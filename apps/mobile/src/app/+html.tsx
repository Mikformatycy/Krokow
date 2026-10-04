import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { ANNOUNCER_ID } from '../adapters/accessibility/announce.web';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <title>Kroków</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Kroków — podgląd aplikacji do planowania pieszych tras z jawnymi brakami danych." />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        {/* Present before the first message so screen readers observe later additions. */}
        <div id={ANNOUNCER_ID} aria-live="polite" aria-relevant="additions" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }} />
      </body>
    </html>
  );
}
