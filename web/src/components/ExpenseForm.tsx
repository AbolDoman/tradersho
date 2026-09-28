import {
  createExpenseSchema,
  MAX_DESCRIPTION_LENGTH,
  type CreateExpenseInput,
} from "@tally/shared";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ApiRequestError } from "../api";
import { formatMoney, parseAmountToCents, todayIsoDate } from "../format";
import { useCreateExpense, useUsers } from "../queries";
import { Field, inputClass, UserSelect } from "./FormField";

type FieldErrors = Partial<Record<keyof CreateExpenseInput, string>>;

interface ExpenseFormProps {
  titleId: string;
  onDone: () => void;
}

export function ExpenseForm({ titleId, onDone }: ExpenseFormProps) {
  const users = useUsers();
  const createExpense = useCreateExpense();

  const [paidById, setPaidById] = useState("");
  const [paidForId, setPaidForId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIsoDate);
  const [errors, setErrors] = useState<FieldErrors>({});

  const payer = users.data?.find((user) => String(user.id) === paidById);
  const recipient = users.data?.find((user) => String(user.id) === paidForId);
  const amountCents = parseAmountToCents(amount);

  function handlePayerChange(value: string) {
    setPaidById(value);
    if (value === paidForId) setPaidForId("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (createExpense.isPending) return;

    const parsed = createExpenseSchema.safeParse({
      paidById: paidById ? Number(paidById) : undefined,
      paidForId: paidForId ? Number(paidForId) : undefined,
      amountCents: amountCents ?? undefined,
      description,
      date,
    });

    const nextErrors = parsed.success
      ? {}
      : toFieldErrors(z.flattenError(parsed.error).fieldErrors);
    if (amount.trim() && amountCents === null) {
      nextErrors.amountCents = "Enter an amount like 12.50";
    }
    setErrors(nextErrors);
    if (!parsed.success || Object.keys(nextErrors).length > 0) return;

    createExpense.mutate(parsed.data, {
      onSuccess: onDone,
      onError: (error) => {
        if (error instanceof ApiRequestError && error.fieldErrors) {
          setErrors(toFieldErrors(error.fieldErrors));
        }
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-stone-900">
            Add expense
          </h2>
          <p className="text-sm text-stone-500">Record money one person paid for another.</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="-mr-2 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid by" error={errors.paidById}>
            {(props) => (
              <UserSelect
                {...props}
                autoFocus
                users={users.data}
                value={paidById}
                onChange={handlePayerChange}
              />
            )}
          </Field>
          <Field label="Expense for" error={errors.paidForId}>
            {(props) => (
              <UserSelect
                {...props}
                users={users.data}
                value={paidForId}
                onChange={setPaidForId}
                disabledUserId={paidById}
              />
            )}
          </Field>
        </div>

        <Field label="Amount" error={errors.amountCents}>
          {(props) => (
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
                $
              </span>
              <input
                {...props}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={`${inputClass} pl-7 tabular-nums`}
              />
            </div>
          )}
        </Field>

        <Field label="Description" error={errors.description}>
          {(props) => (
            <input
              {...props}
              autoComplete="off"
              placeholder="Dinner, taxi, groceries…"
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Date" error={errors.date}>
          {(props) => (
            <input
              {...props}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        {payer && recipient && amountCents ? (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            {recipient.name} will owe {payer.name} {formatMoney(amountCents)}.
          </p>
        ) : null}

        {createExpense.error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {createExpense.error.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createExpense.isPending || !users.data}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createExpense.isPending ? "Saving…" : "Save expense"}
        </button>
      </div>
    </form>
  );
}

function toFieldErrors(fieldErrors: Partial<Record<string, string[]>>): FieldErrors {
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) result[field as keyof CreateExpenseInput] = messages[0];
  }
  return result;
}
