const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatMoney(cents: number) {
  return currency.format(cents / 100);
}

/**
 * Parses a user-typed dollar amount into integer cents without going through
 * floating point. Returns null for anything that isn't a plain positive amount.
 */
export function parseAmountToCents(input: string): number | null {
  const match = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{0,2}))?$/.exec(input.trim());
  if (!match) return null;

  const [, grouped = "", fraction = ""] = match;
  const dollars = grouped.replace(/,/g, "");
  if (dollars.length > 9) return null;

  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
}

// Dates are stored as plain YYYY-MM-DD, so format them in UTC to avoid shifting the day.
const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function formatDateParts(isoDate: string) {
  const date = new Date(isoDate);
  return { month: shortMonth.format(date), day: date.getUTCDate() };
}

export function formatLongDate(isoDate: string) {
  return longDate.format(new Date(isoDate));
}

export function todayIsoDate() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
