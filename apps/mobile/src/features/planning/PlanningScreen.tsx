import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CoverageResponse, PlacesResponse, Preferences, RouteRequest, RouteResponse } from '@krok/contracts';
import { BackHandler, Platform, Text } from 'react-native';
import type { TextInput } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { demoRequest, InvalidResponse, MockRouteApi } from '../../adapters/api/MockRouteApi';
import { HttpRouteApi } from '../../adapters/api/HttpRouteApi';
import { failureMessage } from '../../adapters/api/failureMessage';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { LiveMessage } from '../../components/LiveMessage';
import { Screen } from '../../components/Screen';
import { buildRequest } from './form';
import type { FormError } from './form';
import { OptionsStep, preferenceLabels, requirementText } from './OptionsStep';
import { PlaceStep } from './PlaceStep';
import { RouteResults } from './RouteResults';
import { formStyles as styles } from './styles';

type Step = 'origin' | 'destination' | 'review' | 'options' | 'result';
type Submission = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'success'; response: RouteResponse };
type Place = PlacesResponse['places'][number];
const previous: Record<Step, Step | null> = { origin: null, destination: 'origin', review: 'destination', options: 'review', result: 'review' };

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
  const [step, setStep] = useState<Step>('origin');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<Preferences>(initial.preferences);
  const [detour, setDetour] = useState(initial.preferences.maxDetourRatio);
  const [maxAlternatives, setMaxAlternatives] = useState<RouteRequest['maxAlternatives']>(initial.maxAlternatives);
  const [error, setError] = useState<FormError | null>(null);
  const [submission, setSubmission] = useState<Submission>({ kind: 'idle' });
  const generation = useRef(0);
  const originInput = useRef<TextInput>(null);
  const destinationInput = useRef<TextInput>(null);

  useEffect(() => {
    let active = true;
    setCoverage(null); setCatalogError('');
    if (!api) { setCatalogError('Połączenie z API nie jest skonfigurowane. Możesz wybrać przygotowane przykłady w opcjach demonstracji.'); return; }
    void api.coverage().then((value) => { if (active) setCoverage(value); }).catch((failure: unknown) => { if (active) setCatalogError(failureMessage(failure)); });
    return () => { active = false; generation.current++; };
  }, [api, attempt]);

  // Any edit or step change abandons an in-flight calculation, so a late answer cannot replace newer input.
  function edit() { generation.current++; setSubmission({ kind: 'idle' }); setError(null); }
  function goTo(next: Step) { edit(); setStep(next); }
  const back = useCallback(() => {
    const target = previous[step];
    if (target) { generation.current++; setSubmission({ kind: 'idle' }); setError(null); setStep(target); return; }
    if (router.canGoBack()) router.back(); else router.replace('/');
  }, [step]);

  // Only the first step may leave the screen by swipe or hardware back; later steps go one step back.
  const navigation = useNavigation();
  useEffect(() => { navigation.setOptions({ gestureEnabled: step === 'origin' }); }, [navigation, step]);
  const backRef = useRef(back);
  useEffect(() => { backRef.current = back; }, [back]);
  const firstStep = step === 'origin';
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android' || firstStep) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { backRef.current(); return true; });
    return () => subscription.remove();
  }, [firstStep]));

  const rememberPlaces = useCallback((places: readonly Place[]) => {
    setNames((known) => ({ ...known, ...Object.fromEntries(places.map((place) => [place.id, place.name])) }));
  }, []);
  const nameOf = (id: string) => names[id] ?? 'punkt z katalogu';

  function changeMode(value: 'http' | 'mock') {
    if (mode === value) return;
    edit(); setCoverage(null); setOrigin(''); setDestination(''); setStep('origin'); setMode(value);
  }
  function restore() {
    const example = demoRequest();
    setOrigin(example.origin.kind === 'place' ? example.origin.placeId : '');
    setDestination(example.destination.kind === 'place' ? example.destination.placeId : '');
    setPreferences(example.preferences); setDetour(example.preferences.maxDetourRatio); setMaxAlternatives(example.maxAlternatives);
    if (api && coverage) void api.places(coverage.cityId, '').then((response) => rememberPlaces(response.places)).catch(() => {});
    goTo('review');
  }
  function newRoute() { setOrigin(''); setDestination(''); goTo('origin'); }
  async function submit() {
    if (!coverage || !api) return;
    edit();
    const request = buildRequest(coverage.cityId, origin, destination, preferences, String(detour), maxAlternatives);
    if ('field' in request) {
      setStep(request.field === 'detour' ? 'options' : request.field);
      setError(request);
      return;
    }
    const current = generation.current;
    setSubmission({ kind: 'loading' });
    try {
      const response = await api.plan(request);
      if (response.mode !== coverage.mode) throw new InvalidResponse();
      if (current === generation.current) { setSubmission({ kind: 'success', response }); setStep('result'); }
    } catch (failure) {
      if (current !== generation.current) return;
      setSubmission({ kind: 'error', message: failureMessage(failure) });
    }
  }

  const badge = coverage?.mode === 'synthetic' ? 'Demo: dane fikcyjne' : coverage?.mode === 'pilot' ? 'Dane OSM: tylko podgląd' : 'Podgląd';
  // One plain control instead of a disclosure with a nested group: nothing extra to navigate in or out of.
  const demoOptions = <ActionButton variant="row" testID="data-source"
    label={mode === 'http' ? 'Przełącz na przykłady bez API' : 'Przełącz na obliczanie przez API'}
    detail={mode === 'http' ? 'Teraz: obliczanie tras przez API' : 'Teraz: gotowe przykłady A/B/C, nie nowe obliczenia'}
    onPress={() => changeMode(mode === 'http' ? 'mock' : 'http')} />;

  function content() {
    if (!coverage || !api) return <>
      <Text style={styles.caption}>Krok 1 z 3</Text>
      <ScreenHeading>Skąd idziesz?</ScreenHeading>
      {catalogError ? <>
        <LiveMessage alert text={catalogError} style={styles.error} />
        <ActionButton label="Ponów połączenie" onPress={() => { edit(); setAttempt((value) => value + 1); }} />
      </> : <Text style={styles.body}>Wczytywanie dostępnego obszaru…</Text>}
      {demoOptions}
    </>;
    if (step === 'origin' || step === 'destination') {
      const isOrigin = step === 'origin';
      return <PlaceStep key={step} step={isOrigin ? 'Krok 1 z 3' : 'Krok 2 z 3'} question={isOrigin ? 'Skąd idziesz?' : 'Dokąd idziesz?'}
        fieldLabel={isOrigin ? 'Wyszukaj start' : 'Wyszukaj cel'} api={api} cityId={coverage.cityId} mode={coverage.mode}
        selectedId={isOrigin ? origin : destination} excludeId={isOrigin ? destination : origin}
        error={error?.field === step ? error.message : undefined} inputRef={isOrigin ? originInput : destinationInput} onPlaces={rememberPlaces}
        onSelect={(place) => {
          if (isOrigin) { setOrigin(place.id); goTo(destination ? 'review' : 'destination'); } else { setDestination(place.id); goTo('review'); }
        }}
        before={!isOrigin && origin ? <Text style={styles.strong}>Skąd: {nameOf(origin)}</Text> : null}
        after={isOrigin ? <>
          {coverage.mode === 'synthetic' && <ActionButton label="Użyj przykładu A/B/C" onPress={restore} />}
          {demoOptions}
        </> : null} />;
    }
    if (step === 'options') return <OptionsStep preferences={preferences} onPreferences={(value) => { edit(); setPreferences(value); }}
      detour={detour} onDetour={(value) => { edit(); setDetour(value); }} maxAlternatives={maxAlternatives}
      onMaxAlternatives={(value) => { edit(); setMaxAlternatives(value); }} maxAgeDays={coverage.policy.fieldVerificationMaxAgeDays}
      synthetic={coverage.mode === 'synthetic'} error={error?.field === 'detour' ? error.message : undefined} onDone={() => goTo('review')} />;
    if (step === 'result' && submission.kind === 'success') {
      return <RouteResults key={submission.response.requestId} response={submission.response} computed={mode === 'http'} onNewRoute={newRoute} />;
    }
    const chosen = preferenceLabels.filter(({ key }) => preferences[key]).map(({ short }) => short);
    return <>
      <Text style={styles.caption}>Krok 3 z 3</Text>
      <ScreenHeading>Twoja trasa</ScreenHeading>
      <Text style={styles.body}>{coverage.mode === 'synthetic' ? 'Dane fikcyjne. Bez prowadzenia w terenie.' : `${coverage.name}. Tylko podgląd, bez prowadzenia w terenie.`}</Text>
      <ActionButton variant="row" label={`Skąd: ${nameOf(origin)}`} detail="Zmień start" onPress={() => goTo('origin')} />
      <ActionButton variant="row" label={`Dokąd: ${nameOf(destination)}`} detail="Zmień cel" onPress={() => goTo('destination')} />
      <ActionButton label="Zamień kierunek" onPress={() => { edit(); setOrigin(destination); setDestination(origin); }} />
      <ActionButton variant="row" label="Ustawienia trasy" onPress={() => goTo('options')}
        detail={`${chosen.length ? `Preferowane: ${chosen.join(', ')}.` : 'Bez preferencji.'} ${requirementText(preferences, coverage.policy.fieldVerificationMaxAgeDays)}`} />
      <ActionButton label={submission.kind === 'loading' ? 'Obliczanie…' : mode === 'http' ? 'Oblicz trasy' : 'Pokaż przykład'} primary
        busy={submission.kind === 'loading'} disabled={submission.kind === 'loading'} onPress={() => { void submit(); }} />
      {submission.kind === 'error' && <LiveMessage alert text={submission.message} style={styles.error} />}
    </>;
  }

  return <Screen onBack={back} badge={badge} page={step}>{content()}</Screen>;
}
