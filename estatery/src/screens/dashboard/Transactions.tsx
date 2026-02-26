"use client";

/**
 * Transactions – payment list with search, filter, pagination.
 * Status: Success, Pending, Failed; type: Rent, Sale.
 */
import * as React from "react";
import {
  Calendar,
  RefreshCw,
  ChevronDown,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import type { PaymentTypeApi, PaymentStatusApi } from "@/lib/api-types";

/** API BookingPayment + display fields from booking */
type PaymentDisplay = {
  id: number;
  booking: number;
  payment_type: PaymentTypeApi;
  month_number: number;
  amount: string;
  due_date: string;
  status: PaymentStatusApi;
  paid_date?: string | null;
  property_title?: string;
  customer?: string;
};

const PAYMENT_TYPE_LABEL: Record<PaymentTypeApi, string> = {
  deposit: "Deposit",
  rent: "Rent",
  late_fee: "Late Fee",
  utility: "Utility",
  damage: "Damage",
  refund: "Refund",
};

const PAYMENTS: PaymentDisplay[] = [
  { id: 23487, booking: 101, payment_type: "rent", month_number: 1, amount: "293.00", due_date: "2025-07-08", status: "paid", property_title: "Oak Grove Estates", customer: "David Martinez" },
  { id: 23488, booking: 102, payment_type: "rent", month_number: 2, amount: "320.00", due_date: "2025-07-09", status: "paid", property_title: "Maple Heights", customer: "Sarah Johnson" },
  { id: 23489, booking: 103, payment_type: "rent", month_number: 1, amount: "275.00", due_date: "2025-07-10", status: "pending", property_title: "Riverbend Apartments", customer: "Michael Smith" },
  { id: 23490, booking: 104, payment_type: "rent", month_number: 1, amount: "450.00", due_date: "2025-07-11", status: "paid", property_title: "Sunset Terrace", customer: "Emma Wilson" },
  { id: 23491, booking: 105, payment_type: "deposit", month_number: 0, amount: "8500.00", due_date: "2025-07-12", status: "paid", property_title: "Lakeside Villa", customer: "James Brown" },
  { id: 23492, booking: 106, payment_type: "rent", month_number: 3, amount: "380.00", due_date: "2025-07-13", status: "pending", property_title: "Urban Heights", customer: "Anna Davis" },
  { id: 23493, booking: 107, payment_type: "rent", month_number: 2, amount: "520.00", due_date: "2025-07-14", status: "paid", property_title: "Green Valley", customer: "Chris Lee" },
  { id: 23494, booking: 108, payment_type: "deposit", month_number: 0, amount: "12000.00", due_date: "2025-07-15", status: "cancelled", property_title: "Harbor View", customer: "Maria Garcia" },
  { id: 23495, booking: 109, payment_type: "rent", month_number: 1, amount: "610.00", due_date: "2025-07-16", status: "pending", property_title: "Park Place", customer: "Tom Anderson" },
  { id: 23496, booking: 110, payment_type: "rent", month_number: 4, amount: "295.00", due_date: "2025-07-17", status: "paid", property_title: "Riverside", customer: "Lisa Moore" },
  { id: 23497, booking: 111, payment_type: "deposit", month_number: 0, amount: "9200.00", due_date: "2025-07-18", status: "pending", property_title: "Hilltop Manor", customer: "Paul Clark" },
  { id: 23498, booking: 112, payment_type: "rent", month_number: 2, amount: "720.00", due_date: "2025-07-19", status: "paid", property_title: "Downtown Loft", customer: "Rachel Green" },
  { id: 23499, booking: 113, payment_type: "rent", month_number: 1, amount: "410.00", due_date: "2025-07-20", status: "paid", property_title: "Garden View", customer: "Steve Adams" },
];

// Revenue chart data by period
const LAST_PERIOD_COLOR = "#84cc16"; // lime green

type ChartData = {
  labels: string[];
  fullDateLabels: [string, string];
  thisPeriod: number[];
  lastPeriod: number[];
  totalRevenue: string;
  changePercent: string;
};

const CHART_DATA: Record<string, ChartData> = {
  weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    fullDateLabels: ["Jul 7, 2025", "Jul 13, 2025"],
    thisPeriod: [18.2, 19.5, 20.1, 21.8, 22.5, 23.0, 23.57],
    lastPeriod: [15.0, 16.2, 17.0, 16.8, 17.5, 18.0, 18.5],
    totalRevenue: "₵23,569.00",
    changePercent: "10,5",
  },
  monthly: {
    labels: ["Jun 15", "Jun 18", "Jun 21", "Jun 24", "Jun 27", "Jun 30", "Jul 3", "Jul 6", "Jul 9", "Jul 12", "Jul 15"],
    fullDateLabels: ["June 15, 2025", "July 15, 2025"],
    thisPeriod: [12.5, 14.2, 15.8, 16.5, 18.2, 19.0, 20.5, 21.2, 22.8, 23.2, 23.57],
    lastPeriod: [11.0, 12.5, 13.8, 14.5, 15.2, 14.8, 15.5, 16.2, 17.0, 17.5, 18.5],
    totalRevenue: "₵23,569.00",
    changePercent: "10,5",
  },
  yearly: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    fullDateLabels: ["Jan 1, 2025", "Dec 31, 2025"],
    thisPeriod: [58, 62, 68, 72],
    lastPeriod: [52, 55, 60, 65],
    totalRevenue: "₵260,000.00",
    changePercent: "8,2",
  },
};

