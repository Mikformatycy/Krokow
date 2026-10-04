# Kroków — scenariusz demonstracji

Stan: 2026-10-04. Plan filmu około **120 sekund**, maks. 3 minuty, PDF do 10 slajdów zgodnie z [briefem](../requirements.md). Scenariusz nie jest gotowym nagraniem. Podstawa: kreator i rzeczywisty plan Galeria Pawia → High5ive zachodnie.

## Film

| Czas | Obraz | Treść |
| --- | --- | --- |
| 0:00–0:15 | Nazwa i ekran startowy | Poznaj trasę, zanim wyruszysz. Osoba niewidoma potrzebuje informacji o infrastrukturze i niewiadomych. |
| 0:15–0:35 | Pawia 5 → Galeria Pawia; High5ive → zachodnie | Wybór dokładnych wejść powiązanych z grafem. Wyszukiwarka jest szersza niż zasięg tras. |
| 0:35–0:55 | Wynik 420 m, około 6 min, unknown | Rzeczywisty plan OSM; czas samego marszu. Akustyka nieznana, bez potwierdzenia dostępności. |
| 0:55–1:15 | Informacje o odcinkach, źródła i daty | Nawierzchnia konkretnych obiektów, wpisy niezweryfikowane, nie opisują całej trasy. |
| 1:15–1:30 | Krótki odsłuch lub tekst | Plan można przeczytać/odsłuchać; to nie GPS. Dźwięk trzeba sprawdzić. Przy VoiceOver własny TTS jest blokowany. |
| 1:30–1:45 | Twarde wymaganie akustyki → odmowa | Brak pasującej trasy i zachowanie ustawień, bez automatycznego rozluźnienia. |
| 1:45–2:00 | Rozwój i model biznesowy | Walidacja, aktualizacje, ograniczony pilot poza UMK; płatny widget/opis dojścia dla hoteli i wydarzeń. |

Montaż może skracać przejścia, ale nie zmieniać znaczenia wyniku ani ukrywać „tylko podgląd”. Opcjonalny przykład A/B/C musi w całym fragmencie mieć etykietę synthetic; nie łączyć jego faktów z realnymi miejscami.

## Osiem slajdów

1. Kroków: problem i grupa docelowa.
2. Skala problemu ze źródłem; oddzielnie lokalny audyt danych.
3. Wyszukanie → wejścia → preferencje → plan → tekst/odsłuch.
4. Rzeczywisty przykład 420 m: nawierzchnia i unknown.
5. Wiarygodność: źródła, daty, konflikty i odmowa przy twardym wymaganiu.
6. Architektura/testy; rozdzielone dane/API/UI, bez LLM; ograniczenia urządzenia i terenu.
7. Biznes i [utrzymanie](operations.md): zakres odpowiedzialności, finansowanie, plan zgłoszeń.
8. Następny pilot/miasto: audyt źródeł i topologii, dostosowanie kodu, czytnik, warunki publikacji.

Nie deklarować pełnego pokrycia, potwierdzonej akustyki, bezpieczeństwa, rozpoznawania świateł ani pełnego WCAG. [Start](../README.md), [odbiór materiałów](demo-delivery.md).
