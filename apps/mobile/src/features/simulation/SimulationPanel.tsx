import { Text, View } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { SectionHeading } from '../../components/SectionHeading';
import type { useRoutePlayback } from '../planning/useRoutePlayback';
import { formStyles as styles } from '../planning/styles';
import { simulationItemText } from './text';

export function SimulationPanel({ playback }: { playback: ReturnType<typeof useRoutePlayback> }) {
  const { simulation, active, text, voice, blocked, events, ended } = playback;
  const status = simulation?.status ?? 'ready';
  const running = status === 'running';
  return <View style={styles.section} testID="simulation">
    <SectionHeading>Symulacja wybranego wariantu</SectionHeading>
    <Text style={styles.body}>Fikcyjne dane demonstracyjne. To symulacja w tempie 16×, bez GPS i prowadzenia w terenie. Start symulacji zatrzymuje odsłuch planu. Ukrycie aplikacji pauzuje symulację i zatrzymuje głos. Powrót wymaga ręcznego wznowienia.</Text>
    <Text style={styles.strong} testID="simulation-status">{ended ? 'Symulacja zakończona przez użytkownika.' : {
      ready: 'Symulacja gotowa do rozpoczęcia.', running: 'Symulacja w toku.', paused: 'Symulacja wstrzymana.',
      completed: 'Symulacja dotarła do końca planu. Reset pozwala rozpocząć od nowa.', invalidated: 'Symulacja zakończona.',
    }[status]}</Text>
    {simulation?.pauseReason === 'background' && <Text style={styles.body}>Pauza po ukryciu aplikacji. Wznów na swoje żądanie.</Text>}
    {simulation?.pauseReason === 'clock_invalid' && <Text style={styles.body}>Nieprawidłowy odczyt zegara. Symulacja została wstrzymana.</Text>}
    <Text style={styles.body} testID="simulation-progress">Postęp symulacji: {Math.floor(simulation?.positionM ?? 0)} m{simulation ? ` z ${Math.round(simulation.distanceM)} m` : ''}.</Text>
    <Text style={styles.body} testID="simulation-current">{text ?? 'Brak zdarzenia symulacji. Rozpocznij ją, aby przeglądać zdarzenia.'}</Text>
    <ActionButton label="Włącz głos symulacji" checkbox selected={voice} disabled={blocked} onPress={playback.toggleVoice} />
    <Text style={styles.body}>Włączenie głosu nie odtwarza minionych zdarzeń. Powtórzenie odczytuje ostatni komunikat od początku. Pełny przebieg i dowody są dostępne w szczegółach wariantu.</Text>
    <ActionButton label="Rozpocznij symulację" primary disabled={!active || status !== 'ready'} onPress={playback.start} />
    <ActionButton label="Pauza symulacji" disabled={!running} onPress={() => playback.control('pause')} />
    <ActionButton label="Wznów symulację" disabled={!active || status !== 'paused'} onPress={() => playback.control('resume')} />
    <ActionButton label="Powtórz zdarzenie symulacji" disabled={!active || !text} onPress={() => playback.control('repeat')} />
    <ActionButton label="Resetuj symulację" disabled={!simulation} onPress={() => playback.control('reset')} />
    <ActionButton label="Zakończ symulację" disabled={!simulation} onPress={playback.end} />
    {events.length > 0 && <View style={styles.fact} testID="simulation-events">
      <SectionHeading>Zdarzenia od początku symulacji</SectionHeading>
      {events.map((item) => <Text key={item.key} style={styles.body}>{simulationItemText(item)}</Text>)}
    </View>}
  </View>;
}
