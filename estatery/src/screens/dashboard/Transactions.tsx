"use client";

import * as React from "react";
import {
  Calendar,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";

type PaymentStatus = "Success" | "Pending" | "Failed";
type PaymentType = "Rent" | "Sale";

type Payment = {
  id: string;
  date: string;
  property: string;
  address: string;
  customer: string;
  customerInitial: string;
  type: PaymentType;
  amount: string;
  status: PaymentStatus;
};

const PAYMENTS: Payment[] = [
  {
    id: "23487",
    date: "July 08, 2025",
    property: "Oak Grove Estates",
    address: "159 Elm St, Springfield, USA",
    customer: "David Martinez",
    customerInitial: "D",
    type: "Rent",
    amount: "₵293.00",
    status: "Success",
  },
  {
    id: "23488",
    date: "July 09, 2025",
    property: "Maple Heights",
    address: "78 Maple Ave, Springfield, USA",
    customer: "Sarah Johnson",
    customerInitial: "S",
    type: "Rent",
    amount: "₵320.00",
    status: "Success",
  },
  {
    id: "23489",
    date: "July 10, 2025",
    property: "Riverbend Apartments",
    address: "42 River Rd, Springfield, USA",
    customer: "Michael Smith",
    customerInitial: "M",
    type: "Rent",
    amount: "₵275.00",
    status: "Pending",
  },
  { id: "23490", date: "July 11, 2025", property: "Sunset Terrace", address: "321 Sunset Blvd", customer: "Emma Wilson", customerInitial: "E", type: "Rent", amount: "₵450.00", status: "Success" },
  { id: "23491", date: "July 12, 2025", property: "Lakeside Villa", address: "555 Lake Dr", customer: "James Brown", customerInitial: "J", type: "Sale", amount: "₵8,500.00", status: "Success" },
  { id: "23492", date: "July 13, 2025", property: "Urban Heights", address: "100 Main St", customer: "Anna Davis", customerInitial: "A", type: "Rent", amount: "₵380.00", status: "Pending" },
  { id: "23493", date: "July 14, 2025", property: "Green Valley", address: "200 Valley Rd", customer: "Chris Lee", customerInitial: "C", type: "Rent", amount: "₵520.00", status: "Success" },
  { id: "23494", date: "July 15, 2025", property: "Harbor View", address: "77 Harbor St", customer: "Maria Garcia", customerInitial: "M", type: "Sale", amount: "₵12,000.00", status: "Failed" },
  { id: "23495", date: "July 16, 2025", property: "Park Place", address: "88 Park Ave", customer: "Tom Anderson", customerInitial: "T", type: "Rent", amount: "₵610.00", status: "Pending" },
  { id: "23496", date: "July 17, 2025", property: "Riverside", address: "33 River Ln", customer: "Lisa Moore", customerInitial: "L", type: "Rent", amount: "₵295.00", status: "Success" },
  { id: "23497", date: "July 18, 2025", property: "Hilltop Manor", address: "99 Hill Rd", customer: "Paul Clark", customerInitial: "P", type: "Sale", amount: "₵9,200.00", status: "Pending" },
  { id: "23498", date: "July 19, 2025", property: "Downtown Loft", address: "44 Center St", customer: "Rachel Green", customerInitial: "R", type: "Rent", amount: "₵720.00", status: "Success" },
  { id: "23499", date: "July 20, 2025", property: "Garden View", address: "12 Garden St", customer: "Steve Adams", customerInitial: "S", type: "Rent", amount: "₵410.00", status: "Success" },
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
              <span className="flex items-center gap-1 font-medium text-[#1976d2]">
                <TrendingUp className="size-3" />
                ↑ {changePercent.replace(",", ".")}%
              </span>
              from last period
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#1976d2]" />
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
              <stop offset="0%" stopColor="#1976d2" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1976d2" stopOpacity={0.02} />
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
            stroke="#1976d2"
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
                fill="#1976d2"
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
                <span className="font-semibold text-[#1976d2]">
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
  const [payments, setPayments] = React.useState<Payment[]>(PAYMENTS);
  const [search, setSearch] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [rowMenuOpen, setRowMenuOpen] = React.useState<string | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | "all">("all");
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

  const handleExport = () => {
    const headers = ["ID", "Date", "Property", "Address", "Customer", "Type", "Amount", "Status"];
    const rows = filteredPayments.map((p) =>
      [p.id, p.date, p.property, p.address, p.customer, p.type, p.amount, p.status]
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
      const parsed: Payment[] = [];
      const header = lines[0].toLowerCase();
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
        if (vals.length >= 8) {
          parsed.push({
            id: vals[0] || `imp-${i}`,
            date: vals[1] || "",
            property: vals[2] || "",
            address: vals[3] || "",
            customer: vals[4] || "",
            customerInitial: (vals[4]?.[0] ?? "?").toUpperCase(),
            type: (vals[5] === "Sale" ? "Sale" : "Rent") as PaymentType,
            amount: vals[6] || "",
            status: (vals[7] === "Success" || vals[7] === "Failed" ? vals[7] : "Pending") as PaymentStatus,
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

  const filteredPayments = React.useMemo(() => {
    let list = payments;
    const s = search.toLowerCase();
    if (s) {
      list = list.filter(
        (p) =>
          p.id.includes(s) ||
          p.customer.toLowerCase().includes(s) ||
          p.property.toLowerCase().includes(s) ||
          p.address.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (sortAsc) {
      list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    } else {
      list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [payments, search, statusFilter, sortAsc]);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagePayments = filteredPayments.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [search, statusFilter, sortAsc]);

  const allSelected = filteredPayments.length > 0 && filteredPayments.every((p) => selectedIds.has(p.id));
  const someSelected = filteredPayments.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  React.useEffect(() => {
    const handler = () => {
      setRowMenuOpen(null);
      setFilterOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const statusClass: Record<PaymentStatus, string> = {
    Success: "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]",
    Pending: "bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]",
    Failed: "bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]",
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
              <CheckCircle2 className="size-4 text-[#1976d2]" />
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
              <Clock className="size-4 text-[#1976d2]" />
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
              <XCircle className="size-4 text-[#1976d2]" />
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
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterOpen((v) => !v);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-[#f1f5f9] bg-white px-2.5 py-1.5 text-xs text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
                >
                  <Filter className="size-3.5" />
                  Filter
                </button>
                {filterOpen && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["all", "Success", "Pending", "Failed"] as const).map((opt) => (
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
                        {opt === "all" ? "All statuses" : opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSortAsc((a) => !a)}
                className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
              >
                <ArrowUpDown className="size-3.5" />
                Sort by
              </button>
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
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Property Info</th>
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
                    <td className="px-3 py-2 text-[#64748b]">{p.date}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#1e293b]">{p.property}</p>
                      <p className="text-xs text-[#64748b]">{p.address}</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[10px] font-medium text-[var(--logo)]">
                          {p.customerInitial}
                        </div>
                        {p.customer}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-xs font-medium text-[#1d4ed8]">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1e293b]">{p.amount}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusClass[p.status]
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="relative px-3 py-2">
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
                          className="absolute right-4 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              alert(`View payment ${p.id}`);
                              setRowMenuOpen(null);
                            }}
                            className="flex w-full px-4 py-2 text-left text-sm text-[#1e293b] hover:bg-[#f8fafc]"
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Edit payment ${p.id}`);
                              setRowMenuOpen(null);
                            }}
                            className="flex w-full px-4 py-2 text-left text-sm text-[#1e293b] hover:bg-[#f8fafc]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayments((prev) => prev.filter((x) => x.id !== p.id));
                              setRowMenuOpen(null);
                            }}
                            className="flex w-full px-4 py-2 text-left text-sm text-[#ef4444] hover:bg-[#fef2f2]"
                          >
                            Delete
                          </button>
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
    </DashboardLayout>
  );
}
