import { useState } from 'react';
import type { BooleanFact, Evidence, RouteOption, RouteResponse, TactileFact } from '@krok/contracts';
import { Platform, Text, View } from 'react-native';
import type { SpeechStatus } from '../../adapters/speech/coordinator';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { Details } from '../../components/Details';
import { SectionHeading } from '../../components/SectionHeading';
import { ToggleRow } from '../../components/ToggleRow';
import { SimulationPanel } from '../simulation/SimulationPanel';
import { audibleSummary, crossingText, dateText, evidenceValueText, factText, metres, reasonText, stepText, variantName, walkingText, walkingTime, warningText } from './routeText';
import { formStyles as styles } from './styles';
import { useRoutePlayback } from './useRoutePlayback';

const speechMessages: Record<SpeechStatus, string> = {
  idle: '', loading: 'Przygotowanie głosu…', speaking: 'Trwa odsłuch.', stopped: 'Odsłuch zatrzymany.', done: 'Odsłuch zakończony.',
  unavailable: 'Brak polskiego głosu na urządzeniu. Tekst trasy jest w „Przebieg trasy”.',
  error: 'Nie udało się odtworzyć głosu. Tekst trasy jest w „Przebieg trasy”.',
  reader: 'Głos aplikacji jest wyłączony, bo korzystasz z czytnika ekranu.',
};

const featureNames: Record<Evidence['featureKey'], string> = {
  surface: 'Nawierzchnia', tactile_paving: 'Oznaczenia dotykowe', audible_signal: 'Sygnalizacja dźwiękowa',
  traffic_signals: 'Sygnalizacja świetlna', steps: 'Schody', handrail: 'Poręcz', separated_footway: 'Oddzielony chodnik',
  shared_cycle_path: 'Wspólna droga z rowerami', temporary_obstruction: 'Przeszkoda tymczasowa',
};

function ObjectEvidence({ response }: { response: RouteResponse }) {
  return <Details label="Informacje o odcinkach">
    <Text style={styles.body}>Zapisy OSM o obiektach występujących w znalezionych wariantach. Nie opisują całej trasy ani wszystkich jej odcinków. Nawierzchnia utwardzona nie oznacza równej nawierzchni. Brak wpisu nie oznacza braku przeszkód.</Text>
    {response.evidenceCatalog.length === 0 && <Text style={styles.body}>Brak opublikowanych informacji o tych obiektach.</Text>}
    {response.evidenceCatalog.map(evidence => <View key={evidence.id} style={styles.fact}>
      <Text style={styles.strong}>{featureNames[evidence.featureKey]}: {evidenceValueText(evidence)}.</Text>
      <Text selectable style={styles.body}>Obiekt źródłowy: {evidence.sourceRecordId}. Źródło: {response.sourceCatalog.find(source => source.id === evidence.sourceId)!.name}.</Text>
      <Text style={styles.body}>Status: {{ unverified: 'wpis niezweryfikowany w terenie', source_declared: 'deklaracja źródła', field_verified: 'potwierdzenie terenowe' }[evidence.verificationStatus]}.</Text>
      <Text style={styles.body}>Pobrano: {dateText(evidence.fetchedAt)}. Zmiana rekordu: {dateText(evidence.sourceModifiedAt)}. Obserwacja: {dateText(evidence.observedAt)}. Potwierdzenie: {dateText(evidence.verifiedAt)}.</Text>
      <Text style={styles.body}>Strona: {evidence.scope.side === null ? 'nieokreślona' : { left: 'lewa', right: 'prawa', both: 'obie' }[evidence.scope.side]}. Kierunek: {evidence.scope.direction === null ? 'nieokreślony' : { forward: 'zgodny z obiektem źródłowym', backward: 'przeciwny do obiektu źródłowego', both: 'oba' }[evidence.scope.direction]}. Poziom: {evidence.scope.level ?? 'nieokreślony'}.</Text>
      {evidence.note && <Text style={styles.body}>{evidence.note}</Text>}
    </View>)}
  </Details>;
}

function spokenMetres(value: number): string {
  const n = Math.round(value); const tens = n % 100; const units = n % 10;
  return `${n} ${n === 1 ? 'metr' : units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? 'metry' : 'metrów'}`;
}

