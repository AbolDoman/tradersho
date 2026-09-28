import { formatDateParts, formatLongDate, formatMoney } from "../format";
import { useExpenses } from "../queries";
import { EmptyState, ErrorState, LoadingList } from "./QueryStates";

export function ExpenseList() {
  const { data: expenses, isPending, error, refetch } = useExpenses();

  if (isPending) return <LoadingList />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (expenses.length === 0) {
    return <EmptyState title="No expenses yet">Add the first one to start tracking.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-stone-100">
      {expenses.map((expense) => {
        const { month, day } = formatDateParts(expense.date);
        return (
          <li key={expense.id} className="flex items-center gap-4 px-5 py-4">
            <time
              dateTime={expense.date}
              title={formatLongDate(expense.date)}
              className="flex w-10 shrink-0 flex-col items-center leading-none text-stone-500"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide">{month}</span>
              <span className="mt-1 text-lg font-semibold text-stone-700">{day}</span>
            </time>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-stone-900">{expense.description}</p>
              <p className="mt-0.5 truncate text-sm text-stone-500">
                <span className="font-medium text-stone-700">{expense.paidBy.name}</span> paid for{" "}
                <span className="font-medium text-stone-700">{expense.paidFor.name}</span>
              </p>
            </div>

            <p className="shrink-0 font-semibold tabular-nums text-stone-900">
              {formatMoney(expense.amountCents)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
