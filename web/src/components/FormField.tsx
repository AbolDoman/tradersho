import type { User } from "@tally/shared";
import { useId, type ReactNode } from "react";

export const inputClass =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-xs placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 aria-invalid:border-red-400";

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
    <select
      {...props}
      data-autofocus={autoFocus || undefined}
      value={value}
      disabled={!users}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    >
      <option value="" disabled>
        {users ? "Select…" : "Loading…"}
      </option>
      {users?.map((user) => (
        <option key={user.id} value={user.id} disabled={String(user.id) === disabledUserId}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
