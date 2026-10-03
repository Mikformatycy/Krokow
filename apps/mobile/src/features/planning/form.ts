import { RouteRequestSchema } from '@krok/contracts';
import type { Preferences, RouteRequest } from '@krok/contracts';

export type FormError = { field: 'origin' | 'destination' | 'detour'; message: string };
export function buildRequest(cityId: string, origin: string, destination: string, preferences: Preferences, detour: string, maxAlternatives: RouteRequest['maxAlternatives']): RouteRequest | FormError {
  if (!origin) return { field: 'origin', message: 'Wybierz punkt startowy z katalogu.' };
  if (!destination) return { field: 'destination', message: 'Wybierz punkt docelowy z katalogu.' };
  if (origin === destination) return { field: 'destination', message: 'Wybierz inny punkt docelowy. Start i cel są identyczne.' };
  const normalized = detour.trim().replace(',', '.');
  const maxDetourRatio = /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
  const parsed = RouteRequestSchema.safeParse({ cityId, origin: { kind: 'place', placeId: origin },
    destination: { kind: 'place', placeId: destination }, preferences: { ...preferences, maxDetourRatio }, maxAlternatives, locale: 'pl-PL' });
  if (!parsed.success) return { field: 'detour', message: 'Podaj maksymalny mnożnik długości od 1 do 2, np. 1,6.' };
  return parsed.data;
}
