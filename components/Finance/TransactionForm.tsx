"use client";

import { useState } from "react";
import { Card, Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useCategories } from "@/context/CategoriesContext";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  type Direction,
  minorToInput,
  parseAmountToMinor,
} from "@/lib/money";
import { toDateString } from "@/lib/monthRange";
import { statusForSource } from "@/lib/transactionKind";
import { countOccurrences, defaultRecurrenceEnd, isRecurrence } from "@/lib/recurrence";
import type { TransactionInput } from "@/hooks/useTransactions";
import type { Transaction } from "@/hooks/useTransactions";

interface TransactionFormProps {
  isOpen: boolean;
  /**
   * Who the row is for, when that is already settled — the Household page
   * opens this from inside one member's panel.
   *
   * Ignored when `memberOptions` is supplied, because then the person picks.
   */
  memberName?: string;
  /**
   * Members this account may write records for, for the household-wide pages
   * (Income, Expenses, Calendar) where no member has been chosen yet.
   *
   * Only ever the caller's OWN members. Household reads are wider than
   * household writes, so offering a housemate's person here would produce a
   * form that fails at CreateTransaction's `@check` on submit.
   */
  memberOptions?: { id: string; name: string }[];
  /** Pre-selects an entry in `memberOptions`. */
  defaultMemberId?: string | null;
  /** Pre-fills the date — the Calendar opens this on a specific day. */
  defaultOccurredOn?: string;
  /** Opens the form already set to record something expected rather than done. */
  defaultProjected?: boolean;
  currency?: CurrencyCode;
  /** Present when editing; absent when adding. */
  existing?: Transaction | null;
  onClose: () => void;
  /**
   * `familyMemberId` is present only when the form showed a picker; the
   * single-member call site already knows who the row is for.
   */
  onSubmit: (data: TransactionInput, familyMemberId?: string) => Promise<void>;
}

