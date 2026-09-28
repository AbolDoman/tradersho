import { createExpenseSchema, type ApiError } from "@tally/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { Db } from "./db/client";
import { createExpense, getBalances, listExpenses, listUsers, usersExist } from "./repository";

export const apiRoutes: FastifyPluginAsync<{ db: Db }> = async (app, { db }) => {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/users", async () => listUsers(db));

  app.get("/expenses", async () => listExpenses(db));

  app.get("/balances", async () => getBalances(db));

  app.post("/expenses", async (request, reply) => {
    const parsed = createExpenseSchema.safeParse(request.body);
    if (!parsed.success) {
      const body: ApiError = {
        error: "The expense is not valid",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      };
      return reply.code(400).send(body);
    }

    const { paidById, paidForId } = parsed.data;
    if (!usersExist(db, [paidById, paidForId])) {
      const body: ApiError = { error: "Both users must exist" };
      return reply.code(400).send(body);
    }

    return reply.code(201).send(createExpense(db, parsed.data));
  });
};
