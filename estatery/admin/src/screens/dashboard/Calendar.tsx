"use client";

/**
 * Calendar – month/week/day views; events from GET /api/host/calendar/.
 */
import * as React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  getDate,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchHostCalendar } from "@/lib/api-client";

type ViewMode = "month" | "week" | "day";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  status?: string;
};

function toKeyDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Same grid bounds as the month grid renderer (partial leading/trailing weeks). */
function monthGridDateRange(anchor: Date): { start: Date; end: Date } {
  const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const monthEnd = endOfMonth(anchor);
  const cells: Date[] = [];
  let d = gridStart;
  while (d <= monthEnd || cells.length < 35) {
    cells.push(d);
    d = addDays(d, 1);
  }
  return { start: cells[0], end: cells[cells.length - 1] };
}

function calendarRangeForView(view: ViewMode, currentDate: Date): { start: Date; end: Date } {
  if (view === "month") return monthGridDateRange(currentDate);
  if (view === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return { start, end: addDays(start, 6) };
  }
  return { start: currentDate, end: currentDate };
}

export default function Calendar() {
  const [view, setView] = React.useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { startStr, endStr } = React.useMemo(() => {
    const { start, end } = calendarRangeForView(view, currentDate);
    return { startStr: toKeyDate(start), endStr: toKeyDate(end) };
  }, [view, currentDate]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchHostCalendar(startStr, endStr).then((res) => {
      if (cancelled) return;
      if (!res) {
        setError("Could not load calendar. Check your connection and try again.");
        setEvents([]);
        setLoading(false);
        return;
      }
      setEvents(
        res.events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          date: ev.date,
          allDay: ev.all_day,
          status: ev.status,
        }))
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [startStr, endStr]);

  const handlePrev = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, -1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, -1));
    else setCurrentDate((d) => addDays(d, -1));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const monthLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : view === "week"
        ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`
        : format(currentDate, "EEEE, MMMM d, yyyy");

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const openDay = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfMonth(currentDate);
    const cells: Date[] = [];
    let d = start;
    while (d <= end || cells.length < 35) {
      cells.push(d);
      d = addDays(d, 1);
    }

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-center text-xs font-medium text-[#94a3b8]">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-2xl border border-[#e2e8f0] bg-[#e2e8f0]">
          {cells.map((day) => {
            const key = toKeyDate(day);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            return (
              <button
                key={key}
                type="button"
                onClick={() => openDay(day)}
                className={cn(
                  "flex min-h-[92px] flex-col items-start justify-start gap-1 bg-white px-3 py-2 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--logo)]/40",
                  !isCurrentMonth && "bg-[#f8fafc] text-[#cbd5e1]"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    today ? "bg-[var(--logo)] text-white" : "text-[#0f172a]"
                  )}
                >
                  {getDate(day)}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      className="truncate rounded-md bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium text-[#b45309]"
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-[#94a3b8]">+{dayEvents.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    const refHour = new Date();
    refHour.setHours(8, 0, 0, 0);

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b]">
          <div className="px-2 py-2" />
          {days.map((day) => (
            <div key={toKeyDate(day)} className="px-2 py-2 text-center">
              <div>{format(day, "EEE")}</div>
              <div className="mt-0.5 text-sm font-semibold text-[#0f172a]">{format(day, "d")}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-[#e2e8f0] bg-[#fffbeb]">
          <div className="px-2 py-2 text-[10px] font-medium text-[#92400e]">All day</div>
          {days.map((day) => {
            const key = toKeyDate(day);
            const dayEvents = eventsByDate.get(key) ?? [];
            return (
              <div key={key} className="flex min-h-[44px] flex-col gap-1 border-l border-[#fde68a]/60 px-1.5 py-1.5">
                {dayEvents.map((ev) => (
                  <span
                    key={ev.id}
                    className="truncate rounded-md bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium text-[#b45309]"
                    title={ev.title}
                  >
                    {ev.title}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] text-xs">
          <div className="bg-white">
            {hours.map((h) => {
              const t = new Date(refHour);
              t.setHours(h, 0, 0, 0);
              return (
                <div
                  key={h}
                  className="h-12 border-b border-[#e2e8f0] px-2 text-right text-[10px] text-[#94a3b8]"
                >
                  {format(t, "h a")}
                </div>
              );
            })}
          </div>
          {days.map((day) => {
            const key = toKeyDate(day);
            const timed = (eventsByDate.get(key) ?? []).filter((ev) => ev.startTime && !ev.allDay);
            return (
              <div key={key} className="relative bg-white">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="h-12 border-b border-[#e2e8f0]"
                    onDoubleClick={() => openDay(day)}
                    role="presentation"
                  />
                ))}
                {timed.map((ev) => {
                  const startHour = ev.startTime ? parseInt(ev.startTime.split(":")[0], 10) : 8;
                  const endHour = ev.endTime ? parseInt(ev.endTime.split(":")[0], 10) : startHour + 1;
                  const top = (startHour - 8) * 48;
                  const height = Math.max(32, (endHour - startHour) * 48 - 8);
                  return (
                    <div
                      key={ev.id}
                      style={{ top, height }}
                      className="absolute inset-x-1 rounded-md bg-[#fef3c7] px-2 py-1 text-[10px] font-medium text-[#b45309] shadow-sm"
                    >
                      <div>{ev.title}</div>
                      {ev.startTime && ev.endTime && (
                        <div className="mt-0.5 text-[10px] text-[#a16207]">
                          {ev.startTime} – {ev.endTime}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const day = currentDate;
    const key = toKeyDate(day);
    const dayEvents = eventsByDate.get(key) ?? [];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    const refHour = new Date();
    refHour.setHours(8, 0, 0, 0);

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#0f172a]">
          {format(day, "EEEE, MMMM d")}
        </div>
        {dayEvents.length > 0 && (
          <div className="border-b border-[#e2e8f0] bg-[#fffbeb] px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#92400e]">Bookings (nights)</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg bg-[#fef3c7] px-3 py-2 text-xs font-medium text-[#b45309]"
                >
                  {ev.title}
                  {ev.status ? (
                    <span className="mt-1 block text-[10px] font-normal capitalize text-[#a16207]">
                      {ev.status.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-[80px_minmax(0,1fr)] text-xs">
          <div className="bg-white">
            {hours.map((h) => {
              const t = new Date(refHour);
              t.setHours(h, 0, 0, 0);
              return (
                <div
                  key={h}
                  className="h-12 border-b border-[#e2e8f0] px-2 text-right text-[10px] text-[#94a3b8]"
                >
                  {format(t, "h a")}
                </div>
              );
            })}
          </div>
          <div className="relative bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="h-12 border-b border-[#e2e8f0]"
                onDoubleClick={() => openDay(day)}
                role="presentation"
              />
            ))}
            {dayEvents
              .filter((ev) => ev.startTime && !ev.allDay)
              .map((ev) => {
                const startHour = ev.startTime ? parseInt(ev.startTime.split(":")[0], 10) : 8;
                const endHour = ev.endTime ? parseInt(ev.endTime.split(":")[0], 10) : startHour + 1;
                const top = (startHour - 8) * 48;
                const height = Math.max(32, (endHour - startHour) * 48 - 8);
                return (
                  <div
                    key={ev.id}
                    style={{ top, height }}
                    className="absolute inset-x-2 rounded-md bg-[#fef3c7] px-3 py-1 text-[10px] font-medium text-[#b45309] shadow-sm"
                  >
                    <div>{ev.title}</div>
                    {ev.startTime && ev.endTime && (
                      <div className="mt-0.5 text-[10px] text-[#a16207]">
                        {ev.startTime} – {ev.endTime}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <>
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">{monthLabel}</h1>
              {loading ? (
                <p className="mt-0.5 text-xs text-[#94a3b8]">Loading bookings…</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white p-1 text-xs font-medium text-[#64748b]">
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    view === "month" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setView("week")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    view === "week" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setView("day")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    view === "day" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  Day
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex size-8 items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex size-8 items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
                  aria-label="Next"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                onClick={goToday}
              >
                Today
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          ) : null}

          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </div>
      </>
    </DashboardLayout>
  );
}
