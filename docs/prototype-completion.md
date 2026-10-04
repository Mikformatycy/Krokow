# Domknięcie funkcjonalne prototypu — 2026-10-04

Zakres przed edycją: P-01 audyt bieżącego archiwum tras (surowe tagi →
normalizacja → graf → odpowiedź), P-02 wybór rzeczywistych przykładów,
P-03 zachowanie informacji o obiektach trasy, P-04 podłączenie gotowego
wyszukiwania Krakowa do istniejącego kreatora, P-05 regresja.

Założenia: bez nowych importów, bez zmian topologii, rankingu, twardych
ograniczeń i wire formatów. Dane archiwalne pozostają niezweryfikowane w
terenie. Wyszukiwarka miasta nie rozszerza zasięgu grafu. Nie przebudowujemy
UI, symulacji ani koordynatora mowy. Nie wykonujemy commitów ani pushów.

Odbiór: powtarzalny raport audytu; rzeczywiste fakty tylko z obiektów
wariantów odpowiedzi; wyszukanie nazwy/adresu spoza grafu z jawnym brakiem
trasy; wybór przypisanego punktu i obliczenie planu; brak cichego obejścia
wymagań lub awarii źródła. Testy backendu, kontraktów, aplikacji, lint,
typecheck i eksport web. Telefon/VoiceOver wymagają osobnego sprawdzenia.

Wynik: implementacja, integracja UI/API i weryfikacja automatyczna zakończone. Raport: `data-audit-report.md`; komendy, wyniki, poprawione
testy i pozostałe ograniczenia: bieżący wpis `handoff-backend.md` oraz
`status.md`. Użytkownik potwierdził pięć prób iPhone/VoiceOver;
pozostałe próby i nowsze podsumowanie są opisane w [testing.md](testing.md).
Bez commitów/pushów.
