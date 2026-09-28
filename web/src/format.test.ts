import { describe, expect, it } from "vitest";
import { formatDateParts, formatMoney, parseAmountToCents } from "./format";

describe("parseAmountToCents", () => {
  it.each([
    ["50", 5_000],
    ["12.5", 1_250],
    ["12.50", 1_250],
    ["0.07", 7],
    ["19.99", 1_999],
    ["1,250.00", 125_000],
    [" 8. ", 800],
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1e3", "12.3.4", "$5", "1,2,5", "12,34", "1234567890"])(
    "rejects %j",
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});

describe("formatMoney", () => {
  it("formats cents as dollars", () => {
    expect(formatMoney(12_000)).toBe("$120.00");
    expect(formatMoney(123_456_789)).toBe("$1,234,567.89");
  });
});

describe("formatDateParts", () => {
  it("keeps the calendar day regardless of the local time zone", () => {
    expect(formatDateParts("2026-01-01")).toEqual({ month: "Jan", day: 1 });
  });
});
