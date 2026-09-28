import { buildApp } from "./app";
import { config } from "./config";
import { openDatabase } from "./db/client";
import { seedIfEmpty } from "./db/seed";

const database = openDatabase(config.databasePath, config.migrationsDir);
const app = buildApp({
  db: database.db,
  webDistDir: config.webDistDir,
  logger: { level: config.logLevel },
});
app.addHook("onClose", async () => database.close());

if (seedIfEmpty(database.db)) {
  app.log.info("Seeded an empty database with users and sample expenses");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.log.info(`Received ${signal}, shutting down`);
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
