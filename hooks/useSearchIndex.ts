"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import { useMyTransactions } from "./useMyTransactions";
import { listFamilyMembers } from "@/src/dataconnect-generated";
import type { ListFamilyMembersData, ListFamilyMembersVariables } from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";

export interface SearchFamilyMember {
  id: string;
  name: string;
  relationship: string | null;
}

// Backs the global search bar: family member names (which useMyTransactions
// doesn't cover — a member with zero transactions would otherwise be
// invisible to search) plus every transaction's description, merchant and
// category.
export function useSearchIndex() {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<SearchFamilyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const {
    transactions,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useMyTransactions();

  const refetchMembers = useCallback(async () => {
    if (!user?.uid) {
      setFamilyMembers([]);
      return;
    }
    setMembersLoading(true);
    try {
      const rows = await fetchAllPages<
        ListFamilyMembersVariables,
        ListFamilyMembersData["familyMembers"][number]
      >(
        (vars) =>
          listFamilyMembers(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then(
            (r) => r.data.familyMembers
          ),
        {}
      );
      setFamilyMembers(
        rows.map((row) => ({ id: row.id, name: row.name, relationship: row.relationship ?? null }))
      );
    } finally {
      setMembersLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetchMembers();
  }, [refetchMembers]);

  // Exposed so the search bar can pull a fresh snapshot right as it opens
  // rather than relying on whatever was fetched when this hook first
  // mounted — otherwise a member/transaction created earlier in the same
  // session wouldn't show up in search until a full page reload. Throttled
  // since GlobalSearch calls this on every input focus — without it, clicking
  // in and out of the search box repeatedly re-fires both SERVER_ONLY fetches
  // every time.
  const REFRESH_THROTTLE_MS = 15_000;
  const lastRefreshedAtRef = useRef(0);

  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshedAtRef.current < REFRESH_THROTTLE_MS) return;
    lastRefreshedAtRef.current = now;
    refetchMembers();
    refetchTransactions();
  }, [refetchMembers, refetchTransactions]);

  return {
    familyMembers,
    transactions,
    loading: membersLoading || transactionsLoading,
    refresh,
  };
}
