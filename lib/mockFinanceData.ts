// Mock data for the Income, Expenses and Calendar tabs.
//
// These three tabs are a UI port from Finance Manager Pro and are deliberately
// NOT wired to Data Connect yet. Everything they render comes from here, so
// there is exactly one place to delete when they get hooked up to the real
// `Transaction` rows — no mock values are scattered through the components.
//
// AMOUNTS ARE MINOR UNITS, like everywhere else in this app (see lib/money.ts).
// Mock data is still data: writing these as 1234.56 floats would both break
// the app's one hard invariant and quietly teach the next person the wrong
// pattern when they copy a row.
//
// Dates are "yyyy-mm-dd" local calendar days, matching Transaction.occurredOn.

import type { Minor } from "./money";

export interface MockPerson {
  id: string;
  name: string;
  /** "#rrggbb" or null to let lib/entityColor derive one from the name. */
  color: string | null;
}

export interface MockIncomeRecord {
  id: string;
  personId: string;
  personName: string;
  incomeName: string;
  incomeType: string;
  amountMinor: Minor;
  /** "yyyy-mm-dd" */
  addDate: string;
  payPeriod: string;
  /** What this works out to per month, given payPeriod. */
  monthlyTotalMinor: Minor;
  currency: string;
  isRecurring: boolean;
  isActive: boolean;
  description: string;
}

export interface MockExpenseRecord {
  id: string;
  personId: string;
  personName: string;
  expenseName: string;
  category: string;
  amountMinor: Minor;
  /** "yyyy-mm-dd" */
  addDate: string;
  /** "yyyy-mm-dd" — when it's payable. Drives the calendar and "overdue". */
  dueDate: string;
  payPeriod: string;
  currency: string;
  isRecurring: boolean;
  isActive: boolean;
  description: string;
}

export const MOCK_PEOPLE: MockPerson[] = [
  { id: "p1", name: "Justin", color: "#4f46e5" },
  { id: "p2", name: "Libby", color: "#0891b2" },
  { id: "p3", name: "Household", color: "#78716c" },
];

// Anchored to the current month so the tabs never open on an empty view, and
// so the calendar has something to show without anyone editing a date first.
// Computed at module load rather than hardcoded for the same reason.
const NOW = new Date();
const Y = NOW.getFullYear();
const M = NOW.getMonth();

