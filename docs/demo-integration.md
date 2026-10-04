# Demo — integracja HTTP i porównanie tras

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Zakres B / Codex po zgodzie na samodzielną pracę: okno 1 oraz potrzebne do
filmu szczegóły M-02. Zachowujemy formularz, mock, kontrakt draft.2 i fikcyjny
graf. Bez nowych zależności natywnych i zmian zasad rankingu.

Kryteria: jawny wybór obliczeń API/przykładów; walidacja HTTP i odpowiedzi,
timeout, brak automatycznego fallbacku, zachowanie ustawień po błędzie oraz
odrzucenie spóźnionego wyniku po zmianie formularza/trybu. Porównanie długości,
baseline, akustyki, unknown/conflict, przebiegu tekstowego i źródeł. Komunikaty
wynikają wyłącznie z DTO i szablonów; synthetic i preview_only pozostają jawne.

Sprawdzenie: testy adaptera, Playwright z rzeczywistym API, zmiana preferencji,
błędy, spóźniona odpowiedź, klawiatura, szerokość 390 px, lint, typecheck,
kontrakty i eksport web. Telefon wymaga osobnego wyniku. Odsłuch będzie kolejnym
etapem. PDF-y Lumi przeczytano: dotyczą innego produktu na HarmonyOS, nie są
wymaganiami dla Krok po kroku; nie przenosimy ich deklaracji do naszego demo.
