export interface AnnounceOptions { interrupt?: boolean }

export const ANNOUNCER_ID = 'krokow-announcer';

function region(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById(ANNOUNCER_ID);
  if (existing) return existing;
  const created = document.createElement('div');
  created.id = ANNOUNCER_ID;
  created.setAttribute('aria-live', 'polite');
  created.setAttribute('aria-relevant', 'additions');
  Object.assign(created.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' });
  document.body.appendChild(created);
  return created;
}

/** react-native-web has no announcer; appended nodes make repeated identical messages audible again. */
export function announce(text: string, { interrupt = false }: AnnounceOptions = {}): void {
  const target = region();
  if (!target || !text) return;
  target.setAttribute('aria-live', interrupt ? 'assertive' : 'polite');
  const message = document.createElement('p');
  message.textContent = text;
  target.appendChild(message);
  while (target.childElementCount > 3) target.firstElementChild?.remove();
}
