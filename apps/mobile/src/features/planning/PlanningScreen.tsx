import { useEffect, useMemo, useRef, useState } from 'react';
import type { CoverageResponse, Preferences, RouteRequest, RouteResponse } from '@krok/contracts';
import { Platform, Text, TextInput, View } from 'react-native';
import { demoRequest, MockRouteApi } from '../../adapters/api/MockRouteApi';
import { HttpRouteApi } from '../../adapters/api/HttpRouteApi';
import { failureMessage } from '../../adapters/api/failureMessage';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { ActionLink } from '../../components/ActionLink';
import { Screen } from '../../components/Screen';
import { SectionHeading } from '../../components/SectionHeading';
import { buildRequest } from './form';
import type { FormError } from './form';
import { PlacePicker } from './PlacePicker';
import { formStyles as styles } from './styles';
import { RouteResults } from './RouteResults';

const switches: { key: 'preferAudibleSignals' | 'preferTactilePaving' | 'preferSeparatedFootways' | 'avoidKnownSteps'; label: string }[] = [
  { key: 'preferAudibleSignals', label: 'Preferuj opisaną sygnalizację dźwiękową' },
  { key: 'preferTactilePaving', label: 'Preferuj opisane oznaczenia dotykowe' },
  { key: 'preferSeparatedFootways', label: 'Preferuj opisane oddzielne ciągi piesze' },
  { key: 'avoidKnownSteps', label: 'Pomijaj odcinki oznaczone jako schody' },
];
type Submission = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'success'; response: RouteResponse };

