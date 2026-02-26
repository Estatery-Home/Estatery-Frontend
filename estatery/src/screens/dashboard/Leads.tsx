"use client";

/**
 * Leads screen – pipeline (New → Contacted → Tour → Negotiation → Closed).
 * Search, filter by stage, pagination; uses PropertiesContext for property names.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  ArrowUpRight,
  Search,
  Globe,
  Megaphone,
  Users,
  ChevronRight,
} from "lucide-react";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { useProperties } from "@/contexts/PropertiesContext";
import { LeadsSummaryCards } from "@/components/leads/LeadCards";

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
    budget: "₵600–₵800 / month",
    stage: "New",
    createdAt: "2025-07-10",
  },
  {
    id: "L-3422",
    name: "Linda Johnson",
    email: "linda.johnson@example.com",
    propertyId: "03484",
    source: "Ads",
    budget: "₵1,000–₵1,400 / month",
    stage: "Contacted",
    createdAt: "2025-07-09",
  },
  {
    id: "L-3423",
    name: "Robert Brown",
    email: "robert.brown@example.com",
    propertyId: "03485",
    source: "Referral",
    budget: "₵2,000–₵3,000 / month",
    stage: "Tour Scheduled",
    createdAt: "2025-07-08",
  },
  {
    id: "L-3424",
    name: "Jessica Wilson",
    email: "jessica.wilson@example.com",
    propertyId: "03486",
    source: "Website",
    budget: "₵700–₵900 / month",
    stage: "Negotiation",
    createdAt: "2025-07-05",
  },
  {
    id: "L-3425",
    name: "Michael Taylor",
    email: "michael.taylor@example.com",
    propertyId: "03487",
    source: "Referral",
    budget: "₵1,200–₵1,800 / month",
    stage: "Closed",
    createdAt: "2025-07-02",
  },
  {
    id: "L-3426",
    name: "Emily Davis",
    email: "emily.d@example.com",
    propertyId: "03483",
    source: "Website",
    budget: "₵550–₵700 / month",
    stage: "New",
    createdAt: "2025-07-11",
  },
  {
    id: "L-3427",
    name: "Daniel White",
    email: "daniel.w@example.com",
    propertyId: "03484",
    source: "Ads",
    budget: "₵1,100–₵1,300 / month",
    stage: "Contacted",
    createdAt: "2025-07-10",
  },
  {
    id: "L-3428",
    name: "Sofia Martinez",
    email: "sofia.m@example.com",
    propertyId: "03485",
    source: "Referral",
    budget: "₵2,200–₵2,800 / month",
    stage: "Tour Scheduled",
    createdAt: "2025-07-09",
  },
  {
    id: "L-3429",
    name: "Kevin Harris",
    email: "kevin.h@example.com",
    propertyId: "03486",
    source: "Website",
    budget: "₵780–₵950 / month",
    stage: "Negotiation",
    createdAt: "2025-07-08",
  },
  {
    id: "L-3430",
    name: "Olivia King",
    email: "olivia.k@example.com",
    propertyId: "03487",
    source: "Referral",
    budget: "₵1,400–₵1,700 / month",
    stage: "Closed",
    createdAt: "2025-07-05",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SourceIcon({ source }: { source: Lead["source"] }) {
  if (source === "Website") return <Globe className="size-3 shrink-0 text-[#64748b]" />;
  if (source === "Ads") return <Megaphone className="size-3 shrink-0 text-[#64748b]" />;
  return <Users className="size-3 shrink-0 text-[#64748b]" />;
}

const STAGE_STYLES: Record<LeadStage, string> = {
  New: "bg-[var(--logo-muted)] text-[var(--logo)] border-[var(--logo-muted)]",
  Contacted: "bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]",
  "Tour Scheduled": "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Negotiation: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
  Closed: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
};

export default function Leads() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { properties } = useProperties();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [stageFilter, setStageFilter] = React.useState<LeadStage | "All">("All");
  const [search, setSearch] = React.useState("");
  const [leads, setLeads] = React.useState<Lead[]>(mockLeads);
  const [page, setPage] = React.useState(1);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const PAGE_SIZE = 8;
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

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageLeads = filteredLeads.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [stageFilter, search]);

  const handleAdvanceStage = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const stages: LeadStage[] = [
          "New",
          "Contacted",
          "Tour Scheduled",
          "Negotiation",
          "Closed",
        ];
        const idx = stages.indexOf(l.stage);
        const nextStage = stages[Math.min(idx + 1, stages.length - 1)];
        return { ...l, stage: nextStage };
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">
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
            {/* Header */}
            <header className="rounded-2xl border border-white/60 bg-white/80 px-6 py-5 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1e293b]">Leads</h1>
                  <p className="mt-1.5 text-sm text-[#64748b]">
                    Track incoming leads, follow up quickly, and convert them into clients.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search leads..."
                      className="h-9 w-48 rounded-xl border-[#e2e8f0] bg-white pl-9 pr-3 text-sm placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:ring-2 focus:ring-[var(--logo)]/20"
                    />
                  </div>
                  <Select
                    value={stageFilter}
                    onValueChange={(v) => setStageFilter(v as LeadStage | "All")}
                  >
                    <SelectTrigger className="h-9 w-[160px] rounded-xl border-[#e2e8f0] bg-white px-3 text-sm">
                      <Filter className="mr-1.5 size-4 text-[#64748b]" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All stages</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Tour Scheduled">Tour Scheduled</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </header>

            {/* Summary cards */}
            <LeadsSummaryCards />

            {/* Pipeline table */}
            <section className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl shadow-slate-200/50">
              <div className="border-b border-[#e2e8f0] bg-[#fafbfc] px-4 py-3">
                <h2 className="text-sm font-semibold text-[#1e293b]">Pipeline</h2>
                <p className="mt-0.5 text-xs text-[#64748b]">
                  Manage and advance leads through your sales pipeline
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Lead
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Property
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Source
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Budget
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Stage
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Created
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {pageLeads.map((lead) => {
                      const property = properties.find((p) => p.id === lead.propertyId);
                      return (
                        <tr
                          key={lead.id}
                          className="group transition-colors hover:bg-[#f8fafc]"
                        >
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[10px] font-semibold text-[var(--logo)]">
                                {getInitials(lead.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-[#1e293b]">{lead.name}</p>
                                <p className="truncate text-[10px] text-[#64748b]">{lead.email}</p>
                                <p className="text-[10px] text-[#94a3b8]">{lead.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[120px] px-4 py-2">
                            {property ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/dashboard/properties/${property.id}`)
                                }
                                className="inline-flex max-w-full items-center gap-1 truncate text-[var(--logo)] transition-colors hover:text-[var(--logo-hover)]"
                              >
                                <span className="truncate">{property.title}</span>
                                <ArrowUpRight className="size-3 shrink-0" />
                              </button>
                            ) : (
                              <span className="text-[#94a3b8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <SourceIcon source={lead.source} />
                              <span className="text-[#475569]">{lead.source}</span>
                            </div>
                          </td>
                          <td className="max-w-[110px] px-4 py-2 text-[#64748b]">
                            <span className="block truncate">{lead.budget}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                STAGE_STYLES[lead.stage]
                              )}
                            >
                              {lead.stage}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[#64748b]">
                            {lead.createdAt}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdvanceStage(lead.id)}
                              disabled={lead.stage === "Closed"}
                              className="group/btn h-7 gap-1 border-[#e2e8f0] bg-white px-2 text-[10px] font-medium text-[#1e293b] transition-colors hover:border-[var(--logo)] hover:bg-[var(--logo-muted)] hover:text-[var(--logo)] disabled:opacity-50"
                            >
                              Advance
                              <ChevronRight className="size-3 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-xs text-[#94a3b8]"
                        >
                          No leads match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={filteredLeads.length}
                pageSize={PAGE_SIZE}
                currentPage={safePage}
                onPageChange={setPage}
                itemLabel="leads"
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
    </div>
  );
}
