"use client";

import { useMemo, useState } from "react";
import { Tabs, Button, Card, Label, Dropdown } from "@heroui/react";
import { Ellipsis, Pencil, Person } from "@gravity-ui/icons";
import type { Key } from "react-aria-components";
import type { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { Transaction } from "@/hooks/useTransactions";
import { useSelectedFamilyMember } from "@/context/SelectedFamilyMemberContext";
import { useBorders } from "@/context/BordersContext";
import { useCategoryColorsSetting } from "@/context/CategoryColorsContext";
import { effectiveColor } from "@/lib/entityColor";
import {
  type CurrencyCode,
  DEFAULT_CURRENCY,
  formatMoneyCompact,
  sumTotals,
} from "@/lib/money";
import type { DateRange } from "@/lib/monthRange";
import { NewFamilyMemberDialog } from "./NewFamilyMemberDialog";
import { RenameFamilyMemberDialog } from "./RenameFamilyMemberDialog";
import { DeleteFamilyMemberDialog } from "./DeleteFamilyMemberDialog";

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
      stats.set(memberId, { netMinor: sumTotals(rows).netMinor, count: rows.length });
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

  const handleSelectionChange = (key: Key) => {
    setSelectedFamilyMemberId(key != null ? String(key) : null);
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
            No one here yet. Add the first person to start tracking.
          </p>
        ) : (
          <Tabs
            orientation="vertical"
            className="h-full w-full min-h-0"
            selectedKey={selectedFamilyMemberId ?? undefined}
            onSelectionChange={handleSelectionChange}
          >
            <Tabs.ListContainer className="h-full w-full min-w-0">
              <Tabs.List
                aria-label="Family members"
                className={`h-full w-full min-w-0 overflow-hidden rounded-2xl p-1.5 bg-surface ${
                  bordersEnabled ? "border border-default-200" : ""
                }`}
                data-glass="surface"
              >
                {familyMembers.map((member) => {
                  const stats = statsByMember.get(member.id);
                  const netMinor = stats?.netMinor ?? 0;
                  const dotColor = effectiveColor(member.color, member.name);
                  return (
                    <Tabs.Tab
                      key={member.id}
                      id={member.id}
                      // No Tabs.Indicator: react-aria's FLIP-animated overlay
                      // measures itself independently of the tab and renders
                      // as a mis-sized blob at the left edge. The selected
                      // fill is painted on the tab itself instead, so it is
                      // always exactly the tab's own box.
                      className="h-auto w-full min-w-0 justify-start rounded-xl px-3 py-2.5 text-left text-foreground/60 transition-all hover:bg-default-100/50 data-[selected=true]:bg-accent-soft data-[selected=true]:text-foreground data-[selected=true]:font-semibold"
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
                          <Label className="truncate font-medium">{member.name}</Label>
                          <span className="truncate text-sm text-gray-500">
                            {member.relationship ?? "—"}
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
                          {formatMoneyCompact(Math.abs(netMinor), currency)}
                        </span>
                      </div>
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panels stay empty and the active section renders in the page —
                Tabs is used purely as a selector here. */}
            {familyMembers.map((member) => (
              <Tabs.Panel key={member.id} id={member.id} className="hidden">
                {null}
              </Tabs.Panel>
            ))}
          </Tabs>
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
            <Dropdown.Trigger aria-label="Family member actions" isDisabled={!selectedItem?.isMine}>
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
