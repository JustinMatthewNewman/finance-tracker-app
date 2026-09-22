"use client";

import { useState } from "react";
import { Card, Button } from "@heroui/react";
import { COLOR_PRESETS } from "@/lib/entityColor";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  parseAmountToMinor,
} from "@/lib/money";

interface NewFamilyMemberDialogProps {
  isOpen: boolean;
  currency?: CurrencyCode;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    relationship?: string | null;
    color?: string | null;
    monthlyIncomeTargetMinor?: number | null;
  }) => Promise<void>;
}

// Suggestions, not a fixed list — the field stays free text. A household that
// doesn't fit these (a roommate, a grandparent, a trust) must still be able
// to say so, which an enum would prevent.
const RELATIONSHIP_SUGGESTIONS = ["Self", "Spouse", "Partner", "Child", "Parent", "Other"];

export function NewFamilyMemberDialog({
  isOpen,
  currency = DEFAULT_CURRENCY,
  onClose,
  onCreate,
}: NewFamilyMemberDialogProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [incomeTarget, setIncomeTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // An empty target means "not set" (the column is nullable on purpose —
    // see FamilyMember.monthlyIncomeTargetMinor). Only a non-empty value that
    // fails to parse is an error, so leaving the field blank never blocks the
    // form.
    let monthlyIncomeTargetMinor: number | null = null;
    if (incomeTarget.trim()) {
      const parsed = parseAmountToMinor(incomeTarget, currency);
      if (parsed === null) {
        setError("Monthly income target isn't a valid amount.");
        return;
      }
      monthlyIncomeTargetMinor = parsed;
    }

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        relationship: relationship.trim() || null,
        color,
        monthlyIncomeTargetMinor,
      });
      setName("");
      setRelationship("");
      setColor(null);
      setIncomeTarget("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add family member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add Family Member</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-semibold block mb-2">Name *</label>
              <input
                type="text"
                placeholder="Who are you tracking?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Relationship</label>
              <input
                type="text"
                list="relationship-suggestions"
                placeholder="Spouse, Child, Self..."
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg"
                disabled={loading}
              />
              <datalist id="relationship-suggestions">
                {RELATIONSHIP_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">
                Monthly income target
                <span className="ml-1 font-normal text-foreground/50">(optional)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                className="w-full px-3 py-2 border border-default-200 rounded-lg tabular-nums"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-foreground/50">
                Leave blank to skip — attainment is only shown once a target exists.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {/* "Auto" is a real choice, not an absence of one: leaving
                    color null makes entityColor.ts derive a stable hue from
                    the name, so the member is still colored consistently
                    everywhere. */}
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  aria-label="Automatic color"
                  aria-pressed={color === null}
                  className={`h-7 rounded-full border px-3 text-xs transition ${
                    color === null ? "border-accent text-foreground" : "border-border text-foreground/60"
                  }`}
                  disabled={loading}
                >
                  Auto
                </button>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    aria-label={preset.name}
                    aria-pressed={color === preset.hex}
                    className={`size-7 rounded-full border-2 transition ${
                      color === preset.hex ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} isDisabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isDisabled={loading || !name.trim()}>
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default NewFamilyMemberDialog;
