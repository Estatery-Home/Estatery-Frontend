"use client";

/**
 * Help Center – category cards, FAQ accordion, search, HOME support contacts.
 */
import * as React from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  FileQuestion,
  Settings,
  Home,
  Shield,
  FileText,
  BookOpen,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TermsPrivacyModal } from "@/components/legal/TermsPrivacyModal";
import { HOME_SUPPORT_EMAIL, HOME_SUPPORT_MAILTO, HOME_SUPPORT_PHONES } from "@/lib/home-support";

type CategoryItem =
  | {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      desc: string;
      color: string;
      link: string;
    }
  | {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      desc: string;
      color: string;
      action: "setup" | "terms";
    };

const CATEGORIES: CategoryItem[] = [
  {
    icon: FileQuestion,
    label: "Getting Started",
    desc: "Setup, onboarding, and where to find policies",
    color: "from-blue-500 to-cyan-500",
    action: "setup",
  },
  {
    icon: Settings,
    label: "Account & Settings",
    desc: "Profile, security, preferences",
    color: "from-violet-500 to-purple-500",
    link: "/settings/settings",
  },
  {
    icon: Home,
    label: "Properties & Listings",
    desc: "Manage and list your properties",
    color: "from-emerald-500 to-teal-500",
    link: "/dashboard/properties",
  },
  {
    icon: Shield,
    label: "Privacy & Security",
    desc: "Data protection and account safety",
    color: "from-amber-500 to-orange-500",
    link: "/privacy-security",
  },
  {
    icon: FileText,
    label: "Terms & Privacy",
    desc: "Terms & Conditions and Privacy Policy",
    color: "from-slate-600 to-slate-800",
    action: "terms",
  },
];

const FAQ_ITEMS = [
  {
    q: "How do I add a new property listing?",
    a: "Go to Properties → Add Property and fill in the details. You can upload photos, set pricing, and manage availability from your dashboard.",
  },
  {
    q: "How do I process tenant payments?",
    a: "Navigate to Transactions to view and manage payments. Tenants can pay via the portal; you'll receive notifications when payments are completed.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Use the Export option in any list view (Transactions, Properties, Clients) to download CSV reports.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to Agents → Invite Agent. Enter their email and assign roles. They'll receive an invitation to join your workspace.",
  },
  {
    q: "How do I manage my property listings?",
    a: "Go to Properties to view all your listings. You can edit details, update photos, change availability, and manage rental periods from your dashboard.",
  },
];

