"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Kbd, SearchField } from "@heroui/react";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { useSelectedFamilyMember } from "@/context/SelectedFamilyMemberContext";
import { useUserSettings } from "@/context/UserSettingsContext";
import { fuzzyMatch, splitByMatch } from "@/lib/fuzzyMatch";
import { formatMoney, isCurrencyCode, DEFAULT_CURRENCY } from "@/lib/money";
import { fromDateString } from "@/lib/monthRange";

// No real store to subscribe to — the platform never changes mid-session —
// so this only exists to give useSyncExternalStore a distinct snapshot for
// server (assume Mac) vs client.
const noopSubscribe = () => () => {};
const getIsMacSnapshot = () => /mac/i.test(navigator.platform);
const getIsMacServerSnapshot = () => true;

type SearchResult =
  | {
      type: "familyMember";
      score: number;
      familyMemberId: string;
      name: string;
      relationship: string | null;
      nameIndices: number[];
    }
  | {
      type: "transaction";
      score: number;
      transactionId: string;
      familyMemberId: string;
      familyMemberName: string;
      label: string;
      amountMinor: number;
      direction: string;
      occurredOn: string;
      labelIndices: number[];
    };

const MAX_RESULTS = 8;

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  return (
    <>
      {splitByMatch(text, indices).map((run, i) =>
        run.matched ? (
          <span key={i} className="font-semibold text-accent">
            {run.text}
          </span>
        ) : (
          <span key={i}>{run.text}</span>
        )
      )}
    </>
  );
}

// VSCode-style "go to anything": type to fuzzy-match family members and
// transaction descriptions across the whole household, arrow/enter to jump to
// a result. Picking a transaction also flags it for the detail panel to
// auto-expand and scroll to (see
// SelectedFamilyMemberContext.focusTransactionId).
export function GlobalSearch() {
  const router = useRouter();
  const { familyMembers, transactions, refresh } = useSearchIndex();
  const { setSelectedFamilyMemberId, setFocusTransactionId } = useSelectedFamilyMember();
  const { currencyCode } = useUserSettings();
  const currency = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = useSyncExternalStore(noopSubscribe, getIsMacSnapshot, getIsMacServerSnapshot);

  // Global ⌘K / Ctrl+K shortcut, matching the hint shown in the search bar.
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const memberResults: SearchResult[] = [];
    for (const member of familyMembers) {
      const match = fuzzyMatch(query, member.name);
      if (match) {
        memberResults.push({
          type: "familyMember",
          score: match.score,
          familyMemberId: member.id,
          name: member.name,
          relationship: member.relationship,
          nameIndices: match.indices,
        });
      }
    }

    const transactionResults: SearchResult[] = [];
    for (const txn of transactions) {
      // Merchant, description and category are three ways people remember the
      // same purchase ("Safeway", "weekly shop", "Groceries"), so all three
      // are searched. Matched as one joined string rather than three separate
      // passes, so a query spanning two of them ("safeway groc") still hits
      // and the highlight indices line up with what's rendered.
      const label = [txn.merchant, txn.description, txn.category?.name]
        .filter(Boolean)
        .join(" · ");
      if (!label) continue;

      const match = fuzzyMatch(query, label);
      if (match) {
        transactionResults.push({
          type: "transaction",
          score: match.score,
          transactionId: txn.id,
          familyMemberId: txn.familyMemberId,
          familyMemberName: txn.familyMemberName,
          label,
          amountMinor: txn.amountMinor,
          direction: txn.direction,
          occurredOn: txn.occurredOn,
          labelIndices: match.indices,
        });
      }
    }

    return [...memberResults, ...transactionResults]
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_RESULTS);
  }, [query, familyMembers, transactions]);

  // Reset the highlighted result whenever the query changes — done during
  // render rather than in an effect, to avoid an extra render pass.
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectResult = (result: SearchResult) => {
    setSelectedFamilyMemberId(result.familyMemberId);
    setFocusTransactionId(result.type === "transaction" ? result.transactionId : null);
    router.push("/household");
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <SearchField
        name="search"
        aria-label="Search"
        value={query}
        onChange={(value) => {
          setQuery(value);
          setIsOpen(true);
        }}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            ref={inputRef}
            className="w-[280px]"
            placeholder="Search people and transactions..."
            onFocus={() => {
              refresh();
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <SearchField.ClearButton />
          ) : (
            <Kbd className="mr-1 shrink-0">
              <Kbd.Abbr keyValue={isMac ? "command" : "ctrl"} />K
            </Kbd>
          )}
        </SearchField.Group>
      </SearchField>

      {isOpen && query.trim() && (
        <div
          data-slot="global-search-popover"
          className="absolute left-0 top-full z-50 mt-2 max-h-96 w-[420px] overflow-y-auto rounded-lg border border-border bg-overlay p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <div className="p-3 text-sm text-foreground/60">No matches for &quot;{query}&quot;</div>
          ) : (
            results.map((result, index) => (
              <button
                key={
                  result.type === "familyMember"
                    ? `fm-${result.familyMemberId}`
                    : `tx-${result.transactionId}`
                }
                type="button"
                onClick={() => selectResult(result)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm ${
                  index === activeIndex ? "bg-default" : ""
                }`}
              >
                {result.type === "familyMember" ? (
                  <>
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                      {result.relationship ?? "Household"}
                    </span>
                    <span className="text-foreground">
                      <Highlighted text={result.name} indices={result.nameIndices} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                        {result.familyMemberName} ·{" "}
                        {fromDateString(result.occurredOn).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span
                        className={`text-xs tabular-nums ${
                          result.direction === "INCOME" ? "text-success" : "text-foreground/70"
                        }`}
                      >
                        {result.direction === "INCOME" ? "+" : "−"}
                        {formatMoney(result.amountMinor, currency)}
                      </span>
                    </span>
                    <span className="line-clamp-1 text-foreground">
                      <Highlighted text={result.label} indices={result.labelIndices} />
                    </span>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
