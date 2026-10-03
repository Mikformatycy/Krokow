# B-01 — serwer API i integracja fundamentu

Zakres B / Codex, 2026-10-03: Fastify, health/readiness, katalog, publiczne
źródła/dowody, walidacja wejść i wyjść, kontrolowane błędy i prywatne logi.
Zależność: integracja F-02 z gotowym F-03 w głównym checkoutcie. Użytkownik
polecił kontynuację i zezwolił na samodzielną pracę w projekcie. Przyjmujemy
draft.2 jako roboczą granicę implementacji; nie ogłaszamy formalnego odbioru
ani zatwierdzenia treści przez użytkowników końcowych.

Kryteria: testy HTTP katalogu i błędów, odrzucenie wadliwych współrzędnych,
kontrola wyjść usług, readiness zgodne z faktycznymi zależnościami, test braku
danych prywatnych w logach, lint/typecheck oraz regresja kontraktu i Expo Web
po połączeniu manifestów. Brak migracji, publikacji lub importu rzeczywistych
danych. B-02 pozostaje kolejnym zadaniem; API nie zastępuje routingu fixture.

Integracja Fastify 5.12.5 korzysta z jawnego wywołania wspólnych walidatorów
Zod na wejściu i przed wysłaniem JSON. Nie tworzymy drugiej definicji schematów
ani nie korzystamy z koercji Ajv. Dokumentacja implementacyjna:
[walidacja Fastify](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/),
[logowanie](https://fastify.dev/docs/latest/Reference/Logging/),
[testy przez inject](https://fastify.dev/docs/latest/Guides/Testing/).
`@fastify/cors` 11.3.0 jest zgodne z Fastify 5 według
[tabeli zgodności](https://github.com/fastify/fastify-cors#compatibility).

Wyniki wykonanych kontroli oraz ograniczenia znajdują się we wpisie B-01
w [statusie](status.md). Runtime nie jest wdrożeniem produkcyjnym.