/** The chosen variant in one card; static text only, so readers may treat it as a single element. */
function RouteSummary({ route, index, recommended, stale, multiple }: { route: RouteOption; index: number; recommended: boolean; stale: boolean; multiple: boolean }) {
  const waiting = route.metrics.crossingWaitDurationSec;
  const timing = route.metrics.crossingCount === 0 ? 'Czas samego marszu.'
    : waiting === null ? 'Czas samego marszu, bez oczekiwania na przejściach.'
    : `Czas samego marszu. Dodatkowo założono ${waiting} s oczekiwania na przejściach.`;
  const lines = [
    timing,
    ...(route.metrics.extraDistanceM > 0 ? [`O ${metres(route.metrics.extraDistanceM)} dłuższa od najkrótszej.`] : []),
    crossingText(route.metrics),
    ...(route.metrics.crossingStageCount > 0 ? [audibleSummary(route.metrics.audibleSignals)] : []),
  ];
  const title = multiple ? variantName(index, recommended) : '';
  return <View style={[styles.card, recommended && styles.recommended]} testID="route-summary"
    {...(Platform.OS === 'web' ? {} : { accessible: true, accessibilityLabel: [title, spokenMetres(route.metrics.distanceM), walkingText(route.metrics.walkingDurationSec), ...lines, ...(stale ? ['Część danych ma starsze potwierdzenie.'] : [])].filter(Boolean).join('. ') })}>
    {title !== '' && <Text style={styles.caption}>{title}</Text>}
    <Text style={styles.summaryMetrics}>{metres(route.metrics.distanceM)}<Text style={styles.summaryTime}>{` · ${walkingTime(route.metrics.walkingDurationSec)}`}</Text></Text>
    {lines.map((line, i) => <Text key={i} style={i === 0 ? styles.caption : styles.body}>{line}</Text>)}
    {stale && <Text style={styles.error}>Część danych ma starsze potwierdzenie.</Text>}
  </View>;
}

function RouteEndpoints({ route }: { route: RouteOption }) {
  const start = route.steps[0]; const end = route.steps.at(-1);
  if (start?.instructionKey !== 'route.start' || end?.instructionKey !== 'route.arrive') return null;
  const startName = start.params.placeName; const endName = end.params.placeName;
  const [startTitle, ...startDetail] = startName.split(' — ');
  const [endTitle, ...endDetail] = endName.split(' — ');
  return <View style={styles.fact} testID="route-endpoints"
    {...(Platform.OS === 'web' ? {} : { accessible: true, accessibilityLabel: `Start: ${startName}. Cel: ${endName}.` })}>
    <Text style={styles.strong}>{startTitle} → {endTitle}</Text>
    {(startDetail.length > 0 || endDetail.length > 0) && <Text style={styles.body}>{startDetail.join(' — ') || startTitle} → {endDetail.join(' — ') || endTitle}</Text>}
  </View>;
}

function Fact({ title, fact, response }: { title: string; fact: BooleanFact | TactileFact; response: RouteResponse }) {
  return <View style={styles.fact}>
    <Text style={styles.strong}>{title}</Text>
    <Text style={styles.body}>{factText(fact)}</Text>
    {fact.evidenceIds.map((id) => {
      const evidence = response.evidenceCatalog.find((entry) => entry.id === id)!;
      const source = response.sourceCatalog.find((entry) => entry.id === evidence.sourceId)!;
      return <View key={id} style={styles.fact}>
        <Text style={styles.body}>Źródło: {source.name}. W rekordzie {evidenceValueText(evidence)}.</Text>
        <Text style={styles.body}>Pobrano: {dateText(evidence.fetchedAt)}. Obserwacja: {dateText(evidence.observedAt)}. Potwierdzenie: {dateText(evidence.verifiedAt)}.</Text>
        {evidence.note && <Text style={styles.body}>{evidence.note}</Text>}
      </View>;
    })}
  </View>;
}

