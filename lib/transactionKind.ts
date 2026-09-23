// Projected vs. actual: the one place the `source` and `status` strings on a
// Transaction are written down.
//
// Data Connect has no enum table or CHECK constraint to hang these on — the
// same constraint that puts Transaction.direction's two values in
// lib/money.ts and the join-request states in lib/familyStatus.ts.
//
// THE MODEL. A transaction is either something that happened or something the
// household expects to happen. Both are rows in the same table, because every
// total, calendar day and breakdown in the app has to consider both, and a
// second table would be a second thing to forget. See the note on
// Transaction.source in dataconnect/schema/schema.gql.

/** How the row got here. */
export const TRANSACTION_SOURCES = ["MANUAL", "FORECAST"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

/** Whether the money has actually moved. */
export const TRANSACTION_STATUSES = ["POSTED", "FORECASTED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export function isTransactionSource(value: string | null | undefined): value is TransactionSource {
  return !!value && (TRANSACTION_SOURCES as readonly string[]).includes(value);
}

export function isTransactionStatus(value: string | null | undefined): value is TransactionStatus {
  return !!value && (TRANSACTION_STATUSES as readonly string[]).includes(value);
}

/**
 * Narrows a `source` read from the database.
 *
 * Unrecognized text resolves to "MANUAL" — the conservative direction. A row
 * whose source cannot be read is shown as an ordinary transaction rather than
 * as a projection, because the failure mode of getting that backwards is a
 * figure the household believes is real when it is not.
 */
export function toTransactionSource(value: string | null | undefined): TransactionSource {
  return isTransactionSource(value) ? value : "MANUAL";
}

/** Narrows a `status`. Unrecognized text resolves to "POSTED", as above. */
export function toTransactionStatus(value: string | null | undefined): TransactionStatus {
  return isTransactionStatus(value) ? value : "POSTED";
}

/**
 * Whether this row is money the household is *expecting* rather than money
 * that moved.
 *
 * Reads `status`, not `source`, and that is the whole reason this helper
 * exists rather than each caller writing the comparison itself. A projection
 * that has been marked as received keeps `source: "FORECAST"` — that is how
 * it stays visible as having started life as a projection — while its status
 * becomes POSTED. Anything totalling real money must follow status; only
 * provenance follows source.
 */
export function isProjected(txn: { status: TransactionStatus }): boolean {
  return txn.status === "FORECASTED";
}

/** The status a row should carry given how it was entered. */
export function statusForSource(source: TransactionSource): TransactionStatus {
  return source === "FORECAST" ? "FORECASTED" : "POSTED";
}