/** "yyyy-mm-dd" for a day in the current month, built from local parts. */
function day(d: number, monthOffset = 0): string {
  const date = new Date(Y, M + monthOffset, d);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export const MOCK_INCOME: MockIncomeRecord[] = [
  {
    id: "i1", personId: "p1", personName: "Justin",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 412_500, addDate: day(1), payPeriod: "Biweekly",
    monthlyTotalMinor: 893_750, currency: "USD",
    isRecurring: true, isActive: true, description: "Engineering role",
  },
  {
    id: "i2", personId: "p1", personName: "Justin",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 412_500, addDate: day(15), payPeriod: "Biweekly",
    monthlyTotalMinor: 893_750, currency: "USD",
    isRecurring: true, isActive: true, description: "Engineering role",
  },
  {
    id: "i3", personId: "p1", personName: "Justin",
    incomeName: "Consulting", incomeType: "Freelance",
    amountMinor: 150_000, addDate: day(9), payPeriod: "One-off",
    monthlyTotalMinor: 150_000, currency: "USD",
    isRecurring: false, isActive: true, description: "Side project invoice",
  },
  {
    id: "i4", personId: "p2", personName: "Libby",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 350_000, addDate: day(1), payPeriod: "Biweekly",
    monthlyTotalMinor: 758_333, currency: "USD",
    isRecurring: true, isActive: true, description: "Design role",
  },
  {
    id: "i5", personId: "p2", personName: "Libby",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 350_000, addDate: day(15), payPeriod: "Biweekly",
    monthlyTotalMinor: 758_333, currency: "USD",
    isRecurring: true, isActive: true, description: "Design role",
  },
  {
    id: "i6", personId: "p3", personName: "Household",
    incomeName: "Savings interest", incomeType: "Interest",
    amountMinor: 4_212, addDate: day(28), payPeriod: "Monthly",
    monthlyTotalMinor: 4_212, currency: "USD",
    isRecurring: true, isActive: true, description: "High-yield account",
  },
  {
    id: "i7", personId: "p3", personName: "Household",
    incomeName: "Tax refund", incomeType: "Refund",
    amountMinor: 128_400, addDate: day(22), payPeriod: "One-off",
    monthlyTotalMinor: 128_400, currency: "USD",
    isRecurring: false, isActive: false, description: "Federal, prior year",
  },
];

export const MOCK_EXPENSES: MockExpenseRecord[] = [
  {
    id: "e1", personId: "p3", personName: "Household",
    expenseName: "Rent", category: "Housing",
    amountMinor: 180_000, addDate: day(1), dueDate: day(1),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "Apartment",
  },
  {
    id: "e2", personId: "p3", personName: "Household",
    expenseName: "Electric", category: "Utilities",
    amountMinor: 14_233, addDate: day(3), dueDate: day(5),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "",
  },
  {
    id: "e3", personId: "p3", personName: "Household",
    expenseName: "Internet", category: "Utilities",
    amountMinor: 7_999, addDate: day(3), dueDate: day(8),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "Fibre 1Gb",
  },
  {
    id: "e4", personId: "p1", personName: "Justin",
    expenseName: "Groceries", category: "Food",
    amountMinor: 21_845, addDate: day(4), dueDate: day(4),
    payPeriod: "One-off", currency: "USD",
    isRecurring: false, isActive: true, description: "Weekly shop",
  },
  {
    id: "e5", personId: "p1", personName: "Justin",
    expenseName: "Groceries", category: "Food",
    amountMinor: 18_310, addDate: day(11), dueDate: day(11),
    payPeriod: "One-off", currency: "USD",
    isRecurring: false, isActive: true, description: "Weekly shop",
  },
  {
    id: "e6", personId: "p1", personName: "Justin",
    expenseName: "Car payment", category: "Transport",
    amountMinor: 41_000, addDate: day(10), dueDate: day(12),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "",
  },
  {
    id: "e7", personId: "p2", personName: "Libby",
    expenseName: "Student loan", category: "Debt",
    amountMinor: 32_500, addDate: day(14), dueDate: day(15),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "",
  },
  {
    id: "e8", personId: "p2", personName: "Libby",
    expenseName: "Gym", category: "Health",
    amountMinor: 4_500, addDate: day(6), dueDate: day(6),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "",
  },
  {
    id: "e9", personId: "p2", personName: "Libby",
    expenseName: "Streaming bundle", category: "Subscriptions",
    amountMinor: 3_297, addDate: day(18), dueDate: day(20),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "3 services",
  },
  {
    id: "e10", personId: "p3", personName: "Household",
    expenseName: "Insurance", category: "Insurance",
    amountMinor: 23_000, addDate: day(20), dueDate: day(25),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "Auto + renters",
  },
  {
    id: "e11", personId: "p1", personName: "Justin",
    expenseName: "Dining out", category: "Food",
    amountMinor: 9_640, addDate: day(21), dueDate: day(21),
    payPeriod: "One-off", currency: "USD",
    isRecurring: false, isActive: true, description: "Birthday dinner",
  },
  {
    id: "e12", personId: "p3", personName: "Household",
    expenseName: "Water", category: "Utilities",
    amountMinor: 6_120, addDate: day(24), dueDate: day(28),
    payPeriod: "Quarterly", currency: "USD",
    isRecurring: true, isActive: true, description: "",
  },
  // A couple in the previous month, so stepping the month selector back
  // shows something rather than an empty table.
  {
    id: "e13", personId: "p1", personName: "Justin",
    expenseName: "Groceries", category: "Food",
    amountMinor: 20_115, addDate: day(8, -1), dueDate: day(8, -1),
    payPeriod: "One-off", currency: "USD",
    isRecurring: false, isActive: true, description: "Weekly shop",
  },
  {
    id: "e14", personId: "p3", personName: "Household",
    expenseName: "Rent", category: "Housing",
    amountMinor: 180_000, addDate: day(1, -1), dueDate: day(1, -1),
    payPeriod: "Monthly", currency: "USD",
    isRecurring: true, isActive: true, description: "Apartment",
  },
];

export const MOCK_INCOME_PREV_MONTH: MockIncomeRecord[] = [
  {
    id: "i8", personId: "p1", personName: "Justin",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 412_500, addDate: day(1, -1), payPeriod: "Biweekly",
    monthlyTotalMinor: 893_750, currency: "USD",
    isRecurring: true, isActive: true, description: "Engineering role",
  },
  {
    id: "i9", personId: "p2", personName: "Libby",
    incomeName: "Base salary", incomeType: "Salary",
    amountMinor: 350_000, addDate: day(15, -1), payPeriod: "Biweekly",
    monthlyTotalMinor: 758_333, currency: "USD",
    isRecurring: true, isActive: true, description: "Design role",
  },
];

export const ALL_MOCK_INCOME = [...MOCK_INCOME, ...MOCK_INCOME_PREV_MONTH];

export function personColor(personId: string): string | null {
  return MOCK_PEOPLE.find((p) => p.id === personId)?.color ?? null;
}
