import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from './theme';

/** Single choice with radio semantics, so readers announce the checked option and its position. */
export function ChoiceGroup<T extends string | number>({ title, options, value, onChange }: {
  title: string; options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void;
}) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={title} style={styles.group}>
    {options.map(([option, label]) => <Choice key={String(option)} label={label} checked={option === value} onPress={() => { Keyboard.dismiss(); onChange(option); }} />)}
  </View>;
}

function Choice({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked }} aria-checked={checked}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.choice, checked && styles.checked, pressed && styles.pressed, focused && styles.focused]}>
    <View style={[styles.ring, checked && styles.ringOn]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {checked && <View style={styles.dot} />}
    </View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  group: { gap: space.xs },
  choice: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingVertical: space.s, paddingHorizontal: space.m,
    backgroundColor: colors.surface, borderRadius: radius.control, borderWidth: 2, borderColor: colors.border },
  checked: { borderColor: colors.accent, borderWidth: 3, backgroundColor: colors.accentLight },
  pressed: { backgroundColor: colors.accentLight },
  focused: { borderColor: colors.focus, borderWidth: 3 },
  ring: { width: 26, height: 26, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  ringOn: { borderColor: colors.accent },
  dot: { width: 14, height: 14, borderRadius: radius.pill, backgroundColor: colors.accent },
  label: { ...type.headline, color: colors.ink, flex: 1 },
});
