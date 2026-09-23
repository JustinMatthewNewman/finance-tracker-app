"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { Persons, House, ArrowRightFromSquare, Clock, Copy, CircleCheck, CircleXmark } from "@gravity-ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/context/UserSettingsContext";
import { useOnboarding, type ResolvedFamily } from "@/hooks/useOnboarding";
import { formatInviteCode, INVITE_CODE_LENGTH } from "@/lib/inviteCode";

/** Where somebody lands once they have a household. */
const HOME_ROUTE = "/household";

type Step = "choose" | "join" | "create";

/**
 * The first thing a new account sees, and the only thing it can do.
 *
 * THE SHAPE OF THE FLOW. There are two ways into a household and they are
 * deliberately not symmetrical. Creating one is instant — it is your own
 * household, there is nobody to ask. Joining one is a request that somebody
 * else has to accept, so it has a waiting state in the middle, and that
 * waiting state is the part worth getting right: it is the only screen in the
 * app where the person is blocked on another human.
 *
 * WHICH SCREEN SHOWS IS DERIVED, NOT STORED. A pending request wins over
 * everything, because it is a fact about the database rather than a step
 * somebody navigated to. That is what makes the flow survive a refresh, a
 * second tab, or signing in on a different device mid-wait — all three are
 * ordinary, and a wizard holding its position in useState gets all three
 * wrong.
 */
