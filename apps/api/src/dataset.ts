import { CoverageResponseSchema, PlacesResponseSchema, SourcesResponseSchema, FeatureEvidenceResponseSchema, VersionSetSchema } from '@krok/contracts';
import { coverageResponse, placesResponse, sourcesResponse, routeScenarios } from '@krok/contracts/fixtures';
import type { z } from 'zod';

/** Public, already-redacted catalog data. No routing success fixtures in the service. */
export interface CatalogDataset {
  coverage: z.infer<typeof CoverageResponseSchema>;
  places: z.infer<typeof PlacesResponseSchema>;
  sources: z.infer<typeof SourcesResponseSchema>;
  versions: z.infer<typeof VersionSetSchema>;
  evidence: z.infer<typeof FeatureEvidenceResponseSchema>['evidence'];
}

export function validateDataset(input: CatalogDataset): CatalogDataset {
  const coverage = CoverageResponseSchema.parse(input.coverage);
  // The HTTP response is capped at ten, not the server-side routing catalog.
  // Validate every page using the shared wire schema and enforce global uniqueness.
  const allPlaces = input.places.places;
  if (allPlaces.length > 10_000 || new Set(allPlaces.map(place => place.id)).size !== allPlaces.length) {
    throw new Error('Invalid route catalog size or duplicate places');
  }
  const first = PlacesResponseSchema.parse({ ...input.places, places: allPlaces.slice(0, 10) });
  const places = { ...first, places: [...first.places] };
  for (let offset = 10; offset < allPlaces.length; offset += 10) {
    places.places.push(...PlacesResponseSchema.parse({ ...input.places, places: allPlaces.slice(offset, offset + 10) }).places);
  }
  const sources = SourcesResponseSchema.parse(input.sources);
  const versions = VersionSetSchema.parse(input.versions);
  if (places.cityId !== coverage.cityId || places.mode !== coverage.mode || sources.mode !== coverage.mode
    || places.navigationEligibility !== coverage.navigationEligibility || versions.policyVersion !== coverage.policy.policyVersion) {
    throw new Error('Inconsistent catalog dataset');
  }
  // Validate all IDs and source references through the shared public endpoint schema.
  if (new Set(input.evidence.map((e) => e.id)).size !== input.evidence.length) throw new Error('Duplicate evidence');
  const evidence: CatalogDataset['evidence'] = [];
  for (const objectId of new Set(input.evidence.map((e) => e.objectId))) {
    const parsed = FeatureEvidenceResponseSchema.parse({
      schemaVersion: coverage.schemaVersion, requestId: 'catalog-validation', mode: coverage.mode,
      objectId, evidenceVersion: versions.evidenceVersion,
      evidence: input.evidence.filter((e) => e.objectId === objectId), sources: sources.sources,
    });
    evidence.push(...parsed.evidence);
  }
  return { coverage, places, sources, versions, evidence };
}

export function syntheticCatalog(): CatalogDataset {
  const example = routeScenarios.find((scenario) => scenario.id === 'abc');
  if (!example) throw new Error('Missing synthetic source metadata');
  return validateDataset({
    coverage: coverageResponse, places: placesResponse, sources: sourcesResponse,
    versions: {
      graphVersion: example.response.dataContext.graphVersion,
      evidenceVersion: example.response.dataContext.evidenceVersion,
      policyVersion: example.response.dataContext.policyVersion,
    }, evidence: example.response.evidenceCatalog,
  });
}
