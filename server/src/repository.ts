import type { Balance, CreateExpenseInput, Expense, User } from "@tally/shared";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Db } from "./db/client";
import { expenses, users } from "./db/schema";

export function listUsers(db: Db): User[] {
  return db.select().from(users).orderBy(asc(users.name)).all();
}

export function usersExist(db: Db, ids: number[]) {
  const uniqueIds = [...new Set(ids)];
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(inArray(users.id, uniqueIds))
    .get();
  return row?.count === uniqueIds.length;
}

function selectExpenses(db: Db) {
  const payer = alias(users, "payer");
  const payee = alias(users, "payee");

  return db
    .select({
      id: expenses.id,
      paidBy: { id: payer.id, name: payer.name },
      paidFor: { id: payee.id, name: payee.name },
      amountCents: expenses.amountCents,
      description: expenses.description,
      date: expenses.spentOn,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .innerJoin(payer, eq(payer.id, expenses.paidById))
    .innerJoin(payee, eq(payee.id, expenses.paidForId));
}

export function listExpenses(db: Db): Expense[] {
  return selectExpenses(db).orderBy(desc(expenses.spentOn), desc(expenses.id)).all();
}

export function createExpense(db: Db, input: CreateExpenseInput): Expense {
  const { id } = db
    .insert(expenses)
    .values({
      paidById: input.paidById,
      paidForId: input.paidForId,
      amountCents: input.amountCents,
      description: input.description,
      spentOn: input.date,
    })
    .returning({ id: expenses.id })
    .get();

  const expense = selectExpenses(db).where(eq(expenses.id, id)).get();
  if (!expense) throw new Error(`Expense ${id} disappeared after insert`);
  return expense;
}

/**
 * Nets every pair of users into a single balance.
 *
 * Each pair is keyed by (lower id, higher id). An expense paid by the lower id adds to
 * `net`, one paid by the higher id subtracts, so a positive `net` means the higher id owes.
 */
export function getBalances(db: Db): Balance[] {
  const rows = db.all<{ lowId: number; highId: number; net: number }>(sql`
    select
      min(paid_by_id, paid_for_id) as lowId,
      max(paid_by_id, paid_for_id) as highId,
      sum(case when paid_by_id < paid_for_id then amount_cents else -amount_cents end) as net
    from expenses
    group by lowId, highId
    having net <> 0
  `);

  const userById = new Map(listUsers(db).map((user) => [user.id, user]));
  const userOf = (id: number) => {
    const user = userById.get(id);
    if (!user) throw new Error(`User ${id} referenced by an expense does not exist`);
    return user;
  };

  return rows
    .map(({ lowId, highId, net }) =>
      net > 0
        ? { debtor: userOf(highId), creditor: userOf(lowId), amountCents: net }
        : { debtor: userOf(lowId), creditor: userOf(highId), amountCents: -net },
    )
    .sort((a, b) => b.amountCents - a.amountCents);
}
