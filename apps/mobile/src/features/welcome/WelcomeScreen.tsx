import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Screen } from '../../components/Screen';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionLink } from '../../components/ActionLink';
import { SectionHeading } from '../../components/SectionHeading';
import { colors } from '../../components/theme';

const steps = [
  { number: '01', title: 'Wybierzesz start i cel', body: 'Z katalogu punktów w obszarze pilotażu.' },
  { number: '02', title: 'Porównasz warianty', body: 'Według odległości, opisanej infrastruktury i brakujących informacji.' },
  { number: '03', title: 'Przeczytasz plan', body: 'Odcinek po odcinku, także z pomocą czytnika ekranu.' },
];

export function WelcomeScreen() {
  const { width } = useWindowDimensions();
  return (
    <Screen>
      <View style={[styles.hero, width >= 850 && styles.wide]}>
        <View style={[styles.intro, width >= 850 && styles.column]}>
          <Text style={styles.eyebrow}>PLANOWANIE PIESZYCH TRAS</Text>
          <ScreenHeading>Poznaj trasę, zanim wyruszysz.</ScreenHeading>
          <Text style={styles.lead}>Informacje o infrastrukturze, źródłach i brakach danych — dostępne w tekście.</Text>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>To dopiero podgląd</Text>
            <Text style={styles.noticeText}>Planowanie rzeczywistych tras nie jest jeszcze dostępne. Możesz wybrać fikcyjne punkty i ustawienia przykładu. Ten podgląd nie służy do prowadzenia w terenie.</Text>
          </View>
          <ActionLink href="/about-data" label="Jak czytać informacje o trasie" />
          <ActionLink href="/plan" label="Otwórz demonstrację planowania" />
        </View>
        <View style={[styles.steps, width >= 850 && styles.column]}>
          <SectionHeading>Docelowo, krok po kroku</SectionHeading>
          {steps.map((step) => (
            <View key={step.number} style={styles.step}>
              <Text style={styles.number} accessibilityElementsHidden importantForAccessibility="no">{step.number}</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.body}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.principle}>
        <SectionHeading>Brak danych też jest informacją</SectionHeading>
        <Text style={styles.body}>Oddzielamy zapisany brak udogodnienia od sytuacji, w której nic o nim nie wiadomo. Sprzeczne informacje pokazujemy wprost.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 32, paddingVertical: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start', gap: 48 },
  intro: { gap: 24 },
  column: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  lead: { color: colors.muted, fontSize: 21, lineHeight: 32 },
  notice: { padding: 18, borderRadius: 12, backgroundColor: colors.notice, gap: 8 },
  noticeTitle: { color: colors.noticeInk, fontSize: 17, fontWeight: '700' },
  noticeText: { color: colors.noticeInk, fontSize: 16, lineHeight: 25 },
  steps: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, gap: 24, borderWidth: 1, borderColor: colors.border },
  step: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  number: { color: colors.accent, fontSize: 16, fontWeight: '700', lineHeight: 28, minWidth: 28 },
  stepCopy: { flex: 1, gap: 6 },
  stepTitle: { color: colors.ink, fontSize: 18, lineHeight: 27, fontWeight: '600' },
  body: { color: colors.muted, fontSize: 17, lineHeight: 27 },
  principle: { padding: 24, gap: 10, backgroundColor: colors.accentLight, borderRadius: 16 },
});