function RouteCard({ route, index, response }: { route: RouteOption; index: number; response: RouteResponse }) {
  const [expanded, setExpanded] = useState(false);
  const recommended = response.recommendation.routeId === route.id;
  const labels = route.labels.map((label) => ({ recommended: 'Rekomendowany', shortest: 'Najkrótszy dopuszczalny', better_documented: 'Więcej etapów z opisaną akustyką', fewer_crossings: 'Mniej przejść' })[label]);
  const signals = route.metrics.audibleSignals;
  return <View style={[styles.card, recommended && styles.recommended]} testID={`route-card-${index + 1}`}>
    <SectionHeading>{`Wariant ${index + 1} · ${metres(route.metrics.distanceM)}`}</SectionHeading>
    <Text style={styles.strong}>{labels.join(' · ') || 'Alternatywa'}</Text>
    <Text style={styles.body}>Dodatkowa długość: {metres(route.metrics.extraDistanceM)}. Marsz: {walkingText(route.metrics.walkingDurationSec)} przy {route.metrics.assumedWalkingSpeedMps.toLocaleString('pl-PL')} m/s. {route.metrics.crossingWaitDurationSec === null ? 'Czas oczekiwania na przejściach nieznany.' : `Założony czas oczekiwania: ${route.metrics.crossingWaitDurationSec} s.`}</Text>
    <Text style={styles.body}>{crossingText(route.metrics)}</Text>
    <Text style={styles.body}>Akustyka — obecność opisana: {signals.present}; brak opisany: {signals.absent}; brak danych: {signals.unknown}; konflikt: {signals.conflicting}.</Text>
    <Text style={styles.body}>{route.metrics.unknownSegmentLengthM === null ? 'Długość odcinków z brakami danych nie została określona.' : `Odcinki z niepełnymi danymi: ${metres(route.metrics.unknownSegmentLengthM)}.`}</Text>
    {recommended && <View style={styles.fact}>
      <Text style={styles.strong}>Dlaczego ten wariant</Text>
      {response.recommendation.reasons.map((reason, i) => <Text key={i} style={styles.body}>{reasonText(reason)}</Text>)}
    </View>}
    <ActionButton label={`${expanded ? 'Ukryj' : 'Pokaż'} przebieg i dowody wariantu ${index + 1}`} expanded={expanded} onPress={() => setExpanded(!expanded)} />
    {expanded && <View style={styles.section}>
      <Text style={styles.strong}>Tekstowy przebieg planu</Text>
      {route.steps.map((step) => <Text key={step.id} style={styles.body}>{metres(step.startM)}: {stepText(step)}</Text>)}
      <Text style={styles.strong}>Etapy przejść i pochodzenie danych</Text>
      <Text style={styles.body}>Opis infrastruktury nie informuje o bieżącym świetle ani o możliwości wejścia na jezdnię.</Text>
      {route.events.length === 0 && <Text style={styles.body}>W danych tej trasy nie zapisano etapów przejść.</Text>}
      {route.events.map((event, i) => <View key={event.id} style={styles.event}>
        <Text style={styles.strong}>Etap {i + 1}, w odległości {metres(event.offsetM)} od startu</Text>
        <Fact title="Sygnalizacja dźwiękowa" fact={event.facts.audible_signal} response={response} />
        <Fact title="Oznaczenia dotykowe" fact={event.facts.tactile_paving} response={response} />
      </View>)}
    </View>}
  </View>;
}

