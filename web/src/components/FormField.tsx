import type { User } from "@tally/shared";
import { useId, type ReactNode } from "react";

export const inputClass =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-xs placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 aria-invalid:border-red-400";

export interface ControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  error?: string;
  children: (props: ControlProps) => ReactNode;
}

/** Wires a label and an error message to whatever control `children` renders. */
export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface UserSelectProps extends ControlProps {
  users: User[] | undefined;
  value: string;
  onChange: (value: string) => void;
  disabledUserId?: string;
  autoFocus?: boolean;
}

export function UserSelect({
  users,
  value,
  onChange,
  disabledUserId,
  autoFocus,
  ...props
}: UserSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        data-autofocus={autoFocus || undefined}
        value={value}
        disabled={!users}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} cursor-pointer appearance-none pr-9 disabled:cursor-default ${
          value ? "" : "text-stone-400"
        } [&>option]:text-stone-900`}
      >
        <option value="" disabled>
          {users ? "Select person" : "Loading…"}
        </option>
        {users?.map((user) => (
          <option key={user.id} value={user.id} disabled={String(user.id) === disabledUserId}>
            {user.name}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-stone-400"
      >
        <path
          fillRule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
