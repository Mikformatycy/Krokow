import { Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionLink } from '../../components/ActionLink';
import { Details } from '../../components/Details';
import { formStyles as styles } from '../planning/styles';

export function WelcomeScreen() {
  return <Screen>
    <ScreenHeading>Poznaj trasę, zanim wyruszysz.</ScreenHeading>
    <Text style={styles.strong}>Poznaj plan trasy. Bez prowadzenia w terenie.</Text>
    <ActionLink href="/plan" label="Zaplanuj trasę" />
    <ActionLink href="/about-data" label="Jak czytać informacje o trasie" secondary />
    <Details label="Więcej o aplikacji">
      <View style={styles.section}>
        <Text style={styles.body}>Dostępny obszar i rodzaj danych sprawdzisz na ekranie planowania. Wybierz start i cel, a potem poznaj lub odsłuchaj plan. Symulacja jest dostępna wyłącznie dla oznaczonych fikcyjnych przykładów.</Text>
        <Text style={styles.body}>Brak danych nie oznacza braku udogodnienia. Sprzeczne informacje pokazujemy wprost. Źródła i daty znajdziesz w szczegółach trasy.</Text>
      </View>
    </Details>
  </Screen>;
}
