import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionLink } from '../../components/ActionLink';
import { SectionHeading } from '../../components/SectionHeading';
import { colors } from '../../components/theme';

const meanings = [
  { title: 'Obecność opisana', body: 'Źródło zawiera informację o obecności udogodnienia. Warto sprawdzić, skąd pochodzi i kiedy zostało zaobserwowane.' },
  { title: 'Brak opisany', body: 'W danych zapisano, że danego udogodnienia nie ma. To inna sytuacja niż brak informacji.' },
  { title: 'Brak danych', body: 'Nie mamy informacji pozwalających opisać tę cechę. Nie oznacza to ani obecności, ani braku udogodnienia.' },
  { title: 'Sprzeczne informacje', body: 'Źródła podają różne informacje. Konflikt powinien pozostać widoczny wraz z jego pochodzeniem.' },
];

export function AboutDataScreen() {
  return (
    <Screen>
      <ScreenHeading>Co wiemy, a czego nie wiemy</ScreenHeading>
      <Text style={styles.lead}>To objaśnienia sposobu prezentacji danych. Nie opisują konkretnego miejsca ani rzeczywistej trasy.</Text>
      <View style={styles.meanings}>
        {meanings.map((meaning) => (
          <View key={meaning.title} style={styles.card}>
            <SectionHeading>{meaning.title}</SectionHeading>
            <Text style={styles.body}>{meaning.body}</Text>
          </View>
        ))}
      </View>
      <View style={styles.note}>
        <SectionHeading>Pobranie danych to nie potwierdzenie w terenie</SectionHeading>
        <Text style={styles.body}>Data pobrania rekordu, data obserwacji i data potwierdzenia mają różne znaczenia. Ponowne pobranie nie odmładza obserwacji. Gdy data jest nieznana, trzeba to powiedzieć.</Text>
      </View>
      <ActionLink href="/" label="Wróć do początku" secondary />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 20, lineHeight: 31, maxWidth: 800 },
  meanings: { gap: 16 },
  card: { backgroundColor: colors.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 28 },
  note: { backgroundColor: colors.accentLight, padding: 24, borderRadius: 16, gap: 8 },
});
