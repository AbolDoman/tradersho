import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const expenses = sqliteTable(
  "expenses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    paidById: integer("paid_by_id")
      .notNull()
      .references(() => users.id),
    paidForId: integer("paid_for_id")
      .notNull()
      .references(() => users.id),
    amountCents: integer("amount_cents").notNull(),
    description: text("description").notNull(),
    spentOn: text("spent_on").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    check("expenses_amount_positive", sql`${table.amountCents} > 0`),
    check("expenses_distinct_parties", sql`${table.paidById} <> ${table.paidForId}`),
    index("expenses_spent_on_idx").on(table.spentOn),
  ],
);