export default function OnboardingFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const { refetch: refetchUserSettings } = useUserSettings();
  const {
    hasFamily,
    pendingRequest,
    latestRequest,
    loading,
    error,
    refresh,
    lookupInviteCode,
    createMyFamily,
    requestToJoin,
    cancelRequest,
  } = useOnboarding();

  const [step, setStep] = useState<Step>("choose");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [resolved, setResolved] = useState<ResolvedFamily | null>(null);

  const [householdName, setHouseholdName] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  /**
   * Leaves onboarding once there is a household to leave it for.
   *
   * The context refetch is not optional. OnboardingGate over in `(app)` reads
   * `familyId` from UserSettingsContext, and that context does not know about
   * the mutation that just ran — so navigating without refreshing it first
   * sends the person to /household, where the gate still believes they have
   * no household and bounces them straight back here.
   */
  const enterApp = useCallback(async () => {
    await refetchUserSettings();
    router.replace(HOME_ROUTE);
  }, [refetchUserSettings, router]);

  // Covers the case where somebody already has a household and lands here by
  // typing the URL, and the case where their request was approved while this
  // very page was open.
  useEffect(() => {
    if (hasFamily && !createdCode) void enterApp();
  }, [hasFamily, createdCode, enterApp]);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setFormError(null);
    try {
      await action();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleLookup = () =>
    runAction(async () => {
      const found = await lookupInviteCode(codeInput);
      if (!found) {
        // One message for "malformed" and for "no such household" — see the
        // note on lookupInviteCode. Distinguishing them would turn this box
        // into a way to test which codes are real.
        setFormError("We couldn't find a household with that code. Check it and try again.");
        return;
      }
      setResolved(found);
    });

  const handleRequestToJoin = () =>
    runAction(async () => {
      if (!resolved) return;
      await requestToJoin(resolved.id);
      setResolved(null);
      setCodeInput("");
    });

  const handleCreate = () =>
    runAction(async () => {
      const code = await createMyFamily(householdName);
      // Held deliberately rather than navigating away: this is the only
      // moment the invite code is guaranteed to be in front of the person who
      // needs to share it. It stays in Settings, but showing it here is the
      // difference between a household of one and a household.
      setCreatedCode(code);
    });

  if (loading) {
    return (
      <Shell>
        <p className="text-foreground/60">Loading your account…</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold">We couldn&apos;t load your account</h2>
          <p className="mb-4 text-sm text-foreground/70">{error}</p>
          <Button onPress={() => void refresh()}>Try again</Button>
        </Card>
      </Shell>
    );
  }

  // ── Just created a household: show the code before moving on ──────────────
  if (createdCode) {
    return (
      <Shell>
        <Card className="p-8">
          <div className="mb-4 flex items-center gap-3">
            <CircleCheck className="text-success" width={28} height={28} />
            <h2 className="text-2xl font-bold">{householdName.trim()} is ready</h2>
          </div>
          <p className="mb-6 text-sm text-foreground/70">
            Share this invite code with the people you want in your household. They&apos;ll enter it
            when they sign up, and you&apos;ll get to approve them before they can see anything.
          </p>
          <InviteCodeBlock code={createdCode} />
          <p className="mt-4 text-xs text-foreground/50">
            You can find this again — and change it — under Settings.
          </p>
          <Button className="mt-6 w-full" onPress={() => void enterApp()}>
            Go to my household
          </Button>
        </Card>
      </Shell>
    );
  }

  // ── Waiting on somebody else ──────────────────────────────────────────────
  if (pendingRequest) {
    return (
      <Shell>
        <Card className="p-8">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="text-foreground/60" width={26} height={26} />
            <h2 className="text-2xl font-bold">Waiting for approval</h2>
          </div>
          <p className="mb-2 text-foreground/80">
            You&apos;ve asked to join <strong>{pendingRequest.familyName}</strong>.
          </p>
          <p className="mb-6 text-sm text-foreground/60">
            {pendingRequest.ownerUsername} needs to approve you before you can see the household&apos;s
            finances. Nothing is shared until they do.
          </p>

          {formError && <ErrorNote>{formError}</ErrorNote>}

          <div className="flex flex-col gap-2">
            {/* Polling would be the obvious thing here and is deliberately not
                done: approval is a human on the other end, on no particular
                timescale, and a timer firing a SERVER_ONLY read every few
                seconds for an hour costs real money to save one tap. */}
            <Button isDisabled={busy} onPress={() => void refresh()}>
              Check again
            </Button>
            <Button
              variant="ghost"
              isDisabled={busy}
              onPress={() =>
                void runAction(async () => {
                  await cancelRequest(pendingRequest.familyId);
                  setStep("choose");
                })
              }
            >
              Cancel and start my own household instead
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  // ── Join: enter a code ────────────────────────────────────────────────────
  if (step === "join") {
    return (
      <Shell>
        <Card className="p-8">
          <h2 className="mb-2 text-2xl font-bold">Join a household</h2>
          <p className="mb-6 text-sm text-foreground/60">
            Ask whoever set up your household for their invite code.
          </p>

          {resolved ? (
            <>
              <div className="mb-6 rounded-lg border border-separator p-4">
                <p className="text-xs uppercase tracking-wide text-foreground/50">Found</p>
                <p className="text-lg font-semibold">{resolved.name}</p>
                <p className="text-sm text-foreground/60">
                  Managed by {resolved.ownerUsername}
                </p>
              </div>
              {formError && <ErrorNote>{formError}</ErrorNote>}
              <Button className="w-full" isDisabled={busy} onPress={() => void handleRequestToJoin()}>
                {busy ? "Sending…" : "Ask to join"}
              </Button>
              <Button
                className="mt-2 w-full"
                variant="ghost"
                isDisabled={busy}
                onPress={() => {
                  setResolved(null);
                  setFormError(null);
                }}
              >
                Use a different code
              </Button>
            </>
          ) : (
            <>
              <TextField value={codeInput} onChange={setCodeInput} isDisabled={busy}>
                <Label>Invite code</Label>
                <Input
                  placeholder="ABCDE-12345"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
              </TextField>
              <p className="mt-2 text-xs text-foreground/50">
                {INVITE_CODE_LENGTH} characters. Capitals and dashes don&apos;t matter.
              </p>
              {formError && <ErrorNote>{formError}</ErrorNote>}
              <Button
                className="mt-4 w-full"
                isDisabled={busy || !codeInput.trim()}
                onPress={() => void handleLookup()}
              >
                {busy ? "Looking…" : "Find household"}
              </Button>
            </>
          )}

          <BackLink
            onPress={() => {
              setStep("choose");
              setResolved(null);
              setFormError(null);
            }}
          />
        </Card>
      </Shell>
    );
  }

  // ── Create ────────────────────────────────────────────────────────────────
  if (step === "create") {
    return (
      <Shell>
        <Card className="p-8">
          <h2 className="mb-2 text-2xl font-bold">Start a household</h2>
          <p className="mb-6 text-sm text-foreground/60">
            You&apos;ll be able to invite other people to it afterwards.
          </p>

          <TextField value={householdName} onChange={setHouseholdName} isDisabled={busy}>
            <Label>Household name</Label>
            <Input placeholder="The Newmans" autoComplete="off" />
          </TextField>

          {formError && <ErrorNote>{formError}</ErrorNote>}

          <Button
            className="mt-4 w-full"
            isDisabled={busy || !householdName.trim()}
            onPress={() => void handleCreate()}
          >
            {busy ? "Creating…" : "Create household"}
          </Button>

          <BackLink
            onPress={() => {
              setStep("choose");
              setFormError(null);
            }}
          />
        </Card>
      </Shell>
    );
  }

  // ── The fork ──────────────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-foreground/60">
          Finance Tracker works around a household. Join one, or start your own.
        </p>
      </div>

      {/* A request that was turned down would otherwise vanish without
          explanation, leaving somebody to wonder whether they ever sent it. */}
      {latestRequest?.status === "DENIED" && (
        <Card className="mb-4 p-4">
          <div className="flex items-start gap-3">
            <CircleXmark className="mt-0.5 shrink-0 text-danger" width={20} height={20} />
            <p className="text-sm text-foreground/80">
              Your request to join <strong>{latestRequest.familyName}</strong> wasn&apos;t approved.
              You can ask again with the same code, or start your own household.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceCard
          icon={<Persons width={26} height={26} />}
          title="Join a household"
          body="Somebody already set one up and gave you an invite code."
          cta="I have a code"
          onPress={() => {
            setStep("join");
            setFormError(null);
          }}
        />
        <ChoiceCard
          icon={<House width={26} height={26} />}
          title="Start a household"
          body="Set one up and invite the rest of your family into it."
          cta="Create one"
          onPress={() => {
            setStep("create");
            setFormError(null);
          }}
        />
      </div>
    </Shell>
  );
}

// ── Presentational helpers ──────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-12">
      {children}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
      {children}
    </p>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Button className="mt-6 w-full" variant="ghost" onPress={onPress}>
      Back
    </Button>
  );
}

function ChoiceCard({
  icon,
  title,
  body,
  cta,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-3 text-accent">{icon}</div>
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="mb-6 flex-1 text-sm text-foreground/60">{body}</p>
      <Button className="w-full" onPress={onPress}>
        {cta}
        <ArrowRightFromSquare width={16} height={16} />
      </Button>
    </Card>
  );
}

/** The invite code, big enough to read aloud and with a one-tap copy. */
export function InviteCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied in plenty of ordinary situations — an
      // insecure origin, a browser permission, an embedded webview. The code
      // is displayed in full right next to this button, so there is nothing
      // to recover from and nothing worth interrupting somebody about.
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-separator bg-default/40 p-4">
      <code className="font-mono text-2xl font-semibold tracking-[0.2em]">
        {formatInviteCode(code)}
      </code>
      <Button size="sm" variant="ghost" onPress={() => void copy()}>
        <Copy width={16} height={16} />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