function SelectAllCheckbox({
  allSelected,
  someSelected,
  onChange,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onChange: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      onChange={onChange}
      className="rounded border-[#cbd5e1]"
      aria-label="Select all"
    />
  );
}

const PADDING_LEFT = 38;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 24;
const PADDING_RIGHT = 6;

function RevenueChart({
  period,
  onPeriodChange,
  onRefresh,
}: {
  period: string;
  onPeriodChange: (v: string) => void;
  onRefresh: () => void;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [animating, setAnimating] = React.useState(false);

  const data = CHART_DATA[period] ?? CHART_DATA.monthly;
  React.useEffect(() => setHoverIndex(null), [period]);
  const { labels, fullDateLabels, thisPeriod, lastPeriod, totalRevenue, changePercent } = data;

  const allValues = [...thisPeriod, ...lastPeriod];
  const maxY = Math.ceil((Math.max(...allValues) * 1.12) / 5) * 5 || 25;
  const minY = Math.max(0, Math.floor((Math.min(...allValues) * 0.88) / 5) * 5);

  const chartHeight = 160;
  const chartWidth = 520;
  const plotWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  const toY = (val: number) =>
    PADDING_TOP + (plotHeight - ((val - minY) / (maxY - minY || 1)) * plotHeight);
  const toX = (i: number) =>
    PADDING_LEFT + (labels.length > 1 ? (i / (labels.length - 1)) * plotWidth : plotWidth / 2);

  const thisPath = thisPeriod
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");
  const lastPath = lastPeriod
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");
  const baselineY = chartHeight - PADDING_BOTTOM;
  const thisAreaPath = `${thisPath} L ${toX(thisPeriod.length - 1)} ${baselineY} L ${toX(0)} ${baselineY} Z`;
  const lastAreaPath = `${lastPath} L ${toX(lastPeriod.length - 1)} ${baselineY} L ${toX(0)} ${baselineY} Z`;

  const handleRefresh = () => {
    setAnimating(true);
    onRefresh();
    setTimeout(() => setAnimating(false), 400);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * chartWidth - PADDING_LEFT;
    if (x < 0 || x > plotWidth) {
      setHoverIndex(null);
      return;
    }
    const idx =
      labels.length > 1
        ? Math.round((x / plotWidth) * (labels.length - 1))
        : 0;
    setHoverIndex(Math.max(0, Math.min(labels.length - 1, idx)));
  };

  const formatVal = (v: number) =>
    v >= 1000 ? `₵${(v / 1000).toFixed(1)}M` : `₵${v.toFixed(1)}K`;

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-300/40">
      <div className="border-b border-[#e2e8f0] bg-white px-4 py-3">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-[#1e293b]">Revenue Statistics</h3>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="h-8 min-w-[100px] rounded-lg border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs">
                <span>
                  {period === "weekly"
                    ? "Weekly"
                    : period === "yearly"
                      ? "Yearly"
                      : "Monthly"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e293b]"
              aria-label="Refresh chart"
            >
              <RefreshCw className={cn("size-3.5", animating && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xl font-bold text-[#1e293b]">{totalRevenue}</p>
            <p className="flex items-center gap-1 text-xs text-[#64748b]">
              <span className="flex items-center gap-1 font-medium text-[var(--logo)]">
                <TrendingUp className="size-3" />
                ↑ {changePercent.replace(",", ".")}%
              </span>
              from last period
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[var(--logo)]" />
              <span className="text-xs text-[#64748b]">This period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#84cc16]" />
              <span className="text-xs text-[#64748b]">Last period</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-3 pb-3 pt-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-h-[180px] w-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="thisGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--logo)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--logo)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="lastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84cc16" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#84cc16" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4).map((val) => (
            <text
              key={val}
              x={PADDING_LEFT - 6}
              y={toY(val) + 3}
              textAnchor="end"
              fill="#94a3b8"
              style={{ fontSize: 9, fontWeight: 500 }}
            >
              ₵{val >= 1000 ? `${(val / 1000).toFixed(0)}M` : `${Math.round(val)}K`}
            </text>
          ))}

          <text
            x={PADDING_LEFT}
            y={chartHeight - 6}
            textAnchor="start"
            fill="#94a3b8"
            style={{ fontSize: 9, fontWeight: 500 }}
          >
            {fullDateLabels[0]}
          </text>
          <text
            x={chartWidth - PADDING_RIGHT}
            y={chartHeight - 6}
            textAnchor="end"
            fill="#94a3b8"
            style={{ fontSize: 9, fontWeight: 500 }}
          >
            {fullDateLabels[1]}
          </text>

          {Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4).map((val) => (
            <line
              key={`h-${val}`}
              x1={PADDING_LEFT}
              y1={toY(val)}
              x2={chartWidth - PADDING_RIGHT}
              y2={toY(val)}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}
          {labels.map((_, i) => (
            <line
              key={`v-${i}`}
              x1={toX(i)}
              y1={PADDING_TOP}
              x2={toX(i)}
              y2={chartHeight - PADDING_BOTTOM}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}

          <path d={lastAreaPath} fill="url(#lastGrad)" stroke="none" />
          <path d={thisAreaPath} fill="url(#thisGrad)" stroke="none" />
          <path
            d={thisPath}
            fill="none"
            stroke="var(--logo)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={lastPath}
            fill="none"
            stroke={LAST_PERIOD_COLOR}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverIndex !== null && (
            <>
              <line
                x1={toX(hoverIndex)}
                y1={PADDING_TOP}
                x2={toX(hoverIndex)}
                y2={chartHeight - PADDING_BOTTOM}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <circle
                cx={toX(hoverIndex)}
                cy={toY(thisPeriod[hoverIndex] ?? 0)}
                r={4}
                fill="var(--logo)"
                stroke="white"
                strokeWidth={1.5}
              />
              <circle
                cx={toX(hoverIndex)}
                cy={toY(lastPeriod[hoverIndex] ?? 0)}
                r={4}
                fill={LAST_PERIOD_COLOR}
                stroke="white"
                strokeWidth={1.5}
              />
            </>
          )}

          <rect
            x={PADDING_LEFT}
            y={PADDING_TOP}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
          />
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 w-fit max-w-[180px] rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-xl"
            style={{
              left: `${12 + (hoverIndex / Math.max(1, labels.length - 1)) * 68}%`,
              top: 12,
              transform: "translateX(-50%)",
            }}
          >
            <p className="mb-1.5 text-[10px] font-bold text-[#1e293b]">Total Revenue</p>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center justify-between gap-6">
                <span className="text-[#64748b]">
                  {labels[hoverIndex] ?? ""}
                  {period === "monthly" && ", 2025"}
                  {period === "yearly" && " 2025"}
                  {period === "weekly" && ", 2025"}
                </span>
                <span className="font-semibold text-[var(--logo)]">
                  {formatVal(thisPeriod[hoverIndex] ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-[#64748b]">
                  {labels[hoverIndex] ?? ""}
                  {period === "monthly" && ", 2024"}
                  {period === "yearly" && " 2024"}
                  {period === "weekly" && ", 2024"}
                </span>
                <span className="font-semibold text-[#84cc16]">
                  {formatVal(lastPeriod[hoverIndex] ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Transactions() {
  const [lastUpdated, setLastUpdated] = React.useState("July 08, 2025");
  const [headerRefreshing, setHeaderRefreshing] = React.useState(false);
  const [period, setPeriod] = React.useState("monthly");
  const [payments, setPayments] = React.useState<PaymentDisplay[]>(PAYMENTS);
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [rowMenuOpen, setRowMenuOpen] = React.useState<number | null>(null);
  const [statusChangeModal, setStatusChangeModal] = React.useState<{
    paymentId: number;
    newStatus: PaymentStatusApi;
  } | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatusApi | "all">("all");
  const filterContainerRef = React.useRef<HTMLDivElement>(null);
  const rowMenuRef = React.useRef<HTMLTableCellElement | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<PaymentTypeApi | "all">("all");
  const [page, setPage] = React.useState(1);

  const handleRefresh = () => {
    setHeaderRefreshing(true);
    const d = new Date();
    setLastUpdated(
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    );
    setTimeout(() => setHeaderRefreshing(false), 600);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const formatAmount = (a: string) => `₵${Number(a).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const handleExport = () => {
    const headers = ["ID", "Due Date", "Property", "Customer", "Type", "Amount", "Status"];
    const rows = filteredPayments.map((p) =>
      [p.id, p.due_date, p.property_title ?? "", p.customer ?? "", PAYMENT_TYPE_LABEL[p.payment_type], formatAmount(p.amount), p.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return;
      const parsed: PaymentDisplay[] = [];
      const typeMap: Record<string, PaymentTypeApi> = { Rent: "rent", Deposit: "deposit", Sale: "deposit", "Late Fee": "late_fee" };
      const statusMap: Record<string, PaymentStatusApi> = { Success: "paid", Completed: "paid", paid: "paid", Pending: "pending", pending: "pending", Failed: "cancelled", cancelled: "cancelled" };
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
        if (vals.length >= 7) {
          const typeVal = vals[5] ?? vals[4] ?? "Rent";
          const amountVal = vals[6] ?? vals[5] ?? "0";
          const statusVal = vals[7] ?? vals[6] ?? "pending";
          parsed.push({
            id: 90000 + i,
            booking: 90000 + i,
            payment_type: typeMap[typeVal] ?? "rent",
            month_number: 1,
            amount: String(amountVal).replace(/[^\d.]/g, "") || "0",
            due_date: vals[1] || new Date().toISOString().slice(0, 10),
            status: statusMap[statusVal] ?? "pending",
            property_title: vals[2],
            customer: vals[3] ?? vals[4],
          });
        }
      }
      if (parsed.length > 0) {
        setPayments((prev) => [...parsed, ...prev]);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseDate = (d: string) => new Date(d).getTime() || 0;

  const filteredPayments = React.useMemo(() => {
    let list = payments;
    const s = search.toLowerCase();
    if (s) {
      list = list.filter(
        (p) =>
          String(p.id).includes(s) ||
          (p.customer && p.customer.toLowerCase().includes(s)) ||
          (p.property_title && p.property_title.toLowerCase().includes(s))
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((p) => p.payment_type === typeFilter);
    }
    return [...list].sort((a, b) => parseDate(b.due_date) - parseDate(a.due_date));
  }, [payments, search, statusFilter, typeFilter]);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagePayments = filteredPayments.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [search, statusFilter, typeFilter]);

  const allSelected = filteredPayments.length > 0 && filteredPayments.every((p) => selectedIds.has(p.id));
  const someSelected = filteredPayments.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterContainerRef.current?.contains(target)) return;
      if (rowMenuRef.current?.contains(target)) return;
      setRowMenuOpen(null);
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConfirmStatusChange = (paymentId: number, newStatus: PaymentStatusApi) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
    );
    if (statusFilter !== "all" && statusFilter !== newStatus) {
      setStatusFilter("all");
    }
    setStatusChangeModal(null);
    setRowMenuOpen(null);
  };

  const statusClass: Record<PaymentStatusApi, string> = {
    paid: "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]",
    pending: "bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]",
    overdue: "bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]",
    refunded: "bg-[#e0e7ff] text-[#4f46e5] border border-[#c7d2fe]",
    cancelled: "bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]",
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Transactions</h1>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Track and manage your property dashboard efficiently.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-[#f1f5f9] bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-[#f8fafc]"
            >
              <Calendar className="size-3.5 shrink-0 text-[#64748b]" />
              <span className="text-xs text-[#64748b]">Last updated: {lastUpdated}</span>
              <RefreshCw
                className={cn("size-3.5 shrink-0 text-[var(--logo)] transition-colors hover:text-[var(--logo-hover)]", headerRefreshing && "animate-spin")}
                aria-hidden
              />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              aria-hidden
            />
            <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-sm">
              <button
                type="button"
                onClick={handleImport}
                className="flex shrink-0 items-center gap-1.5 border-r border-[#e2e8f0] px-3 py-2 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
              >
                <Upload className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">Import</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
              >
                <Download className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Statistics */}
        <RevenueChart
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={handleRefresh}
        />

        {/* Summary cards */}
        <div className="grid gap-2 md:grid-cols-3">
          <div
            className="animate-fade-in-up flex items-center gap-2 rounded-lg border border-[#f1f5f9] bg-white p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#e2e8f0] hover:shadow-lg"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--logo-muted)]">
              <CheckCircle2 className="size-4 text-[var(--logo)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#64748b]">Completed Transactions</p>
              <p className="mt-0.5 text-lg font-bold text-[#1e293b]">134</p>
              <p className="mt-0.5 text-xs font-medium text-[#16a34a]">+15% from last month</p>
            </div>
          </div>
          <div
            className="animate-fade-in-up flex items-center gap-2 rounded-lg border border-[#f1f5f9] bg-white p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#e2e8f0] hover:shadow-lg"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--logo-muted)]">
              <Clock className="size-4 text-[var(--logo)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#64748b]">On Progress Transactions</p>
              <p className="mt-0.5 text-lg font-bold text-[#1e293b]">59</p>
              <p className="mt-0.5 text-xs font-medium text-[#ef4444]">-8.5% from last month</p>
            </div>
          </div>
          <div
            className="animate-fade-in-up flex items-center gap-2 rounded-lg border border-[#f1f5f9] bg-white p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#e2e8f0] hover:shadow-lg"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--logo-muted)]">
              <XCircle className="size-4 text-[var(--logo)]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#64748b]">Cancelled Transactions</p>
              <p className="mt-0.5 text-lg font-bold text-[#1e293b]">27</p>
              <p className="mt-0.5 text-xs text-[#64748b]">from last month</p>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="animate-fade-in-up overflow-hidden rounded-lg border border-[#f1f5f9] bg-white shadow-sm transition-all duration-200 ease-out hover:border-[#e2e8f0] hover:shadow-md">
          <div className="border-b border-[#f1f5f9] px-3 py-2">
            <h3 className="mb-2 text-base font-semibold text-[#1e293b]">Recent Payments</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="search"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-[#f1f5f9] bg-white py-1.5 pl-8 pr-2.5 text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  aria-label="Search payments"
                />
              </div>
              <div className="relative" ref={filterContainerRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    statusFilter !== "all"
                      ? "border-[var(--logo)] bg-[var(--logo-muted)] font-medium text-[var(--logo)] hover:bg-[var(--logo-muted)]"
                      : "border-[#f1f5f9] bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
                  )}
                >
                  <Filter className="size-3.5" />
                  Filter
                  {statusFilter !== "all" && (
                    <span className="size-1.5 rounded-full bg-[var(--logo)]" />
                  )}
                </button>
                {filterOpen && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                      Status
                    </p>
                    {(["all", "paid", "pending", "cancelled", "overdue", "refunded"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt);
                          setFilterOpen(false);
                        }}
                        className={cn(
                          "flex w-full px-4 py-2 text-left text-sm",
                          statusFilter === opt
                            ? "bg-[var(--logo-muted)] text-[var(--logo)] font-medium"
                            : "text-[#1e293b] hover:bg-[#f8fafc]"
                        )}
                      >
                        {opt === "all" ? "All statuses" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex items-center">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as PaymentTypeApi | "all")}
                  className="cursor-pointer appearance-none rounded-lg border border-[#e2e8f0] bg-white py-1.5 pl-2.5 pr-8 text-xs text-[#1e293b] transition-colors hover:border-[#cbd5e1] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                >
                  <option value="all">All</option>
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="late_fee">Late Fee</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-[#64748b]" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-xs">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-left text-[10px] font-medium uppercase tracking-wide text-[#64748b]">
                  <th className="px-3 py-2">
                    <SelectAllCheckbox
                      allSelected={allSelected}
                      someSelected={someSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Payment ID</th>
                  <th className="px-3 py-2 font-medium">Due Date</th>
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Customer Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="w-8 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {pagePayments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc]"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-[#cbd5e1]"
                        aria-label={`Select ${p.id}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1e293b]">{p.id}</td>
                    <td className="px-3 py-2 text-[#64748b]">{formatDate(p.due_date)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#1e293b]">{p.property_title ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[10px] font-medium text-[var(--logo)]">
                          {(p.customer ?? "?").charAt(0).toUpperCase()}
                        </div>
                        {p.customer ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-[var(--logo-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--logo)]">
                        {PAYMENT_TYPE_LABEL[p.payment_type]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1e293b]">{formatAmount(p.amount)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          statusClass[p.status]
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td
                      className="relative px-3 py-2"
                      ref={rowMenuOpen === p.id ? rowMenuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRowMenuOpen((v) => (v === p.id ? null : p.id));
                        }}
                        className="flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                        aria-label="More options"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                      {rowMenuOpen === p.id && (
                        <div
                          className="absolute right-0 top-full z-[100] mt-1 min-w-[160px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                            Change status
                          </p>
                          {(["paid", "pending", "cancelled"] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setStatusChangeModal({ paymentId: p.id, newStatus: status });
                                setRowMenuOpen(null);
                              }}
                              disabled={p.status === status}
                              className={cn(
                                "flex w-full px-4 py-2 text-left text-sm",
                                p.status === status
                                  ? "cursor-not-allowed text-[#94a3b8]"
                                  : "text-[#1e293b] hover:bg-[#f8fafc]"
                              )}
                            >
                              Change to {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredPayments.length}
            pageSize={PAGE_SIZE}
            currentPage={safePage}
            onPageChange={setPage}
            itemLabel="payments"
          />
          {filteredPayments.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[#94a3b8]">No payments found.</p>
          )}
        </div>
      </div>

      {/* Status change confirmation modal */}
      {statusChangeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setStatusChangeModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-[#1e293b]">Change status?</h3>
            <p className="mb-6 text-sm text-[#64748b]">
              Are you sure you want to change this payment&apos;s status to{" "}
              <span className="font-medium text-[#1e293b]">{statusChangeModal.newStatus}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusChangeModal(null);
                }}
                className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmStatusChange(statusChangeModal.paymentId, statusChangeModal.newStatus);
                }}
                className="rounded-lg bg-[var(--logo)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--logo-hover)]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
