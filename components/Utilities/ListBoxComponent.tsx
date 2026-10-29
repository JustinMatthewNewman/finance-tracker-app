"use client";

import { useMemo, useState } from "react";
import { ListBox, ListBoxItem, Button, Card, Dropdown } from "@heroui/react";
import { Ellipsis, Pencil, Person } from "@gravity-ui/icons";
import type { Selection } from "react-aria-components";
import type { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { Transaction } from "@/hooks/useTransactions";
import { useSelectedFamilyMember } from "@/context/SelectedFamilyMemberContext";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor } from "@/lib/entityColor";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
} from "@/lib/money";
import { ledgerTotals } from "@/lib/ledgerTotals";
import type { DateRange } from "@/lib/monthRange";
import { NewFamilyMemberDialog } from "./NewFamilyMemberDialog";
import { RenameFamilyMemberDialog } from "./RenameFamilyMemberDialog";
import { DeleteFamilyMemberDialog } from "./DeleteFamilyMemberDialog";
import { usePrivacyMode } from "@/context/PrivacyModeContext";

// Accepts useFamilyMembers()'s result as props rather than calling the hook
// itself — the page also needs the selected member for its header, and
// useFamilyMembers holds its state in a plain useState, not a shared context,
// so two independent calls would each have their own copy and go stale
// relative to each other (a member created here would never show up in the
// parent's copy). `transactions` is similarly the page's own
// useMyTransactions() call, reused here purely to compute per-member totals;
// that hook is read-only and therefore safe to call from two places.
type FamilyMemberListBoxProps = Pick<
  ReturnType<typeof useFamilyMembers>,
  "familyMembers" | "loading" | "error" | "createFamilyMember" | "renameFamilyMember" | "deleteFamilyMember"
> & {
  transactions: Transaction[];
  /** The month the detail panel is showing, so the sidebar totals agree with it. */
  range: DateRange;
  currency?: CurrencyCode;
};

