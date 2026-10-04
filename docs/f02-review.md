# F-02 — propozycja kontraktu do przeglądu A+B

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Właściciel: B / Codex, 2026-10-03. Zakres: schematy Zod, typy, walidacja
referencji i metryk, importowalne fixtures, przykłady JSON, generowane OpenAPI.
Założenie: korzystamy z przygotowanego F-01; nie zmieniamy rankingu ani mobile.
Kryteria techniczne: lint, typecheck, testy kontraktu i istniejącego fundamentu,
walidacja wszystkich przykładów oraz identyczny wynik ponownej generacji.
Odbiór wspólny pozostaje otwarty nawet po przejściu tych kontroli.

Wersja `1.0.0-draft.2` to implementowana propozycja, **bez zatwierdzenia A+B**.
Opis wejściowy `1.0.0-draft.1` pozostaje zachowany. Schematy nie zastępują testów
topologii grafu, resolvera ani późniejszej walidacji request–response przez API.

| Punkt | Propozycja do przeglądu |
| --- | --- |
| C-01 | Coverage zawiera cityId, nazwę, opis tekstowy, mode, navigationEligibility, capabilities, polygon i politykę świeżości. Katalog do 10 punktów; pusty query daje polecane, jeden znak jest błędem. Punkty mają cityId; synthetic nie ma rzeczywistych współrzędnych. |
| C-02 | Kroki: route.start, route.follow_segment, route.arrive; nazwa odcinka jest parametrem, bez zgadywania kierunku. Zdarzenie route.crossing_approach wyłącznie informuje o danych. Na wspólnym offsetcie: start, zdarzenie, odcinek, koniec; kolejność zdarzeń zgodna z tablicą. |
| C-03 | Zamknięte schematy pięciu uzasadnień i sześciu ostrzeżeń. Porównania odnoszą się do baseline, nawet jeżeli nie jest wyświetlany. Teksty UI pozostają do recenzji A. |
| C-04 | Osobne details dla wszystkich 12 kodów, stałe messageKey i retryable; VALIDATION_ERROR przekazuje ścieżkę i kod, bez wartości wejściowych. NO_MATCHING_ROUTE wymienia wymagania; brak automatycznego rozluźniania. |
| C-05 | Znane wartości wymagają dowodu, konflikt dwóch różnych wartości dla tego samego obiektu/cechy/zakresu. Daty nullable, jawne źródła i statusy. Walidacja DTO nie rozstrzyga, czy starszy dowód został zastąpiony — to B-03. |
| C-06 | @krok/contracts/fixtures eksportuje scenariusze wraz z requestem; każdy eksport przechodzi Zod. Dane fikcyjne, bez fs i innych zależności Node w kodzie importowanym przez mobile. JSON w examples jest generowany z tych samych danych. |
| C-07 | Cały draft jest strict: obca wersja, kod, klucz lub pole daje błąd; żadnego domyślania sukcesu. Zmiana polityki tolerowania pól wymaga kolejnego draftu i testu klienta. |
| C-08 | policy zawiera policyVersion i fieldVerificationMaxAgeDays; ta sama wersja w dataContext. 180 dni w fixture jest hipotezą z architektury, nie zatwierdzonym progiem produktu. |

Żądanie wersji: opcjonalne expectedVersions z graphVersion, evidenceVersion
i policyVersion; brak pola oznacza aktywny zestaw. Niedostępny żądany zestaw
ma DATA_VERSION_CHANGED. Serwer ustala asOf; klient nie może go przekazać.

Booleany i limit alternatyw są wymagane w request, bez ukrytych defaults.
Fixture A/B/C jawnie włącza akustykę i limit 1,6. Domyślne ustawienia produktu
oraz komunikaty o przejściach czekają na wspólny odbiór.

Rozbieżność offline P0/P1 pozostaje otwarta; F-02 nie implementuje zapisu.
Brak docs/data-sources.md, docs/testing.md i briefu nie jest uzupełniany
wymyślonymi ustaleniami. Kod nie korzysta z rzeczywistych danych OSM.

OpenAPI 3.1 jest generowane z Zod (mechanizm opisany w
[dokumentacji Zod](https://zod.dev/json-schema)). Reguły porównujące kilka
pól i referencje są dodatkowo egzekwowane przez Zod; sam walidator OpenAPI
nie zastępuje tych kontroli.
