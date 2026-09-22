"use client";

import { useState } from "react";
import { Card, Button } from "@heroui/react";

interface DeleteFamilyMemberDialogProps {
  isOpen: boolean;
  memberName: string;
  transactionCount: number;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function DeleteFamilyMemberDialog({
  isOpen,
  memberName,
  transactionCount,
  onClose,
  onDelete,
}: DeleteFamilyMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove family member");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Remove Family Member</h2>

          {/* Deliberately says "removed from the sidebar", not "deleted": this
              is a soft delete (see DeleteFamilyMember in mutations.gql), so
              promising permanent deletion here would be a lie, and warning
              that history will be destroyed would scare people off an action
              that is in fact reversible. */}
          <p className="text-sm text-gray-600">
            Remove <span className="font-semibold">{memberName}</span> from the household?
            {transactionCount > 0 && (
              <>
                {" "}
                Their {transactionCount} transaction{transactionCount === 1 ? "" : "s"} stay in the
                record and still count toward household totals — they just won&apos;t appear in the
                sidebar.
              </>
            )}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="danger" className="flex-1" onClick={handleDelete} isDisabled={loading}>
              {loading ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DeleteFamilyMemberDialog;
