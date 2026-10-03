import { useEffect, useMemo, useRef, useState } from 'react';
import type { CoverageResponse, Preferences, RouteRequest, RouteResponse } from '@krok/contracts';
import { Platform, Text, TextInput, View } from 'react-native';
import { demoRequest, InvalidResponse, MockRouteApi } from '../../adapters/api/MockRouteApi';
import { HttpRouteApi } from '../../adapters/api/HttpRouteApi';
import { failureMessage } from '../../adapters/api/failureMessage';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { ActionLink } from '../../components/ActionLink';
import { Screen } from '../../components/Screen';
import { SectionHeading } from '../../components/SectionHeading';
import { Details } from '../../components/Details';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [submission, setSubmission] = useState<Submission>({ kind: 'idle' });
  const generation = useRef(0);
  const originInput = useRef<TextInput>(null);
  const destinationInput = useRef<TextInput>(null);
  const detourInput = useRef<TextInput>(null);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => {
      const inputs = { origin: originInput, destination: destinationInput, detour: detourInput };
      inputs[error.field].current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [error]);
  useEffect(() => {
    let active = true;
    setCoverage(null); setCatalogError('');
    if (!api) { setCatalogError('Połączenie z API nie jest skonfigurowane dla tej aplikacji. Możesz jawnie wybrać przygotowane przykłady.'); return; }
    void api.coverage().then((value) => { if (active) setCoverage(value); }).catch((failure: unknown) => { if (active) setCatalogError(failureMessage(failure)); });
    return () => { active = false; generation.current++; };
  }, [api, attempt]);

  function edit() { generation.current++; setSubmission({ kind: 'idle' }); setError(null); }
  function changeMode(value: 'http' | 'mock') {
    if (mode === value) return;
    edit(); setCoverage(null); setOrigin(''); setDestination(''); setMode(value);
  }
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
      if (request.field === 'detour') setSettingsOpen(true);
      return;
    }
    const current = generation.current;
    setSubmission({ kind: 'loading' });
    try {
      const response = await api.plan(request);
      if (response.mode !== coverage.mode) throw new InvalidResponse();
      if (current === generation.current) setSubmission({ kind: 'success', response });
    } catch (failure) {
      if (current !== generation.current) return;
      setSubmission({ kind: 'error', message: failureMessage(failure) });
    }
  }

  return <Screen>
    {submission.kind !== 'success' && <ScreenHeading>{coverage?.mode === 'synthetic' ? 'Zaplanuj przykład trasy' : 'Zaplanuj trasę'}</ScreenHeading>}
    <Text style={styles.strong}>{coverage?.mode === 'synthetic' ? 'Demonstracja — fikcyjne dane. Bez prowadzenia w terenie.' : 'Podgląd planu. Bez prowadzenia w terenie i bez GPS.'}</Text>
    {coverage?.mode === 'pilot' && <Text style={styles.body}>{coverage.name}. Rzeczywiste dane; brak potwierdzenia warunków na miejscu.</Text>}
    {submission.kind === 'success' ? <>
      <RouteResults response={submission.response} computed={mode === 'http'} />
      <ActionButton label="Zmień trasę lub ustawienia" onPress={edit} />
    </> : <>
    <SectionHeading>Wybierz start i cel</SectionHeading>
    {coverage?.mode === 'synthetic' && <ActionButton label="Użyj przykładu A/B/C" primary onPress={restore} />}
    <Details label="Opcje demonstracji">
    <View style={styles.notice}>
      <SectionHeading>Źródło planu</SectionHeading>
      <Text style={styles.body}>{coverage?.description ?? 'Dostępny obszar i rodzaj danych sprawdzamy w API.'}</Text>
      <ActionButton label="Obliczanie tras przez API" selected={mode === 'http'} onPress={() => changeMode('http')} />
      <ActionButton label="Przygotowane przykłady bez API" selected={mode === 'mock'} onPress={() => changeMode('mock')} />
      <Text style={styles.body}>{mode === 'mock' ? 'Przygotowane odpowiedzi A/B/C na fikcyjnych danych. Pozostałe ustawienia mogą nie mieć gotowego przykładu. To nie są nowe obliczenia.' : coverage?.mode === 'pilot' ? 'API oblicza podgląd tras w dostępnym obszarze na rzeczywistych danych.' : 'API oblicza trasy na fikcyjnym grafie. Zmiana preferencji akustyki może zmienić rekomendację.'}</Text>
      {coverage?.mode === 'synthetic' && <Text style={styles.body}>W tym demo preferencje oznaczeń dotykowych i oddzielnych ciągów pieszych nie zmieniają rankingu. Twarde wymagania pozostają obowiązujące.</Text>}
    </View>
    </Details>
    {!coverage || !api ? <View style={styles.section}>
      <Text accessibilityRole={catalogError ? 'alert' : 'text'} style={styles.body}>{catalogError || 'Wczytywanie dostępnego obszaru…'}</Text>
      {catalogError !== '' && <ActionButton label="Ponów połączenie" onPress={() => { edit(); setAttempt((value) => value + 1); }} />}
    </View> : <>
      <PlacePicker label="Start" value={origin} onChange={(id) => { edit(); setOrigin(id); }} api={api} cityId={coverage.cityId} mode={coverage.mode} inputRef={originInput} error={error?.field === 'origin' ? error.message : undefined} />
      <PlacePicker label="Cel" value={destination} onChange={(id) => { edit(); setDestination(id); }} api={api} cityId={coverage.cityId} mode={coverage.mode} inputRef={destinationInput} error={error?.field === 'destination' ? error.message : undefined} />
      <ActionButton label="Zamień start z celem" onPress={() => { edit(); setOrigin(destination); setDestination(origin); }} />
      <Text style={styles.body}>{preferences.audibleRequirement === 'none' ? 'Akustyka: bez twardego wymagania.' : preferences.audibleRequirement === 'documented' ? 'Akustyka: wymagana opisana obecność bez konfliktu.' : `Akustyka: wymagane potwierdzenie z ostatnich ${coverage.policy.fieldVerificationMaxAgeDays} dni.`}</Text>
      <ActionButton label="Ustawienia trasy" expanded={settingsOpen} onPress={() => setSettingsOpen(!settingsOpen)} />
      {settingsOpen && <View style={styles.section}>
      <View style={styles.section}>
        <SectionHeading>Preferencje</SectionHeading>
        <Text style={styles.body}>Preferencje nie potwierdzają obecności udogodnień. Pomijanie opisanych schodów nie gwarantuje trasy bez schodów przy brakach danych.</Text>
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
        <Text style={styles.body}>Okno pochodzi z polityki {coverage.policy.policyVersion}. Sam wiek danych nie potwierdza aktualnych warunków w terenie.</Text>
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
      </View>}
      <ActionButton label={submission.kind === 'loading' ? 'Trwa obliczanie lub wczytywanie…' : mode === 'http' ? 'Oblicz trasy' : 'Pokaż przykład dla ustawień'} primary disabled={submission.kind === 'loading'} onPress={() => { void submit(); }} />
      {submission.kind === 'error' && <Text accessibilityRole="alert" style={styles.error}>{submission.message}</Text>}
    </>}
    </>}
    <ActionLink href="/" label="Wróć do początku" secondary />
  </Screen>;
}
