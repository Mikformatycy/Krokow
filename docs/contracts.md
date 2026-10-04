# Kontrakt API

Jedynym źródłem wykonawczych schematów jest packages/contracts/src.
Wersja envelope: **1.0.0-draft.2**, wyszukiwanie miejsc dodatkowo
**place-search-1**. API i mobile walidują te same DTO; OpenAPI i przykłady
są generowane.

- [Instrukcja pakietu](../packages/contracts/README.md)
- [Endpointy API](../apps/api/README.md)
- [Wyszukiwanie](place-search.md)
- [Testy i bieżący stan](testing.md)

[contracts.md w root](../contracts.md) zachowuje historyczną specyfikację
draft.1. [F-02 review](f02-review.md) jest historią decyzji, nie drugim źródłem
schematów ani poleceniem oczekiwania na nieaktywnych wykonawców.

Zmiana kontraktu wymaga wersji, fixtures/przykładu, testów obu końców
i regeneracji; obowiązują reguły głównego AGENTS.md.
