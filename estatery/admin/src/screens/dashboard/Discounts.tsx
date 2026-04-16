"use client";

/**
 * Discounts — promo codes from GET/POST /api/admin/discounts/ (staff or user_type admin).
 */
import * as React from "react";
import {
  Tag,
  Percent,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Trash2,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  createAdminDiscount,
  deleteAdminDiscount,
  fetchAdminDiscounts,
  fetchMyPropertiesFromApi,
  patchAdminDiscount,
} from "@/lib/api-client";
import type { PromoCode } from "@/lib/api-types";

type UiStatus = "Active" | "Scheduled" | "Expired";

function promoUiStatus(p: PromoCode, now = new Date()): UiStatus {
  const todayT = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = (s: string | null) => (s ? new Date(s + "T12:00:00").getTime() : null);
  const from = t(p.valid_from);
  const until = t(p.valid_until);
  const redeemedOut =
    p.max_redemptions != null && p.times_redeemed >= p.max_redemptions;

  if (!p.is_active) return "Expired";
  if (redeemedOut) return "Expired";
  if (until != null && until < todayT) return "Expired";
  if (from != null && from > todayT) return "Scheduled";
  return "Active";
}

function formatDiscountLabel(p: PromoCode): string {
  if (p.discount_type === "percent") return `${p.discount_value}% off`;
  return `Fixed ${p.discount_value}`;
}

function formatRedemptions(p: PromoCode): string {
  const cap = p.max_redemptions;
  if (cap == null) return `${p.times_redeemed} used`;
  return `${p.times_redeemed} / ${cap}`;
}

const PAGE_SIZE = 10;

