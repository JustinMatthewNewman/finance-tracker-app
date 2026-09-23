"use client";

import { useCallback, useEffect, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "./useAuth";
import {
  useGetMyUser,
  useCreateFamilyMember,
  useRenameFamilyMember,
  useUpdateFamilyMember,
  useDeleteFamilyMember,
} from "@/src/dataconnect-generated/react";
import { listFamilyMembers } from "@/src/dataconnect-generated";
import type {
  ListFamilyMembersData,
  ListFamilyMembersVariables,
  CreateFamilyMemberVariables,
  RenameFamilyMemberVariables,
  UpdateFamilyMemberVariables,
  DeleteFamilyMemberVariables,
} from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { normalizeHexColor } from "@/lib/entityColor";

export interface FamilyMemberData {
  id: string;
  name: string;
  relationship: string | null;
  color: string | null;
  externalAccountRef: string | null;
  monthlyIncomeTargetMinor: number | null;
  createdAt: string;
  /** The account that created this person's record. */
  ownerUserId: string;
  ownerUsername: string;
  /**
   * Whether the signed-in account may edit this row.
   *
   * Reads widened to the household and writes did not (see the visibility
   * note at the top of queries.gql), so the sidebar now lists people whose
   * records belong to a housemate. Those are read-only, and the UI has to
   * know it: a rename button that is always enabled would fail at the
   * `@check` in RenameFamilyMember, and the person would get an
   * authorization error for pressing a button the app offered them.
   */
  isMine: boolean;
}

function toFamilyMemberData(
  rows: ListFamilyMembersData["familyMembers"],
  myUserId: string | undefined
): FamilyMemberData[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    relationship: row.relationship ?? null,
    color: normalizeHexColor(row.color),
    externalAccountRef: row.externalAccountRef ?? null,
    monthlyIncomeTargetMinor: row.monthlyIncomeTargetMinor ?? null,
    createdAt: row.createdAt,
    ownerUserId: row.user.id,
    ownerUsername: row.user.username,
    // Both ids come from a database read, so both have their hyphens
    // stripped and compare directly. Defaults to false while the caller's
    // own id is still loading: treating an unknown owner as "mine" would
    // flash editable controls onto somebody else's row.
    isMine: !!myUserId && row.user.id === myUserId,
  }));
}

/**
 * The household roster behind the finance page's sidebar.
 *
 * CALL THIS ONCE PER PAGE and pass the result down. State lives in a plain
 * useState here rather than a shared context, so two independent calls each
 * get their own copy and go stale relative to each other — a member created
 * in the sidebar would never appear in a parent's list. The sidebar takes
 * these as props for exactly that reason (see FamilyMemberListBox).
 */
export function useFamilyMembers() {
  const { user } = useAuth();

  const myUserQuery = useGetMyUser({ enabled: !!user?.uid });
  const createMutation = useCreateFamilyMember();
  const renameMutation = useRenameFamilyMember();
  const updateMutation = useUpdateFamilyMember();
  const deleteMutation = useDeleteFamilyMember();

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data Connect's generated React query hooks default to a "prefer cache"
  // fetch policy that mutations never invalidate, so a plain refetch() from
  // useListFamilyMembers can return a stale list forever after a
  // create/rename/delete. SERVER_ONLY guarantees the sidebar reflects the
  // latest state.
  // Read once here rather than inside refetch's body, so the callback's
  // dependency list can name it: the ownership flags are wrong until the
  // caller's own id has loaded, and the list has to be rebuilt when it does.
  const myUserId = myUserQuery.data?.user?.id;

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setFamilyMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
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
      setFamilyMembers(toFamilyMemberData(rows, myUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family members");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, myUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const createFamilyMember = useCallback(
    async (data: {
      name: string;
      relationship?: string | null;
      color?: string | null;
      monthlyIncomeTargetMinor?: number | null;
    }) => {
      if (!myUserId) throw new Error("User profile not found");

      const familyMemberId = crypto.randomUUID();

      await createMutation.mutateAsync({
        userId: myUserId,
        familyMemberId,
        name: data.name,
        relationship: data.relationship || undefined,
        color: data.color || undefined,
        monthlyIncomeTargetMinor: data.monthlyIncomeTargetMinor ?? undefined,
      } as CreateFamilyMemberVariables);

      await refetch();

      // Data Connect always returns UUIDs with hyphens stripped, but
      // crypto.randomUUID() produces the hyphenated form. Returning the raw
      // client id here means callers who use it to select the new row never
      // find a match against familyMembers[].id, so the new member silently
      // never appears selected.
      return { familyMemberId: familyMemberId.replace(/-/g, "") };
    },
    [myUserId, createMutation, refetch]
  );

  const renameFamilyMember = useCallback(
    async (familyMemberId: string, name: string) => {
      await renameMutation.mutateAsync({ familyMemberId, name } as RenameFamilyMemberVariables);
      await refetch();
    },
    [renameMutation, refetch]
  );

  const updateFamilyMember = useCallback(
    async (
      familyMemberId: string,
      data: {
        name: string;
        relationship?: string | null;
        color?: string | null;
        externalAccountRef?: string | null;
        monthlyIncomeTargetMinor?: number | null;
      }
    ) => {
      await updateMutation.mutateAsync({
        familyMemberId,
        name: data.name,
        relationship: data.relationship ?? null,
        color: data.color ?? null,
        externalAccountRef: data.externalAccountRef ?? null,
        monthlyIncomeTargetMinor: data.monthlyIncomeTargetMinor ?? null,
      } as UpdateFamilyMemberVariables);
      await refetch();
    },
    [updateMutation, refetch]
  );

  // Soft delete (see DeleteFamilyMember in mutations.gql) — the person
  // disappears from the sidebar but their transaction history survives.
  const deleteFamilyMember = useCallback(
    async (familyMemberId: string) => {
      await deleteMutation.mutateAsync({ familyMemberId } as DeleteFamilyMemberVariables);
      await refetch();
    },
    [deleteMutation, refetch]
  );

  return {
    familyMembers,
    loading,
    error,
    refetch,
    createFamilyMember,
    renameFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    /** The caller's database row id, which transactions must be written with. */
    myUserId,
  };
}
