"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Phone,
  Mail,
  Search,
  Users,
  UserCheck,
  Clock,
  Building2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";

type AgentStatus = "Active" | "Pending" | "Inactive";

type Agent = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  properties: number;
  dealsClosed: number;
  rating: number;
  status: AgentStatus;
};

const mockAgents: Agent[] = [
  {
    id: "A-1021",
    name: "Sarah Lee",
    initials: "SL",
    email: "sarah.lee@example.com",
    phone: "+1 (555) 011-2345",
    properties: 24,
    dealsClosed: 18,
    rating: 4.9,
    status: "Active",
  },
  {
    id: "A-1022",
    name: "Jonathan Cruz",
    initials: "JC",
    email: "jonathan.cruz@example.com",
    phone: "+1 (555) 016-7890",
    properties: 15,
    dealsClosed: 9,
    rating: 4.6,
    status: "Pending",
  },
  {
    id: "A-1023",
    name: "Amanda Lee",
    initials: "AL",
    email: "amanda.lee@example.com",
    phone: "+1 (555) 018-9876",
    properties: 12,
    dealsClosed: 7,
    rating: 4.4,
    status: "Active",
  },
  {
    id: "A-1024",
    name: "Robert Brown",
    initials: "RB",
    email: "robert.brown@example.com",
    phone: "+1 (555) 017-4456",
    properties: 4,
    dealsClosed: 2,
    rating: 4.1,
    status: "Inactive",
  },
];

const AVATAR_GRADIENTS = [
  "from-[#6366f1] to-[#8b5cf6]",
  "from-[#0ea5e9] to-[#06b6d4]",
  "from-[#f59e0b] to-[#f97316]",
  "from-[#10b981] to-[#14b8a6]",
];

