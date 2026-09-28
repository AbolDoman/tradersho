import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolves to the server package root both from src/ (tsx) and from the bundled dist/.
const serverRoot = fileURLToPath(new URL("..", import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  logLevel: process.env.LOG_LEVEL ?? "info",
  databasePath: process.env.DATABASE_PATH ?? path.join(serverRoot, "data", "tally.db"),
  migrationsDir: path.join(serverRoot, "drizzle"),
  webDistDir: process.env.WEB_DIST_DIR ?? path.join(serverRoot, "..", "web", "dist"),
};
