"use client";

import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { Persons, CircleCheck, CircleXmark, ArrowsRotateLeft } from "@gravity-ui/icons";
import { useFamily } from "@/hooks/useFamily";
import { InviteCodeBlock } from "@/components/Onboarding/OnboardingFlow";

/**
 * The household's roster, its invite code, and — for the primary user — the
 * queue of people asking to join.
 *
 * This is where a household is actually run from, and it is in Settings
 * rather than on a page of its own for a reason worth stating: it is
 * administration, done rarely, by one person. A nav tab for it would sit
 * there permanently advertising a job that most members of the household can
 * never do.
 *
 * Calls useFamily() once and passes nothing down — same rule as
 * useFamilyMembers, and for the same reason.
 */
export default function FamilyPanel() {
  const { family, myUserId, isOwner, loading, error, refetch, approve, deny, leave, rotateInviteCode } =
    useFamily();

  // Keyed by requester id so two rows cannot both claim the spinner — with a
  // single boolean, approving one person greys out every button in the list.
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const run = async (key: string, action: () => Promise<unknown>) => {
    setActingOn(key);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setActingOn(null);
    }
  };

  if (loading && !family) {
    return (
      <Card className="p-6">
        <SectionHeading />
        <p className="text-sm text-foreground/60">Loading your household…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <SectionHeading />
        <p className="mb-3 text-sm text-danger">{error}</p>
        <Button size="sm" onPress={() => void refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  // Reachable by someone who left their household in another tab — the
  // OnboardingGate will move them, but this should not render as a crash in
  // the meantime.
  if (!family) {
    return (
      <Card className="p-6">
        <SectionHeading />
        <p className="text-sm text-foreground/60">You&apos;re not in a household yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <SectionHeading />

      <div className="mb-4 rounded-lg bg-default-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Household</p>
        <p className="mt-1 text-sm text-foreground">{family.name}</p>
      </div>

      {/* Shown to every member, not just the owner: anybody in the household
          can hand the code to somebody they want in it. The owner still
          decides who actually gets in, which is where the control belongs —
          gatekeeping the code as well would mean the one person who can
          approve is also the only one who can invite. */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
          Invite code
        </p>
        <InviteCodeBlock code={family.inviteCode} />
        {isOwner && (
          <>
            <p className="mt-2 text-xs text-foreground/60">
              Anyone with this code can ask to join — you still approve them. Replace it if it ends
              up somewhere it shouldn&apos;t.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              isDisabled={rotating}
              onPress={() =>
                void (async () => {
                  setRotating(true);
                  setActionError(null);
                  try {
                    await rotateInviteCode();
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : "Could not change the code.");
                  } finally {
                    setRotating(false);
                  }
                })()
              }
            >
              <ArrowsRotateLeft width={14} height={14} />
              {rotating ? "Changing…" : "Change code"}
            </Button>
          </>
        )}
      </div>

      {actionError && <p className="mb-3 text-sm text-danger">{actionError}</p>}

      {/* Pending requests. The list is visible to every member; the buttons
          are the owner's. That split mirrors the guard exactly — a non-owner
          who forced the button would be refused by ApproveJoinRequest's
          @check, so hiding it is honesty about what will work, not the
          control itself. */}
      {family.pendingRequests.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            {isOwner ? "Waiting for your approval" : "Waiting for approval"}
          </p>
          <ul className="space-y-2">
            {family.pendingRequests.map((req) => (
              <li
                key={req.requesterId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-default-100 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{req.username}</p>
                  {req.email && (
                    <p className="truncate text-xs text-foreground/60">{req.email}</p>
                  )}
                </div>
                {isOwner ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isDisabled={actingOn !== null}
                      onPress={() => void run(req.requesterId, () => approve(req.requesterId))}
                    >
                      <CircleCheck width={14} height={14} />
                      {actingOn === req.requesterId ? "Working…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={actingOn !== null}
                      onPress={() => void run(req.requesterId, () => deny(req.requesterId))}
                    >
                      <CircleXmark width={14} height={14} />
                      Deny
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-foreground/50">
                    {family.ownerUsername} decides
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
          Members
        </p>
        <ul className="space-y-2">
          {family.members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-default-100 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.username}
                  {member.id === myUserId && (
                    <span className="ml-2 text-xs text-foreground/50">you</span>
                  )}
                </p>
                {member.email && <p className="truncate text-xs text-foreground/60">{member.email}</p>}
              </div>
              {member.id === family.ownerUserId && (
                <span className="rounded bg-default-200 px-2 py-0.5 text-xs">Primary</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-3 text-xs text-foreground/60">
        Everyone here can see the household&apos;s income and expenses. Only the person who entered a
        transaction can change it.
      </p>

      {/* The primary user has no Leave button because LeaveMyFamily refuses
          them — Family.ownerUser is non-null, so there is no household
          without one. Offering the button and failing the call would be a
          worse way to say the same thing. */}
      {!isOwner && (
        <LeaveHousehold
          familyName={family.name}
          isBusy={actingOn === "leave"}
          onConfirm={() => void run("leave", leave)}
        />
      )}
    </Card>
  );
}

function SectionHeading() {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
      <Persons className="size-4" /> Household
    </h2>
  );
}

/**
 * Two-step, because leaving is not undoable from this side: getting back in
 * needs the code again and another approval from the owner. Nothing is
 * deleted — the person keeps every transaction they entered — but "I can no
 * longer see my family's finances and need somebody else to let me back in"
 * is not a state to arrive at from a single mis-tap.
 */
function LeaveHousehold({
  familyName,
  isBusy,
  onConfirm,
}: {
  familyName: string;
  isBusy: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onPress={() => setConfirming(true)}>
        Leave household
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
      <p className="mb-3 text-sm">
        Leave <strong>{familyName}</strong>? Your own transactions stay with you, but you&apos;ll
        stop seeing everyone else&apos;s — and you&apos;ll need the invite code and another approval
        to come back.
      </p>
      <div className="flex gap-2">
        <Button size="sm" isDisabled={isBusy} onPress={onConfirm}>
          {isBusy ? "Leaving…" : "Yes, leave"}
        </Button>
        <Button size="sm" variant="ghost" isDisabled={isBusy} onPress={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
