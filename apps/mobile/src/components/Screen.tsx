import { useState } from 'react';
import type { ReactNode } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space, type } from './theme';

/**
 * Fixed top bar keeps "Wstecz" in one predictable place.
 * The data badge stays visible on every step so demo data can never look real; readers hear it once, at the end.
 */
export function Screen({ children, onBack, backLabel = 'Wstecz', badge, page }: {
  children: ReactNode; onBack?: () => void; backLabel?: string; badge?: string; page?: string;
}) {
  // VoiceOver's escape gesture first hides the keyboard, as in system apps; only without a keyboard does it go back.
  const escape = () => {
    if (Keyboard.isVisible()) { Keyboard.dismiss(); return; }
    onBack?.();
  };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame} onAccessibilityEscape={escape}>
        {(onBack || badge) && <View style={styles.bar}>
          {onBack ? <BackButton label={backLabel} onPress={onBack} /> : <View />}
          {/* iOS orders VoiceOver by position, so moving this in the tree is not enough: hide it here, repeat it last. */}
          {badge ? <Text style={styles.badge} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{badge}</Text> : null}
        </View>}
        {/* A new page (wizard step) starts at the top instead of inheriting the previous scroll offset. */}
        <ScrollView key={page} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {children}
            {badge ? <Text style={styles.footer} testID="data-label">{badge}</Text> : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.back, pressed && styles.backPressed, focused && styles.backFocused]}>
    <Text style={styles.backText}>‹ {label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  frame: { flex: 1 },
  bar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.xs,
    paddingHorizontal: space.s, paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: colors.separator, backgroundColor: colors.background },
  back: { minHeight: 48, minWidth: 48, justifyContent: 'center', paddingHorizontal: space.xs, borderRadius: radius.control, borderWidth: 2, borderColor: 'transparent' },
  backPressed: { backgroundColor: colors.accentLight },
  backFocused: { borderColor: colors.focus },
  backText: { ...type.headline, color: colors.accent },
  badge: { ...type.callout, fontWeight: '600', color: colors.accent, backgroundColor: colors.accentLight, borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: space.s, overflow: 'hidden' },
  footer: { ...type.callout, color: colors.muted, textAlign: 'center', paddingTop: space.s, borderTopWidth: 1, borderTopColor: colors.separator },
  scroll: { flexGrow: 1, paddingHorizontal: space.m + 4, paddingTop: space.l, paddingBottom: space.xl },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.m + 4 },
});
