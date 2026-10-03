import { useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ActionButton } from './ActionButton';

/** Collapsed content is unmounted so it cannot retain keyboard or reader focus. */
export function Details({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 16 }}>
    <ActionButton label={label} expanded={open} onPress={() => setOpen(!open)} />
    {open && children}
  </View>;
}
