import type { Balance, Expense, User } from "@tally/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { config } from "../src/config";
import { openDatabase } from "../src/db/client";
import { seedIfEmpty } from "../src/db/seed";

let app: ReturnType<typeof buildApp>;
let usersByName: Record<string, User>;

beforeEach(async () => {
  const database = openDatabase(":memory:", config.migrationsDir);
  seedIfEmpty(database.db, { withSampleExpenses: false });
  app = buildApp({ db: database.db });
  app.addHook("onClose", async () => database.close());

  const users = (await app.inject("/api/users")).json<User[]>();
  usersByName = Object.fromEntries(users.map((user) => [user.name, user]));
});

afterEach(async () => {
  await app.close();
});

function addExpense(paidBy: string, paidFor: string, amountCents: number, overrides = {}) {
  return app.inject({
    method: "POST",
    url: "/api/expenses",
    payload: {
      paidById: usersByName[paidBy]?.id,
      paidForId: usersByName[paidFor]?.id,
      amountCents,
      description: "Dinner",
      date: "2026-09-20",
      ...overrides,
    },
  });
}

async function balances(target = app) {
  const rows = (await target.inject("/api/balances")).json<Balance[]>();
  return rows.map((row) => `${row.debtor.name} owes ${row.creditor.name} ${row.amountCents}`);
}

describe("unknown routes", () => {
  it("return a JSON 404 in the same shape as other errors", async () => {
    const response = await app.inject("/api/nope");

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Route GET /api/nope not found" });
  });
});

describe("seeding", () => {
  it("does nothing when users already exist", async () => {
    const database = openDatabase(":memory:", config.migrationsDir);

    expect(seedIfEmpty(database.db)).toBe(true);
    expect(seedIfEmpty(database.db)).toBe(false);
    database.close();
  });
});

describe("GET /api/users", () => {
  it("returns the seeded users sorted by name", async () => {
    const response = await app.inject("/api/users");

    expect(response.statusCode).toBe(200);
    expect(response.json<User[]>().map((user) => user.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
      "David",
    ]);
  });
});

describe("POST /api/expenses", () => {
  it("creates an expense and returns it with both users", async () => {
    const response = await addExpense("Alice", "Bob", 5_000, { description: "  Pizza  " });

    expect(response.statusCode).toBe(201);
    expect(response.json<Expense>()).toMatchObject({
      paidBy: { name: "Alice" },
      paidFor: { name: "Bob" },
      amountCents: 5_000,
      description: "Pizza",
      date: "2026-09-20",
    });
  });

  it("rejects an expense where someone pays for themselves", async () => {
    const response = await addExpense("Alice", "Alice", 5_000);

    expect(response.statusCode).toBe(400);
    expect(response.json().fieldErrors.paidForId).toBeDefined();
  });

  it.each([
    ["a zero amount", { amountCents: 0 }],
    ["a fractional amount of cents", { amountCents: 10.5 }],
    ["an empty description", { description: "   " }],
    ["a description over 120 characters", { description: "x".repeat(121) }],
    ["an amount over one million dollars", { amountCents: 100_000_001 }],
    ["an invalid date", { date: "2026-02-30" }],
  ])("rejects %s", async (_, overrides) => {
    const response = await addExpense("Alice", "Bob", 5_000, overrides);

    expect(response.statusCode).toBe(400);
  });

  it("rejects unknown users", async () => {
    const response = await addExpense("Alice", "Bob", 5_000, { paidForId: 999 });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Both users must exist");
  });

  it("rejects a malformed JSON body", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/expenses",
      headers: { "content-type": "application/json" },
      payload: "{",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toEqual(expect.any(String));
  });
});

describe("GET /api/expenses", () => {
  it("lists the newest expenses first", async () => {
    await addExpense("Alice", "Bob", 1_000, { description: "Older", date: "2026-09-01" });
    await addExpense("Bob", "Charlie", 2_000, { description: "Newer", date: "2026-09-15" });
    await addExpense("Charlie", "David", 3_000, { description: "Same day", date: "2026-09-15" });

    const expenses = (await app.inject("/api/expenses")).json<Expense[]>();

    expect(expenses.map((expense) => expense.description)).toEqual(["Same day", "Newer", "Older"]);
  });
});

describe("GET /api/balances", () => {
  it("is empty when there are no expenses", async () => {
    expect(await balances()).toEqual([]);
  });

  it("treats an expense as a debt from the recipient to the payer", async () => {
    await addExpense("Alice", "Bob", 5_000);

    expect(await balances()).toEqual(["Bob owes Alice 5000"]);
  });

  it("nets expenses between the same two users in both directions", async () => {
    await addExpense("Bob", "Alice", 15_000);
    await addExpense("Alice", "Bob", 3_000);

    expect(await balances()).toEqual(["Alice owes Bob 12000"]);
  });

  it("leaves out pairs that are settled up", async () => {
    await addExpense("Alice", "Bob", 2_500);
    await addExpense("Bob", "Alice", 2_500);

    expect(await balances()).toEqual([]);
  });

  it("matches the example from the brief with the sample seed data", async () => {
    const database = openDatabase(":memory:", config.migrationsDir);
    seedIfEmpty(database.db);
    const seeded = buildApp({ db: database.db });

    const result = await balances(seeded);
    await seeded.close();
    database.close();

    expect(result).toEqual([
      "Alice owes Bob 12000",
      "Charlie owes Alice 5000",
      "David owes Bob 3000",
    ]);
  });

  it("keeps each pair separate and sorts by amount", async () => {
    await addExpense("Bob", "Alice", 15_000);
    await addExpense("Alice", "Charlie", 5_000);
    await addExpense("Alice", "Bob", 3_000);
    await addExpense("Bob", "David", 3_000);

    expect(await balances()).toEqual([
      "Alice owes Bob 12000",
      "Charlie owes Alice 5000",
      "David owes Bob 3000",
    ]);
  });
});
