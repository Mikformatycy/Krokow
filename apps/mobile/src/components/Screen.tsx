import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Kroków</Text>
            <Text style={styles.tag}>PODGLĄD APLIKACJI</Text>
          </View>
          {children}
          <Text style={styles.footer}>Informacje o trasie. Z miejscem na niewiadome.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 12, paddingVertical: 20 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 24 },
  brandRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { fontSize: 24, fontWeight: '700', color: colors.ink },
  tag: { color: colors.accent, fontSize: 12, letterSpacing: 1.3, fontWeight: '700', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.accentLight, borderRadius: 8 },
  footer: { color: colors.muted, fontSize: 14, lineHeight: 22, paddingTop: 20, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border },
});
