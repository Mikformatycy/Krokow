# Rzeczywisty graf centrum Krakowa

`raw-map.json.gz` jest ograniczonym wyciągiem z wcześniej pobranego
[eksportu BBBike Cracow](https://download.bbbike.org/osm/bbbike/Cracow/),
z danymi © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright).
BBBike jest dystrybutorem danych OSM, nie potwierdzeniem terenowym.
Pobranie źródłowego pliku: **2026-10-03T20:39:21.626Z**; ponowne
przetworzenie nie zmienia tej daty. Metadata i checksum obu poziomów:
`capture.json`. Plik upstream `.osm.gz` pozostaje w lokalnym test-results;
odtwarzalność backendu opiera się na dołączonym ograniczonym JSON gzip.

Wyciąg obejmuje bbox `[50.052,19.925,50.075,19.955]`: drogi (także
kontekst jezdni), bariery, tory, budynki, kompletne węzły ich geometrii
i relacje ograniczeń pieszych. Zachowuje identyfikatory i wersje OSM.
Nie tworzy węzłów ani łączników. Publikowany bbox ma dodatkowy wewnętrzny
margines. Raw zawiera publiczne metadata autorów; API ich nie udostępnia.
Próba nowego Overpass zwróciła HTTP 406; nie użyto jej jako danych.

`src/krakow-prototype.ts` wybiera 15 punktów na nazwanych drogach pieszych
i 15 wejść (w tym wcześniejsze 5). Nazwy punktów pochodzą z dokładnie
wskazanej drogi zawierającej dany węzeł; nazwy/adresy wejść z ich własnych
tagów lub jednoznacznego budynku, którego obrys zawiera węzeł. Zmiana
tych relacji powoduje błąd, a nie wybór podobnego punktu.

Graf korzysta z istniejącego konserwatywnego importera. Nie dodano osi
jezdni, schodów, torowisk, przejść wieloetapowych ani wnętrz, których
topologii obecny importer nie obsługuje. Wynik nie stanowi pełnego grafu
pieszego centrum, nawet gdy OSM zawiera dodatkowe nieobsługiwane obiekty.

## Odtwarzanie i audyt

Python 3, wyłącznie standard library; oryginalny plik i data pobrania są
jawnymi argumentami. Katalog wyjściowy musi być nowy:

```powershell
python packages/ingestion/scripts/extract-prototype.py PATH/Cracow.osm.gz PATH/new-output --fetched-at 2026-10-03T20:39:21.626Z
```

Nie podmieniać daty na datę wykonania komendy. Dostawca zmienia swój plik;
inny checksum upstream wymaga ponownego audytu i nowego snapshotu.
Runtime nie wykonuje tego skryptu, nie pobiera danych i nie wymaga Pythona.

Audyt grafu z root:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm --filter @krok/ingestion exec tsx src/audit-prototype.ts data/krakow-prototype/route-audit.json"
```

Raport zawiera wersję grafu, faktyczny rozmiar, odrzucenia, grupy punktów,
50 obliczeń tras i 4 jawne przypadki braku połączenia między grupami.
W pierwszym audycie 34 obliczenia zakończyły pełny zakres wyszukiwania,
16 ograniczyło szukanie alternatyw (prawidłowe trasy zwrócono), p95 66 ms,
max 108 ms. To pomiar lokalnego silnika, nie sieci, telefonu ani obciążenia.
