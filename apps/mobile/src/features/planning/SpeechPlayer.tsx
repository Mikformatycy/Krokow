import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { RouteResponse } from '@krok/contracts';
import { SpeechCoordinator } from '../../adapters/speech/coordinator';
import type { SpeechStatus } from '../../adapters/speech/coordinator';
import { createSpeechPort, watchSpeechEnvironment } from '../../adapters/speech/platform';
import { ActionButton } from '../../components/ActionButton';
import { SectionHeading } from '../../components/SectionHeading';
import { speechText } from './speechText';
import { formStyles as styles } from './styles';

const messages: Record<SpeechStatus, string> = {
  idle: 'Odsłuch zaczyna się wyłącznie na Twoje żądanie.', loading: 'Sprawdzanie polskiego głosu…',
  speaking: 'Trwa odsłuch planu.', stopped: 'Odsłuch zatrzymany. Powtórzenie zacznie plan od początku.',
  done: 'Odsłuch zakończony.', unavailable: 'Brak dostępnego polskiego głosu. Na web wymagany jest głos lokalny. Sprawdź głosy w ustawieniach urządzenia lub skorzystaj z tekstu poniżej.',
  error: 'Nie udało się odtworzyć planu. Tekst jest dostępny poniżej.',
  reader: 'Własny głos aplikacji wyłączony. Odczytaj tekst planu swoim czytnikiem ekranu.',
};
export function SpeechPlayer({ response }: { response: RouteResponse }) {
  const [selected, setSelected] = useState(response.recommendation.routeId);
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [reader, setReader] = useState<boolean | null>(null);
  const [manualReader, setManualReader] = useState(false);
  const [showText, setShowText] = useState(false);
  const controller = useRef<SpeechCoordinator | null>(null);
  const manual = useRef(false);
  useEffect(() => {
    const next = new SpeechCoordinator(createSpeechPort(), setStatus); controller.current = next; next.setBlocked(true);
    const unwatch = watchSpeechEnvironment((enabled) => { setReader(enabled); next.setBlocked(enabled !== false || manual.current); }, () => next.stop());
    return () => { unwatch(); next.dispose(); controller.current = null; };
  }, []);
  const blocked = reader !== false || manualReader;
  const route = response.routes.find((option) => option.id === selected)!;
  const parts = speechText(route, response);
  return <View style={styles.card}>
    <SectionHeading>Odsłuch planu</SectionHeading>
    <Text style={styles.body}>To opis fikcyjnej trasy, bez prowadzenia i śledzenia pozycji. Wybierz wariant do odsłuchania.</Text>
    {response.routes.map((option, i) => <ActionButton key={option.id} label={`Odsłuch: wariant ${i + 1}, ${Math.round(option.metrics.distanceM)} m`}
      selected={selected === option.id} onPress={() => { controller.current?.stop(); setSelected(option.id); }} />)}
    <ActionButton label="Korzystam z czytnika — wyłącz głos aplikacji" checkbox selected={manualReader} onPress={() => {
      manual.current = !manualReader; setManualReader(!manualReader); controller.current?.setBlocked(reader !== false || !manualReader);
    }} />
    {Platform.OS === 'web' && <Text style={styles.body}>Przeglądarka nie wykrywa niezawodnie czytnika ekranu. Jeśli go używasz, zaznacz powyższą opcję przed odsłuchem.</Text>}
    {reader === null && <Text style={styles.body}>Nie potwierdzono jeszcze stanu czytnika. Własny odsłuch pozostaje wyłączony.</Text>}
    {Platform.OS === 'ios' && <Text style={styles.body}>Na iPhonie wyłącz tryb cichy i sprawdź głośność, jeśli nie słyszysz odsłuchu.</Text>}
    <Text accessibilityLiveRegion={blocked ? 'polite' : 'none'} style={styles.body}>{messages[status]}</Text>
    <ActionButton label="Odsłuchaj wybrany plan" primary disabled={blocked || status === 'loading' || status === 'speaking'} onPress={() => { void controller.current?.play(parts); }} />
    <ActionButton label="Zatrzymaj odsłuch" disabled={status !== 'loading' && status !== 'speaking'} onPress={() => controller.current?.stop()} />
    <ActionButton label="Powtórz plan od początku" disabled={blocked || status === 'loading'} onPress={() => { void controller.current?.play(parts); }} />
    <ActionButton label={showText ? 'Ukryj tekst odsłuchu' : 'Pokaż tekst odsłuchu'} expanded={showText} onPress={() => setShowText(!showText)} />
    {showText && <View style={styles.fact}>
      <Text style={styles.strong}>Tekst wybranego odsłuchu</Text>
      {parts.map((part, i) => <Text key={i} style={styles.body}>{part}</Text>)}
    </View>}
  </View>;
}
