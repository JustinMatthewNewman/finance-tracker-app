"use client";

import { Card, Switch, Button, Tooltip, Slider, TextField, Input, Label } from '@heroui/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useThemeSelection, getVariant } from '@/context/ThemeSelectionContext'
import { usePerformanceMode } from '@/context/PerformanceModeContext'
import { useBackgroundOpacity } from '@/context/BackgroundOpacityContext'
import { useCardStyle } from '@/context/CardStyleContext'
import { useBorders } from '@/context/BordersContext'
import { useSquareCorners } from '@/context/SquareCornersContext'
import { useCalendarView } from '@/context/CalendarViewContext'
import { useInternalTransfers } from '@/context/InternalTransfersContext'
import { usePrivacyMode } from '@/context/PrivacyModeContext'
import { useInternalTransferSync } from '@/hooks/useInternalTransferSync'
import { useCategoryColorsSetting } from '@/context/CategoryColorsContext'
import { useUserSettings } from '@/context/UserSettingsContext'
import FamilyPanel from '@/components/Family/FamilyPanel'
import { useSelectMyExternalAccountLinkTemplate, useSelectMyCurrency } from '@/src/dataconnect-generated/react'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/lib/money'
import { ACCOUNT_ID_PLACEHOLDER, isValidLinkTemplate } from '@/lib/externalAccountLink'
import {
  Sun,
  Moon,
  Paintbrush,
  Thunderbolt,
  Droplet,
  Layers,
  SquareDashed,
  Square,
  Palette,
  Link as LinkIcon,
  Calculator,
  CircleInfo,
} from '@gravity-ui/icons'

const APP_VERSION = "1.0.0";


