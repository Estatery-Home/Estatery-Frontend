"use client";

import * as React from "react";
import { addDays, addMonths, addWeeks, endOfMonth, format, getDate, getDay, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

type CalendarEvent = {
  id: number;
  title: string;
  date: string; // yyyy-MM-dd
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
};

function toKeyDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function Calendar() {
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const [view, setView] = React.useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date(2025, 6, 11)); // July 11, 2025
  const [events, setEvents] = React.useState<CalendarEvent[]>([
    { id: 1, title: "Home Tour", date: "2025-07-02", startTime: "10:00", endTime: "12:00" },
    { id: 2, title: "Home Tour", date: "2025-07-02", startTime: "13:00", endTime: "15:00" },
    { id: 3, title: "Home Tour", date: "2025-07-11", startTime: "13:00", endTime: "14:00" },
    { id: 4, title: "Home Tour", date: "2025-07-17", startTime: "13:00", endTime: "14:00" },
    { id: 5, title: "Home Tour", date: "2025-07-19", startTime: "13:00", endTime: "14:00" },
    { id: 6, title: "Home Tour", date: "2025-07-20", startTime: "13:00", endTime: "14:00" },
    { id: 7, title: "Home Tour", date: "2025-07-29", startTime: "13:00", endTime: "14:00" },
  ]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState<string>(toKeyDate(currentDate));
  const [draftStart, setDraftStart] = React.useState<string>("13:00");
  const [draftEnd, setDraftEnd] = React.useState<string>("14:00");
  const [draftTitle, setDraftTitle] = React.useState<string>("Home Tour");

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
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

  const monthLabel = format(currentDate, "MMMM yyyy");

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const openAddModalFor = (date: Date) => {
    setDraftDate(toKeyDate(date));
    setModalOpen(true);
  };

  const handleSaveEvent = () => {
    const title = draftTitle.trim();
    if (!title || !draftDate) return;
    setEvents((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title,
        date: draftDate,
        startTime: draftStart || undefined,
        endTime: draftEnd || undefined,
      },
    ]);
    setModalOpen(false);
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
                onClick={() => openAddModalFor(day)}
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
                    <span className="text-[10px] text-[#94a3b8]">
                      +{dayEvents.length - 2} more
                    </span>
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
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM – 7 PM

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b]">
          <div className="px-2 py-2" />
          {days.map((day) => (
            <div key={toKeyDate(day)} className="px-2 py-2 text-center">
              <div>{format(day, "EEE")}</div>
              <div className="mt-0.5 text-sm font-semibold text-[#0f172a]">
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] text-xs">
          <div className="bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="h-12 border-b border-[#e2e8f0] px-2 text-right text-[10px] text-[#94a3b8]"
              >
                {format(new Date(2025, 0, 1, h), "h a")}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const key = toKeyDate(day);
            const dayEvents = (eventsByDate.get(key) ?? []).filter((ev) => ev.startTime);
            return (
              <div key={key} className="relative bg-white">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="h-12 border-b border-[#e2e8f0]"
                    onDoubleClick={() => openAddModalFor(day)}
                  />
                ))}
                {dayEvents.map((ev) => {
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

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#0f172a]">
          {format(day, "EEEE dd")}
        </div>
        <div className="grid grid-cols-[80px_minmax(0,1fr)] text-xs">
          <div className="bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="h-12 border-b border-[#e2e8f0] px-2 text-right text-[10px] text-[#94a3b8]"
              >
                {format(new Date(2025, 0, 1, h), "h a")}
              </div>
            ))}
          </div>
          <div className="relative bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="h-12 border-b border-[#e2e8f0]"
                onDoubleClick={() => openAddModalFor(day)}
              />
            ))}
            {dayEvents.map((ev) => {
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
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-[#1e293b]">{monthLabel}</h1>
              <div className="flex items-center gap-2">
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
                  onClick={() => {
                    setDraftDate(toKeyDate(currentDate));
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-full bg-[var(--logo)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--logo-hover)]"
                >
                  <Plus className="size-4" />
                  Add New Schedule
                </Button>
              </div>
            </div>

            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </div>
        </main>
      </div>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Add New Schedule</h3>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="schedule-title" className="text-xs font-medium text-[#64748b]">
                  Title
                </label>
                <input
                  id="schedule-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="schedule-date" className="text-xs font-medium text-[#64748b]">
                  Date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="schedule-start" className="text-xs font-medium text-[#64748b]">
                    Start time
                  </label>
                  <input
                    id="schedule-start"
                    type="time"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="schedule-end" className="text-xs font-medium text-[#64748b]">
                    End time
                  </label>
                  <input
                    id="schedule-end"
                    type="time"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                onClick={handleSaveEvent}
              >
                Save Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

