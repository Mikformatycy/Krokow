import { Platform, Text, View } from 'react-native';
import type { RouteResponse } from '@krok/contracts';
import type { SpeechStatus } from '../../adapters/speech/coordinator';
import { ActionButton } from '../../components/ActionButton';
import { Details } from '../../components/Details';
import { SectionHeading } from '../../components/SectionHeading';
import { useRoutePlayback } from './useRoutePlayback';
import { SimulationPanel } from '../simulation/SimulationPanel';
import { formStyles as styles } from './styles';

const messages: Record<SpeechStatus, string> = {
  idle: 'Głos uruchamiasz na żądanie.', loading: 'Sprawdzanie polskiego głosu…',
  speaking: 'Trwa odsłuch planu.', stopped: 'Odsłuch zatrzymany.',
  done: 'Odsłuch zakończony.', unavailable: 'Brak dostępnego polskiego głosu. Tekst pozostaje dostępny. Sprawdź ustawienia głosu urządzenia.',
  error: 'Nie udało się odtworzyć tekstu. Pozostaje on dostępny na ekranie.',
  reader: 'Własny głos aplikacji wyłączony. Odczytaj tekst swoim czytnikiem ekranu.',
};
export function SpeechPlayer({ response }: { response: RouteResponse }) {
  const playback = useRoutePlayback(response);
  const { selected, status, reader, manualReader, blocked, active, parts } = playback;
  const routeIndex = response.routes.findIndex((route) => route.id === selected);
  const route = response.routes[routeIndex]!;
  const signals = route.metrics.audibleSignals;
  const stale = route.events.some((event) => Object.values(event.facts).some((fact) => fact.state === 'known' && fact.freshness === 'stale'));
  const speaking = status === 'loading' || status === 'speaking';
  return <View style={styles.section}>
    <Text style={styles.strong}>Wybrany wariant {routeIndex + 1}: {Math.round(route.metrics.distanceM)} m, około {Math.ceil(route.metrics.walkingDurationSec / 60)} min marszu.</Text>
    <Text style={styles.body}>Akustyka: brak danych — {signals.unknown}, konflikt — {signals.conflicting}, brak opisany — {signals.absent}.</Text>
    {stale && <Text style={styles.error}>Część danych ma starsze potwierdzenie. Sprawdź szczegóły trasy.</Text>}
    <Details label="Zmień wariant">
      {response.routes.map((option, i) => <ActionButton key={option.id} label={`Wybierz wariant ${i + 1}, ${Math.round(option.metrics.distanceM)} m`}
        selected={selected === option.id} onPress={() => playback.select(option.id)} />)}
    </Details>
    {Platform.OS === 'web' && <ActionButton label="Korzystam z czytnika — wyłącz głos aplikacji" checkbox selected={manualReader} onPress={playback.toggleReader} />}
    {reader === null && <Text style={styles.body}>Nie potwierdzono stanu czytnika. Własny głos pozostaje wyłączony.</Text>}
    <Text accessibilityLiveRegion={blocked ? 'polite' : 'none'} style={styles.body}>{playback.simulation && status === 'speaking' ? 'Trwa odsłuch symulacji.'
      : playback.simulation && status === 'reader' && !blocked ? 'Głos symulacji wyłączony.' : messages[status]}</Text>
    {response.mode === 'synthetic' && <SimulationPanel playback={playback} />}
    <SectionHeading>Odsłuch planu</SectionHeading>
    <ActionButton label="Odsłuchaj wybrany plan" disabled={blocked || !active || (!playback.simulation && speaking)} onPress={playback.playPlan} />
    {speaking && <ActionButton label="Zatrzymaj odsłuch" onPress={playback.stopSpeech} />}
    <Details label="Tekst i opcje odsłuchu">
      <ActionButton label="Powtórz plan od początku" disabled={blocked || !active || (!playback.simulation && status === 'loading')} onPress={playback.playPlan} />
      <Text style={styles.strong}>Tekst wybranego odsłuchu</Text>
      {parts.map((part, i) => <Text key={i} style={styles.body}>{part}</Text>)}
    </Details>
    <Details label="Pomoc i ustawienia głosu">
      {Platform.OS !== 'web' && <ActionButton label="Korzystam z czytnika — wyłącz głos aplikacji" checkbox selected={manualReader} onPress={playback.toggleReader} />}
      <Text style={styles.body}>Rozpoczęcie odsłuchu planu kończy symulację. Zatrzymanie odsłuchu wyłącza także głos przyszłych zdarzeń symulacji.</Text>
      {Platform.OS === 'web' && <Text style={styles.body}>Przeglądarka nie wykrywa niezawodnie czytnika. Jeśli go używasz, zaznacz opcję wyłączenia głosu aplikacji. Na web wymagany jest lokalny polski głos.</Text>}
      {Platform.OS === 'ios' && <Text style={styles.body}>Na iPhonie wyłącz tryb cichy i sprawdź głośność, jeśli nie słyszysz odsłuchu.</Text>}
    </Details>
  </View>;
}
