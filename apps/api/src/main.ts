import { buildApi } from './app';
import { readConfig } from './config';
import { createDatabaseProbe } from './database';
import { createSyntheticServices } from './routing';

async function main() {
  const config = readConfig(process.env);
  const database = createDatabaseProbe(config.database);
  const app = buildApi({
    ...(config.dataMode === 'synthetic' ? createSyntheticServices() : {}),
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
