import { formatMoney } from "../format";
import { useBalances } from "../queries";
import { Avatar } from "./Avatar";
import { EmptyState, ErrorState, LoadingList } from "./QueryStates";

export function BalanceList() {
  const { data: balances, isPending, error, refetch } = useBalances();

  if (isPending) return <LoadingList />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (balances.length === 0) {
    return <EmptyState title="All settled up">Nobody owes anybody right now.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-stone-100">
      {balances.map(({ debtor, creditor, amountCents }) => (
        <li key={`${debtor.id}-${creditor.id}`} className="flex items-center gap-4 px-5 py-4">
          <div className="flex -space-x-2">
            <Avatar user={debtor} />
            <span className="rounded-full ring-2 ring-white">
              <Avatar user={creditor} />
            </span>
          </div>

          <p className="min-w-0 flex-1 truncate text-stone-600">
            <span className="font-medium text-stone-900">{debtor.name}</span> owes{" "}
            <span className="font-medium text-stone-900">{creditor.name}</span>
          </p>

          <p className="shrink-0 font-semibold tabular-nums text-orange-700">
            {formatMoney(amountCents)}
          </p>
        </li>
      ))}
    </ul>
  );
}
