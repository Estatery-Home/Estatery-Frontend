"use client";

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
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { icon: FileQuestion, label: "Getting Started", desc: "Setup and onboarding guides", color: "from-blue-500 to-cyan-500", link: null },
  { icon: Settings, label: "Account & Settings", desc: "Profile, security, preferences", color: "from-violet-500 to-purple-500", link: "/settings/settings" },
  { icon: Home, label: "Properties & Listings", desc: "Manage and list your properties", color: "from-emerald-500 to-teal-500", link: "/dashboard/properties" },
  { icon: Shield, label: "Privacy & Security", desc: "Data protection, 2FA", color: "from-amber-500 to-orange-500", link: "/privacy-security" },
  { icon: Zap, label: "Integrations", desc: "APIs and third-party tools", color: "from-rose-500 to-pink-500", link: null },
];

const FAQ_ITEMS = [
  { q: "How do I add a new property listing?", a: "Go to Properties → Add Property and fill in the details. You can upload photos, set pricing, and manage availability from your dashboard." },
  { q: "How do I process tenant payments?", a: "Navigate to Transactions to view and manage payments. Tenants can pay via the portal; you'll receive notifications when payments are completed." },
  { q: "Can I export my data?", a: "Yes. Use the Export option in any list view (Transactions, Properties, Clients) to download CSV reports." },
  { q: "How do I invite team members?", a: "Go to Agents → Invite Agent. Enter their email and assign roles. They'll receive an invitation to join your workspace." },
  { q: "How do I manage my property listings?", a: "Go to Properties to view all your listings. You can edit details, update photos, change availability, and manage rental periods from your dashboard." },
];

export default function HelpCenter() {
  const [search, setSearch] = React.useState("");
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--logo)] via-[var(--logo-hover)] to-[#1e40af] p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-48 translate-y-1/2 -translate-x-1/4 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            <p className="mt-2 text-blue-100">
              Find answers, guides, and support for Luxeyline
            </p>
            <div className="relative mt-6 max-w-xl">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-blue-300" />
              <input
                type="search"
                placeholder="Search for help..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-white/95 py-3.5 pl-12 pr-4 text-[#1e293b] placeholder:text-slate-400 shadow-lg transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        {/* Category cards */}
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
                    <h3 className="font-semibold text-[#1e293b] transition-colors group-hover:text-[var(--logo)]">
                      {item.label}
                    </h3>
                    <p className="mt-0.5 text-sm text-[#64748b]">{item.desc}</p>
                  </div>
                  <ChevronDown className="ml-auto size-5 shrink-0 -rotate-90 text-[#94a3b8] transition-colors group-hover:text-[var(--logo)]" />
                </>
              );
              return item.link ? (
                <Link
                  key={item.label}
                  to={item.link}
                  className={cardClass}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  {content}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={cardClass}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  {content}
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQ Accordion */}
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
                      className={cn(
                        "size-5 shrink-0 text-[#64748b] transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-[#f1f5f9] p-5 pt-4 text-sm text-[#64748b]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact cards */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#1e293b]">Still need help?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:support@luxeyline.com"
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
                <p className="mt-1 text-sm text-[#64748b]">support@luxeyline.com</p>
                <p className="mt-2 text-xs text-[#94a3b8]">Usually replied within 24h</p>
              </div>
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
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
                <h3 className="font-semibold text-[#1e293b]">Live chat</h3>
                <p className="mt-1 text-sm text-[#64748b]">Chat with support</p>
                <p className="mt-2 text-xs text-[#94a3b8]">Mon–Fri, 9am–6pm</p>
              </div>
            </a>
            <a
              href="tel:+1234567890"
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
                <p className="mt-1 text-sm text-[#64748b]">+1 (234) 567-890</p>
                <p className="mt-2 text-xs text-[#94a3b8]">Mon–Fri, 9am–5pm</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
