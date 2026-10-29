"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Bars, ChartPie, ChevronLeft, ChevronRight, Plus } from "@gravity-ui/icons";
import FamilyMemberListBox from "../Utilities/ListBoxComponent";
import { useSidebar } from "@/context/SideBarContext";
import { useBorders } from "@/context/BordersContext";
import { useSelectedFamilyMember } from "@/context/SelectedFamilyMemberContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useMyTransactions } from "@/hooks/useMyTransactions";
import { useTransactions, type Transaction, type TransactionInput } from "@/hooks/useTransactions";
import {
  DEFAULT_CURRENCY,
  type Direction,
  isCurrencyCode,
} from "@/lib/money";
import {
  addMonths,
  currentMonthKey,
  monthLabel,
  monthRange,
  relativeMonthLabel,
} from "@/lib/monthRange";
import { ledgerTotals, memberTotals } from "@/lib/ledgerTotals";
import { isInternal } from "@/lib/internalTransfers";
import { effectiveColor } from "@/lib/entityColor";
import { TransactionTable } from "./TransactionTable";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { TransactionForm } from "./TransactionForm";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

interface MemberDetailLayoutProps {
  showBreakdown?: boolean;
  onToggleBreakdown?: (showBreakdown: boolean) => void;
}

function MemberDetailLayout({ showBreakdown = false, onToggleBreakdown }: MemberDetailLayoutProps) {
  // Amounts go through formatAmount rather than formatMoney, so privacy
  // mode covers them. A figure that bypassed it would stay legible with the
  // toggle on, and a screen that hides most of its numbers is worse than one
  // that hides none — the person believes they are covered.
  const { formatAmount } = usePrivacyMode();

  const { isOpen, toggle: toggleSidebar } = useSidebar();
  const { bordersEnabled } = useBorders();
  const {
    selectedFamilyMemberId,
    setSelectedFamilyMemberId,
    initializeSelection,
    selectionInitialized,
    focusTransactionId,
    setFocusTransactionId,
  } = useSelectedFamilyMember();
  const { currencyCode } = useUserSettings();
  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  const {
    familyMembers,
    loading: membersLoading,
    error: membersError,
    createFamilyMember,
    renameFamilyMember,
    deleteFamilyMember,
    myUserId,
    selfMemberId,
  } = useFamilyMembers();

  // Memoized because it is a dependency of the transfer-resolution pass, which
  // pairs every transfer leg against every other — see useMyTransactions.
  const memberNames = useMemo(
    () => familyMembers.map((m) => m.name),
    [familyMembers]
  );

  /**
   * ONE fetch, ONE resolution, both views.
   *
   * This used to be two reads: the household-wide one for the sidebar's
   * subtotals, and a member-scoped useTransactions(selectedId) for the panel.
   * Deriving the panel from the household list instead is not just one query
   * fewer — it is what makes the two views AGREE.
   *
   * A member-scoped read holds one person's rows, so `pairTransfers` has nothing
   * to pair against: the other leg of a transfer almost always belongs to
   * somebody else. Jordan's anonymous "CASH APP" row was therefore counted as
   * real spending while Jordan was selected and correctly excluded under
   * "Everyone" — the same row, two answers, on two views of one page. One
   * resolved list, filtered per view, cannot do that.
   */
  const {
    resolved: allResolved,
    visible: allVisible,
    showInternalTransfers,
    loading,
    error,
    refetch: refetchAll,
  } = useMyTransactions(memberNames);

  // Write-only, hence null: createTransaction takes the member id per call, and
  // update/delete address a row by id. Same split as useHouseholdMonth.
  const { createTransaction, updateTransaction, deleteTransaction } = useTransactions(null);

  const selectedMember = familyMembers.find((m) => m.id === selectedFamilyMemberId) ?? null;
  /**
   * No one selected — show everybody's figures combined.
   *
   * `null` is a real view here, not an empty state: clicking the selected person
   * in the sidebar clears the selection and lands on this. See the note on
   * selectedFamilyMemberId in SelectedFamilyMemberContext for why that needed a
   * separate "has anything been chosen yet" flag to be possible at all.
   */
  const isHouseholdView = selectedFamilyMemberId === null;

  // Open on the signed-in person rather than on nothing.
  //
  // The page used to land on "No one selected" with a populated sidebar beside
  // it, which asks somebody to make a choice before the app will show them
  // anything — and the answer is nearly always "me".
  //
  // GUARDED ON selectionInitialized, NOT ON THE ID BEING NULL, and that is the
  // change that makes deselecting possible. The household view IS a null id, so
  // a null check could not tell "nobody has chosen yet" from "somebody chose
  // everyone" — it read the second as the first and put the person straight
  // back on the next render. This was also two effects racing to fill the same
  // hole (one preferring `selfMemberId`, one the first row); they are one now,
  // with the fallback expressed as a fallback.
  //
  // Both ids are null while the roster loads, so this resolves once the real
  // answer arrives rather than selecting whichever row appears first.
  useEffect(() => {
    if (selectionInitialized) return;
    const landOn = selfMemberId ?? familyMembers[0]?.id;
    if (!landOn) return;
    initializeSelection(landOn);
  }, [selectionInitialized, selfMemberId, familyMembers, initializeSelection]);

  // The month the panel is showing. Lives here rather than in the sidebar
  // because in this app the *panel* owns time and the sidebar owns people —
  // the inverse of the source template, where work logs were day-scoped and
  // the sidebar paged through weeks.
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const [breakdownDirection, setBreakdownDirection] = useState<Direction>("EXPENSE");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  /**
   * The month's rows, resolved but NOT yet filtered.
   *
   * Kept separate from `visible` below because the totals need the rows the
   * household has hidden: ledgerTotals only reports `excludedTransferCount` for
   * rows it was given and chose to skip. Hand it a pre-filtered list and the
   * count is always zero, which is how a panel comes to quietly omit rows with
   * nothing on screen to say so.
   */
  const monthRows = useMemo(
    () => allResolved.filter((t) => t.occurredOn >= range.startDate && t.occurredOn <= range.endDate),
    [allResolved, range.startDate, range.endDate]
  );

  /** The month's rows for whichever view is up — one person's, or everybody's. */
  const scopedRows = useMemo(
    () =>
      isHouseholdView
        ? monthRows
        : monthRows.filter((t) => t.familyMemberId === selectedFamilyMemberId),
    [monthRows, isHouseholdView, selectedFamilyMemberId]
  );

  const totalsOptions = useMemo(
    () => ({ includeInternalTransfers: showInternalTransfers }),
    [showInternalTransfers]
  );

  // From the shared module, so this panel's figures are the same arithmetic as
  // the Calendar's and the ledgers'. sumTotals() nets projections into the same
  // bucket as actuals, which is exactly the blending lib/ledgerTotals.ts exists
  // to prevent.
  const ledger = useMemo(() => ledgerTotals(scopedRows, totalsOptions), [scopedRows, totalsOptions]);
  const totals = useMemo(
    () => ({
      incomeMinor: ledger.in.actualMinor,
      expenseMinor: ledger.out.actualMinor,
      netMinor: ledger.netMinor,
    }),
    [ledger]
  );

  /**
   * What the table lists — the same rows the figures above it counted.
   *
   * Derived from `scopedRows` rather than fetched separately so the two cannot
   * drift. The flags are already on the row (see useMyTransactions' `resolved`),
   * so this is the same test ledgerTotals just applied.
   */
  const visible = useMemo(
    () => (showInternalTransfers ? scopedRows : scopedRows.filter((t) => !isInternal(t))),
    [scopedRows, showInternalTransfers]
  );

  /**
   * Per-person figures for the household view, in roster order.
   *
   * memberTotals() rather than a filter-and-total here, because this is an in/out
   * figure and those all live in lib/ledgerTotals.ts — and these in particular
   * print directly above the combined figure they add up to, so "computed the
   * same way" is what keeps them agreeing. It is pure and tested, including that
   * the parts sum back to the whole.
   *
   * Roster order, and roster MEMBERSHIP: the ids come from the roster rather than
   * from the rows, so somebody with a quiet month still appears instead of
   * vanishing from a list the sidebar beside it still shows them in.
   */
  const memberSummaries = useMemo(() => {
    if (!isHouseholdView) return [];
    const byId = new Map(familyMembers.map((m) => [m.id, m]));
    return memberTotals(
      monthRows,
      familyMembers.map((m) => m.id),
      totalsOptions
    ).flatMap((totals) => {
      const member = byId.get(totals.familyMemberId);
      return member ? [{ member, totals }] : [];
    });
  }, [isHouseholdView, familyMembers, monthRows, totalsOptions]);

  /** Roster colours, so the table's "who" chip matches the sidebar's dot. */
  const memberColorById = useMemo(
    () => new Map(familyMembers.map((m) => [m.id, m.color])),
    [familyMembers]
  );

  // A search result may point at a transaction outside the month currently
  // shown, in which case selecting it would land on an empty panel and look
  // broken. Jump the carousel to the transaction's own month and open its day
  // group — the same "make the target visible" move the source template made
  // for hour blocks, one level up.
  //
  // Genuinely effectful rather than derivable during render: the transaction
  // arrives from an async fetch, and this also schedules a timer.
  useEffect(() => {
    if (!focusTransactionId) return;
    // Searched across the whole household, not just the selected member: the
    // search bar sets the member and the focus id together, but those arrive in
    // one render and this effect should not depend on which one it sees first.
    const target = allResolved.find((t) => t.id === focusTransactionId);
    if (!target) return; // still loading

    const [year, month] = target.occurredOn.split("-").map(Number);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonthKey((current) =>
      current.year === year && current.month === month - 1
        ? current
        : { year, month: month - 1 }
    );

    const dayKey = target.occurredOn.slice(0, 10);
    setExpandedKeys((prev) => (prev.has(dayKey) ? prev : new Set([...prev, dayKey])));

    // One-shot: clear it so re-expanding/collapsing the same day later doesn't
    // keep snapping back open.
    const timeout = setTimeout(() => setFocusTransactionId(null), 2000);
    return () => clearTimeout(timeout);
  }, [focusTransactionId, allResolved, setFocusTransactionId]);

  const handleSubmit = useCallback(
    async (data: TransactionInput) => {
      if (editing) {
        await updateTransaction(editing.id, data);
      } else {
        if (!selectedFamilyMemberId || !myUserId) throw new Error("No family member selected");
        await createTransaction(selectedFamilyMemberId, myUserId, data);
      }
      // The sidebar's per-member totals come from the household-wide fetch,
      // which this hook's own refetch doesn't touch — without this the number
      // next to the person's name stays stale until a reload.
      await refetchAll();
      setEditing(null);
    },
    [editing, updateTransaction, createTransaction, selectedFamilyMemberId, myUserId, refetchAll]
  );

  const handleDelete = useCallback(
    async (txn: Transaction) => {
      await deleteTransaction(txn.id);
      await refetchAll();
    },
    [deleteTransaction, refetchAll]
  );

  const viewControlKeys = useMemo(() => {
    const keys: string[] = [];
    if (isOpen) keys.push("sidebar");
    if (showBreakdown) keys.push("breakdown");
    return keys;
  }, [isOpen, showBreakdown]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Mobile view switcher: on narrow screens the sidebar and main content
          below become mutually-exclusive full-width panels (see the aside's
          responsive width) instead of side-by-side, so the header's small
          icon-only sidebar toggle has no room to double as the primary way to
          switch between them. This floating arrow is that dedicated control
          instead — anchored to the corner so it never crowds either panel's
          own header, and it flips direction to reflect which panel a tap will
          reveal next. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Show transactions" : "Show household"}
        className="absolute right-4 bottom-4 z-20 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:bg-accent-hover active:scale-95 md:hidden"
      >
        {isOpen ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
      </button>

      <div className="flex h-full min-h-0 flex-1 items-stretch gap-4 overflow-hidden">
        <aside
          className={`${
            isOpen ? "flex w-full md:w-72" : "hidden"
          } min-h-0 shrink-0 flex-col overflow-hidden`}
        >
          <FamilyMemberListBox
            familyMembers={familyMembers}
            loading={membersLoading}
            error={membersError}
            createFamilyMember={createFamilyMember}
            renameFamilyMember={renameFamilyMember}
            deleteFamilyMember={deleteFamilyMember}
            transactions={allVisible}
            range={range}
            currency={currency}
          />
        </aside>

        <div className={`${isOpen ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col`}>
          <Card
            className={`flex h-full min-h-0 flex-col overflow-hidden ${
              bordersEnabled ? "" : "border-none"
            }`}
          >
            {/* Sticky header: opts into the glass treatment explicitly via
                data-glass, since it paints its own background rather than
                inheriting the Card's. */}
            <div
              className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-border p-4"
              data-glass="surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {isHouseholdView ? "Everyone" : selectedMember?.name ?? "Everyone"}
                  </h2>
                  {/* The derived label — see lib/householdRole.ts. The stored
                      column says "Self" on every account's own row, which is
                      true of at most one of them for any given viewer. */}
                  {isHouseholdView ? (
                    <span className="shrink-0 rounded-full bg-default px-2 py-0.5 text-xs text-foreground/60">
                      {familyMembers.length} {familyMembers.length === 1 ? "person" : "people"} combined
                    </span>
                  ) : (
                    selectedMember?.relationshipLabel && (
                      <span className="shrink-0 rounded-full bg-default px-2 py-0.5 text-xs text-foreground/60">
                        {selectedMember.relationshipLabel}
                      </span>
                    )
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <ToggleButtonGroup
                    selectionMode="multiple"
                    selectedKeys={viewControlKeys}
                    onSelectionChange={(keys) => {
                      const next = new Set(Array.from(keys, String));
                      if (next.has("sidebar") !== isOpen) toggleSidebar();
                      onToggleBreakdown?.(next.has("breakdown"));
                    }}
                    size="sm"
                    aria-label="View options"
                  >
                    <ToggleButton id="sidebar" isIconOnly aria-label="Toggle household list">
                      <Bars className="size-4" />
                    </ToggleButton>
                    <ToggleButton id="breakdown" isIconOnly aria-label="Toggle category breakdown">
                      <ChartPie className="size-4" />
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* `selectedMember.isMine` for the same reason the
                      sidebar's rename is gated: CreateTransaction checks that
                      the family member belongs to the caller, so adding a
                      transaction against a housemate's person is refused at
                      the database. */}
                  <Button
                    size="sm"
                    isDisabled={!selectedFamilyMemberId || !myUserId || !selectedMember?.isMine}
                    // Every transaction belongs to exactly one person, so there
                    // is nobody to attribute one to while the combined view is
                    // up. Says so rather than leaving a dead button.
                    aria-label={
                      isHouseholdView
                        ? "Pick someone from the household to add a transaction"
                        : "Add transaction"
                    }
                    onPress={() => {
                      setEditing(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" aria-hidden /> Add
                  </Button>
                </div>
              </div>

              {/* Month carousel + the three figures for that month. */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    isIconOnly
                    aria-label="Previous month"
                    onPress={() => setMonthKey((k) => addMonths(k, -1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="min-w-36 text-center">
                    <div className="text-sm font-medium text-foreground">
                      {relativeMonthLabel(monthKey)}
                    </div>
                    <div className="text-xs text-foreground/50">{monthLabel(monthKey)}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    isIconOnly
                    aria-label="Next month"
                    onPress={() => setMonthKey((k) => addMonths(k, 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm tabular-nums">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-foreground/50">In</span>
                    <span className="text-success">{formatAmount(totals.incomeMinor, currency)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-foreground/50">Out</span>
                    <span className="text-foreground">{formatAmount(totals.expenseMinor, currency)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-foreground/50">Net</span>
                    {/* Sign is spelled out, not left to color alone. */}
                    <span
                      className={
                        totals.netMinor > 0
                          ? "text-success"
                          : totals.netMinor < 0
                            ? "text-danger"
                            : "text-foreground"
                      }
                    >
                      {totals.netMinor > 0 ? "+" : totals.netMinor < 0 ? "−" : ""}
                      {formatAmount(Math.abs(totals.netMinor), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* A total that silently omits rows the table below it lists is
                unreconcilable by hand — which is the one thing somebody does
                when they distrust a ledger. So when transfers are hidden, the
                figures say so. Same wording as the Income and Expenses pages,
                and it applies to both views here: this panel applies the
                preference, so this panel has to report it. */}
            {!showInternalTransfers && ledger.excludedTransferCount > 0 && (
              <p className="shrink-0 px-4 pb-2 text-xs text-foreground/50">
                Not counting {ledger.excludedTransferCount} transfer
                {ledger.excludedTransferCount === 1 ? "" : "s"} inside the household.
              </p>
            )}

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loading ? (
                  <p className="p-6 text-sm text-foreground/60">Loading transactions...</p>
                ) : error ? (
                  <p className="p-6 text-sm text-red-500">Error: {error}</p>
                ) : (
                  <>
                    {/* Who the combined figure is made of. The header above
                        answers "what did the household do this month"; this
                        answers "who did it", which is the question anybody
                        looking at a combined total asks next. Each row selects
                        that person, so the combined view is also the way in. */}
                    {isHouseholdView && memberSummaries.length > 0 && (
                      <div className="mb-2 flex flex-col gap-1 px-1">
                        {memberSummaries.map(({ member, totals: figures }) => {
                          const dotColor = effectiveColor(member.color, member.name);
                          const { hasActivity } = figures;
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => setSelectedFamilyMemberId(member.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-default-100/60"
                            >
                              {dotColor && (
                                <span
                                  className="size-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: dotColor }}
                                  aria-hidden
                                />
                              )}
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                {member.name}
                                {member.isSelf && (
                                  <span className="ml-1.5 text-xs text-foreground/50">you</span>
                                )}
                              </span>
                              {hasActivity ? (
                                <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                                  <span className="text-success">
                                    {formatAmount(figures.in.actualMinor, currency)}
                                  </span>
                                  <span className="text-foreground/70">
                                    {formatAmount(figures.out.actualMinor, currency)}
                                  </span>
                                  <span
                                    className={`w-20 text-right ${
                                      figures.netMinor > 0
                                        ? "text-success"
                                        : figures.netMinor < 0
                                          ? "text-danger"
                                          : "text-foreground/40"
                                    }`}
                                  >
                                    {figures.netMinor > 0
                                      ? "+"
                                      : figures.netMinor < 0
                                        ? "−"
                                        : ""}
                                    {formatAmount(Math.abs(figures.netMinor), currency)}
                                  </span>
                                </span>
                              ) : (
                                // Shown rather than omitted: a member who is
                                // missing from this strip but present in the
                                // sidebar reads as a bug, and "nothing this
                                // month" is itself worth knowing.
                                <span className="shrink-0 text-xs text-foreground/40">
                                  Nothing this month
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <TransactionTable
                      transactions={visible}
                      currency={currency}
                      expandedKeys={expandedKeys}
                      onExpandedChange={setExpandedKeys}
                      focusTransactionId={focusTransactionId}
                      // Only worth the column when rows from several people are
                      // interleaved; in one person's panel it is their name
                      // repeated down the page.
                      showMember={isHouseholdView}
                      memberColorById={memberColorById}
                      onEdit={(txn) => {
                        setEditing(txn);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  </>
                )}
              </div>

              {showBreakdown && (
                <div className="hidden min-h-0 w-80 shrink-0 border-l border-border lg:flex lg:flex-col">
                  <CategoryBreakdown
                    transactions={visible}
                    direction={breakdownDirection}
                    onDirectionChange={setBreakdownDirection}
                    currency={currency}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {selectedMember && (
        <TransactionForm
          isOpen={isFormOpen}
          memberName={selectedMember.name}
          currency={currency}
          existing={editing}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

export default MemberDetailLayout;
