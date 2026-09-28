import type { Db } from "./client";
import { expenses, users } from "./schema";

const USER_NAMES = ["Alice", "Bob", "Charlie", "David"];

// Nets out to the balances used as the example in the task description.
const SAMPLE_EXPENSES = [
  { paidBy: "Bob", paidFor: "Alice", amountCents: 15_000, description: "Movie night", daysAgo: 6 },
  { paidBy: "Alice", paidFor: "Charlie", amountCents: 5_000, description: "Groceries", daysAgo: 4 },
  { paidBy: "Alice", paidFor: "Bob", amountCents: 3_000, description: "Taxi home", daysAgo: 3 },
  { paidBy: "Bob", paidFor: "David", amountCents: 3_000, description: "Lunch", daysAgo: 1 },
];

function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Seeds users and a few sample expenses on a fresh database. Returns false if data already exists. */
export function seedIfEmpty(db: Db, { withSampleExpenses = true } = {}) {
  if (db.select({ id: users.id }).from(users).limit(1).get()) {
    return false;
  }

  db.transaction((tx) => {
    const inserted = tx
      .insert(users)
      .values(USER_NAMES.map((name) => ({ name })))
      .returning()
      .all();

    if (!withSampleExpenses) return;

    const idByName = new Map(inserted.map((user) => [user.name, user.id]));
    const idOf = (name: string) => {
      const id = idByName.get(name);
      if (id === undefined) throw new Error(`Seed user ${name} is missing`);
      return id;
    };

    tx.insert(expenses)
      .values(
        SAMPLE_EXPENSES.map((expense) => ({
          paidById: idOf(expense.paidBy),
          paidForId: idOf(expense.paidFor),
          amountCents: expense.amountCents,
          description: expense.description,
          spentOn: isoDateDaysAgo(expense.daysAgo),
        })),
      )
      .run();
  });

  return true;
}
