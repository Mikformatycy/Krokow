import { useRef } from 'react';
import { Text, View } from 'react-native';
import { focusControl } from '../../adapters/accessibility/focusControl';
import { ActionButton } from '../../components/ActionButton';
import { Details } from '../../components/Details';
import { SectionHeading } from '../../components/SectionHeading';
import { ToggleRow } from '../../components/ToggleRow';
import type { useRoutePlayback } from '../planning/useRoutePlayback';
import { formStyles as styles } from '../planning/styles';
import { simulationItemText } from './text';
import { simulationItemSummary } from './summary';

export function SimulationPanel({ playback }: { playback: ReturnType<typeof useRoutePlayback> }) {
  const mainButton = useRef<View>(null);
  const { simulation, active, text, voice, blocked, events, ended } = playback;
  const status = simulation?.status ?? 'ready';
  const mainAction = status === 'running' ? { label: 'Pauza symulacji', press: () => playback.control('pause') }
    : status === 'paused' ? { label: 'Wznów symulację', press: () => playback.control('resume') }
    : status === 'completed' ? { label: 'Resetuj symulację', press: () => playback.control('reset') }
    : { label: 'Rozpocznij symulację', press: playback.start };
  return <View style={styles.card} testID="simulation">
    <SectionHeading>Symulacja</SectionHeading>
    <Text style={styles.body}>Przejście po planie w tempie 16×. Bez GPS. Ukrycie aplikacji ją wstrzymuje.</Text>
    <Text style={styles.strong} testID="simulation-status">{ended ? 'Symulacja zakończona przez użytkownika.' : {
      ready: 'Symulacja gotowa do rozpoczęcia.', running: 'Symulacja w toku.', paused: 'Symulacja wstrzymana.',
      completed: 'Symulacja dotarła do końca planu.', invalidated: 'Symulacja zakończona.',
    }[status]}</Text>
    {simulation?.pauseReason === 'background' && <Text style={styles.body}>Wstrzymano po ukryciu aplikacji. Wznów, gdy chcesz.</Text>}
    {simulation?.pauseReason === 'clock_invalid' && <Text style={styles.body}>Nieprawidłowy odczyt zegara. Symulację wstrzymano.</Text>}
    <ActionButton buttonRef={mainButton} label={mainAction.label} primary disabled={!active && status !== 'running'} onPress={mainAction.press} />
    {text && <ActionButton label="Powtórz komunikat" disabled={!active} onPress={() => playback.control('repeat')} />}
    {simulation && <ActionButton label="Zakończ symulację" onPress={() => { playback.end(); focusControl(mainButton); }} />}
    <ToggleRow label="Głos symulacji" value={voice} disabled={blocked} onChange={playback.toggleVoice} />
    {blocked && <Text style={styles.body} testID="simulation-reader-note">Zdarzenia ogłasza czytnik ekranu. „Powtórz komunikat” czyta ostatnie w całości.</Text>}
    <Text style={styles.body} testID="simulation-progress">Postęp symulacji: {Math.floor(simulation?.positionM ?? 0)} m{simulation ? ` z ${Math.round(simulation.distanceM)} m` : ''}.</Text>
    <Text style={styles.body} testID="simulation-current">{simulation?.lastItem ? simulationItemSummary(simulation.lastItem) : 'Rozpocznij, aby poznać przebieg trasy.'}</Text>
    <Details label="Szczegóły symulacji">
      {simulation && status !== 'completed' && <ActionButton label="Resetuj symulację" onPress={() => { playback.control('reset'); focusControl(mainButton); }} />}
      <Text style={styles.body}>Start symulacji zatrzymuje odsłuch planu. Powrót z tła jej nie wznawia. Włączenie głosu nie odtwarza minionych zdarzeń.</Text>
      {text && <Text style={styles.body}>{text}</Text>}
      {events.length > 0 && <View style={styles.fact} testID="simulation-events">
        <SectionHeading>Zdarzenia od początku symulacji</SectionHeading>
        {events.map((item) => <Text key={item.key} style={styles.body}>{simulationItemText(item)}</Text>)}
      </View>}
    </Details>
  </View>;
}
