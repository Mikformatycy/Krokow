import { useState } from 'react';
import type { BooleanFact, RouteOption, RouteResponse, TactileFact } from '@krok/contracts';
import { Text, View } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { SectionHeading } from '../../components/SectionHeading';
import { Details } from '../../components/Details';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { dateText, factText, metres, reasonText, stepText, warningText } from './routeText';
import { formStyles as styles } from './styles';
import { SpeechPlayer } from './SpeechPlayer';

function Fact({ title, fact, response }: { title: string; fact: BooleanFact | TactileFact; response: RouteResponse }) {
  return <View style={styles.fact}>
    <Text style={styles.strong}>{title}</Text>
    <Text style={styles.body}>{factText(fact)}</Text>
    {fact.evidenceIds.map((id) => {
      const evidence = response.evidenceCatalog.find((entry) => entry.id === id)!;
      const source = response.sourceCatalog.find((entry) => entry.id === evidence.sourceId)!;
      return <View key={id} style={styles.fact}>
        <Text style={styles.body}>Źródło: {source.name}. Wartość w rekordzie: {String(evidence.value)}.</Text>
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
    <Text style={styles.body}>Dodatkowa długość: {metres(route.metrics.extraDistanceM)}. Marsz: około {Math.ceil(route.metrics.walkingDurationSec / 60)} min przy założeniu {route.metrics.assumedWalkingSpeedMps.toLocaleString('pl-PL')} m/s. {route.metrics.crossingWaitDurationSec === null ? 'Czas oczekiwania na przejściach nieznany.' : `Założony czas oczekiwania: ${route.metrics.crossingWaitDurationSec} s.`}</Text>
    <Text style={styles.body}>Przejścia: {route.metrics.crossingCount}. Etapy przejść: {route.metrics.crossingStageCount}.</Text>
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

export function RouteResults({ response, computed }: { response: RouteResponse; computed: boolean }) {
  const recommended = response.routes.find((route) => route.id === response.recommendation.routeId)!;
  const warnings = [...new Set(response.warnings.map(warningText))];
  const importantWarnings = [...new Set(response.warnings.filter((warning) => !['SYNTHETIC_DATA', 'MISSING_FEATURE_DATA'].includes(warning.code)).map(warningText))];
  return <View style={styles.section}>
    <ScreenHeading>Twój plan</ScreenHeading>
    {response.mode === 'pilot' && <Text style={styles.body}>Źródła: {response.sourceCatalog.map((source) => source.attribution).join('; ')}.</Text>}
    <Text accessibilityLiveRegion="polite" style={styles.strong}>{computed ? 'Obliczono' : 'Wczytano'} {response.routes.length} {response.routes.length === 1 ? 'wariant' : 'warianty'}. Rekomendacja: {metres(recommended.metrics.distanceM)}.</Text>
    {importantWarnings.map((warning) => <Text key={warning} style={styles.error}>{warning}</Text>)}
    <SpeechPlayer key={response.requestId} response={response} />
    <Details label="Porównaj trasy i sprawdź źródła">
    <SectionHeading>Porównanie tras</SectionHeading>
    {!computed && <Text style={styles.body}>Wczytano warianty przykładu: {response.routes.map((route) => `${route.id} — ${route.metrics.distanceM} m`).join('; ')}.</Text>}
    <Text style={styles.body}>{response.mode === 'pilot' ? 'Wynik obliczeń na rzeczywistych danych. Tylko podgląd.' : computed ? 'Wynik obliczeń na syntetycznym grafie.' : 'Przygotowana odpowiedź demonstracyjna, a nie nowe obliczenie trasy.'} Najkrótsza trasa spełniająca te same twarde wymagania: {metres(response.baseline.distanceM)}.</Text>
    <Text style={styles.body}>Liczba alternatyw jest ograniczona. Rekomendacja dotyczy znalezionych wariantów.</Text>
    <View style={styles.notice}>{warnings.filter((warning) => !importantWarnings.includes(warning)).map((warning) => <Text key={warning} style={styles.body}>{warning}</Text>)}</View>
    {response.routes.map((route, i) => <RouteCard key={`${response.requestId}-${route.id}`} route={route} index={i} response={response} />)}
    <SectionHeading>Źródła i aktualność</SectionHeading>
    <Text style={styles.body}>Stan wiedzy na: {dateText(response.asOf)}. Pobranie zestawu danych: {dateText(response.dataContext.snapshotFetchedAt)}. Ponowne pobranie nie jest potwierdzeniem w terenie.</Text>
    {response.sourceCatalog.map((source) => <View key={source.id} style={styles.card}>
      <Text style={styles.strong}>{source.name}</Text>
      <Text style={styles.body}>{source.kind === 'synthetic' ? 'Źródło syntetyczne.' : 'Źródło rzeczywistych danych.'} Status: {{ ok: 'dostępne', degraded: 'ograniczona dostępność', unavailable: 'niedostępne' }[source.status]}. Ostatnie pobranie: {dateText(source.lastFetchedAt)}.</Text>
      <Text style={styles.body}>{source.attribution}. Licencja: {source.license}.</Text>
      {source.sourceUrl && <Text selectable style={styles.body}>{source.sourceUrl}</Text>}
    </View>)}
    </Details>
  </View>;
}