export function PlanningScreen() {
  const initial = demoRequest();
  const [mode, setMode] = useState<'http' | 'mock'>('http');
  const [attempt, setAttempt] = useState(0);
  const api = useMemo(() => {
    if (mode === 'mock') return new MockRouteApi();
    const address: unknown = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:3001' : '');
    if (typeof address !== 'string') return null;
    try { return new HttpRouteApi(address); } catch { return null; }
  }, [mode]);
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(initial.preferences);
  const [detour, setDetour] = useState(String(initial.preferences.maxDetourRatio).replace('.', ','));
  const [maxAlternatives, setMaxAlternatives] = useState<RouteRequest['maxAlternatives']>(initial.maxAlternatives);
  const [error, setError] = useState<FormError | null>(null);
  const [submission, setSubmission] = useState<Submission>({ kind: 'idle' });
  const generation = useRef(0);
  const originInput = useRef<TextInput>(null);
  const destinationInput = useRef<TextInput>(null);
  const detourInput = useRef<TextInput>(null);
  useEffect(() => {
    let active = true;
    setCoverage(null); setCatalogError('');
    if (!api) { setCatalogError('Połączenie z API nie jest skonfigurowane dla tej aplikacji. Możesz jawnie wybrać przygotowane przykłady.'); return; }
    void api.coverage().then((value) => { if (active) setCoverage(value); }).catch((failure: unknown) => { if (active) setCatalogError(failureMessage(failure)); });
    return () => { active = false; generation.current++; };
  }, [api, attempt]);

  function edit() { generation.current++; setSubmission({ kind: 'idle' }); setError(null); }
  function restore() {
    edit();
    const example = demoRequest();
    setOrigin(example.origin.kind === 'place' ? example.origin.placeId : '');
    setDestination(example.destination.kind === 'place' ? example.destination.placeId : '');
    setPreferences(example.preferences); setDetour(String(example.preferences.maxDetourRatio).replace('.', ',')); setMaxAlternatives(example.maxAlternatives);
  }
  async function submit() {
    if (!coverage || !api) return;
    edit();
    const request = buildRequest(coverage.cityId, origin, destination, preferences, detour, maxAlternatives);
    if ('field' in request) {
      setError(request);
      const inputs = { origin: originInput, destination: destinationInput, detour: detourInput };
      inputs[request.field].current?.focus();
      return;
    }
    const current = generation.current;
    setSubmission({ kind: 'loading' });
    try {
      const response = await api.plan(request);
      if (current === generation.current) setSubmission({ kind: 'success', response });
    } catch (failure) {
      if (current !== generation.current) return;
      setSubmission({ kind: 'error', message: failureMessage(failure) });
    }
  }

  return <Screen>
    <ScreenHeading>Zaplanuj przykład trasy</ScreenHeading>
    <View style={styles.notice}>
      <SectionHeading>Tryb demonstracyjny — fikcyjne dane</SectionHeading>
      <Text style={styles.body}>Tylko podgląd. Przykłady nie opisują prawdziwych miejsc i nie służą do prowadzenia w terenie. GPS nie jest używany.</Text>
      <ActionButton label="Obliczanie tras przez API" selected={mode === 'http'} onPress={() => { if (mode !== 'http') { edit(); setCoverage(null); setMode('http'); } }} />
      <ActionButton label="Przygotowane przykłady bez API" selected={mode === 'mock'} onPress={() => { if (mode !== 'mock') { edit(); setCoverage(null); setMode('mock'); } }} />
      <Text style={styles.body}>{mode === 'http' ? 'API oblicza trasy na fikcyjnym grafie. Zmiana preferencji akustyki może zmienić rekomendację.' : 'Przygotowane odpowiedzi A/B/C. Pozostałe ustawienia mogą nie mieć gotowego przykładu. To nie są nowe obliczenia.'}</Text>
      <Text style={styles.body}>W tym demo preferencje oznaczeń dotykowych i oddzielnych ciągów pieszych nie zmieniają rankingu. Twarde wymagania pozostają obowiązujące.</Text>
      <ActionButton label="Przywróć punkty i ustawienia przykładu A/B/C" onPress={restore} />
    </View>
    {!coverage || !api ? <View style={styles.section}>
      <Text accessibilityRole={catalogError ? 'alert' : 'text'} style={styles.body}>{catalogError || 'Wczytywanie danych demonstracji…'}</Text>
      {catalogError !== '' && <ActionButton label="Ponów połączenie" onPress={() => { edit(); setAttempt((value) => value + 1); }} />}
    </View> : <>
      <Text style={styles.body}>{coverage.description}</Text>
      <PlacePicker label="Start" value={origin} onChange={(id) => { edit(); setOrigin(id); }} api={api} cityId={coverage.cityId} inputRef={originInput} error={error?.field === 'origin' ? error.message : undefined} />
      <PlacePicker label="Cel" value={destination} onChange={(id) => { edit(); setDestination(id); }} api={api} cityId={coverage.cityId} inputRef={destinationInput} error={error?.field === 'destination' ? error.message : undefined} />
      <ActionButton label="Zamień start z celem" onPress={() => { edit(); setOrigin(destination); setDestination(origin); }} />
      <View style={styles.section}>
        <SectionHeading>Preferencje</SectionHeading>
        <Text style={styles.body}>Początkowe ustawienia pochodzą z przykładu A/B/C. Preferencje nie potwierdzają obecności udogodnień. Pomijanie opisanych schodów nie gwarantuje trasy bez schodów przy brakach danych.</Text>
        {switches.map(({ key, label }) => <ActionButton key={key} label={label} checkbox selected={preferences[key]} onPress={() => { edit(); setPreferences({ ...preferences, [key]: !preferences[key] }); }} />)}
      </View>
      <View style={styles.section}>
        <SectionHeading>Wymaganie dotyczące akustyki</SectionHeading>
        <Text style={styles.body}>Twarde wymaganie nie jest automatycznie rozluźniane. Brak informacji i konflikt nie spełniają wymagania obecności.</Text>
        {([
          ['none', 'Bez twardego wymagania akustyki'],
          ['documented', 'Wymagaj opisanej obecności akustyki bez konfliktu'],
          ['field_verified_recent', `Wymagaj potwierdzenia w terenie w ciągu ${coverage.policy.fieldVerificationMaxAgeDays} dni`],
        ] as const).map(([value, label]) => <ActionButton key={value} label={label} selected={preferences.audibleRequirement === value} onPress={() => { edit(); setPreferences({ ...preferences, audibleRequirement: value }); }} />)}
        <Text style={styles.body}>Okno pochodzi z polityki przykładu {coverage.policy.policyVersion}. Jest założeniem demonstracji, nie zatwierdzonym progiem produktu.</Text>
      </View>
      <View style={styles.section}>
        <SectionHeading>Maksymalna długość względem najkrótszej dopuszczalnej trasy</SectionHeading>
        <Text style={styles.body}>Mnożnik od 1 do 2. Wartość 1,6 dopuszcza długość do 160% najkrótszej trasy spełniającej te same twarde wymagania.</Text>
        <TextInput ref={detourInput} accessibilityLabel="Maksymalny mnożnik długości" accessibilityHint={error?.field === 'detour' ? error.message : 'Wartość od 1 do 2'} keyboardType="decimal-pad" value={detour} onChangeText={(value) => { edit(); setDetour(value); }} maxLength={12} style={styles.input} />
        {error?.field === 'detour' && <Text accessibilityRole="alert" style={styles.error}>{error.message}</Text>}
      </View>
      <View style={styles.section}>
        <SectionHeading>Liczba alternatyw</SectionHeading>
        {([1, 2, 3] as const).map((count) => <ActionButton key={count} label={`Maksymalnie ${count}`} selected={maxAlternatives === count} onPress={() => { edit(); setMaxAlternatives(count); }} />)}
      </View>
      <ActionButton label={submission.kind === 'loading' ? 'Trwa obliczanie lub wczytywanie…' : mode === 'http' ? 'Oblicz trasy' : 'Pokaż przykład dla ustawień'} primary disabled={submission.kind === 'loading'} onPress={() => { void submit(); }} />
      {submission.kind === 'error' && <Text accessibilityRole="alert" style={styles.error}>{submission.message}</Text>}
      {submission.kind === 'success' && <>
        {mode === 'mock' && <Text accessibilityLiveRegion="polite" style={styles.body}>Wczytano warianty przykładu: {submission.response.routes.map((route) => `${route.id} — ${route.metrics.distanceM} m`).join('; ')}.</Text>}
        <RouteResults response={submission.response} computed={mode === 'http'} />
      </>}
    </>}
    <ActionLink href="/" label="Wróć do początku" secondary />
  </Screen>;
}