export function RouteResults({ response, computed, onNewRoute }: { response: RouteResponse; computed: boolean; onNewRoute: () => void }) {
  const playback = useRoutePlayback(response);
  const { selected, status, reader, manualReader, blocked, active, parts } = playback;
  const routeIndex = response.routes.findIndex((route) => route.id === selected);
  const route = response.routes[routeIndex]!;
  const warnings = [...new Set(response.warnings.map(warningText))];
  const importantWarnings = [...new Set(response.warnings.filter((warning) => !['SYNTHETIC_DATA', 'MISSING_FEATURE_DATA'].includes(warning.code)).map(warningText))];
  const stale = route.events.some((event) => Object.values(event.facts).some((fact) => fact.state === 'known' && fact.freshness === 'stale'));
  const speaking = status === 'loading' || status === 'speaking';
  const statusText = reader === null && status === 'reader' ? 'Nie potwierdzono stanu czytnika ekranu, więc głos aplikacji jest wyłączony.' : speechMessages[status];
  return <>
    <ScreenHeading>Twój plan</ScreenHeading>
    <RouteEndpoints route={route} />
    {importantWarnings.length > 0 && <View style={styles.notice}>{importantWarnings.map((warning) => <Text key={warning} style={styles.noticeText}>{warning}</Text>)}</View>}
    <RouteSummary route={route} index={routeIndex} recommended={route.id === response.recommendation.routeId} stale={stale} multiple={response.routes.length > 1} />
    {!blocked && <ActionButton primary label={speaking ? 'Zatrzymaj odsłuch' : 'Odsłuchaj plan'} disabled={!active}
      onPress={speaking ? playback.stopSpeech : playback.playPlan} />}
    {statusText !== '' && <Text style={styles.body} testID="speech-status">{statusText}</Text>}
    <Details label="Przebieg trasy">
      {parts.map((part, i) => <Text key={i} style={styles.body}>{part}</Text>)}
    </Details>
    {response.mode === 'pilot' && <ObjectEvidence response={response} />}
    {response.mode === 'pilot' && <Text style={styles.caption}>Źródła: {response.sourceCatalog.map((source) => source.attribution).join('; ')}. Tylko podgląd.</Text>}
    {response.routes.length > 1 && <Details label={`Inne warianty (${response.routes.length - 1})`}>
      <ChoiceGroup title="Wariant trasy" value={route.id} onChange={playback.select}
        options={response.routes.map((option, i) => [option.id, `${variantName(i, option.id === response.recommendation.routeId)}, ${metres(option.metrics.distanceM)}`] as const)} />
    </Details>}
    {response.mode === 'synthetic' && <SimulationPanel playback={playback} />}
    <Details label="Porównanie, źródła i daty">
      <Text style={styles.body}>{response.mode === 'pilot' ? 'Wynik obliczeń na rzeczywistych danych. Tylko podgląd.' : computed ? 'Wynik obliczeń na syntetycznym grafie.' : 'Przygotowana odpowiedź demonstracyjna, a nie nowe obliczenie trasy.'} Najkrótsza trasa spełniająca te same twarde wymagania: {metres(response.baseline.distanceM)}.</Text>
      {!computed && <Text style={styles.body}>Wczytano warianty przykładu: {response.routes.map((option) => `${option.id} — ${option.metrics.distanceM} m`).join('; ')}.</Text>}
      <Text style={styles.body}>Liczba alternatyw jest ograniczona. Rekomendacja dotyczy znalezionych wariantów.</Text>
      {warnings.filter((warning) => !importantWarnings.includes(warning)).map((warning) => <Text key={warning} style={styles.body}>{warning}</Text>)}
      {response.routes.map((option, i) => <RouteCard key={`${response.requestId}-${option.id}`} route={option} index={i} response={response} />)}
      <SectionHeading>Źródła i aktualność</SectionHeading>
      <Text style={styles.body}>Stan wiedzy na: {dateText(response.asOf)}. Pobranie zestawu danych: {dateText(response.dataContext.snapshotFetchedAt)}. Ponowne pobranie nie jest potwierdzeniem w terenie.</Text>
      {response.sourceCatalog.map((source) => <View key={source.id} style={styles.card}>
        <Text style={styles.strong}>{source.name}</Text>
        <Text style={styles.body}>{source.kind === 'synthetic' ? 'Źródło syntetyczne.' : 'Źródło rzeczywistych danych.'} Status: {{ ok: 'dostępne', degraded: 'ograniczona dostępność', unavailable: 'niedostępne' }[source.status]}. Ostatnie pobranie: {dateText(source.lastFetchedAt)}.</Text>
        <Text style={styles.body}>{source.attribution}. Licencja: {source.license}.</Text>
        {source.sourceUrl && <Text selectable style={styles.body}>{source.sourceUrl}</Text>}
      </View>)}
    </Details>
    <Details label="Ustawienia głosu">
      <ToggleRow label="Korzystam z czytnika — wyłącz głos aplikacji" value={manualReader} onChange={playback.toggleReader} />
      <Text style={styles.body}>Odsłuch planu kończy symulację. Zatrzymanie odsłuchu wyłącza też głos symulacji.</Text>
      {Platform.OS === 'web' && <Text style={styles.body}>Przeglądarka nie wykrywa czytnika. Jeśli go używasz, włącz powyższą opcję.</Text>}
      {Platform.OS === 'ios' && <Text style={styles.body}>Jeśli nie słyszysz odsłuchu, wyłącz tryb cichy i sprawdź głośność.</Text>}
    </Details>
    <ActionButton label="Nowa trasa" onPress={onNewRoute} />
  </>;
}
