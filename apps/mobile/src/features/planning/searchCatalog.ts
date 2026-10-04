import type { PlacesResponse } from '@krok/contracts';
import { InvalidResponse } from '../../adapters/api/MockRouteApi';
import type { RouteApi } from '../../adapters/api/MockRouteApi';

type Place = PlacesResponse['places'][number];
export interface PlaceChoice { id: string; name: string; detail: string; place: Place | null }

/** Search IDs/centroids never become route endpoints. Only the explicit binding may be selected. */
export async function searchCatalog(api: RouteApi, cityId: string, mode: PlacesResponse['mode'], query: string) {
  if (mode === 'pilot') {
    if (cityId !== 'krakow-stare-miasto-pilot' || !api.searchPlaces) throw new InvalidResponse();
    const response = await api.searchPlaces('krakow', query);
    if (response.mode !== mode) throw new InvalidResponse();
    const choices: PlaceChoice[] = response.places.map(item => {
      const binding = item.routing;
      if (binding.status === 'available' && binding.cityId !== cityId) throw new InvalidResponse();
      const unavailable = binding.status === 'unavailable'
        ? binding.reason === 'outside_coverage' ? 'Poza zasięgiem tras prototypu.' : 'Brak potwierdzonego połączenia z siecią pieszą.' : '';
      return { id: item.id, name: item.name, detail: [item.address, unavailable].filter(Boolean).join('. '),
        place: binding.status === 'available' ? { id: binding.placeId, cityId: binding.cityId, name: item.name,
          description: item.address ?? '', coordinate: item.coordinate } : null };
    });
    return { choices, total: response.total, hasMore: response.hasMore, attribution: response.sources.map(source => source.attribution).join('; ') };
  }
  const response = await api.places(cityId, query);
  if (response.mode !== mode) throw new InvalidResponse();
  return { choices: response.places.map(place => ({ id: place.id, name: place.name, detail: '', place })),
    total: response.places.length, hasMore: false, attribution: '' };
}