export default function Discounts() {
  const [rows, setRows] = React.useState<PromoCode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [propertyOptions, setPropertyOptions] = React.useState<{ id: number; title: string }[]>([]);

  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftCode, setDraftCode] = React.useState("");
  const [draftType, setDraftType] = React.useState<"percent" | "fixed">("percent");
  const [draftValue, setDraftValue] = React.useState("10");
  const [draftStart, setDraftStart] = React.useState("");
  const [draftEnd, setDraftEnd] = React.useState("");
  const [draftMaxRedeem, setDraftMaxRedeem] = React.useState("");
  const [draftMinMonths, setDraftMinMonths] = React.useState("");
  const [draftPropertyId, setDraftPropertyId] = React.useState<string>("");

  const load = React.useCallback(async () => {
    const data = await fetchAdminDiscounts();
    if (data === null) {
      setError(
        "Could not load discounts. Sign in as staff or an admin user and ensure the API is running."
      );
      setRows([]);
    } else {
      setError(null);
      setRows(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!modalOpen) return;
    setFormError(null);
    void fetchMyPropertiesFromApi().then((raw) => {
      const list = (raw as { id?: number; title?: string }[])
        .filter((r) => r.id != null)
        .map((r) => ({ id: r.id as number, title: (r.title as string) || `Listing #${r.id}` }));
      setPropertyOptions(list);
    });
  }, [modalOpen]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const withUi = React.useMemo(
    () =>
      rows.map((p) => ({
        promo: p,
        ui: promoUiStatus(p),
      })),
    [rows]
  );

  const totalActive = withUi.filter((x) => x.ui === "Active").length;
  const totalScheduled = withUi.filter((x) => x.ui === "Scheduled").length;
  const totalExpired = withUi.filter((x) => x.ui === "Expired").length;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return withUi;
    return withUi.filter(
      (x) =>
        (x.promo.code ?? "").toLowerCase().includes(q) ||
        (x.promo.description ?? "").toLowerCase().includes(q)
    );
  }, [withUi, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => setPage(1), [search]);

  const resetForm = () => {
    setDraftTitle("");
    setDraftCode("");
    setDraftType("percent");
    setDraftValue("10");
    setDraftStart("");
    setDraftEnd("");
    setDraftMaxRedeem("");
    setDraftMinMonths("");
    setDraftPropertyId("");
    setFormError(null);
  };

  const handleSave = async () => {
    const title = draftTitle.trim();
    const code = draftCode.trim();
    const val = Number(draftValue);
    if (!title || !code || !Number.isFinite(val) || val <= 0) {
      setFormError("Add a campaign name, code, and a positive discount value.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = await createAdminDiscount({
      code: code.toUpperCase(),
      description: title,
      discount_type: draftType,
      discount_value: draftType === "percent" ? String(Math.min(100, val)) : String(val.toFixed(2)),
      valid_from: draftStart.trim() || null,
      valid_until: draftEnd.trim() || null,
      max_redemptions: (() => {
        const s = draftMaxRedeem.trim();
        if (!s) return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) && n > 0 ? n : null;
      })(),
      min_booking_months: (() => {
        const s = draftMinMonths.trim();
        if (!s) return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) && n > 0 ? n : null;
      })(),
      applies_to_property: (() => {
        const s = draftPropertyId.trim();
        if (!s) return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
      })(),
      is_active: true,
    });
    setSaving(false);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setModalOpen(false);
    resetForm();
    void load();
  };

  const toggleActive = async (p: PromoCode) => {
    const next = !p.is_active;
    const r = await patchAdminDiscount(p.id, { is_active: next });
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === p.id ? r.promo : x)));
    setError(null);
  };

  const remove = async (p: PromoCode) => {
    if (!window.confirm(`Delete promo code “${p.code}”? This cannot be undone.`)) return;
    const r = await deleteAdminDiscount(p.id);
    if (!r.ok) {
      setError(r.message ?? "Delete failed");
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== p.id));
    setError(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading discounts…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-violet-50/80 via-white to-[var(--logo-muted)]/25 px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-gradient-to-br from-violet-400/20 to-[var(--logo)]/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 shadow-sm">
                <Sparkles className="size-3.5 text-violet-600" />
                Promo &amp; pricing rules
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Discounts</h1>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Create codes tenants can apply at checkout.{" "}
                <span className="font-medium text-slate-800">Percentage or fixed amount</span>, optional caps, and
                listing-specific promos.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRefresh}
                  className="gap-2 border-slate-200 bg-white/90 shadow-sm hover:bg-white"
                >
                  <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="gap-2 rounded-xl bg-[var(--logo)] px-5 text-white shadow-md shadow-[var(--logo)]/25 hover:bg-[var(--logo-hover)]"
                >
                  <Tag className="size-4" />
                  New promo code
                </Button>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Live now",
              value: totalActive,
              sub: "Within validity & redeemable",
              icon: Percent,
              accent: "from-emerald-500/15 to-emerald-600/5 text-emerald-700 ring-emerald-200/60",
            },
            {
              label: "Scheduled",
              value: totalScheduled,
              sub: "Starts on a future date",
              icon: Clock,
              accent: "from-amber-500/15 to-amber-600/5 text-amber-800 ring-amber-200/60",
            },
            {
              label: "Paused or ended",
              value: totalExpired,
              sub: "Inactive, fully redeemed, or past end",
              icon: CheckCircle2,
              accent: "from-slate-400/15 to-slate-500/5 text-slate-700 ring-slate-200/70",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg",
                "backdrop-blur-sm"
              )}
            >
              <div
                className={cn(
                  "mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                  card.accent
                )}
              >
                <card.icon className="size-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-600">{card.sub}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Promo codes</h2>
              <p className="text-xs text-slate-500">{filtered.length} matching · {rows.length} total</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or campaign…"
                className="w-56 rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Campaign</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageSlice.map(({ promo: d, ui }) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="font-medium text-slate-900">{d.description?.trim() || "—"}</p>
                      <p className="text-[11px] text-slate-400">ID {d.id}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-violet-700">{d.code}</td>
                    <td className="px-4 py-3.5 text-slate-600">{formatDiscountLabel(d)}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {d.applies_to_property == null ? (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium">All listings</span>
                      ) : (
                        <span className="text-xs">Property #{d.applies_to_property}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatRedemptions(d)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      <span className="block">{d.valid_from ?? "—"}</span>
                      <span className="block text-slate-400">→ {d.valid_until ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          ui === "Active" && "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
                          ui === "Scheduled" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
                          ui === "Expired" && "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
                        )}
                      >
                        {ui}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-6">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleActive(d)}
                          className="h-8 border-slate-200 text-xs"
                        >
                          {d.is_active ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void remove(d)}
                          className="h-8 border-rose-200/80 text-rose-700 hover:bg-rose-50"
                          aria-label={`Delete ${d.code}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">
                      {rows.length === 0
                        ? "No promo codes yet. Create one to reward long stays or spotlight a listing."
                        : "No promos match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 ? (
            <Pagination
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              currentPage={safePage}
              onPageChange={setPage}
              itemLabel="codes"
            />
          ) : null}
        </section>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => {
              setModalOpen(false);
              resetForm();
            }}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/90 to-white px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">New promo code</h3>
              <p className="mt-1 text-sm text-slate-600">Codes are saved in uppercase and validated on the booking flow.</p>
            </div>
            <div className="max-h-[min(70vh,540px)] space-y-4 overflow-y-auto px-6 py-5 text-sm">
              <div className="space-y-1.5">
                <label htmlFor="promo-title" className="text-xs font-medium text-slate-700">
                  Campaign name
                </label>
                <input
                  id="promo-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Summer long-stay"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="promo-code" className="text-xs font-medium text-slate-700">
                  Code
                </label>
                <input
                  id="promo-code"
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER10"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 font-mono text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="promo-type" className="text-xs font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    id="promo-type"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as "percent" | "fixed")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  >
                    <option value="percent">Percent off</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="promo-value" className="text-xs font-medium text-slate-700">
                    {draftType === "percent" ? "Percent" : "Amount"}
                  </label>
                  <input
                    id="promo-value"
                    type="number"
                    min={0.01}
                    step={draftType === "percent" ? 1 : 0.01}
                    max={draftType === "percent" ? 100 : undefined}
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="promo-start" className="text-xs font-medium text-slate-700">
                    Valid from (optional)
                  </label>
                  <input
                    id="promo-start"
                    type="date"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="promo-end" className="text-xs font-medium text-slate-700">
                    Valid until (optional)
                  </label>
                  <input
                    id="promo-end"
                    type="date"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="promo-max" className="text-xs font-medium text-slate-700">
                    Max redemptions (optional)
                  </label>
                  <input
                    id="promo-max"
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={draftMaxRedeem}
                    onChange={(e) => setDraftMaxRedeem(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="promo-minm" className="text-xs font-medium text-slate-700">
                    Min booking months (optional)
                  </label>
                  <input
                    id="promo-minm"
                    type="number"
                    min={1}
                    placeholder="Any"
                    value={draftMinMonths}
                    onChange={(e) => setDraftMinMonths(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="promo-prop" className="text-xs font-medium text-slate-700">
                  Limit to one listing (optional)
                </label>
                <select
                  id="promo-prop"
                  value={draftPropertyId}
                  onChange={(e) => setDraftPropertyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-900 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
                >
                  <option value="">All my listings</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              {formError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving…" : "Create promo"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
