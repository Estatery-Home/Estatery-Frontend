/**
 * Search – agents, sections, and property results for quick search overlay.
 * searchAll merges and filters by query; returns up to 12.
 */
export type SearchResultType = "query" | "agent" | "property" | "section";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  label: string;
  subtitle?: string;
  href?: string;
  avatar?: string;
};

export const agents: SearchResult[] = [
  { id: "a1", type: "agent", label: "Claudia Fairchild", subtitle: "Agent", href: "/dashboard/agents/a1", avatar: "C" },
  { id: "a2", type: "agent", label: "Clara Withmore", subtitle: "Agent", href: "/dashboard/agents/a2", avatar: "C" },
  { id: "a3", type: "agent", label: "Clarisa Stone", subtitle: "Agent", href: "/dashboard/agents/a3", avatar: "C" },
  { id: "a4", type: "agent", label: "Jonathan Cruz", subtitle: "Agent", href: "/dashboard/agents/a4", avatar: "J" },
  { id: "a5", type: "agent", label: "Sarah Lee", subtitle: "Agent", href: "/dashboard", avatar: "S" },
];

export const sections: SearchResult[] = [
  { id: "s1", type: "section", label: "Dashboard", href: "/dashboard" },
  { id: "s2", type: "section", label: "Agents", href: "/dashboard/agents" },
  { id: "s3", type: "section", label: "Clients", href: "/clients/clients" },
  { id: "s4", type: "section", label: "Properties", href: "/dashboard/properties" },
  { id: "s5", type: "section", label: "Analytics", href: "/dashboard/analytics" },
  { id: "s6", type: "section", label: "Recent Payments", href: "/dashboard" },
];

function getPropertyResults(
  properties: { id: string | number; title: string; address: string; city: string; country: string }[]
): SearchResult[] {
  return properties.map((p) => ({
    id: String(p.id),
    type: "property" as const,
    label: p.title,
    subtitle: [p.address, p.city, p.country].filter(Boolean).join(", "),
    href: `/dashboard/properties/${p.id}`,
  }));
}

export function searchAll(
  query: string,
  propertyList: { id: string | number; title: string; address: string; city: string; country: string }[]
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const propertyResults = getPropertyResults(propertyList);
  const all: SearchResult[] = [
    ...agents.filter((a) => a.label.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q)),
    ...sections.filter((s) => s.label.toLowerCase().includes(q)),
    ...propertyResults.filter((p) => p.label.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q))),
  ];

  return all.slice(0, 12);
}
