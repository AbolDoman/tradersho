import type { User } from "@tally/shared";

const COLORS = [
  "bg-teal-100 text-teal-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-lime-100 text-lime-800",
];

export function Avatar({ user }: { user: User }) {
  const color = COLORS[user.id % COLORS.length];
  return (
    <span
      aria-hidden
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color}`}
    >
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}
