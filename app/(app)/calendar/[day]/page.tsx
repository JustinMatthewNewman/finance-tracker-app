import CalendarDayPage from "@/components/Calendar/CalendarDayPage";

/**
 * One day of the household's money, at /calendar/2026-09-15.
 *
 * A ROUTE RATHER THAN A PANEL, and that is the point of it: a day is a thing
 * somebody wants to link to, send to a housemate, bookmark, and reach with the
 * back button after tapping into it from the grid. The calendar previously
 * expanded a day inline, which made all four impossible and put the day's detail
 * in the same scroll box as the month.
 *
 * The day itself is the URL, in "yyyy-mm-dd" — the same form the Date column
 * stores, so nothing has to be parsed or reformatted to match a row. Validating
 * it is the client component's job, because an unparseable day is a thing to show
 * a message about rather than a 404.
 */
export default async function Page({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return <CalendarDayPage dayKey={day} />;
}
