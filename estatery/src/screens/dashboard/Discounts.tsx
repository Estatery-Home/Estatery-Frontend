"use client";

/**
 * Discounts – promo codes (Active/Scheduled/Expired).
 * Add modal, toggle status, pagination.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Percent, Clock, CheckCircle2 } from "lucide-react";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";

type DiscountStatus = "Active" | "Scheduled" | "Expired";

type Discount = {
  id: string;
  name: string;
  code: string;
  percentage: number;
  propertiesCount: number;
  startDate: string;
  endDate: string;
  status: DiscountStatus;
};

const initialDiscounts: Discount[] = [
  {
    id: "D-1021",
    name: "Summer Move-In",
    code: "SUMMER25",
    percentage: 25,
    propertiesCount: 8,
    startDate: "2025-07-01",
    endDate: "2025-08-31",
    status: "Active",
  },
  {
    id: "D-1022",
    name: "New Listing Promo",
    code: "NEWLIST10",
    percentage: 10,
    propertiesCount: 5,
    startDate: "2025-08-01",
    endDate: "2025-09-01",
    status: "Scheduled",
  },
  {
    id: "D-1019",
    name: "Spring Flash Sale",
    code: "SPRING15",
    percentage: 15,
    propertiesCount: 12,
    startDate: "2025-04-01",
    endDate: "2025-04-30",
    status: "Expired",
  },
];

export default function Discounts() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [discounts, setDiscounts] = React.useState<Discount[]>(initialDiscounts);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const [draftName, setDraftName] = React.useState("");
  const [draftCode, setDraftCode] = React.useState("");
  const [draftPercent, setDraftPercent] = React.useState("10");
  const [draftStart, setDraftStart] = React.useState("");
  const [draftEnd, setDraftEnd] = React.useState("");

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const totalActive = discounts.filter((d) => d.status === "Active").length;
  const totalScheduled = discounts.filter((d) => d.status === "Scheduled").length;
  const totalExpired = discounts.filter((d) => d.status === "Expired").length;
  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(discounts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageDiscounts = discounts.slice(startIdx, startIdx + PAGE_SIZE);

  /* Toggle Active ↔ Expired for a discount */
  const handleToggleStatus = (id: string) => {
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (d.status === "Active") return { ...d, status: "Expired" };
        if (d.status === "Expired") return { ...d, status: "Active" };
        return d;
      })
    );
  };

  const handleSave = () => {
    const name = draftName.trim();
    const code = draftCode.trim().toUpperCase();
    const percent = Number(draftPercent);
    if (!name || !code || !draftStart || !draftEnd || !percent) return;
    setDiscounts((prev) => [
      ...prev,
      {
        id: `D-${1000 + prev.length + 1}`,
        name,
        code,
        percentage: percent,
        propertiesCount: 0,
        startDate: draftStart,
        endDate: draftEnd,
        status: "Scheduled",
      },
    ]);
    setModalOpen(false);
    setDraftName("");
    setDraftCode("");
    setDraftPercent("10");
    setDraftStart("");
    setDraftEnd("");
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-2.75rem)] flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Discounts</h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Manage discount codes and campaigns across your properties.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[var(--logo)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--logo-hover)]"
              >
                <Tag className="size-4" />
                Create Discount
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Percent className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Active Discounts</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{totalActive}</p>
                </div>
              </div>
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fffbeb] text-[#b45309] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Clock className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Scheduled</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{totalScheduled}</p>
                </div>
              </div>
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Expired</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{totalExpired}</p>
                </div>
              </div>
            </div>

            <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
              <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                Discount Campaigns
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full table-auto text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Discount</th>
                      <th className="px-4 py-2 text-left">Properties</th>
                      <th className="px-4 py-2 text-left">Start</th>
                      <th className="px-4 py-2 text-left">End</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageDiscounts.map((d) => (
                      <tr key={d.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                        <td className="px-4 py-2 align-middle text-sm text-[#0f172a]">
                          {d.name}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs font-mono text-[#334155]">
                          {d.code}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                          {d.percentage}% off
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                          {d.propertiesCount}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#94a3b8]">
                          {d.startDate}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#94a3b8]">
                          {d.endDate}
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-0.5 text-xs font-medium",
                              d.status === "Active" &&
                                "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] border",
                              d.status === "Scheduled" &&
                                "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c] border",
                              d.status === "Expired" &&
                                "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] border"
                            )}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 align-middle text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(d.id)}
                            className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                          >
                            {d.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {discounts.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-[#94a3b8]"
                        >
                          No discounts configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={discounts.length}
                pageSize={PAGE_SIZE}
                currentPage={safePage}
                onPageChange={setPage}
                itemLabel="discounts"
              />
            </section>
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
            <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Create Discount</h3>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="discount-name" className="text-xs font-medium text-[#64748b]">
                  Name
                </label>
                <input
                  id="discount-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="discount-code" className="text-xs font-medium text-[#64748b]">
                  Code
                </label>
                <input
                  id="discount-code"
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] uppercase focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="discount-percent" className="text-xs font-medium text-[#64748b]">
                    Percentage
                  </label>
                  <input
                    id="discount-percent"
                    type="number"
                    min={1}
                    max={100}
                    value={draftPercent}
                    onChange={(e) => setDraftPercent(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="discount-start" className="text-xs font-medium text-[#64748b]">
                    Start date
                  </label>
                  <input
                    id="discount-start"
                    type="date"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="discount-end" className="text-xs font-medium text-[#64748b]">
                  End date
                </label>
                <input
                  id="discount-end"
                  type="date"
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
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
                onClick={handleSave}
              >
                Save Discount
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