function HelpSetupModal({
  open,
  onClose,
  onViewTerms,
}: {
  open: boolean;
  onClose: () => void;
  onViewTerms: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-dialog-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/90 to-white px-5 py-4 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
            <BookOpen className="size-5" />
          </div>
          <h2 id="setup-dialog-title" className="mt-3 text-lg font-semibold text-slate-900">
            Getting started
          </h2>
          <p className="mt-1 text-sm text-slate-600">A quick path from signup to your first listing.</p>
        </div>
        <div className="space-y-3 px-5 py-5 text-sm text-slate-700 sm:px-6">
          <ul className="list-inside list-disc space-y-2 leading-relaxed">
            <li>Verify your email after registering so you can sign in without issues.</li>
            <li>Add a property from <strong className="font-medium text-slate-900">Properties</strong> → Add Property.</li>
            <li>Track rent installments and receipts under <strong className="font-medium text-slate-900">Transactions</strong>.</li>
            <li>Update your profile and security options in <strong className="font-medium text-slate-900">Settings</strong>.</li>
            <li>Review the Terms &amp; Privacy Policy before publishing listings.</li>
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full rounded-xl border-slate-200"
            onClick={() => {
              onClose();
              onViewTerms();
            }}
          >
            View Terms &amp; Conditions and Privacy Policy
          </Button>
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
          <Button type="button" className="rounded-xl bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = React.useState("");
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-[#1e293b]">Help Center</h1>
          <p className="mt-1 text-xs text-[#64748b]">Find answers, guides, and support for your workspace.</p>
          <div className="relative mt-4 max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="search"
              placeholder="Search for help..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1e293b] placeholder:text-[#94a3b8] shadow-sm focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            />
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#1e293b]">Browse by topic</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((item, i) => {
              const cardClass = cn(
                "group relative overflow-hidden flex items-start gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 text-left shadow-sm transition-all duration-300 ease-out",
                "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--logo)] focus:ring-offset-2"
              );
              const content = (
                <>
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110",
                      item.color
                    )}
                  >
                    <item.icon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1e293b] transition-colors group-hover:text-[var(--logo)]">{item.label}</h3>
                    <p className="mt-0.5 text-sm text-[#64748b]">{item.desc}</p>
                  </div>
                  <ChevronDown className="ml-auto size-5 shrink-0 -rotate-90 text-[#94a3b8] transition-colors group-hover:text-[var(--logo)]" />
                </>
              );

              if ("link" in item) {
                return (
                  <Link key={item.label} to={item.link} className={cardClass} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                    {content}
                  </Link>
                );
              }

              const onClick = item.action === "setup" ? () => setSetupOpen(true) : () => setTermsOpen(true);

              return (
                <button key={item.label} type="button" onClick={onClick} className={cardClass} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  {content}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#1e293b]">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = expandedFaq === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "group overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition-all duration-300 ease-out",
                    "hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-lg"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/50"
                  >
                    <span className="font-medium text-[#1e293b]">{item.q}</span>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-[#64748b] transition-transform duration-300", isOpen && "rotate-180")}
                    />
                  </button>
                  <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="border-t border-[#f1f5f9] p-5 pt-4 text-sm text-[#64748b]">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#1e293b]">Still need help?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href={HOME_SUPPORT_MAILTO}
              className={cn(
                "group relative overflow-hidden flex flex-col items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-300 ease-out",
                "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[var(--logo)]/30 hover:shadow-xl active:scale-[1.01]"
              )}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--logo)] group-hover:text-white">
                <Mail className="size-7" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-[#1e293b]">Email us</h3>
                <p className="mt-1 break-all text-sm text-[#64748b]">{HOME_SUPPORT_EMAIL}</p>
                <p className="mt-2 text-xs text-[#94a3b8]">We aim to reply within 24 hours</p>
              </div>
            </a>
            <a
              href={`tel:${HOME_SUPPORT_PHONES[0].tel}`}
              className={cn(
                "group relative overflow-hidden flex flex-col items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-300 ease-out",
                "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[var(--logo)]/30 hover:shadow-xl active:scale-[1.01]"
              )}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[#fff3e0] text-[#e65100] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#e65100] group-hover:text-white">
                <Phone className="size-7" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-[#1e293b]">Call us</h3>
                <p className="mt-1 text-sm font-medium text-[#64748b]">{HOME_SUPPORT_PHONES[0].display}</p>
                <p className="mt-2 text-xs text-[#94a3b8]">Primary support line</p>
              </div>
            </a>
            <a
              href={`tel:${HOME_SUPPORT_PHONES[1].tel}`}
              className={cn(
                "group relative overflow-hidden flex flex-col items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-300 ease-out",
                "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[var(--logo)]/30 hover:shadow-xl active:scale-[1.01]"
              )}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#2e7d32] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2e7d32] group-hover:text-white">
                <MessageCircle className="size-7" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-[#1e293b]">Alternative line</h3>
                <p className="mt-1 text-sm font-medium text-[#64748b]">{HOME_SUPPORT_PHONES[1].display}</p>
                <p className="mt-2 text-xs text-[#94a3b8]">Tap to call · same team</p>
              </div>
            </a>
          </div>
        </section>
      </div>

      <HelpSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onViewTerms={() => setTermsOpen(true)} />
      <TermsPrivacyModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </DashboardLayout>
  );
}
