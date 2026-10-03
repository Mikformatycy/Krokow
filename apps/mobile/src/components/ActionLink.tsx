import { useState } from 'react';
import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

export function ActionLink({ href, label, secondary = false }: {
  href: Href; label: string; secondary?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={StyleSheet.flatten([styles.link, secondary && styles.secondary, focused && styles.focused])}
      >
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 64, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch', borderRadius: 12, borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.accent, paddingVertical: 16, paddingHorizontal: 20 },
  label: { color: colors.surface, fontSize: 20, lineHeight: 29, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  secondaryLabel: { color: colors.ink },
  focused: { borderColor: colors.focus },
});
