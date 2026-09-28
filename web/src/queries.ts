import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

const keys = {
  users: ["users"],
  expenses: ["expenses"],
  balances: ["balances"],
} as const;

export function useUsers() {
  return useQuery({ queryKey: keys.users, queryFn: api.users, staleTime: Infinity });
}

export function useExpenses() {
  return useQuery({ queryKey: keys.expenses, queryFn: api.expenses });
}

export function useBalances() {
  return useQuery({ queryKey: keys.balances, queryFn: api.balances });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.expenses }),
        queryClient.invalidateQueries({ queryKey: keys.balances }),
      ]),
  });
}
