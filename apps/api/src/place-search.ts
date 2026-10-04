import { PLACE_SEARCH_VERSION, PlaceSearchItemSchema, PlaceSearchResponseSchema, SCHEMA_VERSION } from '@krok/contracts';
import type { PlaceSearchItem, PlaceSearchResponse } from '@krok/contracts';
import { insideRing } from '@krok/ingestion';
import type { CityCatalog } from '@krok/ingestion';
import type { Snapshot } from '@krok/routing';
import { createPlaceIndex } from './place-index';
import { publicError } from './errors';

export interface PlaceSearch { search(cityId: string, query: string, requestId: string): PlaceSearchResponse }
export function createCitySearch(catalogInput: CityCatalog, snapshot: Snapshot): PlaceSearch {
  const catalog = structuredClone(catalogInput);
  if (snapshot.mode !== 'pilot' || !snapshot.coverage) throw new Error('City search requires explicit pilot context');
  const polygon = snapshot.coverage.polygon.coordinates;
  const source = snapshot.sources[0];
  if (!source || source.kind !== 'osm') throw new Error('Missing pilot source');
  const entries = catalog.entries.map(entry => {
    const place = PlaceSearchItemSchema.parse(entry.place);
    const inside = place.coordinate !== null && insideRing(place.coordinate, polygon[0]!) && !polygon.slice(1).some(ring => insideRing(place.coordinate!, ring));
    place.routing = { status: 'unavailable', reason: inside ? 'unresolved' : 'outside_coverage' };
    return { place, aliases: [...entry.aliases] };
  });
  // Only exact graph node bindings can enable routing. No distance-based association
  // of city centroids, addresses or different entrances to a pilot node.
  for (const bound of snapshot.places) {
    if (!bound.nodeId.startsWith('osm:node/') || !bound.coordinate) throw new Error('Invalid pilot binding');
    const node = snapshot.graph.nodes.find(n => n.id === bound.nodeId);
    if (!node || JSON.stringify(node.coordinate) !== JSON.stringify(bound.coordinate)) throw new Error('Unproven pilot endpoint');
    const recordId = bound.nodeId.slice(4);
    const index = entries.findIndex(e => e.place.sourceRecordId === recordId);
    const previous = index >= 0 ? entries[index] : undefined;
    const place: PlaceSearchItem = PlaceSearchItemSchema.parse({
      id: `osm-node-${recordId.split('/')[1]!}`, name: bound.name, address: bound.address ?? previous?.place.address ?? null,
      kind: bound.kind ?? 'entrance', coordinate: bound.coordinate, positionKind: 'mapped_point',
      sourceId: source.id, sourceRecordId: recordId, sourceModifiedAt: null,
      routing: { status: 'available', cityId: snapshot.cityId, placeId: bound.id },
    });
    const value = { place, aliases: previous?.aliases ?? [] };
    if (index >= 0) entries[index] = value; else entries.push(value);
  }
  const index = createPlaceIndex(entries.map(({ place, aliases }) => ({ id: place.id, name: place.name,
    fields: [place.address ?? '', catalog.areaName, ...aliases], priority: place.routing.status === 'available' ? 0 : 1, value: place })));
  const recommended = entries.filter(e => e.place.routing.status === 'available').map(e => e.place);
  const sources = [catalog.source, ...snapshot.sources.filter(s => s.id !== catalog.source.id)];
  return {
    search(cityId, query, requestId) {
      if (cityId !== catalog.cityId) throw publicError('SOURCE_UNAVAILABLE', { cityId });
      const result = query.trim() === '' ? { items: recommended.slice(0, 10), total: recommended.length } : index.search(query);
      return PlaceSearchResponseSchema.parse({ schemaVersion: SCHEMA_VERSION, searchVersion: PLACE_SEARCH_VERSION, requestId,
        mode: 'pilot', navigationEligibility: 'preview_only', cityId, areaName: catalog.areaName,
        catalogVersion: `${catalog.version}:${snapshot.graphVersion}`, fetchedAt: catalog.fetchedAt,
        catalogSize: entries.length,
        total: result.total, hasMore: result.total > result.items.length, places: result.items, sources });
    },
  };
}