const statCards = [
  {
    title: "Total Agents",
    valueKey: "total" as const,
    icon: Users,
    gradient: "from-[#6366f1] to-[#8b5cf6]",
    bgMuted: "bg-indigo-50",
  },
  {
    title: "Active",
    valueKey: "active" as const,
    icon: UserCheck,
    gradient: "from-[#10b981] to-[#14b8a6]",
    bgMuted: "bg-emerald-50",
  },
  {
    title: "Pending approvals",
    valueKey: "pending" as const,
    icon: Clock,
    gradient: "from-[#f59e0b] to-[#f97316]",
    bgMuted: "bg-amber-50",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function nextAgentId(agents: Agent[]): string {
  const nums = agents
    .map((a) => parseInt(a.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1024;
  return `A-${max + 1}`;
}

export default function Agents() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<AgentStatus | "All">("All");
  const [search, setSearch] = React.useState("");
  const [agents, setAgents] = React.useState<Agent[]>(mockAgents);
  const [page, setPage] = React.useState(1);
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);
  const [addAgentOpen, setAddAgentOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "Active").length;
  const pendingAgents = agents.filter((a) => a.status === "Pending").length;

  const statValues = { total: totalAgents, active: activeAgents, pending: pendingAgents };

  const filteredAgents = agents.filter((a) => {
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.id.toLowerCase().includes(term)
    );
  });

  const PAGE_SIZE = 8;
  const pageCount = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageAgents = filteredAgents.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [statusFilter, search]);

  const handleApprove = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id && a.status === "Pending" ? { ...a, status: "Active" } : a))
    );
  };

  const handleDeactivate = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id && a.status === "Active" ? { ...a, status: "Inactive" } : a))
    );
    setSelectedAgent((prev) =>
      prev?.id === id ? { ...prev, status: "Inactive" as const } : prev
    );
  };

  const handleSetActive = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id && a.status === "Inactive" ? { ...a, status: "Active" } : a))
    );
    setSelectedAgent((prev) =>
      prev?.id === id ? { ...prev, status: "Active" as const } : prev
    );
  };

  const handleApproveFromDetail = (id: string) => {
    handleApprove(id);
    setSelectedAgent((prev) =>
      prev?.id === id ? { ...prev, status: "Active" as const } : prev
    );
  };

  const [newAgent, setNewAgent] = React.useState({
    name: "",
    email: "",
    phone: "",
    properties: 0,
    dealsClosed: 0,
  });

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newAgent.name.trim();
    const email = newAgent.email.trim();
    const phone = newAgent.phone.trim();
    if (!name || !email) return;
    const id = nextAgentId(agents);
    const agent: Agent = {
      id,
      name,
      initials: getInitials(name),
      email,
      phone: phone || "—",
      properties: newAgent.properties || 0,
      dealsClosed: newAgent.dealsClosed || 0,
      rating: 4.0,
      status: "Pending",
    };
    setAgents((prev) => [agent, ...prev]);
    setNewAgent({ name: "", email: "", phone: "", properties: 0, dealsClosed: 0 });
    setAddAgentOpen(false);
  };

  const showTableView = viewMode === "table" || filteredAgents.length > 12;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
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
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#475569] px-6 py-8 text-white shadow-xl">
              <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agents</h1>
                  <p className="mt-2 max-w-md text-sm text-slate-300">
                    Manage your sales team, track performance, and approve new agents.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <Sparkles className="size-4 text-amber-300" />
                  <span className="text-sm font-medium">Team ready</span>
                </div>
              </div>
            </div>

            {/* Stats cards + Performance tips + Approve queue */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.title}</p>
                      <p className="mt-1 text-3xl font-bold text-slate-800">
                        {statValues[card.valueKey]}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                        card.gradient
                      )}
                    >
                      <card.icon className="size-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <div className="relative flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                    <Sparkles className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Performance tips</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Agents with quick response times close up to 3x more deals.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <div className="relative flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Clock className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Approval queue</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      New sign-ups appear here for review. Use Approve to activate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search, Filters, Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AgentStatus | "All")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    viewMode === "cards"
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                  aria-label="Card view"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    viewMode === "table"
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                  aria-label="Table view"
                >
                  <List className="size-4" />
                </button>
              </div>
              <Button
                type="button"
                onClick={() => setAddAgentOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[var(--logo)] text-white hover:opacity-90"
              >
                <Plus className="size-4" />
                Add Agent
              </Button>
            </div>

            {/* Agent cards grid */}
            <div>
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-800">Agent Directory</h2>

                {showTableView ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                    {filteredAgents.length === 0 ? (
                      <div className="py-16 text-center">
                        <Users className="mx-auto size-12 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-600">
                          No agents match your filters
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try adjusting your search or status filter
                        </p>
                      </div>
                    ) : (
                    <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Agent</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Properties</th>
                            <th className="px-4 py-3">Deals</th>
                            <th className="px-4 py-3">Rating</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageAgents.map((agent, idx) => (
                            <tr
                              key={agent.id}
                              onClick={() => setSelectedAgent(agent)}
                              className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white",
                                      AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                                    )}
                                  >
                                    {agent.initials}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{agent.name}</p>
                                    <p className="text-xs text-slate-500">{agent.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                <a href={`mailto:${agent.email}`} className="hover:text-[var(--logo)]" onClick={(e) => e.stopPropagation()}>
                                  {agent.email}
                                </a>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{agent.properties}</td>
                              <td className="px-4 py-3 text-slate-700">{agent.dealsClosed}</td>
                              <td className="px-4 py-3">
                                <span className="flex items-center gap-1">
                                  <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                  {agent.rating.toFixed(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    agent.status === "Active" && "bg-emerald-100 text-emerald-700",
                                    agent.status === "Pending" && "bg-amber-100 text-amber-700",
                                    agent.status === "Inactive" && "bg-slate-100 text-slate-500"
                                  )}
                                >
                                  {agent.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                {agent.status === "Pending" && (
                                  <Button size="sm" onClick={() => handleApprove(agent.id)} className="mr-1">
                                    Approve
                                  </Button>
                                )}
                                {agent.status === "Active" && (
                                  <Button size="sm" variant="outline" onClick={() => handleDeactivate(agent.id)}>
                                    Deactivate
                                  </Button>
                                )}
                                {agent.status === "Inactive" && (
                                  <Button size="sm" onClick={() => handleSetActive(agent.id)}>
                                    Set Active
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      totalItems={filteredAgents.length}
                      pageSize={PAGE_SIZE}
                      currentPage={safePage}
                      onPageChange={setPage}
                      itemLabel="agents"
                    />
                    </>
                    )}
                  </div>
                ) : (
                <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {pageAgents.map((agent, idx) => (
                    <div
                      key={agent.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAgent(agent)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedAgent(agent)}
                      className="group relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-600 group-hover:translate-x-full" />
                      <div className="relative flex flex-1 flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md",
                                AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                              )}
                            >
                              {agent.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">{agent.name}</p>
                              <p className="truncate text-xs text-slate-500">{agent.id}</p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                              agent.status === "Active" &&
                                "bg-emerald-100 text-emerald-700 border border-emerald-200",
                              agent.status === "Pending" &&
                                "bg-amber-100 text-amber-700 border border-amber-200",
                              agent.status === "Inactive" &&
                                "bg-slate-100 text-slate-500 border border-slate-200"
                            )}
                          >
                            {agent.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <Building2 className="size-3.5 shrink-0 text-slate-500" />
                            <span className="font-medium text-slate-700">{agent.properties}</span>
                            <span className="text-slate-500">props</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <TrendingUp className="size-3.5 shrink-0 text-slate-500" />
                            <span className="font-medium text-slate-700">{agent.dealsClosed}</span>
                            <span className="text-slate-500">deals</span>
                          </div>
                          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5">
                            <Star className="size-3.5 shrink-0 fill-amber-500 text-amber-500" />
                            <span className="font-medium text-slate-700">
                              {agent.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                          <a
                            href={`mailto:${agent.email}`}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--logo)]"
                          >
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{agent.email}</span>
                          </a>
                          <a
                            href={`tel:${agent.phone}`}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--logo)]"
                          >
                            <Phone className="size-3.5 shrink-0" />
                            <span className="truncate">{agent.phone}</span>
                          </a>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <div className="min-w-0 flex-1">
                            {agent.status === "Pending" && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleApprove(agent.id)}
                                className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Approve
                              </Button>
                            )}
                            {agent.status === "Active" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeactivate(agent.id)}
                                className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                Deactivate
                              </Button>
                            )}
                            {agent.status === "Inactive" && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSetActive(agent.id)}
                                className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Set Active
                              </Button>
                            )}
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAgents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                    <Users className="mx-auto size-12 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No agents match your filters
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try adjusting your search or status filter
                    </p>
                  </div>
                )}

                {!showTableView && filteredAgents.length > 0 && (
                  <div className="mt-6 rounded-xl border border-slate-200/80 bg-white">
                    <Pagination
                      totalItems={filteredAgents.length}
                      pageSize={PAGE_SIZE}
                      currentPage={safePage}
                      onPageChange={setPage}
                      itemLabel="agents"
                    />
                  </div>
                )}
                </>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setSelectedAgent(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-detail-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white",
                    AVATAR_GRADIENTS[Math.max(0, agents.findIndex((a) => a.id === selectedAgent.id)) % AVATAR_GRADIENTS.length]
                  )}
                >
                  {selectedAgent.initials}
                </div>
                <div>
                  <h2 id="agent-detail-title" className="text-xl font-bold text-slate-800">
                    {selectedAgent.name}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedAgent.id}</p>
                  <span
                    className={cn(
                      "mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium",
                      selectedAgent.status === "Active" &&
                        "bg-emerald-100 text-emerald-700",
                      selectedAgent.status === "Pending" &&
                        "bg-amber-100 text-amber-700",
                      selectedAgent.status === "Inactive" &&
                        "bg-slate-100 text-slate-500"
                    )}
                  >
                    {selectedAgent.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</p>
                <a
                  href={`mailto:${selectedAgent.email}`}
                  className="mt-1 flex items-center gap-2 text-slate-700 hover:text-[var(--logo)]"
                >
                  <Mail className="size-4" />
                  {selectedAgent.email}
                </a>
                <a
                  href={`tel:${selectedAgent.phone}`}
                  className="mt-1 flex items-center gap-2 text-slate-700 hover:text-[var(--logo)]"
                >
                  <Phone className="size-4" />
                  {selectedAgent.phone}
                </a>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Performance</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <Building2 className="size-4 text-slate-500" />
                    <span className="font-medium">{selectedAgent.properties}</span>
                    <span className="text-slate-500">properties</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <TrendingUp className="size-4 text-slate-500" />
                    <span className="font-medium">{selectedAgent.dealsClosed}</span>
                    <span className="text-slate-500">deals closed</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                    <Star className="size-4 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{selectedAgent.rating.toFixed(1)}</span>
                    <span className="text-slate-500">rating</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedAgent.status === "Pending" && (
                <Button
                  onClick={() => handleApproveFromDetail(selectedAgent.id)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve
                </Button>
              )}
              {selectedAgent.status === "Active" && (
                <Button variant="outline" onClick={() => handleDeactivate(selectedAgent.id)}>
                  Deactivate
                </Button>
              )}
              {selectedAgent.status === "Inactive" && (
                <Button
                  onClick={() => handleSetActive(selectedAgent.id)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Set to Active
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add Agent Modal */}
      {addAgentOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setAddAgentOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-agent-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="add-agent-title" className="text-xl font-bold text-slate-800">
                Add Agent
              </h2>
              <button
                type="button"
                onClick={() => setAddAgentOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="agent-name" className="text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="agent-name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="agent-email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="agent-email"
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent((p) => ({ ...p, email: e.target.value }))}
                  placeholder="agent@example.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="agent-phone" className="text-slate-700">
                  Phone
                </Label>
                <Input
                  id="agent-phone"
                  type="tel"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent-properties" className="text-slate-700">
                    Properties
                  </Label>
                  <Input
                    id="agent-properties"
                    type="number"
                    min={0}
                    value={newAgent.properties || ""}
                    onChange={(e) =>
                      setNewAgent((p) => ({
                        ...p,
                        properties: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-deals" className="text-slate-700">
                    Deals Closed
                  </Label>
                  <Input
                    id="agent-deals"
                    type="number"
                    min={0}
                    value={newAgent.dealsClosed || ""}
                    onChange={(e) =>
                      setNewAgent((p) => ({
                        ...p,
                        dealsClosed: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddAgentOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[var(--logo)] text-white hover:opacity-90">
                  Add Agent
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
