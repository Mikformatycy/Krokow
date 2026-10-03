import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { RouteResponse } from '@krok/contracts';
import type { SpeechStatus } from '../../adapters/speech/coordinator';
import { ActionButton } from '../../components/ActionButton';
import { SectionHeading } from '../../components/SectionHeading';
import { useRoutePlayback } from './useRoutePlayback';
import { SimulationPanel } from '../simulation/SimulationPanel';
import { formStyles as styles } from './styles';

const messages: Record<SpeechStatus, string> = {
  idle: 'Odsłuch zaczyna się wyłącznie na Twoje żądanie.', loading: 'Sprawdzanie polskiego głosu…',
  speaking: 'Trwa odsłuch planu.', stopped: 'Odsłuch zatrzymany. Powtórzenie zacznie plan od początku.',
  done: 'Odsłuch zakończony.', unavailable: 'Brak dostępnego polskiego głosu. Na web wymagany jest głos lokalny. Sprawdź głosy w ustawieniach urządzenia lub skorzystaj z tekstu.',
  error: 'Nie udało się odtworzyć tekstu. Pozostaje on dostępny na ekranie.',
  reader: 'Własny głos aplikacji wyłączony. Odczytaj tekst planu swoim czytnikiem ekranu.',
};
export function SpeechPlayer({ response }: { response: RouteResponse }) {
  const playback = useRoutePlayback(response);
  const { selected, status, reader, manualReader, blocked, active, parts } = playback;
  const [showText, setShowText] = useState(false);
  return <View style={styles.card}>
    <SectionHeading>Odsłuch planu</SectionHeading>
    <Text style={styles.body}>To opis fikcyjnej trasy, bez prowadzenia i śledzenia pozycji. Wybierz wspólny wariant do odsłuchu i symulacji. Rozpoczęcie odsłuchu planu kończy symulację.</Text>
    {response.routes.map((option, i) => <ActionButton key={option.id} label={`Odsłuch: wariant ${i + 1}, ${Math.round(option.metrics.distanceM)} m`}
      selected={selected === option.id} onPress={() => playback.select(option.id)} />)}
    <ActionButton label="Korzystam z czytnika — wyłącz głos aplikacji" checkbox selected={manualReader} onPress={playback.toggleReader} />
    {Platform.OS === 'web' && <Text style={styles.body}>Przeglądarka nie wykrywa niezawodnie czytnika ekranu. Jeśli go używasz, zaznacz powyższą opcję przed odsłuchem.</Text>}
    {reader === null && <Text style={styles.body}>Nie potwierdzono jeszcze stanu czytnika. Własny odsłuch pozostaje wyłączony.</Text>}
    {Platform.OS === 'ios' && <Text style={styles.body}>Na iPhonie wyłącz tryb cichy i sprawdź głośność, jeśli nie słyszysz odsłuchu.</Text>}
    <Text accessibilityLiveRegion={blocked ? 'polite' : 'none'} style={styles.body}>{playback.simulation && status === 'speaking' ? 'Trwa odsłuch symulacji.'
      : playback.simulation && status === 'stopped' ? 'Odsłuch symulacji zatrzymany.'
      : playback.simulation && status === 'reader' && !blocked ? 'Głos symulacji wyłączony lub aplikacja nieaktywna. Tekst pozostaje dostępny.' : messages[status]}</Text>
    <ActionButton label="Odsłuchaj wybrany plan" primary disabled={blocked || !active || (!playback.simulation && (status === 'loading' || status === 'speaking'))} onPress={playback.playPlan} />
    <ActionButton label="Zatrzymaj odsłuch" disabled={status !== 'loading' && status !== 'speaking'} onPress={playback.stopSpeech} />
    <ActionButton label="Powtórz plan od początku" disabled={blocked || !active || (!playback.simulation && status === 'loading')} onPress={playback.playPlan} />
    <ActionButton label={showText ? 'Ukryj tekst odsłuchu' : 'Pokaż tekst odsłuchu'} expanded={showText} onPress={() => setShowText(!showText)} />
    {showText && <View style={styles.fact}>
      <Text style={styles.strong}>Tekst wybranego odsłuchu</Text>
      {parts.map((part, i) => <Text key={i} style={styles.body}>{part}</Text>)}
    </View>}
    <SimulationPanel playback={playback} />
  </View>;
}
