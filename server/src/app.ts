import { existsSync } from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import type { ApiError } from "@tally/shared";
import Fastify, { type FastifyError, type FastifyServerOptions } from "fastify";
import type { Db } from "./db/client";
import { apiRoutes } from "./routes";

interface AppOptions {
  db: Db;
  webDistDir?: string;
  logger?: FastifyServerOptions["logger"];
}

export function buildApp({ db, webDistDir, logger = false }: AppOptions) {
  const app = Fastify({ logger });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
    }
    const body: ApiError = {
      error: statusCode >= 500 ? "Something went wrong on our side" : error.message,
    };
    return reply.code(statusCode).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const body: ApiError = { error: `Route ${request.method} ${request.url} not found` };
    return reply.code(404).send(body);
  });

  app.register(apiRoutes, { prefix: "/api", db });

  if (webDistDir && existsSync(webDistDir)) {
    app.register(fastifyStatic, {
      root: webDistDir,
      setHeaders(reply, filePath) {
        // Vite puts content hashes in asset file names, so they never change.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          reply.header("cache-control", "public, max-age=31536000, immutable");
        }
      },
    });
  }

  return app;
}
