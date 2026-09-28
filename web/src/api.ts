import type { ApiError, Balance, CreateExpenseInput, Expense, User } from "@tally/shared";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: ApiError["fieldErrors"],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: init?.body ? { "content-type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiRequestError("Can't reach the server. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.error ?? `Request failed with status ${response.status}`,
      response.status,
      body?.fieldErrors,
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  users: () => request<User[]>("/users"),
  expenses: () => request<Expense[]>("/expenses"),
  balances: () => request<Balance[]>("/balances"),
  createExpense: (input: CreateExpenseInput) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) }),
};
