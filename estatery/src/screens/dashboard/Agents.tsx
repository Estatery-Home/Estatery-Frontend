"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Phone, Mail, Filter } from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function Agents() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<AgentStatus | "All">("All");
  const [search, setSearch] = React.useState("");
  const [agents, setAgents] = React.useState<Agent[]>(mockAgents);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "Active").length;
  const pendingAgents = agents.filter((a) => a.status === "Pending").length;

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

  const handleApprove = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id && a.status === "Pending" ? { ...a, status: "Active" } : a))
    );
  };

  const handleDeactivate = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id && a.status === "Active" ? { ...a, status: "Inactive" } : a))
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
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Agents</h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Manage your sales agents, approvals, and performance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-xs text-[#64748b]">
                  <Filter className="size-3" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as AgentStatus | "All")}
                    className="bg-transparent text-xs outline-none"
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="w-40 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Total Agents</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{totalAgents}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Active</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{activeAgents}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Pending approvals</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{pendingAgents}</p>
              </div>
            </div>

            <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
              <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
                <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                  Agent Directory
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full table-auto text-sm">
                    <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      <tr>
                        <th className="px-4 py-2 text-left">Agent</th>
                        <th className="px-4 py-2 text-left">Contact</th>
                        <th className="px-4 py-2 text-left">Properties</th>
                        <th className="px-4 py-2 text-left">Deals Closed</th>
                        <th className="px-4 py-2 text-left">Rating</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((agent) => (
                        <tr
                          key={agent.id}
                          className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                        >
                          <td className="px-4 py-2 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-semibold text-[var(--logo)]">
                                {agent.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#0f172a]">
                                  {agent.name}
                                </p>
                                <p className="truncate text-xs text-[#94a3b8]">{agent.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <div className="flex flex-col gap-0.5 text-xs text-[#64748b]">
                              <a href={`mailto:${agent.email}`} className="hover:text-[var(--logo)]">
                                {agent.email}
                              </a>
                              <a href={`tel:${agent.phone}`} className="hover:text-[var(--logo)]">
                                {agent.phone}
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">
                            {agent.properties}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">
                            {agent.dealsClosed}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <div className="flex items-center gap-1 text-xs text-[#fbbf24]">
                              <Star className="size-3 fill-[#fbbf24]" />
                              <span className="text-[#0f172a]">{agent.rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-3 py-0.5 text-xs font-medium",
                                agent.status === "Active" &&
                                  "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] border",
                                agent.status === "Pending" &&
                                  "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c] border",
                                agent.status === "Inactive" &&
                                  "border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] border"
                              )}
                            >
                              {agent.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-right">
                            <div className="inline-flex gap-2">
                              {agent.status === "Pending" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(agent.id)}
                                  className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
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
                                  className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                                >
                                  Deactivate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[#0f172a]">Performance tips</p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    Agents with quick response times and consistent follow-ups close up to 3x more
                    deals. Assign hot leads to your highest rated agents to increase conversion.
                  </p>
                </section>
                <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[#0f172a]">Approval queue</p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    New agent sign-ups from the Notifications page will appear here for review. Use
                    the Approve button in the directory to activate their account.
                  </p>
                </section>
              </div>
            </section>
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

