import { buildApi } from './app';
import { readConfig } from './config';
import { createDatabaseProbe } from './database';
import { createSnapshotServices, createSyntheticServices } from './routing';
import { loadKrakowCityCatalog, loadKrakowPrototype } from '@krok/ingestion';
import { PILOT_POLICY } from '@krok/routing';
import { createCitySearch } from './place-search';
import type { PlaceSearch } from './place-search';

async function main() {
  const config = readConfig(process.env);
  const database = createDatabaseProbe(config.database);
  const pilot = config.dataMode === 'pilot' ? (await loadKrakowPrototype()).snapshot : undefined;
  const services = pilot ? createSnapshotServices(pilot, PILOT_POLICY)
    : config.dataMode === 'synthetic' ? createSyntheticServices() : {};
  let placeSearch: PlaceSearch | undefined;
  if (pilot) {
    try { placeSearch = createCitySearch(await loadKrakowCityCatalog(), pilot); }
    catch { console.error('City search catalog unavailable. Existing route catalog remains active.'); }
  }
  const app = buildApi({
    ...services,
    ...(placeSearch ? { placeSearch } : {}),
    databaseReady: () => database.ready(), allowedOrigins: config.allowedOrigins,
  });
  app.addHook('onClose', () => database.close());
  const stop = () => {
    void app.close().catch(() => { console.error('API shutdown failed'); process.exitCode = 1; });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  app.addHook('onClose', (_instance, done) => {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    done();
  });
  try { await app.listen({ host: config.host, port: config.port }); }
  catch (error) { await app.close(); throw error; }
}

try { await main(); }
catch {
  console.error('API startup failed. Check local configuration and port availability.');
  process.exitCode = 1;
}
