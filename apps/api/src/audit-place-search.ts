import { writeFile } from 'node:fs/promises';
import { loadKrakowCityCatalog, loadKrakowPrototype } from '@krok/ingestion';
import { createCitySearch } from './place-search';

const start = performance.now();
const catalog = await loadKrakowCityCatalog();
const { snapshot } = await loadKrakowPrototype();
const search = createCitySearch(catalog, snapshot);
const buildMs = performance.now() - start;
const queries = ['Rynek Glowny', 'Wawel', 'Nowa Huta', 'Wolica', 'Pawia 7', 'apteka', 'glaeria krakowska', 'High5', 'Aleja Solidarnosci', 'zzqxzzq'];
const times: number[] = [];
const examples = queries.map(query => {
  const result = search.search('krakow', query, 'operator-audit');
  return { query, total: result.total, results: result.places.slice(0, 3).map(place => ({ name: place.name, address: place.address, routing: place.routing })) };
});
for (let round = 0; round < 10; round++) for (const query of queries) {
  const before = performance.now(); search.search('krakow', query, 'operator-audit'); times.push(performance.now() - before);
}
times.sort((a, b) => a - b);
const result = { checkedAt: new Date().toISOString(), version: catalog.version, graphVersion: snapshot.graphVersion,
  catalogSize: search.search('krakow', '', 'operator-audit').catalogSize, ...catalog.audit,
  buildMs: Math.round(buildMs), queries: times.length, p50Ms: +times[Math.floor(times.length * .50)]!.toFixed(2),
  p95Ms: +times[Math.floor(times.length * .95)]!.toFixed(2), maxMs: +times.at(-1)!.toFixed(2), examples };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, examples: undefined }));
