"use client";

/**
 * Client detail – profile, transactions table, edit modal.
 * Loads from getClientDetail(clientId), getClientTransactions; filter, pagination.
 */
import * as React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Calendar, Edit3, FileText, Mail, Phone, MessageCircle, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import {
  getClientDetail,
  getClientTransactions,
  type ClientTransaction,
  type ClientTransactionStatus,
} from "@/lib/clients";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type RouteParams = {
  clientId: string;
};

export default function ClientDetail() {
  const { clientId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const detail = clientId ? getClientDetail(clientId) : undefined;
  const [transactions] = React.useState<ClientTransaction[]>(() =>
    clientId ? getClientTransactions(clientId) : []
  );

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ClientTransactionStatus>("all");
  const [page, setPage] = React.useState(1);
  const [selectedTxIds, setSelectedTxIds] = React.useState<Set<string>>(new Set());

  const [editName, setEditName] = React.useState(detail?.name ?? "");
  const [editEmail, setEditEmail] = React.useState(detail?.email ?? "");
  const [editBio, setEditBio] = React.useState(detail?.bio ?? "");

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  if (!detail) {
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
            <div className="mx-auto max-w-4xl rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
              <p className="text-[#64748b]">Client not found.</p>
              <Button
                onClick={() => navigate("/clients/clients")}
                variant="outline"
                className="mt-4"
              >
                Back to Clients
              </Button>
            </div>
          </main>
        </div>
        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          onConfirm={handleLogoutConfirm}
        />
      </div>
    );
  }

  const filteredTx = transactions.filter((tx) => {
    const term = search.trim().toLowerCase();
    if (term) {
      if (
        !(
          tx.id.includes(term) ||
          tx.paymentType.toLowerCase().includes(term) ||
          tx.dueDate.toLowerCase().includes(term)
        )
      ) {
        return false;
      }
    }
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    return true;
  });

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageTx = filteredTx.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [search, statusFilter]);

  const allChecked = filteredTx.length > 0 && filteredTx.every((t) => selectedTxIds.has(t.id));
  const someChecked = filteredTx.some((t) => selectedTxIds.has(t.id)) && !allChecked;

  const toggleAllTx = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(new Set(filteredTx.map((t) => t.id)));
    } else {
      setSelectedTxIds(new Set());
    }
  };

  const toggleOneTx = (id: string, checked: boolean) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleGenerateReport = () => {
    const header = ["Transaction ID", "Payment Type", "Due Date", "Amount", "Status"];
    const rows = transactions.map((t) => [
      t.id,
      t.paymentType,
      t.dueDate,
      t.amount.toString(),
      t.status,
    ]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `client-${detail.clientId}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditSave = () => {
    // For now, keep the edits local to this screen.
    setEditOpen(false);
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
            <Link
              to="/clients/clients"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[var(--logo)]"
            >
              <ArrowLeft className="size-4" />
              Back to Clients
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1e293b]">Client Details</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateReport}
                  className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                >
                  <FileText className="size-4 text-[var(--logo)]" />
                  Report
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                >
                  <Edit3 className="size-4" />
                  Edit Information
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
              <section className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[#0f172a]">Client Information</h2>
                <div className="mt-4 flex flex-wrap items-start gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xl font-semibold text-[var(--logo)]">
                    {detail.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-base font-semibold text-[#0f172a]">{editName}</p>
                    <p className="text-sm text-[#64748b]">{editEmail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${editEmail}`}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                        aria-label="Send email"
                      >
                        <Mail className="size-4" />
                      </a>
                      <a
                        href={`tel:${detail.phone}`}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                        aria-label="Call client"
                      >
                        <Phone className="size-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/messages?clientId=${detail.clientId}`)}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                        aria-label="Open messages"
                      >
                        <MessageCircle className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-[#0f172a]">Bio</p>
                  <p className="text-sm leading-relaxed text-[#64748b]">{editBio}</p>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[#0f172a]">Property Details</h2>
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#64748b]">Property Name</dt>
                    <dd className="mt-1 text-[#0f172a]">{detail.propertyName}</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Address Property</dt>
                    <dd className="mt-1 text-[#0f172a]">{detail.propertyAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Property Type</dt>
                    <dd className="mt-1">
                      <span className="inline-flex rounded-full bg-[var(--logo-muted)] px-3 py-0.5 text-xs font-medium text-[var(--logo)]">
                        {detail.propertyType}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Transaction Date</dt>
                    <dd className="mt-1 inline-flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-[var(--logo-muted)] px-3 py-0.5 font-medium text-[var(--logo)]">
                        <Calendar className="mr-1 size-3" />
                        {detail.transactionDate}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Transaction Type</dt>
                    <dd className="mt-1">
                      <span className="inline-flex rounded-full bg-[#ecfdf3] px-3 py-0.5 text-xs font-medium text-[#15803d]">
                        {detail.transactionType}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Rent Duration</dt>
                    <dd className="mt-1">
                      <span className="inline-flex rounded-full bg-[var(--logo-muted)] px-3 py-0.5 text-xs font-medium text-[var(--logo)]">
                        {detail.rentDuration}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <section className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[#0f172a]">Transaction Details</h2>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full rounded-full border-[#e2e8f0] bg-white pl-9 pr-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setStatusFilter((prev) => (prev === "Pending" ? "all" : "Pending"))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        statusFilter === "Pending"
                          ? "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
                          : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                      )}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter((prev) => (prev === "Paid" ? "all" : "Paid"))}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        statusFilter === "Paid"
                          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
                          : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                      )}
                    >
                      Paid
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full table-auto text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={(v) => toggleAllTx(Boolean(v))}
                          className={cn(
                            "border-[#cbd5e1]",
                            someChecked && "data-[state=indeterminate]:bg-[var(--logo-muted)]"
                          )}
                          aria-label="Select all transactions"
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Transaction ID</th>
                      <th className="px-4 py-3 text-left">Payment Type</th>
                      <th className="px-4 py-3 text-left">Due Date Payment</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageTx.map((tx) => {
                      const checked = selectedTxIds.has(tx.id);
                      return (
                        <tr
                          key={tx.id}
                          className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                        >
                          <td className="px-4 py-3 align-middle">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => toggleOneTx(tx.id, Boolean(v))}
                              className="border-[#cbd5e1]"
                              aria-label={`Select transaction ${tx.id}`}
                            />
                          </td>
                          <td className="px-4 py-3 align-middle text-[#0f172a]">{tx.id}</td>
                          <td className="px-4 py-3 align-middle text-[#0f172a]">
                            {tx.paymentType}
                          </td>
                          <td className="px-4 py-3 align-middle text-[#0f172a]">
                            {new Date(tx.dueDate).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-right align-middle text-[#0f172a]">
                            {tx.amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "GHS",
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-3 py-0.5 text-xs font-medium",
                                tx.status === "Pending" &&
                                  "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
                                tx.status === "Paid" &&
                                  "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
                              )}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle text-right text-lg text-[#94a3b8]">
                            ···
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTx.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-[#94a3b8]"
                        >
                          No transactions match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={filteredTx.length}
                pageSize={PAGE_SIZE}
                currentPage={safePage}
                onPageChange={setPage}
                itemLabel="transactions"
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

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Edit Information</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#64748b]" htmlFor="edit-name">
                  Full Name
                </label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-[#e2e8f0] bg-white text-[#0f172a]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#64748b]" htmlFor="edit-email">
                  Email
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="border-[#e2e8f0] bg-white text-[#0f172a]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#64748b]" htmlFor="edit-bio">
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                onClick={handleEditSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