const METHOD_SUGGESTIONS = ["Card", "Cash", "Transfer", "Direct debit", "Check"];
const RECURRENCE_OPTIONS = [
  { value: "", label: "One-off" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export function TransactionForm({
  isOpen,
  memberName,
  memberOptions,
  defaultMemberId,
  defaultOccurredOn,
  defaultProjected,
  currency = DEFAULT_CURRENCY,
  existing,
  onClose,
  onSubmit,
}: TransactionFormProps) {
  const { categories } = useCategories();

  const [direction, setDirection] = useState<Direction>(existing?.direction ?? "EXPENSE");
  const [source, setSource] = useState<"MANUAL" | "FORECAST">(
    existing ? (existing.source === "FORECAST" ? "FORECAST" : "MANUAL") : defaultProjected ? "FORECAST" : "MANUAL"
  );
  const [familyMemberId, setFamilyMemberId] = useState<string>(
    existing?.familyMemberId ?? defaultMemberId ?? memberOptions?.[0]?.id ?? ""
  );
  const [amount, setAmount] = useState(existing ? minorToInput(existing.amountMinor, currency) : "");
  const [occurredOn, setOccurredOn] = useState(
    existing?.occurredOn ?? defaultOccurredOn ?? toDateString(new Date())
  );
  const [categoryName, setCategoryName] = useState(existing?.category?.name ?? "");
  const [merchant, setMerchant] = useState(existing?.merchant ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [method, setMethod] = useState(existing?.method ?? "");
  const [recurrence, setRecurrence] = useState(existing?.recurrence ?? "");
  // "" means indefinitely. Kept as the raw input value rather than a Date so
  // the field can be cleared, which is how somebody says "no end".
  const [recurrenceEndsOn, setRecurrenceEndsOn] = useState(existing?.recurrenceEndsOn ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the fields whenever the dialog transitions from closed to open, or
  // when it's reopened on a different transaction — done during render rather
  // than in an effect (see https://react.dev/learn/you-might-not-need-an-effect).
  // Keyed on the transaction id as well as the open flag, so switching
  // straight from editing one row to another doesn't leave the first row's
  // values in the form.
  const formKey = `${isOpen}:${existing?.id ?? "new"}`;
  const [lastFormKey, setLastFormKey] = useState(formKey);
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    if (isOpen) {
      setDirection(existing?.direction ?? "EXPENSE");
      setSource(existing?.source === "FORECAST" ? "FORECAST" : "MANUAL");
      setAmount(existing ? minorToInput(existing.amountMinor, currency) : "");
      setOccurredOn(existing?.occurredOn ?? toDateString(new Date()));
      setCategoryName(existing?.category?.name ?? "");
      setMerchant(existing?.merchant ?? "");
      setDescription(existing?.description ?? "");
      setMethod(existing?.method ?? "");
      setRecurrence(existing?.recurrence ?? "");
      setRecurrenceEndsOn(existing?.recurrenceEndsOn ?? "");
      setError(null);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // parseAmountToMinor returns null rather than throwing or coercing, so a
    // typo surfaces here as a message instead of silently becoming 0.00 —
    // see the note in lib/money.ts on why that distinction matters.
    const amountMinor = parseAmountToMinor(amount, currency);
    if (amountMinor === null) {
      setError("Enter a valid amount, like 42.50");
      return;
    }
    if (amountMinor === 0) {
      setError("Amount must be more than zero.");
      return;
    }

    if (showsRepeatWindow && endsBeforeItStarts) {
      setError("The repeat end date is before the first occurrence.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amountMinor,
        direction,
        occurredOn,
        categoryName: categoryName.trim() || null,
        merchant: merchant.trim() || null,
        description: description.trim() || null,
        method: method.trim() || null,
        recurrence: recurrence || null,
        // Only meaningful on a repeating projection. Cleared otherwise so a
        // row cannot carry an end date for a series it is not part of —
        // switching a repeating projection back to one-off would otherwise
        // leave a stale bound behind for the next person to puzzle over.
        recurrenceEndsOn: showsRepeatWindow && recurrenceEndsOn ? recurrenceEndsOn : null,
        source,
        status: statusForSource(source),
      }, memberOptions ? familyMemberId : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  // Suggestions are filtered to the chosen direction's usual side, but the
  // input stays free text so a refund against a spending category (or a
  // payroll deduction against an earning one) is still expressible — which is
  // exactly why Transaction.direction is authoritative rather than derived
  // from the category. See the schema note on Category.kind.
  // Repeating only means something for a projection — see the note on
  // Transaction.recurrence in schema.gql.
  const showsRepeatWindow = source === "FORECAST" && isRecurrence(recurrence);
  const endsBeforeItStarts = !!recurrenceEndsOn && recurrenceEndsOn < occurredOn;

  const occurrenceCount = showsRepeatWindow
    ? countOccurrences({
        occurredOn,
        recurrence,
        recurrenceEndsOn: recurrenceEndsOn || null,
      })
    : null;

  // Says what the setting will actually produce, in entries rather than in
  // dates — "repeats until 21 Mar" does not tell somebody whether that is
  // three paycheques or thirty.
  const repeatSummary = !recurrenceEndsOn
    ? "Keeps repeating with no end date."
    : endsBeforeItStarts
      ? ""
      : `${occurrenceCount} ${occurrenceCount === 1 ? "entry" : "entries"}, ending ${recurrenceEndsOn}.`;

  const suggested = categories.filter((c) => c.kind === direction);
  const others = categories.filter((c) => c.kind !== direction);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-1">
            {existing ? "Edit Transaction" : "New Transaction"}
          </h2>
          {!memberOptions && memberName && (
            <p className="mb-4 text-sm text-foreground/60">for {memberName}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {memberOptions && (
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="txn-member">
                  Who is this for? *
                </label>
                <select
                  id="txn-member"
                  className="w-full rounded border border-border bg-transparent p-2 text-sm"
                  value={familyMemberId}
                  onChange={(e) => setFamilyMemberId(e.target.value)}
                >
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <ToggleButtonGroup
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[direction]}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0];
                  if (next === "INCOME" || next === "EXPENSE") setDirection(next);
                }}
                aria-label="Direction"
              >
                <ToggleButton id="EXPENSE">Money out</ToggleButton>
                <ToggleButton id="INCOME">Money in</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[source]}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0];
                  if (next === "MANUAL" || next === "FORECAST") setSource(next);
                }}
                aria-label="Transaction Type"
              >
                <ToggleButton id="MANUAL">Already happened</ToggleButton>
                <ToggleButton id="FORECAST">Expected</ToggleButton>
              </ToggleButtonGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-2">Amount *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-default-200 rounded-lg tabular-nums"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Date *</label>
                <input
                  type="date"
                  value={occurredOn}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  className="w-full px-3 py-2 border border-default-200 rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Category</label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="Groceries, Salary, Rent..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg"
                disabled={loading}
              />
              <datalist id="category-suggestions">
                {suggested.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
                {others.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-foreground/50">
                A category that doesn&apos;t exist yet is created automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-2">
                  {direction === "INCOME" ? "Source" : "Merchant"}
                </label>
                <input
                  type="text"
                  placeholder={direction === "INCOME" ? "Employer" : "Where?"}
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-3 py-2 border border-default-200 rounded-lg"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Method</label>
                <input
                  type="text"
                  list="method-suggestions"
                  placeholder="Card, Cash..."
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-default-200 rounded-lg"
                  disabled={loading}
                />
                <datalist id="method-suggestions">
                  {METHOD_SUGGESTIONS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Note</label>
              <input
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Repeats</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg bg-transparent"
                disabled={loading}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-foreground/50">
                {showsRepeatWindow
                  ? "This will appear on the calendar on every matching day."
                  : "Labels this as recurring. Only projections repeat on the calendar."}
              </p>
            </div>

            {/* HOW LONG A PROJECTION KEEPS SHOWING.
                Only for repeating projections: a one-off has nothing to
                bound, and something that already happened happened once. */}
            {showsRepeatWindow && (
              <div>
                <label className="text-sm font-semibold block mb-2" htmlFor="txn-repeat-until">
                  Repeats until
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="txn-repeat-until"
                    type="date"
                    value={recurrenceEndsOn}
                    min={occurredOn}
                    onChange={(e) => setRecurrenceEndsOn(e.target.value)}
                    className="flex-1 rounded-lg border border-default-200 bg-transparent px-3 py-2"
                    disabled={loading}
                  />
                  {/* Clearing the field is how you say "no end", so there has
                      to be something to clear it WITH — a date input offers no
                      affordance of its own, and on several browsers no way to
                      empty it by typing either. */}
                  <Button
                    type="button"
                    size="sm"
                    variant={recurrenceEndsOn ? "outline" : "secondary"}
                    isDisabled={loading}
                    onPress={() =>
                      setRecurrenceEndsOn(
                        recurrenceEndsOn ? "" : defaultRecurrenceEnd(occurredOn)
                      )
                    }
                  >
                    {recurrenceEndsOn ? "No end date" : "Set an end date"}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-foreground/50">{repeatSummary}</p>
                {endsBeforeItStarts && (
                  <p className="mt-1 text-xs text-danger">
                    That&apos;s before the first one, so nothing would show.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} isDisabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isDisabled={loading || !amount.trim()}>
                {loading ? "Saving..." : existing ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default TransactionForm;
