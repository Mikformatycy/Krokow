# Rejestr źródeł danych

## OpenStreetMap — adapter B-04

- Identyfikator: `osm`; typ `osm`.
- Pochodzenie: [OpenStreetMap](https://www.openstreetmap.org).
- Atrybucja: © OpenStreetMap contributors; [licencja ODbL](https://www.openstreetmap.org/copyright).
- Pobranie operatora: `https://overpass-api.de/api/interpreter`, mały bbox
  `[south=50.065, west=19.939, north=50.071, east=19.950]`.
- Wzór zapytania: `queryFor` w `packages/ingestion/src/osm.ts`;
  rzeczywiste zapytanie jest zachowywane przy każdym uruchomieniu.
- Format: Overpass JSON `out meta`, węzły i drogi z pełnymi referencjami.
  Tożsamość `type/id` i wersja OSM; data edycji to `sourceModifiedAt`,
  nigdy automatyczne `observedAt` lub `verifiedAt`.
- Surowe rekordy/checksum i wyniki są lokalne. Raw może zawierać publiczne
  metadane autorów OSM; znormalizowane elementy pomijają username/uid.
- Stan Overpass 2026-10-03: timeout połączenia. Później operator pozyskał
  kompletny jednorazowy eksport OSM map API. Raw, checksum, licencja i data:
  [archiwum Krakowa](../packages/ingestion/data/krakow/README.md).
  Nowy [raport realnego pilota](real-pilot.md) pochodzi z tego eksportu,
  nie z fixtures. Aplikacja korzysta z archiwum, bez żądań do dostawcy.
- Instrukcja i ograniczenia: [ingestion](../packages/ingestion/README.md).

## Własne dane syntetyczne

Fixtures w `packages/contracts` i graf w `packages/routing/src/synthetic.ts`
służą testom i demonstracji. Ich pochodzenie oraz synthetic/preview_only
są jawne w kontrakcie. Nie są obserwacjami infrastruktury Krakowa i nie
mogą wypełniać braków realnego snapshotu ani uruchamiać trybu terenowego.
