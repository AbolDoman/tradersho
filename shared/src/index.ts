import { z } from "zod";

export const MAX_AMOUNT_CENTS = 100_000_000;
export const MAX_DESCRIPTION_LENGTH = 120;

export const createExpenseSchema = z
  .object({
    paidById: z.int({ error: "Choose who paid" }).positive({ error: "Choose who paid" }),
    paidForId: z
      .int({ error: "Choose who it was for" })
      .positive({ error: "Choose who it was for" }),
    amountCents: z
      .int({ error: "Enter an amount" })
      .positive({ error: "Amount must be greater than zero" })
      .max(MAX_AMOUNT_CENTS, { error: "Amount can't be more than $1,000,000" }),
    description: z
      .string({ error: "Add a description" })
      .trim()
      .min(1, { error: "Add a description" })
      .max(MAX_DESCRIPTION_LENGTH, {
        error: `Keep it under ${MAX_DESCRIPTION_LENGTH} characters`,
      }),
    date: z.iso.date({ error: "Pick a valid date" }),
  })
  .refine((expense) => expense.paidById !== expense.paidForId, {
    error: "Payer and recipient must be different people",
    path: ["paidForId"],
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export interface User {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  paidBy: User;
  paidFor: User;
  amountCents: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Balance {
  debtor: User;
  creditor: User;
  amountCents: number;
}

export interface ApiError {
  error: string;
  fieldErrors?: Partial<Record<keyof CreateExpenseInput, string[]>>;
}
