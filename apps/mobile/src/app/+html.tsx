import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

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
      <body>{children}</body>
    </html>
  );
}
