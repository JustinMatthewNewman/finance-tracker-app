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
  formatMoney,
  isCurrencyCode,
  sumTotals,
} from "@/lib/money";
import {
  addMonths,
  currentMonthKey,
  monthLabel,
  monthRange,
  relativeMonthLabel,
} from "@/lib/monthRange";
import { TransactionTable } from "./TransactionTable";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { TransactionForm } from "./TransactionForm";

interface MemberDetailLayoutProps {
  showBreakdown?: boolean;
  onToggleBreakdown?: (showBreakdown: boolean) => void;
}

function MemberDetailLayout({ showBreakdown = false, onToggleBreakdown }: MemberDetailLayoutProps) {
  const { isOpen, toggle: toggleSidebar } = useSidebar();
  const { bordersEnabled } = useBorders();
  const { selectedFamilyMemberId, setSelectedFamilyMemberId, focusTransactionId, setFocusTransactionId } =
    useSelectedFamilyMember();
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
  } = useFamilyMembers();

  const { transactions: allTransactions, refetch: refetchAll } = useMyTransactions();
  const {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(selectedFamilyMemberId);

  const selectedMember = familyMembers.find((m) => m.id === selectedFamilyMemberId) ?? null;

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

  // Select the first member automatically once the roster loads, so the panel
  // isn't empty on a fresh page load with nothing chosen. Only when nothing is
  // selected — never overriding a choice the user (or the search bar) made.
  useEffect(() => {
    if (selectedFamilyMemberId || familyMembers.length === 0) return;
    setSelectedFamilyMemberId(familyMembers[0].id);
  }, [familyMembers, selectedFamilyMemberId, setSelectedFamilyMemberId]);

  const visible = useMemo(
    () => transactions.filter((t) => t.occurredOn >= range.startDate && t.occurredOn <= range.endDate),
    [transactions, range.startDate, range.endDate]
  );

  const totals = useMemo(() => sumTotals(visible), [visible]);

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
    const target = transactions.find((t) => t.id === focusTransactionId);
    if (!target) return; // not this member's, or still loading

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
  }, [focusTransactionId, transactions, setFocusTransactionId]);

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
            transactions={allTransactions}
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
                    {selectedMember?.name ?? "No one selected"}
                  </h2>
                  {selectedMember?.relationship && (
                    <span className="shrink-0 rounded-full bg-default px-2 py-0.5 text-xs text-foreground/60">
                      {selectedMember.relationship}
                    </span>
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
                    <span className="text-success">{formatMoney(totals.incomeMinor, currency)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-foreground/50">Out</span>
                    <span className="text-foreground">{formatMoney(totals.expenseMinor, currency)}</span>
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
                      {formatMoney(Math.abs(totals.netMinor), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {!selectedFamilyMemberId ? (
                  <p className="p-6 text-sm text-foreground/60">
                    Pick someone from the household to see their income and expenses.
                  </p>
                ) : loading ? (
                  <p className="p-6 text-sm text-foreground/60">Loading transactions...</p>
                ) : error ? (
                  <p className="p-6 text-sm text-red-500">Error: {error}</p>
                ) : (
                  <TransactionTable
                    transactions={visible}
                    currency={currency}
                    expandedKeys={expandedKeys}
                    onExpandedChange={setExpandedKeys}
                    focusTransactionId={focusTransactionId}
                    onEdit={(txn) => {
                      setEditing(txn);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDelete}
                  />
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
