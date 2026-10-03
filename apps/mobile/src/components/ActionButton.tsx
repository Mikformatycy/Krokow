import { useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

export function ActionButton({ label, onPress, selected, expanded, checkbox = false, disabled = false, primary = false, buttonRef }: {
  label: string; onPress: () => void; selected?: boolean; expanded?: boolean; checkbox?: boolean; disabled?: boolean; primary?: boolean;
  buttonRef?: RefObject<View | null>;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable ref={buttonRef} accessibilityRole={checkbox ? 'checkbox' : 'button'} accessibilityLabel={label}
    accessibilityState={{ disabled, ...(expanded !== undefined ? { expanded } : {}), ...(checkbox ? { checked: selected ?? false } : { selected: selected ?? false }) }}
    aria-disabled={disabled} aria-expanded={expanded} aria-checked={checkbox ? selected ?? false : undefined}
    {...(Platform.OS === 'web' && !checkbox && selected !== undefined ? { 'aria-pressed': selected } : {})}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[styles.button, primary && styles.primary, selected && styles.selected, focused && styles.focused, disabled && styles.disabled]}>
    <Text style={[styles.text, primary && styles.primaryText]}>{selected ? '✓ ' : ''}{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 64, padding: 12, borderWidth: 3, borderColor: colors.border, borderRadius: 12, justifyContent: 'center', backgroundColor: colors.surface },
  text: { fontSize: 20, lineHeight: 29, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  primaryText: { color: colors.surface, fontWeight: '600' },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  focused: { borderColor: colors.focus },
  disabled: { opacity: 0.6 },
});
