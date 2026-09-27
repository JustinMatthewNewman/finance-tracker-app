"use client";

import { useRef, useState } from "react";
import { Button, Card, Chip } from "@heroui/react";
import { useTransactionImport, type ImportOutcome, type ImportPlan } from "@/hooks/useTransactionImport";
import { accountLabelFromFilename } from "@/lib/wellsFargoCsv";
import { MATCH_BASIS_LABELS } from "@/lib/importReconcile";
import { formatDayHeading } from "@/lib/monthRange";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

// Upload a Wells Fargo statement CSV.
//
// THREE STEPS, AND THE MIDDLE ONE IS THE POINT. Choose a file, review what it
// will do, then write it. The review step is not ceremony: an import writes
// hundreds of rows into shared household finances at once, the mapping from a
// bank memo to a merchant and a category is a heuristic, and "positive is
// income" is a rule with a real edge to it (see the transfers note below). All
// of that is cheap to look at beforehand and tedious to unpick afterwards.
//
// Everything shown here comes from hooks/useTransactionImport.ts planImport(),
// which writes nothing.

interface ImportStatementDialogProps {
  isOpen: boolean;
  /** Members this account may write to — imports are gated on ownership. */
  memberOptions: { id: string; name: string }[];
  /**
   * Every name in the household, not only the writable ones.
   *
   * Wider than memberOptions on purpose: a transfer to a housemate is internal
   * whether or not this account may edit that housemate's records. Narrowing it
   * to what is writable would leave real family transfers counted as household
   * income.
   */
  householdNames: readonly string[];
  defaultMemberId: string | null;
  onClose: () => void;
  /** Called after rows land, so the page behind can refetch the month. */
  onImported: () => void;
}

type Stage = "choose" | "review" | "done";

