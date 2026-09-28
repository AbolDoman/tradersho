import { useState, type KeyboardEvent } from "react";
import { AddExpenseDialog } from "./components/AddExpenseDialog";
import { BalanceList } from "./components/BalanceList";
import { ExpenseList } from "./components/ExpenseList";
import { useBalances, useExpenses, useUsers } from "./queries";

const VIEWS = ["expenses", "balances"] as const;
type View = (typeof VIEWS)[number];

function readViewFromUrl(): View {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "balances" ? "balances" : "expenses";
}

export function App() {
  const [view, setView] = useState<View>(readViewFromUrl);
  const [isAdding, setIsAdding] = useState(false);
  const expenseCount = useExpenses().data?.length;
  const balanceCount = useBalances().data?.length;
  // Loaded up front so the form's selects are ready the moment the modal opens.
  useUsers();

  function selectView(next: View) {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  }

  function handleTabKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = view === "expenses" ? "balances" : "expenses";
    selectView(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8 sm:py-14">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Tally</h1>
          <p className="text-sm text-stone-500">Shared expenses and who owes whom</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add expense
        </button>
      </header>

      <main className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div
          role="tablist"
          aria-label="Views"
          onKeyDown={handleTabKeyDown}
          className="flex gap-6 border-b border-stone-200 px-5"
        >
          <Tab view="expenses" current={view} count={expenseCount} onSelect={selectView}>
            Expenses
          </Tab>
          <Tab view="balances" current={view} count={balanceCount} onSelect={selectView}>
            Balances
          </Tab>
        </div>

        {VIEWS.map((panel) => (
          <section
            key={panel}
            id={`panel-${panel}`}
            role="tabpanel"
            aria-labelledby={`tab-${panel}`}
            hidden={panel !== view}
          >
            {panel === view && (panel === "expenses" ? <ExpenseList /> : <BalanceList />)}
          </section>
        ))}
      </main>

      <AddExpenseDialog open={isAdding} onClose={() => setIsAdding(false)} />
    </div>
  );
}

interface TabProps {
  view: View;
  current: View;
  count: number | undefined;
  onSelect: (view: View) => void;
  children: string;
}

function Tab({ view, current, count, onSelect, children }: TabProps) {
  const selected = view === current;
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${view}`}
      aria-selected={selected}
      aria-controls={`panel-${view}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(view)}
      className={`-mb-px flex items-center gap-2 border-b-2 py-3.5 text-sm font-medium transition-colors ${
        selected
          ? "border-teal-700 text-stone-900"
          : "border-transparent text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
            selected ? "bg-teal-50 text-teal-800" : "bg-stone-100 text-stone-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
