import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from './theme';

/** On/off setting: the whole row is one switch; state is shown by knob position and text, not colour alone. */
export function ToggleRow({ label, value, onChange, description, disabled = false }: {
  label: string; value: boolean; onChange: (value: boolean) => void; description?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }}
    aria-checked={value} aria-disabled={disabled} disabled={disabled}
    onPress={() => { Keyboard.dismiss(); onChange(!value); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, focused && styles.focused, disabled && styles.disabled]}>
    <Text style={styles.texts}>
      <Text style={styles.label}>{label}</Text>
      {description ? <Text style={styles.description}>{'\n'}{description}</Text> : null}
    </Text>
    <View style={styles.control} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.state}>{value ? 'Wł.' : 'Wył.'}</Text>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingVertical: space.s, paddingHorizontal: space.m,
    backgroundColor: colors.surface, borderRadius: radius.control, borderWidth: 2, borderColor: colors.border },
  texts: { flex: 1 },
  label: { ...type.headline, color: colors.ink },
  description: { ...type.callout, color: colors.muted },
  control: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  state: { ...type.callout, fontWeight: '600', color: colors.ink, minWidth: 34, textAlign: 'right' },
  track: { width: 56, height: 34, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: 3, justifyContent: 'center' },
  trackOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  knob: { width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.border },
  knobOn: { backgroundColor: colors.surface, alignSelf: 'flex-end' },
  pressed: { backgroundColor: colors.accentLight },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  disabled: { opacity: 0.55 },
});
