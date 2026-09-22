"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { useAuth } from "@/hooks/useAuth";
import { listCategories, upsertCategory, updateCategory } from "@/src/dataconnect-generated";
import type {
  UpsertCategoryVariables,
  UpdateCategoryVariables,
  ListCategoriesData,
  ListCategoriesVariables,
} from "@/src/dataconnect-generated";
import { fetchAllPages } from "@/lib/dataconnectPagination";
import { normalizeHexColor } from "@/lib/entityColor";
import { type Direction, normalizeDirection } from "@/lib/money";

export interface Category {
  id: string;
  /** The table's key. Unique, and what transactions reference. */
  name: string;
  kind: Direction;
  parentGroup: string | null;
  /** Canonical "#rrggbb", or null when no color has been chosen. */
  color: string | null;
}

export interface UpsertCategoryInput {
  name: string;
  kind?: Direction;
  parentGroup?: string | null;
  color?: string | null;
}

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  /** Lookup by name — the key transactions carry. */
  byName: Map<string, Category>;
  saveCategory: (data: UpsertCategoryInput) => Promise<Category>;
  updateCategoryDetails: (data: UpsertCategoryInput & { kind: Direction }) => Promise<Category>;
  ensureCategoriesExist: (names: string[]) => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextType | null>(null);

function normalizeCategory(row: ListCategoriesData["categories"][number]): Category {
  return {
    id: row.id,
    name: row.name,
    kind: normalizeDirection(row.kind),
    parentGroup: row.parentGroup ?? null,
    // Normalized at the boundary, so nothing downstream can hand an unvetted
    // string to a CSS color-mix() — see lib/entityColor.ts.
    color: normalizeHexColor(row.color),
  };
}

// Shared across every category picker instance (one per transaction row, and
// there can be many rows) so that creating or editing a category in one place
// is immediately visible everywhere else referencing it, rather than each
// component holding its own stale copy of the list. Same multi-instance-state
// pitfall as ThemeSelectionContext and useFamilyMembers.
export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setCategories([]);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllPages<ListCategoriesVariables, ListCategoriesData["categories"][number]>(
        (vars) => listCategories(vars, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }).then((r) => r.data.categories),
        {}
      );
      const normalized = rows.map(normalizeCategory);
      setCategories(normalized);
      return normalized;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const byName = useMemo(() => new Map(categories.map((c) => [c.name, c])), [categories]);

  // category_upsert/category_update only return Category_Key (name — the
  // table's actual key), not id, so the saved row's id has to come from
  // re-fetching the list rather than the mutation result itself.
  const saveCategory = useCallback(
    async (data: UpsertCategoryInput) => {
      await upsertCategory({
        name: data.name,
        kind: data.kind,
        parentGroup: data.parentGroup,
        color: data.color,
      } as UpsertCategoryVariables);
      const fresh = await refetch();
      const saved = fresh.find((c) => c.name === data.name);
      if (!saved) throw new Error("Category was saved but could not be found afterward");
      return saved;
    },
    [refetch]
  );

  const updateCategoryDetails = useCallback(
    async (data: UpsertCategoryInput & { kind: Direction }) => {
      await updateCategory({
        name: data.name,
        kind: data.kind,
        parentGroup: data.parentGroup,
        color: data.color,
      } as UpdateCategoryVariables);
      const fresh = await refetch();
      const saved = fresh.find((c) => c.name === data.name);
      if (!saved) throw new Error("Category was saved but could not be found afterward");
      return saved;
    },
    [refetch]
  );

  // Guarantees a Category row exists for every referenced name, without
  // touching kind/color on any that already exist. Only the name is ever sent
  // for a genuinely new row, so an existing category's hand-picked color can
  // never be clobbered by someone typing its name into the transaction form.
  const ensureCategoriesExist = useCallback(
    async (names: string[]) => {
      const distinct = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
      if (distinct.length === 0) return;

      const current = await refetch();
      const known = new Set(current.map((c) => c.name));
      const missing = distinct.filter((n) => !known.has(n));
      if (missing.length === 0) return;

      await Promise.all(missing.map((name) => upsertCategory({ name } as UpsertCategoryVariables)));
      await refetch();
    },
    [refetch]
  );

  return (
    <CategoriesContext.Provider
      value={{ categories, loading, error, byName, saveCategory, updateCategoryDetails, ensureCategoriesExist }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return ctx;
}
