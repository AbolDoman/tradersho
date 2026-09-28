import type { ReactNode } from "react";

export function LoadingList() {
  return (
    <ul aria-busy="true" aria-label="Loading" className="divide-y divide-stone-100">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-4 px-5 py-4">
          <div className="size-10 animate-pulse rounded-lg bg-stone-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-stone-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-stone-100" />
        </li>
      ))}
    </ul>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="px-5 py-12 text-center">
      <p className="font-medium text-stone-900">Couldn't load this list</p>
      <p className="mt-1 text-sm text-stone-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-medium text-stone-900">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{children}</p>
    </div>
  );
}
