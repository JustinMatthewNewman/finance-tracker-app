// Which widgets the dashboard has, and which of them a viewer wants to see.
//
// THE ORDER HERE IS THE ORDER ON SCREEN. A dashboard reads top-left first, so the
// list runs from "the answer" to "the detail": the headline figures, then the two
// time charts that say how the period moved, then the breakdowns that say what it
// was made of.

export const DASHBOARD_WIDGETS = [
  { id: "kpis", label: "Headline figures", span: "full" },
  { id: "trend", label: "Income & spending over time", span: "wide" },
  { id: "cumulative", label: "Cumulative net", span: "narrow" },
  { id: "composition", label: "Spending composition (3D)", span: "wide" },
  { id: "categories", label: "Categories ranked", span: "narrow" },
  { id: "members", label: "Who spent what", span: "narrow" },
  { id: "merchants", label: "Top merchants", span: "narrow" },
  { id: "projections", label: "Expected vs actual", span: "narrow" },
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];

export const ALL_WIDGET_IDS: WidgetId[] = DASHBOARD_WIDGETS.map((w) => w.id);

/**
 * Where a viewer's widget choice is kept.
 *
 * localStorage, PER DEVICE, and that is a deliberate scoping decision rather
 * than an oversight. Every *account* preference in this app lives on the
 * UserSetting row and is fed by UserSettingsContext's single fetch — see the
 * note there — because a preference that silently fails to persist is a bug this
 * codebase has already been bitten by. This one is different in kind: which
 * widgets fit is a property of the SCREEN, and somebody who hides two charts on
 * a laptop has said nothing about their phone.
 *
 * Promoting it is one nullable `dashboardWidgets: String` column on UserSetting
 * plus a provider beside the others, if it turns out people want it to follow
 * them. Nothing here depends on it staying local.
 */
const STORAGE_KEY = "dashboardHiddenWidgets";

/**
 * Reads the hidden set.
 *
 * Every access is wrapped: localStorage throws outright in a private window with
 * site data blocked, and returns null in plenty of other ordinary situations. A
 * dashboard that fails to render because it could not read a preference about
 * which parts of it to render would be a poor trade.
 *
 * Unknown ids are dropped on read rather than kept. A widget removed in a later
 * version would otherwise sit in everybody's stored set forever, and — worse —
 * a renamed id would silently hide the new widget for every existing viewer.
 */
export function readHiddenWidgets(): Set<WidgetId> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const known = new Set<string>(ALL_WIDGET_IDS);
    return new Set(parsed.filter((id): id is WidgetId => typeof id === "string" && known.has(id)));
  } catch {
    return new Set();
  }
}

export function writeHiddenWidgets(hidden: ReadonlySet<WidgetId>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
  } catch {
    // Nothing to do and nothing worth saying: the dashboard still works, it just
    // will not remember this next time.
  }
}