function SettingsCard() {
  const { resolvedTheme, setTheme } = useTheme()
  const { schemes, selectedScheme, selectScheme, clearScheme } = useThemeSelection()
  const { performanceMode, setPerformanceMode } = usePerformanceMode()
  const { backgroundOpacity, setBackgroundOpacity } = useBackgroundOpacity()
  const { cardOpacity, setCardOpacity, cardBlur, setCardBlur } = useCardStyle()
  const { bordersEnabled, setBordersEnabled } = useBorders()
  const { squareCorners, setSquareCorners } = useSquareCorners()
  const { hideWeekends, setHideWeekends } = useCalendarView();
  const { showInternalTransfers, setShowInternalTransfers } = useInternalTransfers();
  const { privacyMode, setPrivacyMode } = usePrivacyMode();
  const {
    resync: resyncTransfers,
    running: transferSyncRunning,
    progress: transferSyncProgress,
    outcome: transferSyncOutcome,
    error: transferSyncError,
  } = useInternalTransferSync();
  const { categoryColorsEnabled, setCategoryColorsEnabled } = useCategoryColorsSetting()
  const { externalAccountLinkTemplate, currencyCode, refetch: refetchUserSettings } = useUserSettings()
  const selectTemplateMutation = useSelectMyExternalAccountLinkTemplate()
  const selectCurrencyMutation = useSelectMyCurrency()

  // next-themes only knows the real theme after mount (it reads from
  // localStorage/media query client-side), so the switch stays hidden
  // until then to avoid a flash of the wrong state.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Mirrors externalAccountLinkTemplate whenever it (re)loads — including
  // right after a save, when refetch() returns the same value just written,
  // so this never fights the user's in-progress typing.
  const [templateDraft, setTemplateDraft] = useState("")
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplateDraft(externalAccountLinkTemplate ?? "")
  }, [externalAccountLinkTemplate])

  const handleSaveTemplate = async () => {
    const trimmed = templateDraft.trim()
    // Validated here as well as at render time, because this value ends up in
    // an href — isValidLinkTemplate rejects non-http(s) schemes, which is what
    // keeps a `javascript:` template from becoming a clickable script. An
    // empty value is allowed: that clears the setting.
    if (trimmed && !isValidLinkTemplate(trimmed)) {
      setTemplateError(`Enter a full http(s) URL containing ${ACCOUNT_ID_PLACEHOLDER}`)
      return
    }
    setTemplateError(null)
    setTemplateSaving(true)
    try {
      await selectTemplateMutation.mutateAsync({ externalAccountLinkTemplate: trimmed || null })
      await refetchUserSettings()
    } finally {
      setTemplateSaving(false)
    }
  }

  const currency: CurrencyCode = isCurrencyCode(currencyCode) ? currencyCode : DEFAULT_CURRENCY

  const handleSelectCurrency = async (next: CurrencyCode) => {
    // Changing this reformats existing amounts; it does NOT convert them.
    // Amounts are stored as minor units with no currency attached (see
    // lib/money.ts), so 1234 displayed as $12.34 becomes ¥1234 here, not
    // its exchange-rate equivalent. The helper text below says so plainly,
    // because a silent reinterpretation of every number in the app is the
    // kind of thing people only notice much later.
    await selectCurrencyMutation.mutateAsync({ currencyCode: next })
    await refetchUserSettings()
  }

  return (
    <div className="flex w-full flex-col gap-6">


      {/* Appearance */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />} Appearance
        </h2>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Dark mode</p>
            <p className="text-xs text-foreground/60">Switch between light and dark themes</p>
          </div>
          {mounted && (
            <Switch
              isSelected={resolvedTheme === "dark"}
              onChange={(isDark) => setTheme(isDark ? "dark" : "light")}
              aria-label="Dark mode"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          )}
        </div>

        {schemes.length > 0 && (
          <div className="mt-3 rounded-lg bg-default-100 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Paintbrush className="size-4" />
              <p className="text-sm font-medium text-foreground">Color theme</p>
            </div>
            <p className="mb-3 text-xs text-foreground/60">
              Each scheme has its own light and dark look — the switch above still toggles between them.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                key="__default"
                variant={selectedScheme === null ? "primary" : "outline"}
                size="sm"
                onPress={() => clearScheme()}
              >
                Default
              </Button>
              {schemes.map((scheme) => {
                const previewVariant = getVariant(scheme, resolvedTheme === "dark") ?? scheme.variants[0];
                return (
                  <Tooltip key={scheme.id}>
                    <Tooltip.Trigger>
                      <Button
                        variant={selectedScheme?.id === scheme.id ? "primary" : "outline"}
                        size="sm"
                        onPress={() => selectScheme(scheme.id)}
                      >
                        <span
                          className="size-3 rounded-full border-2"
                          style={{
                            backgroundColor: previewVariant?.background,
                            borderColor: previewVariant?.accent,
                          }}
                        />
                        {scheme.name}
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      {scheme.name} · {resolvedTheme === "dark" ? "Dark" : "Light"} variant
                    </Tooltip.Content>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Thunderbolt className="size-4" /> Performance mode
            </p>
            <p className="text-xs text-foreground/60">
              Turns off animated backgrounds and blur effects for a smoother, less CPU-intensive
              experience on older devices.
            </p>
          </div>
          <Switch
            isSelected={performanceMode}
            onChange={setPerformanceMode}
            aria-label="Performance mode"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        {/* No-op with performance mode on — AmbientBackground unmounts
            entirely rather than just hiding, so there's nothing for this
            to dial in. */}
        {!performanceMode && (
          <div className="mt-3 rounded-lg bg-default-100 p-3">
            <Slider
              value={backgroundOpacity}
              onChange={(value) => setBackgroundOpacity(Array.isArray(value) ? value[0] : value)}
              minValue={0}
              maxValue={100}
              step={5}
              aria-label="Background opacity"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Droplet className="size-4" /> Background opacity
                </p>
                <Slider.Output>{`${backgroundOpacity}%`}</Slider.Output>
              </div>
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <p className="mt-2 text-xs text-foreground/60">
              Controls how strong the animated background glow appears across the app.
            </p>
          </div>
        )}

        {/* Card opacity/blur are no-ops with performance mode on — its
            "blur effects off" behavior overrides cardBlur back to none
            (see globals.css), and there's nothing gained from a translucent
            card once the ambient background behind it isn't rendering. */}
        {!performanceMode && (
          <>
            <div className="mt-3 rounded-lg bg-default-100 p-3">
              <Slider
                value={cardOpacity}
                onChange={(value) => setCardOpacity(Array.isArray(value) ? value[0] : value)}
                minValue={10}
                maxValue={100}
                step={5}
                aria-label="Card opacity"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Layers className="size-4" /> Card opacity
                  </p>
                  <Slider.Output>{`${cardOpacity}%`}</Slider.Output>
                </div>
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <p className="mt-2 text-xs text-foreground/60">
                How see-through cards are — lower values let the background show through.
              </p>
            </div>

            <div className="mt-3 rounded-lg bg-default-100 p-3">
              <Slider
                value={cardBlur}
                onChange={(value) => setCardBlur(Array.isArray(value) ? value[0] : value)}
                minValue={0}
                maxValue={40}
                step={2}
                aria-label="Card background blur"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <SquareDashed className="size-4" /> Card background blur
                  </p>
                  <Slider.Output>{`${cardBlur}px`}</Slider.Output>
                </div>
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <p className="mt-2 text-xs text-foreground/60">
                Gaussian blur behind cards for a frosted-glass look. 0 disables it.
              </p>
            </div>
          </>
        )}

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Square className="size-4" /> Show borders
            </p>
            <p className="text-xs text-foreground/60">
              Outlines cards and tables. Turn off for a cleaner, borderless look.
            </p>
          </div>
          <Switch
            isSelected={bordersEnabled}
            onChange={setBordersEnabled}
            aria-label="Show borders"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Square className="size-4" /> Square corners
            </p>
            <p className="text-xs text-foreground/60">
              Squares off rounded corners across the app — cards, inputs, buttons and panels.
              Avatars, pills and switches stay round.
            </p>
          </div>
          <Switch
            isSelected={squareCorners}
            onChange={setSquareCorners}
            aria-label="Square corners"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Hide amounts</p>
            <p className="text-xs text-foreground/60">
              Replaces every figure with dots, for a shared screen or a screenshot. There is a
              quicker toggle for this in the navbar. It hides amounts from somebody looking at
              the screen — it is not a password, and anyone with the device can switch it off.
            </p>
          </div>
          <Switch isSelected={privacyMode} onChange={setPrivacyMode} aria-label="Hide amounts">
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Count internal transfers</p>
            {/* The one preference here that changes a figure rather than an
                appearance, so the description says what it does to the numbers
                rather than what it looks like. */}
            <p className="text-xs text-foreground/60">
              Whether money you move around inside your household — between your own accounts,
              or between people in it — counts as income and spending. Each transfer is a real
              credit and a real debit, so counting them adds the same amount to both sides, and
              a household that sweeps money into savings looks like it earns and spends far more
              than it does. If only one of the two accounts is imported, counting it also makes
              your net wrong, because money that just moved looks like money spent.
            </p>
          </div>
          <Switch
            isSelected={showInternalTransfers}
            onChange={setShowInternalTransfers}
            aria-label="Count internal transfers"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        {/* THE BACKFILL, and the reason it has a button rather than running
            automatically: both flags are read off the statement memo, which the
            importer does not keep, so a row imported before those columns existed
            has neither set. That was 592 rows out of 1952 in a real household —
            enough that the toggle above looked broken, because there was nothing
            flagged for it to hide. It is also the repair path for adding or
            renaming a household member, since a payment to somebody only becomes
            internal once they are in the roster. */}
        <div className="mt-3 rounded-lg bg-default-100 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Re-check internal transfers</p>
              <p className="text-xs text-foreground/60">
                Looks at every imported transaction again and works out which ones just move money
                around inside your household — between your own accounts, or between people in it.
                Run this after importing statements from before this feature existed, or after
                adding someone to your household.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              isDisabled={transferSyncRunning}
              onPress={() => void resyncTransfers().catch(() => {})}
            >
              {transferSyncRunning ? "Checking…" : "Re-check"}
            </Button>
          </div>

          {transferSyncProgress && (
            <p className="mt-2 text-xs text-foreground/60 tabular-nums">
              Updating {transferSyncProgress.done} of {transferSyncProgress.total}…
            </p>
          )}
          {transferSyncError && <p className="mt-2 text-xs text-danger">{transferSyncError}</p>}
          {transferSyncOutcome && !transferSyncRunning && (
            <p className="mt-2 text-xs text-foreground/60">
              Checked {transferSyncOutcome.scanned} imported transaction
              {transferSyncOutcome.scanned === 1 ? "" : "s"}:{" "}
              {transferSyncOutcome.flaggedToUser} between your own accounts,{" "}
              {transferSyncOutcome.flaggedToFamily} within the household
              {transferSyncOutcome.unflagged > 0 && `, ${transferSyncOutcome.unflagged} no longer internal`}
              {transferSyncOutcome.failures > 0 && `, ${transferSyncOutcome.failures} could not be updated`}
              .{" "}
              {transferSyncOutcome.flaggedToUser +
                transferSyncOutcome.flaggedToFamily +
                transferSyncOutcome.unflagged ===
                0 && "Nothing needed changing."}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Hide weekends on the calendar</p>
            <p className="text-xs text-foreground/60">
              Drops Saturday and Sunday from the calendar grid, leaving five wider columns.
              Weekend transactions still exist and still count in every total — only the
              columns go.
            </p>
          </div>
          <Switch
            isSelected={hideWeekends}
            onChange={setHideWeekends}
            aria-label="Hide weekends on the calendar"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="size-4" /> Category colors
            </p>
            <p className="text-xs text-foreground/60">
              Tints transaction rows, the breakdown and the household list with each
              category&apos;s color. Turning this off hides the tints everywhere without
              clearing any colors.
            </p>
          </div>
          <Switch
            isSelected={categoryColorsEnabled}
            onChange={setCategoryColorsEnabled}
            aria-label="Category colors"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      </Card>

      {/* Money */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Calculator className="size-4" /> Money
        </h2>
        <div className="rounded-lg bg-default-100 p-3">
          <p className="text-sm font-medium text-foreground">Currency</p>
          <p className="mb-3 text-xs text-foreground/60">
            How amounts are displayed across the app.{" "}
            <strong className="font-medium text-foreground/80">
              This reformats existing amounts, it doesn&apos;t convert them
            </strong>{" "}
            — no exchange rate is applied.
          </p>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_CURRENCIES.map((code) => (
              <Button
                key={code}
                variant={currency === code ? "primary" : "outline"}
                size="sm"
                onPress={() => handleSelectCurrency(code)}
              >
                {code}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Integrations */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <LinkIcon className="size-4" /> Integrations
        </h2>
        <div className="rounded-lg bg-default-100 p-3">
          <TextField value={templateDraft} onChange={setTemplateDraft} isDisabled={templateSaving}>
            <Label>External account link</Label>
            <Input placeholder={`https://bank.example.com/accounts/${ACCOUNT_ID_PLACEHOLDER}`} />
          </TextField>
          <p className="mt-2 text-xs text-foreground/60">
            Shown as an &quot;open at your institution&quot; link for family members who have an
            account reference set. Use{" "}
            <code className="rounded bg-default-200 px-1">{ACCOUNT_ID_PLACEHOLDER}</code> as a
            placeholder for that reference. Must be a full http(s) URL.
          </p>
          {templateError && <p className="mt-1 text-sm text-danger">{templateError}</p>}
          <Button size="sm" className="mt-3" onPress={handleSaveTemplate} isDisabled={templateSaving}>
            {templateSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>

      {/* Household — who is in it, the invite code, and the join queue. */}
      <FamilyPanel />

      {/* About */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CircleInfo className="size-4" /> About
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-default-100 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">App Version</p>
            <p className="mt-1 font-mono text-sm text-foreground">{APP_VERSION}</p>
          </div>
          <div className="rounded-lg bg-default-100 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Last Updated</p>
            <p className="mt-1 text-sm text-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SettingsCard