export function ImportStatementDialog({
  isOpen,
  memberOptions,
  householdNames,
  defaultMemberId,
  onClose,
  onImported,
}: ImportStatementDialogProps) {
  // Amounts go through formatAmount rather than formatMoney, so privacy
  // mode covers them. A figure that bypassed it would stay legible with the
  // toggle on, and a screen that hides most of its numbers is worse than one
  // that hides none — the person believes they are covered.
  const { formatAmount } = usePrivacyMode();

  const { imports, progress, planImport, runImport, removeImport, currency } = useTransactionImport();

  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [text, setText] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState(defaultMemberId ?? memberOptions[0]?.id ?? "");
  const [categorize, setCategorize] = useState(true);
  // Default OFF: a transfer between your own accounts IS a positive or negative
  // line on the statement, and "positive is income" is the rule this importer was
  // asked for. It is offered because the consequence is real — every £500 moved
  // into savings adds £500 to the month's income AND £500 to its spending, so a
  // household that sweeps money around looks like it earns and spends far more
  // than it does. Which of those two a person wants is genuinely their call.
  const [excludeTransfers, setExcludeTransfers] = useState(false);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  // importKeys of probable duplicates the person has ticked as "already have
  // this". Empty by default on purpose: a row the reconciler is merely unsure
  // about is imported unless somebody says otherwise, because a ledger quietly
  // missing a transaction is worse than one with a visible duplicate in it.
  const [skipKeys, setSkipKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStage("choose");
    setText(null);
    setFilename("");
    setAccountLabel("");
    setPlan(null);
    setOutcome(null);
    setSkipKeys(new Set());
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const contents = await file.text();
      setText(contents);
      setFilename(file.name);
      setAccountLabel(accountLabelFromFilename(file.name));
    } catch {
      setError("That file could not be read.");
    }
  };

  /** Re-plans against the current options. Writes nothing. */
  const review = async (overrides?: { categorize?: boolean; excludeTransfers?: boolean }) => {
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const next = await planImport(text, {
        accountLabel: accountLabel.trim() || accountLabelFromFilename(filename),
        filename,
        householdNames,
        categorize: overrides?.categorize ?? categorize,
        excludeInternalTransfers: overrides?.excludeTransfers ?? excludeTransfers,
      });
      setPlan(next);
      // Re-planning invalidates the keys the ticks referred to, so they reset
      // rather than silently applying to different rows.
      setSkipKeys(new Set());
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!plan || !familyMemberId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await runImport(familyMemberId, plan, skipKeys);
      setOutcome(result);
      setStage("done");
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The import did not finish.");
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (!outcome) return;
    setBusy(true);
    setError(null);
    try {
      await removeImport(outcome.statementImportId);
      onImported();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That import could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await removeImport(id);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That import could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const totalOf = (rows: { amountMinor: number; direction: string }[], direction: string) =>
    rows.filter((r) => r.direction === direction).reduce((sum, r) => sum + r.amountMinor, 0);

  // What is actually going to be written, once the ticks are applied. Every
  // figure in the review step reads from this rather than from plan.toImport, so
  // ticking a duplicate visibly moves the totals — which is the point of showing
  // them at all.
  const rowsToWrite = plan
    ? plan.toImport.filter((_, i) => !skipKeys.has(plan.keys[i]))
    : [];
  const writeCount = rowsToWrite.length;

  const toggleSkip = (key: string) =>
    setSkipKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <div className="p-6">
          <h2 className="mb-1 text-2xl font-bold">Import a statement</h2>
          <p className="mb-4 text-sm text-foreground/60">
            A Wells Fargo CSV export. Positive amounts become income, negative ones become
            expenses, and everything lands as money that has already moved — never as a projection.
          </p>

          {error && (
            <div className="mb-4 rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {stage === "choose" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="import-file">
                  Statement file *
                </label>
                <input
                  id="import-file"
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="w-full rounded border border-border bg-transparent p-2 text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </div>

              {text !== null && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold" htmlFor="import-member">
                        Whose money is this? *
                      </label>
                      <select
                        id="import-member"
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
                    <div>
                      <label className="mb-2 block text-sm font-semibold" htmlFor="import-account">
                        Account name *
                      </label>
                      <input
                        id="import-account"
                        type="text"
                        className="w-full rounded border border-border bg-transparent p-2 text-sm"
                        value={accountLabel}
                        onChange={(e) => setAccountLabel(e.target.value)}
                        placeholder="Checking"
                      />
                      {/* This is not cosmetic: it is part of every row's
                          identity, which is what lets a later export of the SAME
                          account recognize lines it has already imported. Two
                          accounts with an identical payment on an identical day
                          are two transactions, and only this tells them apart. */}
                      <p className="mt-1 text-xs text-foreground/50">
                        Use the same name each time you import this account, so repeat uploads
                        recognize rows they have already brought in.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={categorize}
                      onChange={(e) => setCategorize(e.target.checked)}
                    />
                    <span>
                      Guess categories from the description
                      <span className="block text-xs text-foreground/50">
                        Only high-confidence matches — payroll, groceries, fuel, rent, fees and
                        transfers. Everything else stays uncategorized for you to file.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={excludeTransfers}
                      onChange={(e) => setExcludeTransfers(e.target.checked)}
                    />
                    <span>
                      Skip transfers between your own Wells Fargo accounts
                      <span className="block text-xs text-foreground/50">
                        They are real statement lines, but they are not money entering or leaving
                        the household — each one adds to both income and spending.
                      </span>
                    </span>
                  </label>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onPress={onClose} isDisabled={busy}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      isDisabled={busy || !familyMemberId || !accountLabel.trim()}
                      onPress={() => void review()}
                    >
                      {busy ? "Reading…" : "Review"}
                    </Button>
                  </div>
                </>
              )}

              {imports.length > 0 && (
                <PreviousImports
                  imports={imports}
                  busy={busy}
                  onRemove={(id) => void remove(id)}
                />
              )}
            </div>
          )}

          {stage === "review" && plan && (
            <div className="flex flex-col gap-4">
              {plan.duplicateOf && (
                <div className="rounded border border-warning/40 bg-warning/10 p-3 text-sm">
                  <strong>You have uploaded this exact file before</strong> — as{" "}
                  {plan.duplicateOf.accountLabel} on {formatDayHeading(plan.duplicateOf.createdAt)}.
                  Importing again is safe: every line it already brought in is skipped below.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Will import" value={writeCount} accent="text-success" />
                <Stat label="Already imported" value={plan.certainDuplicates.length} />
                <Stat
                  label="Possible duplicates"
                  value={plan.probableDuplicates.length}
                  accent={plan.probableDuplicates.length ? "text-warning" : undefined}
                />
                <Stat
                  label="Unreadable"
                  value={plan.parsed.skipped.length}
                  accent={plan.parsed.skipped.length ? "text-danger" : undefined}
                />
              </div>

              <div className="flex flex-wrap gap-6 rounded border border-border p-3 text-sm">
                <div>
                  <div className="text-xs text-foreground/50">Income</div>
                  <div className="font-semibold tabular-nums text-success">
                    {formatAmount(totalOf(rowsToWrite, "INCOME"), currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/50">Expenses</div>
                  <div className="font-semibold tabular-nums text-danger">
                    {formatAmount(totalOf(rowsToWrite, "EXPENSE"), currency)}
                  </div>
                </div>
              </div>

              {/* Re-plans rather than filtering what is on screen, so the counts
                  and the already-imported check stay true to the options. */}
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categorize}
                    disabled={busy}
                    onChange={(e) => {
                      setCategorize(e.target.checked);
                      void review({ categorize: e.target.checked });
                    }}
                  />
                  Guess categories
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={excludeTransfers}
                    disabled={busy}
                    onChange={(e) => {
                      setExcludeTransfers(e.target.checked);
                      void review({ excludeTransfers: e.target.checked });
                    }}
                  />
                  Skip internal transfers
                </label>
              </div>

              {/* POSSIBLE DUPLICATES.
                  Nothing here is skipped unless it is ticked. These are rows
                  that resemble something already imported — almost always a
                  charge that was pending at the last upload and has since
                  settled under a rewritten memo, a new date and sometimes a new
                  amount. The reconciler cannot tell that from a second identical
                  purchase (see lib/importReconcile.ts), so it reports and a
                  person decides. Defaulting these to skipped would quietly drop
                  real transactions. */}
              {plan.probableDuplicates.length > 0 && (
                <div className="rounded border border-warning/40 bg-warning/5 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {plan.probableDuplicates.length} row
                        {plan.probableDuplicates.length === 1 ? "" : "s"} may already be here
                      </h3>
                      <p className="text-xs text-foreground/60">
                        These look like transactions you have already imported, under a different
                        description — usually a charge that was pending last time and has since
                        settled. They <strong>will be imported</strong> unless you tick them.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={busy}
                      onPress={() =>
                        setSkipKeys((current) =>
                          plan.probableDuplicates.every((m) => current.has(m.key))
                            ? new Set()
                            : new Set(plan.probableDuplicates.map((m) => m.key))
                        )
                      }
                    >
                      {plan.probableDuplicates.every((m) => skipKeys.has(m.key))
                        ? "Import all of them"
                        : "Skip all of them"}
                    </Button>
                  </div>

                  <div className="max-h-56 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-surface">
                        <tr className="border-b border-border">
                          <th className="p-2 font-semibold">Skip</th>
                          <th className="p-2 font-semibold">In this file</th>
                          <th className="p-2 font-semibold">Already imported</th>
                          <th className="p-2 font-semibold">Why it matched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.probableDuplicates.map((m) => (
                          <tr key={m.key} className="border-b border-border/50 align-top">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                aria-label={`Skip ${m.row.merchant} on ${m.row.occurredOn}`}
                                checked={skipKeys.has(m.key)}
                                disabled={busy}
                                onChange={() => toggleSkip(m.key)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="font-medium text-foreground">{m.row.merchant}</div>
                              <div className="tabular-nums text-foreground/60">
                                {m.row.occurredOn} ·{" "}
                                {formatAmount(m.row.amountMinor, currency)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="text-foreground/70">{m.existing.merchant ?? "—"}</div>
                              <div className="tabular-nums text-foreground/60">
                                {m.existing.occurredOn} ·{" "}
                                {formatAmount(m.existing.amountMinor, currency)}
                              </div>
                            </td>
                            <td className="p-2 text-foreground/60">
                              {MATCH_BASIS_LABELS[m.basis]}
                              {m.dayGap !== 0 && (
                                <span className="block">
                                  {Math.abs(m.dayGap)} day{Math.abs(m.dayGap) === 1 ? "" : "s"}{" "}
                                  {m.dayGap > 0 ? "later" : "earlier"}
                                </span>
                              )}
                              {m.row.amountMinor !== m.existing.amountMinor && (
                                <span className="block text-warning">
                                  Amount differs by{" "}
                                  {formatAmount(
                                    Math.abs(m.row.amountMinor - m.existing.amountMinor),
                                    currency
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* THE RAW MEMO IS SHOWN BESIDE WHAT WILL BE STORED. Only the
                  merchant is kept (see lib/wellsFargoCsv.ts), so this preview is
                  the one place the original line and the interpretation of it can
                  be compared — before it is committed, rather than discovered
                  afterwards. */}
              <div className="max-h-72 overflow-auto rounded border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-border">
                      <th className="p-2 font-semibold">Date</th>
                      <th className="p-2 font-semibold">Merchant</th>
                      <th className="p-2 font-semibold">Category</th>
                      <th className="p-2 text-right font-semibold">Amount</th>
                      <th className="p-2 font-semibold">From the statement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsToWrite.slice(0, 200).map((row) => (
                      <tr key={row.fingerprint} className="border-b border-border/50">
                        <td className="whitespace-nowrap p-2 tabular-nums">{row.occurredOn}</td>
                        <td className="p-2">{row.merchant}</td>
                        <td className="p-2">
                          {row.categoryName ? (
                            <Chip size="sm">{row.categoryName}</Chip>
                          ) : (
                            <span className="text-foreground/40">—</span>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap p-2 text-right tabular-nums ${
                            row.direction === "INCOME" ? "text-success" : "text-danger"
                          }`}
                        >
                          {row.direction === "INCOME" ? "+" : "−"}
                          {formatAmount(row.amountMinor, currency)}
                        </td>
                        <td className="max-w-64 truncate p-2 text-foreground/40" title={row.raw.description}>
                          {row.raw.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {writeCount > 200 && (
                  <p className="p-2 text-xs text-foreground/50">
                    Showing the first 200 of {writeCount}.
                  </p>
                )}
                {writeCount === 0 && (
                  <p className="p-4 text-center text-xs text-foreground/50">
                    Nothing new to import from this file.
                  </p>
                )}
              </div>

              {plan.parsed.skipped.length > 0 && (
                <details className="rounded border border-danger/30 p-3 text-xs">
                  <summary className="cursor-pointer font-semibold text-danger">
                    {plan.parsed.skipped.length} line
                    {plan.parsed.skipped.length === 1 ? "" : "s"} could not be read
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1 text-foreground/60">
                    {plan.parsed.skipped.slice(0, 20).map((s) => (
                      <li key={s.raw.line}>
                        Line {s.raw.line}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {progress && (
                <p className="text-sm text-foreground/60 tabular-nums">
                  Importing {progress.done} of {progress.total}…
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onPress={reset} isDisabled={busy}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  isDisabled={busy || writeCount === 0}
                  onPress={() => void commit()}
                >
                  {busy
                    ? "Importing…"
                    : `Import ${writeCount} transaction${writeCount === 1 ? "" : "s"}`}
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && outcome && (
            <div className="flex flex-col gap-4">
              <div className="rounded border border-success/40 bg-success/10 p-3 text-sm">
                <strong>
                  Imported {outcome.imported} transaction{outcome.imported === 1 ? "" : "s"}.
                </strong>{" "}
                They are on the Income, Expenses and Calendar tabs now, marked as imported.
              </div>

              <ul className="flex flex-col gap-1 text-sm text-foreground/60">
                {outcome.alreadyImported > 0 && (
                  <li>{outcome.alreadyImported} were already imported, so they were skipped.</li>
                )}
                {outcome.skippedAsDuplicate > 0 && (
                  <li>
                    {outcome.skippedAsDuplicate} you marked as already here were skipped.
                  </li>
                )}
                {outcome.excludedTransfers > 0 && (
                  <li>{outcome.excludedTransfers} internal transfers were left out.</li>
                )}
                {outcome.unreadable > 0 && <li>{outcome.unreadable} lines could not be read.</li>}
              </ul>

              {outcome.failures.length > 0 && (
                <details className="rounded border border-danger/30 p-3 text-xs">
                  <summary className="cursor-pointer font-semibold text-danger">
                    {outcome.failures.length} row
                    {outcome.failures.length === 1 ? "" : "s"} did not save
                  </summary>
                  {/* Re-running the same file is the fix, and it is safe: the
                      rows that landed are recognized and skipped. */}
                  <p className="mt-2 text-foreground/60">
                    Importing this file again will retry just these — everything that landed is
                    recognized and skipped.
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-foreground/60">
                    {outcome.failures.slice(0, 20).map((f) => (
                      <li key={f.row.fingerprint}>
                        {f.row.occurredOn} {f.row.merchant}: {f.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onPress={() => void undo()} isDisabled={busy}>
                  Undo this import
                </Button>
                <Button variant="outline" className="flex-1" onPress={reset} isDisabled={busy}>
                  Import another
                </Button>
                <Button className="flex-1" onPress={onClose} isDisabled={busy}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded border border-border p-2">
      <div className="text-xs text-foreground/50">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${accent ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * Every upload the household has made.
 *
 * Household-wide because it is a read (see ListMyStatementImports), so a
 * housemate's upload appears here and is deliberately offered no Remove button —
 * both delete mutations are owner-only and would refuse at a `@check` nobody
 * would see the reason for.
 */
function PreviousImports({
  imports,
  busy,
  onRemove,
}: {
  imports: ReturnType<typeof useTransactionImport>["imports"];
  busy: boolean;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <div className="mt-2 border-t border-border pt-4">
      <h3 className="mb-2 text-sm font-semibold">Previous imports</h3>
      <div className="flex flex-col gap-2">
        {imports.map((imp) => (
          <div
            key={imp.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-2 text-xs"
          >
            <div>
              <div className="font-semibold text-foreground">
                {imp.accountLabel} · {imp.familyMemberName}
              </div>
              <div className="text-foreground/50">
                {imp.importedRowCount} row{imp.importedRowCount === 1 ? "" : "s"}
                {imp.earliestOccurredOn && imp.latestOccurredOn
                  ? ` · ${imp.earliestOccurredOn} to ${imp.latestOccurredOn}`
                  : ""}
                {" · "}
                {imp.filename}
                {!imp.isMine && ` · uploaded by ${imp.ownerUsername}`}
              </div>
            </div>
            {imp.isMine ? (
              confirming === imp.id ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setConfirming(null)}>
                    Keep
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger"
                    isDisabled={busy}
                    onPress={() => {
                      setConfirming(null);
                      onRemove(imp.id);
                    }}
                  >
                    Delete {imp.importedRowCount} rows
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setConfirming(imp.id)}>
                  Remove
                </Button>
              )
            ) : (
              <span className="text-foreground/40">{imp.ownerUsername}&apos;s</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImportStatementDialog;
