import { useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { Keyboard, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space, type } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'row';

/**
 * One button for the whole app. `row` is a list choice with an optional second line;
 * the accessible name stays the visible label unless `accessibilityLabel` adds context.
 */
export function ActionButton({ label, onPress, selected, expanded, disabled = false, busy = false, primary = false,
  variant, detail, accessibilityLabel, hint, buttonRef, testID }: {
  label: string; onPress: () => void; selected?: boolean; expanded?: boolean; disabled?: boolean; busy?: boolean;
  primary?: boolean; variant?: ButtonVariant; detail?: string; accessibilityLabel?: string; hint?: string;
  buttonRef?: RefObject<View | null>; testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  const kind: ButtonVariant = variant ?? (primary ? 'primary' : 'secondary');
  const name = accessibilityLabel ?? (detail ? `${label}, ${detail}` : label);
  return <Pressable ref={buttonRef} accessibilityRole="button" accessibilityLabel={name}
    {...(hint ? { accessibilityHint: hint } : {})}
    accessibilityState={{ disabled, busy, ...(expanded !== undefined ? { expanded } : {}), selected: selected ?? false }}
    aria-disabled={disabled} aria-busy={busy} aria-expanded={expanded}
    {...(Platform.OS === 'web' && selected !== undefined ? { 'aria-pressed': selected } : {})}
    {...(testID ? { testID } : {})}
    // An open keyboard adds its keys to VoiceOver's swipe order, so any button press closes it.
    disabled={disabled} onPress={() => { Keyboard.dismiss(); onPress(); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.base, styles[kind], selected && styles.selected, pressed && !disabled && (kind === 'primary' ? styles.primaryPressed : styles.pressed),
      focused && styles.focused, disabled && styles.disabled]}>
    {kind === 'row' ? <>
      <Text style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{selected ? '✓ ' : ''}{label}</Text>
        {detail ? <Text style={styles.detail}>{'\n'}{detail}</Text> : null}
      </Text>
      <Text style={styles.chevron} aria-hidden accessibilityElementsHidden importantForAccessibility="no">{expanded === undefined ? '›' : expanded ? '⌃' : '⌄'}</Text>
    </> : <Text style={[styles.label, kind === 'primary' && styles.primaryLabel]}>{selected ? '✓ ' : ''}{label}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  base: { minHeight: 64, borderRadius: radius.control, borderWidth: 2, paddingVertical: space.s, paddingHorizontal: space.m, justifyContent: 'center' },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent, minHeight: 72 },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' },
  row: { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: space.s },
  label: { ...type.headline, color: colors.ink, textAlign: 'center' },
  primaryLabel: { color: colors.surface, fontSize: 21 },
  rowTexts: { flex: 1 },
  rowLabel: { ...type.headline, color: colors.ink },
  detail: { ...type.callout, color: colors.muted },
  chevron: { fontSize: 28, lineHeight: 32, color: colors.muted },
  selected: { borderColor: colors.accent, borderWidth: 3, backgroundColor: colors.accentLight },
  pressed: { backgroundColor: colors.accentLight },
  primaryPressed: { opacity: 0.85 },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  disabled: { opacity: 0.55 },
});
