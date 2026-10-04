import { useState } from 'react';
import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space, type } from './theme';

export function ActionLink({ href, label, secondary = false }: {
  href: Href; label: string; secondary?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Link's slot merges plain style objects only, so pressed state is tracked here rather than via a style function.
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={StyleSheet.flatten([styles.link, secondary && styles.secondary, pressed && (secondary ? styles.secondaryPressed : styles.pressed), focused && styles.focused])}
      >
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 72, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch', borderRadius: radius.control, borderWidth: 2,
    borderColor: colors.accent, backgroundColor: colors.accent, paddingVertical: space.s, paddingHorizontal: space.m },
  label: { ...type.headline, fontSize: 21, color: colors.surface, textAlign: 'center' },
  secondary: { minHeight: 64, backgroundColor: colors.surface, borderColor: colors.border },
  secondaryLabel: { color: colors.ink, fontSize: 20 },
  pressed: { opacity: 0.85 },
  secondaryPressed: { backgroundColor: colors.accentLight },
  focused: { borderColor: colors.focus, borderWidth: 3 },
});