export function FamilyMemberListBox({
  familyMembers,
  loading,
  error,
  createFamilyMember,
  renameFamilyMember,
  deleteFamilyMember,
  transactions,
  range,
  currency = DEFAULT_CURRENCY,
}: FamilyMemberListBoxProps) {
  // Amounts go through formatAmount rather than formatMoney, so privacy
  // mode covers them. A figure that bypassed it would stay legible with the
  // toggle on, and a screen that hides most of its numbers is worse than one
  // that hides none — the person believes they are covered.
  const { formatAmountCompact } = usePrivacyMode();

  const { selectedFamilyMemberId, setSelectedFamilyMemberId } = useSelectedFamilyMember();
  const { bordersEnabled } = useBorders();
  const { categoryColorsEnabled } = useCategoryColorsSetting();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Per-member net for the visible month, from the page's already-fetched
  // transactions — avoids an N+1 fetch just for a sidebar subtotal.
  //
  // Filtered to the same range the detail panel shows, deliberately: a
  // sidebar figure that silently covers all time while the panel beside it
  // shows one month is the kind of mismatch nobody notices and everybody
  // eventually misreads. String comparison works directly here because
  // "yyyy-mm-dd" sorts lexicographically the same way it sorts
  // chronologically — no Date parsing, and so no timezone shift.
  const statsByMember = useMemo(() => {
    const inRange = transactions.filter(
      (t) => t.occurredOn >= range.startDate && t.occurredOn <= range.endDate
    );
    const grouped = new Map<string, Transaction[]>();
    for (const txn of inRange) {
      const bucket = grouped.get(txn.familyMemberId);
      if (bucket) bucket.push(txn);
      else grouped.set(txn.familyMemberId, [txn]);
    }
    const stats = new Map<string, { netMinor: number; count: number }>();
    for (const [memberId, rows] of grouped) {
      // ledgerTotals, not sumTotals. The two answer different questions and the
      // difference is projections: sumTotals reads only amount and direction, so
      // it folds an expected paycheque into the same figure as a received one,
      // while every panel figure in the app is actuals-only. That put a number
      // in this sidebar that disagreed with the one in the panel beside it for
      // any member with a projection — invisible until the household view put a
      // combined total directly next to the combined row.
      //
      // `rows` arrive already filtered for hidden transfers, so the default
      // options are right here: there is nothing left for it to exclude.
      stats.set(memberId, { netMinor: ledgerTotals(rows).netMinor, count: rows.length });
    }
    return stats;
  }, [transactions, range.startDate, range.endDate]);

  // Lifetime count, not the filtered one — this backs the delete dialog's
  // "their N transactions stay in the record" line, which is about everything
  // that would be hidden, not just this month's.
  const lifetimeCountByMember = useMemo(() => {
    const counts = new Map<string, number>();
    for (const txn of transactions) {
      counts.set(txn.familyMemberId, (counts.get(txn.familyMemberId) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const selectedItem = familyMembers.find((m) => m.id === selectedFamilyMemberId) ?? null;

  /**
   * What the listbox is told is selected — a set, empty for the combined view.
   *
   * An empty selection is a legitimate state for a listbox, which is exactly why
   * this is one and not a tab list. ARIA requires a tablist to always have a
   * selected tab, and react-aria enforces it in two places that quietly defeated
   * the toggle: useTabListState re-selects the first tab whenever the selection
   * comes up empty, and it wraps onSelectionChange so a null key is never
   * reported at all. So deselecting could not be observed, and whatever did get
   * through raced the component putting the tab back — which is what made
   * clicking feel unreliable rather than simply not work.
   */
  const selectedKeys = useMemo(
    () => (selectedFamilyMemberId ? new Set([selectedFamilyMemberId]) : new Set<string>()),
    [selectedFamilyMemberId]
  );

  /**
   * Clicking the selected person clears the selection, and the panel combines
   * everybody.
   *
   * No interception of any kind: react-aria does the toggle itself for a
   * single-selection list that permits an empty selection, so this just reports
   * whichever of the two states came out. That also means it works from the
   * keyboard — Enter or Space on the focused row selects it, and again clears
   * it — which a click handler bolted onto a tab never could.
   */
  const handleSelectionChange = (keys: Selection) => {
    // "all" cannot occur in single-selection mode, but the type admits it and
    // String(...) on a Set would silently produce nonsense.
    if (keys === "all") return;
    const [first] = keys;
    setSelectedFamilyMemberId(first != null ? String(first) : null);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading household...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between px-1 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Household</h3>
        <span className="text-xs font-medium text-foreground/60">
          {familyMembers.length} {familyMembers.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        {familyMembers.length === 0 ? (
          <p className="p-4 text-sm text-foreground/60">
            Setting up your household…
          </p>
        ) : (
          <ListBox
            aria-label="Household members"
            // SINGLE SELECTION, AND EMPTY SELECTION ALLOWED — which together are
            // the whole feature. react-aria deselects an already-selected item in
            // a single-selection list for free (SelectionManager.select: if it is
            // already selected and empty selection is permitted, it toggles), so
            // clicking the selected person clears it and the panel shows the
            // combined view. `disallowEmptySelection` is deliberately NOT set.
            selectionMode="single"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            className={`h-full w-full min-h-0 overflow-y-auto rounded-2xl p-1.5 bg-surface outline-none ${
              bordersEnabled ? "border border-default-200" : ""
            }`}
            data-glass="surface"
          >
            {familyMembers.map((member) => {
              const stats = statsByMember.get(member.id);
              const netMinor = stats?.netMinor ?? 0;
              const dotColor = effectiveColor(member.color, member.name);
              return (
                <ListBoxItem
                  key={member.id}
                  id={member.id}
                  // Typeahead reads this rather than trying to flatten the markup
                  // below into a string; without it react-aria warns on every
                  // item whose children are not plain text.
                  textValue={member.name}
                  className="h-auto w-full min-w-0 cursor-pointer justify-start rounded-xl px-3 py-2.5 text-left text-foreground/60 outline-none transition-all hover:bg-default-100/50 data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-accent data-[selected=true]:bg-accent-soft data-[selected=true]:font-semibold data-[selected=true]:text-foreground"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {categoryColorsEnabled && dotColor && (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                        aria-hidden
                      />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {member.name}
                        {/* The account's own entry. Worth marking: in a
                            household where several people sign in, every
                            one of them appears here, and "which of these
                            is me" is otherwise a guess from the name. */}
                        {member.isSelf && (
                          <span className="ml-1.5 text-xs font-normal text-foreground/50">
                            you
                          </span>
                        )}
                      </span>
                      <span className="truncate text-sm text-gray-500">
                        {/* The DERIVED label, not the stored column: every
                            account's own row is written with "Self", so two
                            accounts in one household both claimed it. See
                            lib/householdRole.ts. */}
                        {member.relationshipLabel ?? "—"}
                      </span>
                    </div>
                    {/* Sign is carried by an explicit +/− and by color,
                        not by color alone — a red number reads as
                        "negative" only if you can see red. */}
                    <span
                      className={`shrink-0 text-xs tabular-nums ${
                        netMinor > 0
                          ? "text-success"
                          : netMinor < 0
                            ? "text-danger"
                            : "text-foreground/40"
                      }`}
                    >
                      {netMinor > 0 ? "+" : netMinor < 0 ? "−" : ""}
                      {formatAmountCompact(Math.abs(netMinor), currency)}
                    </span>
                  </div>
                </ListBoxItem>
              );
            })}
          </ListBox>
        )}
      </div>

      <Card className="flex shrink-0 flex-col gap-3 p-3">
        <div className="flex gap-2">
          <Button aria-label="Add family member" onPress={() => setIsDialogOpen(true)}>
            <Person width={16} height={16} />
          </Button>

          {/* Editing is gated on ownership, not just on selection. The
              sidebar now lists people whose records belong to a housemate —
              reads widened to the household, writes did not — and
              RenameFamilyMember/DeleteFamilyMember would reject those at the
              `@check`. Offering an enabled button that is guaranteed to fail
              turns a deliberate boundary into what looks like a bug. */}
          <Button
            aria-label="Rename family member"
            isDisabled={!selectedItem?.isMine}
            onPress={() => setIsRenameDialogOpen(true)}
          >
            <Pencil width={16} height={16} />
          </Button>

          <Dropdown>
            {/* Disabled for your own entry as well as for a housemate's:
                DeleteFamilyMember refuses to soft-delete a row with selfUser
                set, so offering it would fail at the @check. */}
            <Dropdown.Trigger
              aria-label="Family member actions"
              isDisabled={!selectedItem?.isMine || selectedItem.isSelf}
            >
              <Ellipsis width={16} height={16} />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "delete") setIsDeleteDialogOpen(true);
                }}
              >
                <Dropdown.Item id="delete">Remove from household</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {/* Says why the controls above are greyed out. Without it the only
            signal is a disabled button, which reads as broken rather than as
            "this is somebody else's record". */}
        {selectedItem?.isSelf && (
          <p className="text-xs text-foreground/60">
            This is you. You can rename yourself, but you can&apos;t remove
            yourself from your own household.
          </p>
        )}

        {selectedItem && !selectedItem.isMine && (
          <p className="text-xs text-foreground/60">
            {selectedItem.name} was added by {selectedItem.ownerUsername}. You can see their
            transactions, but only {selectedItem.ownerUsername} can change them.
          </p>
        )}
      </Card>

      <NewFamilyMemberDialog
        isOpen={isDialogOpen}
        currency={currency}
        onClose={() => setIsDialogOpen(false)}
        onCreate={async (data) => {
          const { familyMemberId } = await createFamilyMember(data);
          setSelectedFamilyMemberId(familyMemberId);
        }}
      />

      {selectedItem && (
        <RenameFamilyMemberDialog
          isOpen={isRenameDialogOpen}
          initialName={selectedItem.name}
          onClose={() => setIsRenameDialogOpen(false)}
          onRename={(name) => renameFamilyMember(selectedItem.id, name)}
        />
      )}

      {selectedItem && (
        <DeleteFamilyMemberDialog
          isOpen={isDeleteDialogOpen}
          memberName={selectedItem.name}
          transactionCount={lifetimeCountByMember.get(selectedItem.id) ?? 0}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDelete={async () => {
            await deleteFamilyMember(selectedItem.id);
            setSelectedFamilyMemberId(null);
          }}
        />
      )}
    </div>
  );
}

export default FamilyMemberListBox;
