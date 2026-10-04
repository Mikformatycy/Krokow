import { Image, StyleSheet, Text, View } from 'react-native';
import logo from '../../../../../logo.png';
import { Screen } from '../../components/Screen';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionLink } from '../../components/ActionLink';
import { colors, space, type } from '../../components/theme';

export function WelcomeScreen() {
  return <Screen>
    <View style={styles.hero}>
      <Text style={styles.brand}>Kroków</Text>
      <ScreenHeading>To mały krok dla człowieka, ale wielki krok dla Krakowa</ScreenHeading>
      <Text style={styles.lead}>Plan pieszej trasy z jasną informacją, czego nie wiemy. Bez prowadzenia w terenie.</Text>
    </View>
    <ActionLink href="/plan" label="Zaplanuj trasę" />
    <ActionLink href="/about-data" label="Jak czytać informacje o trasie" secondary />
    <View style={styles.footer}>
      <Image source={logo} style={styles.logo} resizeMode="contain"
        accessible accessibilityLabel="Logo Kroków — białe laski ułożone w literę K" />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { gap: space.s, paddingTop: space.l, paddingBottom: space.m },
  brand: { ...type.headline, color: colors.accent, letterSpacing: 0.5 },
  lead: { ...type.body, fontSize: 20, lineHeight: 28, color: colors.muted },
  footer: { alignItems: 'center', paddingTop: space.s, borderTopWidth: 1, borderTopColor: colors.separator },
  logo: { width: 160, height: 160, borderRadius: 16 },
});
