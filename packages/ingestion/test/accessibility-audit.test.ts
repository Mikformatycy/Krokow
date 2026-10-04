import { expect, it } from 'vitest';
import { loadKrakowPrototype } from '../src/krakow-prototype';
import { accessibilityAudit } from '../src/accessibility-audit';

const { snapshot, audit } = await loadKrakowPrototype();

it('counts physical crossing stages once, independently of travel direction, without mutating facts', () => {
  const before = JSON.stringify(snapshot);
  const report = accessibilityAudit([], snapshot, []);
  expect(report.graph.stages).toBe(audit.crossings);
  expect(report.graph.physicalSegments * 2).toBe(report.graph.directedEdges);
  expect(report.graph.audible).toEqual({ unknown: audit.crossings });
  expect(report.verification).toEqual({ unverified: snapshot.evidence.length });
  expect(JSON.stringify(snapshot)).toBe(before);
  expect(accessibilityAudit([], snapshot, [])).toEqual(report);
});
