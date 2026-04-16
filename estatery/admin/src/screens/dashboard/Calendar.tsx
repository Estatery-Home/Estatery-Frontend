"use client";

/**
 * Calendar — month/week/day views; booking nights from host or admin calendar API.
 * Click a booking to reschedule (check-in, check-out, guests) when allowed by the API.
 */
import * as React from "react";
import { createPortal } from "react-dom";
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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  fetchAdminCalendar,
  fetchHostCalendar,
  patchBookingReschedule,
} from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "month" | "week" | "day";

type CalendarEvent = {
  id: string;
  booking_id: number;
  title: string;
  date: string;
  allDay?: boolean;
  status?: string;
  property_id?: number;
  property_title?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
};

function toKeyDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

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

/** One row per booking on a day (API emits one event per night). */
function uniqueBookingsOnDay(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<number>();
  const out: CalendarEvent[] = [];
  for (const ev of events) {
    if (seen.has(ev.booking_id)) continue;
    seen.add(ev.booking_id);
    out.push(ev);
  }
  return out;
}

function isoDateOnly(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function Calendar() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.user_type === "admin";

  const [view, setView] = React.useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [activeEv, setActiveEv] = React.useState<CalendarEvent | null>(null);
  const [formCheckIn, setFormCheckIn] = React.useState("");
  const [formCheckOut, setFormCheckOut] = React.useState("");
  const [formGuests, setFormGuests] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const { startStr, endStr } = React.useMemo(() => {
    const { start, end } = calendarRangeForView(view, currentDate);
    return { startStr: toKeyDate(start), endStr: toKeyDate(end) };
  }, [view, currentDate]);

  const loadCalendar = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const fetcher = isPlatformAdmin ? fetchAdminCalendar : fetchHostCalendar;
    const res = await fetcher(startStr, endStr);
    if (!res) {
      setError("Could not load calendar. Check your connection and try again.");
      setEvents([]);
      setLoading(false);
      return;
    }
    setEvents(
      res.events.map((ev) => ({
        id: ev.id,
        booking_id: ev.booking_id,
        title: ev.title,
        date: ev.date,
        allDay: ev.all_day,
        status: ev.status,
        property_id: ev.property_id,
        property_title: ev.property_title,
        check_in: ev.check_in,
        check_out: ev.check_out,
        guests: ev.guests,
      }))
    );
    setLoading(false);
  }, [startStr, endStr, isPlatformAdmin]);

  React.useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const openReschedule = (ev: CalendarEvent) => {
    setModalError(null);
    setActiveEv(ev);
    const cin = ev.check_in ? isoDateOnly(ev.check_in) : "";
    const cout = ev.check_out ? isoDateOnly(ev.check_out) : "";
    if (!cin || !cout) {
      setModalError("Missing booking dates from server. Refresh and try again.");
    }
    setFormCheckIn(cin);
    setFormCheckOut(cout);
    setFormGuests(ev.guests ?? 1);
    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setRescheduleOpen(false);
    setActiveEv(null);
    setModalError(null);
    setSaving(false);
  };

  const handleSaveReschedule = async () => {
    if (!activeEv) return;
    setModalError(null);
    if (!formCheckIn || !formCheckOut) {
      setModalError("Check-in and check-out are required.");
      return;
    }
    setSaving(true);
    try {
      await patchBookingReschedule(activeEv.booking_id, {
        check_in: formCheckIn,
        check_out: formCheckOut,
        guests: formGuests,
      });
      closeReschedule();
      await loadCalendar();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Could not reschedule.");
    } finally {
      setSaving(false);
    }
  };

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

  const eventChipClass =
    "w-full truncate rounded-md bg-[#fef3c7] px-1.5 py-0.5 text-left text-[10px] font-medium text-[#b45309] transition hover:bg-[#fde68a] hover:ring-1 hover:ring-amber-300";

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
              <div
                key={key}
                className={cn(
                  "flex min-h-[92px] flex-col items-start justify-start gap-1 bg-white px-3 py-2 text-left text-xs",
                  !isCurrentMonth && "bg-[#f8fafc] text-[#cbd5e1]"
                )}
              >
                <button
                  type="button"
                  onClick={() => openDay(day)}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    today ? "bg-[var(--logo)] text-white" : "text-[#0f172a]"
                  )}
                >
                  {getDate(day)}
                </button>
                <div className="mt-1 flex w-full flex-col gap-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      className={eventChipClass}
                      title="Reschedule"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReschedule(ev);
                      }}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-[#94a3b8]">+{dayEvents.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
                  <button
                    key={ev.id}
                    type="button"
                    className={eventChipClass}
                    title={ev.title}
                    onClick={() => openReschedule(ev)}
                  >
                    {ev.title}
                  </button>
                ))}
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
    const raw = eventsByDate.get(key) ?? [];
    const dayBookings = uniqueBookingsOnDay(raw);

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#0f172a]">
          {format(day, "EEEE, MMMM d")}
        </div>
        {dayBookings.length > 0 && (
          <div className="border-b border-[#e2e8f0] bg-[#fffbeb] px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#92400e]">
              Bookings (click to reschedule)
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {dayBookings.map((ev) => (
                <button
                  key={String(ev.booking_id)}
                  type="button"
                  onClick={() => openReschedule(ev)}
                  className="rounded-lg border border-amber-200/80 bg-[#fef3c7] px-3 py-2 text-left text-xs font-medium text-[#b45309] transition hover:bg-[#fde68a]"
                >
                  <span className="block">{ev.title}</span>
                  {ev.property_title ? (
                    <span className="mt-0.5 block text-[10px] font-normal text-[#a16207]">{ev.property_title}</span>
                  ) : null}
                  {ev.check_in && ev.check_out ? (
                    <span className="mt-1 block text-[10px] font-normal text-[#a16207]">
                      {isoDateOnly(ev.check_in)} → {isoDateOnly(ev.check_out)}
                    </span>
                  ) : null}
                  {ev.status ? (
                    <span className="mt-1 block text-[10px] font-normal capitalize text-[#a16207]">
                      {ev.status.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}
        {dayBookings.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#94a3b8]">No bookings on this day.</div>
        )}
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
              <p className="mt-0.5 text-xs text-[#64748b]">
                {isPlatformAdmin
                  ? "All properties — click a booking to reschedule."
                  : "Your listings — click a booking to reschedule."}
              </p>
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

        {rescheduleOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reschedule-title"
              onClick={closeReschedule}
            >
              <div
                className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="reschedule-title" className="text-lg font-semibold text-[#1e293b]">
                  Reschedule booking
                </h3>
                {activeEv ? (
                  <p className="mt-1 text-sm text-[#64748b]">{activeEv.title}</p>
                ) : null}

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cal-check-in">Check-in</Label>
                      <Input
                        id="cal-check-in"
                        type="date"
                        value={formCheckIn}
                        onChange={(e) => setFormCheckIn(e.target.value)}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cal-check-out">Check-out</Label>
                      <Input
                        id="cal-check-out"
                        type="date"
                        value={formCheckOut}
                        onChange={(e) => setFormCheckOut(e.target.value)}
                        className="border-[#e2e8f0]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cal-guests">Guests</Label>
                    <Input
                      id="cal-guests"
                      type="number"
                      min={1}
                      max={50}
                      value={formGuests}
                      onChange={(e) => setFormGuests(Math.max(1, Number(e.target.value) || 1))}
                      className="border-[#e2e8f0]"
                    />
                  </div>
                </div>

                {modalError ? (
                  <p className="mt-3 text-sm text-red-600">{modalError}</p>
                ) : (
                  <p className="mt-3 text-xs text-[#94a3b8]">
                    Dates must follow the property&apos;s monthly cycle and stay rules. Not available if payments are
                    already marked paid.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeReschedule} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                    onClick={() => void handleSaveReschedule()}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </>
    </DashboardLayout>
  );
}
