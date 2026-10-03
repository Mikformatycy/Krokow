import { buildApi } from './app';
import { readConfig } from './config';
import { createDatabaseProbe } from './database';
import { createSnapshotServices, createSyntheticServices } from './routing';
import { loadKrakowPilot } from '@krok/ingestion';
import { PILOT_POLICY } from '@krok/routing';

async function main() {
  const config = readConfig(process.env);
  const database = createDatabaseProbe(config.database);
  const services = config.dataMode === 'pilot' ? createSnapshotServices((await loadKrakowPilot()).snapshot, PILOT_POLICY)
    : config.dataMode === 'synthetic' ? createSyntheticServices() : {};
  const app = buildApi({
    ...services,
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
