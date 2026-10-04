import type { Preferences, RouteRequest } from '@krok/contracts';
import { Text } from 'react-native';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { SectionHeading } from '../../components/SectionHeading';
import { ToggleRow } from '../../components/ToggleRow';
import { formStyles as styles } from './styles';

export const preferenceLabels = [
  { key: 'preferAudibleSignals', label: 'Preferuj opisaną sygnalizację dźwiękową', short: 'sygnalizacja dźwiękowa' },
  { key: 'preferTactilePaving', label: 'Preferuj opisane oznaczenia dotykowe', short: 'oznaczenia dotykowe' },
  { key: 'preferSeparatedFootways', label: 'Preferuj opisane oddzielne ciągi piesze', short: 'oddzielne ciągi piesze' },
  { key: 'avoidKnownSteps', label: 'Pomijaj odcinki oznaczone jako schody', short: 'pomijanie schodów' },
] as const;
export const detourChoices = [[1.2, 'Do 20% dłuższa'], [1.4, 'Do 40% dłuższa'], [1.6, 'Do 60% dłuższa'], [2, 'Do 2 razy dłuższa']] as const;

export function requirementText(preferences: Preferences, maxAgeDays: number): string {
  return { none: 'Akustyka: bez twardego wymagania.', documented: 'Akustyka: wymagana opisana obecność bez konfliktu.',
    field_verified_recent: `Akustyka: wymagane potwierdzenie z ostatnich ${maxAgeDays} dni.` }[preferences.audibleRequirement];
}

export function OptionsStep({ preferences, onPreferences, detour, onDetour, maxAlternatives, onMaxAlternatives, maxAgeDays, synthetic, error, onDone }: {
  preferences: Preferences; onPreferences: (value: Preferences) => void; detour: number; onDetour: (value: number) => void;
  maxAlternatives: RouteRequest['maxAlternatives']; onMaxAlternatives: (value: RouteRequest['maxAlternatives']) => void;
  maxAgeDays: number; synthetic: boolean; error: string | undefined; onDone: () => void;
}) {
  const presets: readonly (readonly [number, string])[] = detourChoices.some(([value]) => value === detour)
    ? detourChoices : [...detourChoices, [detour, `Do ${Math.round((detour - 1) * 100)}% dłuższa`]];
  return <>
    <ScreenHeading>Ustawienia trasy</ScreenHeading>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <SectionHeading>Preferencje</SectionHeading>
    <Text style={styles.body}>{synthetic ? 'Preferencje nie potwierdzają udogodnień. W demo ranking zmienia tylko akustyka.' : 'Preferencje nie potwierdzają udogodnień.'}</Text>
    {preferenceLabels.map(({ key, label }) => <ToggleRow key={key} label={label} value={preferences[key]}
      {...(key === 'avoidKnownSteps' ? { description: 'Braki danych mogą ukrywać schody.' } : {})}
      onChange={(value) => onPreferences({ ...preferences, [key]: value })} />)}
    <SectionHeading>Wymaganie akustyki</SectionHeading>
    <ChoiceGroup title="Wymaganie akustyki" value={preferences.audibleRequirement}
      onChange={(value) => onPreferences({ ...preferences, audibleRequirement: value })} options={[
        ['none', 'Bez twardego wymagania akustyki'],
        ['documented', 'Wymagaj opisanej obecności akustyki bez konfliktu'],
        ['field_verified_recent', `Wymagaj potwierdzenia w terenie w ciągu ${maxAgeDays} dni`],
      ]} />
    <Text style={styles.body}>Brak danych i konflikt nie spełniają wymagania. Nie rozluźniamy go automatycznie.</Text>
    <SectionHeading>Maksymalne wydłużenie</SectionHeading>
    <Text style={styles.body}>Względem najkrótszej trasy spełniającej te same wymagania.</Text>
    <ChoiceGroup title="Maksymalne wydłużenie" value={detour} onChange={onDetour} options={presets} />
    <SectionHeading>Liczba wariantów</SectionHeading>
    <ChoiceGroup title="Liczba wariantów" value={maxAlternatives} onChange={onMaxAlternatives}
      options={[[1, 'Maksymalnie 1'], [2, 'Maksymalnie 2'], [3, 'Maksymalnie 3']]} />
    <ActionButton primary label="Gotowe" onPress={onDone} />
  </>;
}
