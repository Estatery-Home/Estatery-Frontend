"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ArrowUpRight } from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { properties } from "@/lib/properties";

type LeadStage = "New" | "Contacted" | "Tour Scheduled" | "Negotiation" | "Closed";

type Lead = {
  id: string;
  name: string;
  email: string;
  propertyId: string;
  source: "Website" | "Referral" | "Ads";
  budget: string;
  stage: LeadStage;
  createdAt: string;
};

const mockLeads: Lead[] = [
  {
    id: "L-3421",
    name: "James Smith",
    email: "james.smith@example.com",
    propertyId: "03483",
    source: "Website",
    budget: "$600–$800 / month",
    stage: "New",
    createdAt: "2025-07-10",
  },
  {
    id: "L-3422",
    name: "Linda Johnson",
    email: "linda.johnson@example.com",
    propertyId: "03484",
    source: "Ads",
    budget: "$1,000–$1,400 / month",
    stage: "Contacted",
    createdAt: "2025-07-09",
  },
  {
    id: "L-3423",
    name: "Robert Brown",
    email: "robert.brown@example.com",
    propertyId: "03485",
    source: "Referral",
    budget: "$2,000–$3,000 / month",
    stage: "Tour Scheduled",
    createdAt: "2025-07-08",
  },
  {
    id: "L-3424",
    name: "Jessica Wilson",
    email: "jessica.wilson@example.com",
    propertyId: "03486",
    source: "Website",
    budget: "$700–$900 / month",
    stage: "Negotiation",
    createdAt: "2025-07-05",
  },
  {
    id: "L-3425",
    name: "Michael Taylor",
    email: "michael.taylor@example.com",
    propertyId: "03487",
    source: "Referral",
    budget: "$1,200–$1,800 / month",
    stage: "Closed",
    createdAt: "2025-07-02",
  },
];

export default function Leads() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [stageFilter, setStageFilter] = React.useState<LeadStage | "All">("All");
  const [search, setSearch] = React.useState("");
  const [leads, setLeads] = React.useState<Lead[]>(mockLeads);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.stage !== "Closed").length;
  const closedLeads = leads.filter((l) => l.stage === "Closed").length;
  const conversionRate = totalLeads === 0 ? 0 : Math.round((closedLeads / totalLeads) * 100);

  const filteredLeads = leads.filter((l) => {
    if (stageFilter !== "All" && l.stage !== stageFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      l.name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.id.toLowerCase().includes(term)
    );
  });

  const handleAdvanceStage = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const stages: LeadStage[] = ["New", "Contacted", "Tour Scheduled", "Negotiation", "Closed"];
        const idx = stages.indexOf(l.stage);
        const nextStage = stages[Math.min(idx + 1, stages.length - 1)];
        return { ...l, stage: nextStage };
      })
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
                <h1 className="text-2xl font-bold text-[#1e293b]">Leads</h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Track incoming leads, follow up quickly, and convert them into clients.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-xs text-[#64748b]">
                  <Filter className="size-3" />
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as LeadStage | "All")}
                    className="bg-transparent text-xs outline-none"
                  >
                    <option value="All">All stages</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Tour Scheduled">Tour Scheduled</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads..."
                  className="w-40 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Total Leads</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{totalLeads}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Active Pipeline</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{activeLeads}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#64748b]">Conversion Rate</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{conversionRate}%</p>
              </div>
            </div>

            <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
              <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">
                Pipeline
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full table-auto text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="px-4 py-2 text-left">Lead ID</th>
                      <th className="px-4 py-2 text-left">Lead Name</th>
                      <th className="px-4 py-2 text-left">Property</th>
                      <th className="px-4 py-2 text-left">Source</th>
                      <th className="px-4 py-2 text-left">Budget</th>
                      <th className="px-4 py-2 text-left">Stage</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const property = properties.find((p) => p.id === lead.propertyId);
                      return (
                        <tr key={lead.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                          <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                            {lead.id}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[#0f172a]">
                                {lead.name}
                              </span>
                              <span className="text-xs text-[#94a3b8]">{lead.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            {property ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/dashboard/properties/${property.id}`)
                                }
                                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--logo)] hover:underline"
                              >
                                {property.name}
                                <ArrowUpRight className="size-3" />
                              </button>
                            ) : (
                              <span className="text-xs text-[#94a3b8]">Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                            {lead.source}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                            {lead.budget}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-3 py-0.5 text-xs font-medium",
                                lead.stage === "New" &&
                                  "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] border",
                                lead.stage === "Contacted" &&
                                  "border-[#a5b4fc] bg-[#eef2ff] text-[#4f46e5] border",
                                lead.stage === "Tour Scheduled" &&
                                  "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c] border",
                                lead.stage === "Negotiation" &&
                                  "border-[#fcd34d] bg-[#fffbeb] text-[#b45309] border",
                                lead.stage === "Closed" &&
                                  "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] border"
                              )}
                            >
                              {lead.stage}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-[#94a3b8]">
                            {lead.createdAt}
                          </td>
                          <td className="px-4 py-2 align-middle text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdvanceStage(lead.id)}
                              className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                            >
                              Advance
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-[#94a3b8]"
                        >
                          No leads match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

