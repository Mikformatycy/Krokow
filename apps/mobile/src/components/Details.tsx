import { useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ActionButton } from './ActionButton';
import { space } from './theme';

/** Collapsed content is unmounted so it cannot retain keyboard or reader focus. */
export function Details({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: space.s }}>
    <ActionButton variant="row" label={label} {...(detail ? { detail } : {})} accessibilityLabel={detail ? `${label}, ${detail}` : label}
      expanded={open} onPress={() => setOpen(!open)} />
    {open && <View style={{ gap: space.s }}>{children}</View>}
  </View>;
}
