# B-03 — rozstrzyganie dowodów

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Moduł: `packages/routing/src/evidence`, eksport `resolveEvidence` z
`@krok/routing`. Jest czystą funkcją przygotowaną do importera/grafu.
Nie został automatycznie podłączony do działającego API podczas pracy A.
Nie zmienia kontraktu, wag ani istniejących fixtures.

## Wejście i wyjście

`resolveEvidence(request, clock)` przyjmuje objectId, featureKey, dokładny
scope, kandydatów Evidence, katalog PublicSource, politykę wieku oraz
opcjonalne decyzje supersessions. `clock: () => string` zwraca ISO UTC;
funkcja pobiera czas raz. Typ wyniku jest zależny od featureKey.

Kandydat zawiera dane Evidence (walidowane kanonicznym schematem), stan
publikacji published/pending/rejected i opcjonalny kanoniczny origin
sourceId/sourceRecordId. Te metadane ustala zaufany adapter/moderator;
nie pochodzą z notatki OSM, zgłoszenia klienta ani tekstu wygenerowanego.
Bez origin podstawą jest para sourceId/sourceRecordId dowodu. Adapter
musi jawnie wskazać wspólne pochodzenie kopii z różnych dostawców.

Wynik zawiera `fact` zgodny z istniejącym modelem oraz wewnętrzny `audit`:
czas i politykę, pominięte rekordy z powodami, niezależne pochodzenie,
problemy, decyzje zastąpienia i witnessId dla znanego faktu. Nie jest to
nowy endpoint ani automatycznie publikowany format. Historia dowodów
pozostaje u wywołującego; resolver jej nie usuwa i nie zmienia wejścia.

## Reguły

- Brak danych to unknown/missing, zapis false pozostaje known(false).
  Surface `unknown` jest brakiem rozpoznanej wartości, nie znaną nawierzchnią.
- Pending/rejected nie wpływają na fakt; published nie awansuje do
  field_verified. Sprzeczne stany publikacji dla tego samego ID są błędem.
- Dokładne dopasowanie zakresu jest wymagane. Inny poziom/strona/kierunek
  zostaje odrzucony. Niejednoznaczne nakładanie null/both nie jest rozszerzane
  geometrycznie; blokuje known przez ambiguous_scope. Fakty nie dostają
  mieszanych zakresów w evidenceIds. Dokładnie pasujący zakres null jest
  niesprecyzowanym faktem o obiekcie, bez twierdzenia o stronie podejścia.
- Dwa przeciwne, niezależne i dokładnie przypisane dowody dają conflicting.
  Nie głosujemy większością, nie wybieramy automatycznie najnowszego źródła.
  Dodatkowy niepoprawny/niejednoznaczny rekord nie ukrywa już wykazanego konfliktu.
- Przeciwne rewizje jednego pochodzenia nie mogą stać się independent
  conflicting według draft.2. Bez odrębnego wykazanego konfliktu zwracamy
  unknown/unsupported_value i audit.issues=inconsistent_origin. Przed
  publikowaniem tego przypadku potrzebny przegląd jego prezentacji przez A.
- Błędny opublikowany rekord, przyszłe daty lub brak źródła blokują known,
  zamiast pozwolić wybrać wygodny pozostały dowód. Nieznany zakres błędnego
  rekordu nie jest domyślany. Importer powinien dobierać kandydatów do cechy
  i obiektu oraz przechowywać odrzucone surowe rekordy oddzielnie.
- Świeżość korzysta z verifiedAt, a bez niego observedAt. Nigdy z fetchedAt
  lub sourceModifiedAt. Wiek równy progowi jest recent; validUntil jest
  końcem wyłącznym. Progi dodatnie i skończone, przekazywane jawnie.
- Znany fakt wybiera deterministycznie dowód: field_verified, source_declared,
  community_mapped; potem najnowszy czas właściwy tej rangi i ID. Daty oraz
  wiarygodność pochodzą z tego samego dowodu. Starsza weryfikacja terenowa
  pozostaje stale nawet przy nowszej zgodnej obserwacji społecznościowej.
  Zgodne dowody pozostają w evidenceIds; nie są liczone jako głosy.
- Wygaśnięte lub zbyt stare obserwacje temporary_obstruction wypadają
  z aktualnego faktu, z audytem. Niedatowana obserwacja tymczasowa również
  nie dowodzi aktualnego stanu. Nie generujemy potwierdzenia usunięcia.
  Stare dowody trwałej infrastruktury pozostają i mogą utrzymywać konflikt.
- Zmiana fetchedAt, ponowny import i kopie nie tworzą nowego niezależnego
  pochodzenia. Różna treść pod jednym Evidence.id jest błędem wejścia.

## Jawne zastąpienie

Decyzja wskazuje ID, replacementId, supersededIds, reviewedAt i uzasadnienie.
Replacement musi być opublikowany, dokładnie przypisany i field_verified.
Przegląd nie może poprzedzać weryfikacji ani być z przyszłości. Zastępowana
obserwacja musi mieć znaną datę nie późniejszą niż weryfikacja. Nie zgadujemy
chronologii niedatowanych danych. Nie wolno zamienić decyzji w cykl ani
w niejednoznaczne przypisanie tego samego dowodu do różnych następców.

Audyt rozszerza supersededIds o kopie tej samej obserwacji i zachowuje
uzasadnienie. To zapobiega odtworzeniu starego konfliktu samym ponownym
importem kopii. Inna obserwacja z tego samego źródła nie jest automatycznie
usuwana. Łańcuchy zweryfikowanych decyzji działają niezależnie od kolejności.

## Integracja i ograniczenia

Importer musi zapewnić autentyczność metadanych publikacji, pochodzenia
i decyzji operatora. Resolver sprawdza ich spójność, nie uwierzytelnia ludzi
ani nie dowodzi prawdziwości obserwacji w terenie. Nie odgaduje nieobsługiwanych
tagów, topologii ani zakresu z geometrii. Wersję polityki i progi wieku
należy uzgodnić z publikowaną wersją danych/routingu, przed uruchomieniem pilot.

Stan dostępności źródła obsługuje warstwa snapshotu/API. Jego awaria nie jest
obserwacją infrastruktury i nie znaczy false. Zewnętrzne komunikaty nadal
muszą pokazywać pochodzenie, wiek i ograniczenia; żadna świeżość nie oznacza
wiedzy o bieżącym świetle lub możliwości wejścia na jezdnię.

Testy obejmują także odbudowanie faktów całego grafu synthetic, porównanie
go z oryginałem, rzeczywisty planner/RouteResponseSchema i brak trasy przy
twardym wymaganiu świeżej weryfikacji. Produkcyjne podłączenie i przegląd
przez A pozostają osobną iteracją.
