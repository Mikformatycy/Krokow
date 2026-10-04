# B-02 — rzeczywiste obliczenia na grafie synthetic

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Zakres B / Codex, 2026-10-03: czyste funkcje grafu i kosztu, Dijkstra,
ograniczone alternatywy bez pętli, metryki i adapter do istniejącego API.
Założenia: jawne węzły i skierowane połączenia, fikcyjne dane, brak geometrii
realnych miejsc; brak zmian DTO draft.2 i kodu mobile. Zachowujemy M-01 oraz
jego manifest podczas regeneracji wspólnego lockfile.

Kryteria: A/B/C mają 740/980/1120 m; dla akustyki koszt wynosi odpowiednio
1480/1100/1160, rekomendacja B. Bez preferencji rekomendacja A. Twarde wymogi
nie są rozluźniane, baseline spełnia te same wymagania, limit jednej opcji
zachowuje osobny baseline. Testy obejmą rozłączny graf, kierunek, zamknięcia,
schody, unknown/conflict/stare potwierdzenie, limity wyszukiwania, deterministykę,
deduplikację i niezmienność metryk/kosztu przy podziale odcinka. Odpowiedzi
algorytmu muszą przejść istniejący Zod i test HTTP.

Polityka `synthetic-acoustic-v1` zachowuje przykład architektury: po włączeniu
akustyki 40/300/400/500 za stan present/absent/unknown/conflicting, poza tym
koszt długości. Dotyk, oddzielenie i wiek nie mają dodatkowych kar w tej
polityce. Wybranie tych miękkich preferencji nie zmienia rankingu synthetic.
To ograniczenie jawnego scenariusza, nie docelowa polityka produktu.
Twarde ograniczenia schodów i aktualnej weryfikacji nadal są egzekwowane.
Parametry proponowanej polityki pilot-v1 z architektury pozostają osobno;
runtime B-02 nie włącza prawdziwego pilotażu.

Brak trasy po ograniczeniach wymaga sprawdzenia połączenia w bazowym grafie
legalnego dostępu. Wyczerpanie budżetu nigdy nie dowodzi braku połączenia.
Readiness dalej sprawdza także PostGIS; działający graf w RAM nie zastępuje
dodatniego testu bazy. B-03 pozostaje osobnym resolverem; B-02 korzysta
z jawnie przygotowanych faktów, nie dopowiada danych OSM.
