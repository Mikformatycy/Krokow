import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { SectionHeading } from '../../components/SectionHeading';
import { colors, radius, space, type } from '../../components/theme';

const meanings = [
  { title: 'Obecność opisana', body: 'Źródło podaje, że udogodnienie jest. Sprawdź skąd i kiedy.' },
  { title: 'Brak opisany', body: 'W danych zapisano, że udogodnienia nie ma. To co innego niż brak informacji.' },
  { title: 'Brak danych', body: 'Nie wiemy. To nie oznacza ani obecności, ani braku.' },
  { title: 'Sprzeczne informacje', body: 'Źródła się różnią. Pokazujemy oba zapisy.' },
];

export function AboutDataScreen() {
  return (
    <Screen onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}>
      <ScreenHeading>Co wiemy, a czego nie wiemy</ScreenHeading>
      <Text style={styles.lead}>Tak opisujemy dane o udogodnieniach. Nie opisują konkretnego miejsca ani trasy.</Text>
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
        <Text style={styles.body}>Data pobrania, obserwacji i potwierdzenia znaczą co innego. Ponowne pobranie nie odmładza obserwacji.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { ...type.body, fontSize: 20, lineHeight: 28, color: colors.muted },
  meanings: { gap: space.s },
  card: { backgroundColor: colors.surface, padding: space.m + 4, borderRadius: radius.card, borderWidth: 1, borderColor: colors.separator, gap: space.xs },
  body: { ...type.body, color: colors.muted },
  note: { backgroundColor: colors.accentLight, padding: space.m + 4, borderRadius: radius.card, gap: space.xs },
});
