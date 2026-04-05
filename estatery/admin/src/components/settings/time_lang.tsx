"use client";

/**
 * Time & Language – time zone, language.
 * Options loaded from GET /api/timezones/ and /api/languages/.
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

type Choice = { value: string; label: string };

function normalizeChoices(data: unknown): Choice[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((c: { value?: string; code?: string; label?: string; name?: string }) => ({
      value: String(c.value ?? c.code ?? ""),
      label: String(c.label ?? c.name ?? c.value ?? ""),
    }))
    .filter((c) => c.value && c.label);
}

function withCurrentOption(options: Choice[], current: string): Choice[] {
  if (!current || options.some((o) => o.value === current)) return options;
  return [...options, { value: current, label: current }].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function TimeLang() {
  const { timeLang, setTimeLang } = useSettings();
  const [timezoneOptions, setTimezoneOptions] = React.useState<Choice[]>([]);
  const [languageOptions, setLanguageOptions] = React.useState<Choice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tzRes, langRes] = await Promise.all([
          fetch(api.endpoints.timezones),
          fetch(api.endpoints.languages),
        ]);
        if (cancelled) return;
        if (tzRes.ok) {
          const tz = normalizeChoices(await tzRes.json()).sort((a, b) =>
            a.label.localeCompare(b.label)
          );
          setTimezoneOptions(tz);
        }
        if (langRes.ok) {
          const lang = normalizeChoices(await langRes.json()).sort((a, b) =>
            a.label.localeCompare(b.label)
          );
          setLanguageOptions(lang);
        }
      } catch {
        /* keep empty; selects show fallback messaging */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tzItems = React.useMemo(
    () => withCurrentOption(timezoneOptions, timeLang.timeZone),
    [timezoneOptions, timeLang.timeZone]
  );
  const langItems = React.useMemo(
    () => withCurrentOption(languageOptions, timeLang.language),
    [languageOptions, timeLang.language]
  );

  return (
    <div className="space-y-0">
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Time</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Set your preferred time zone to ensure that all activites align with your local time.
          </p>
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 ">
          <div className="space-y-2">
            <Label htmlFor="time-zone" className="text-[#1e293b]">
              Time Zone
            </Label>
            <Select value={timeLang.timeZone} onValueChange={(v) => setTimeLang((p) => ({ ...p, timeZone: v }))}>
              <SelectTrigger id="time-zone" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value={timeLang.timeZone}>{timeLang.timeZone}</SelectItem>
                ) : tzItems.length > 0 ? (
                  tzItems.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={timeLang.timeZone}>{timeLang.timeZone}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-t my-10 border-[#e2e8f0] -mx-6" />

      <section className="flex flex-col gap-6 pt-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Set language</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Choose the language. All text and communication will be displayed in the language you select.
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 ">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-[#1e293b]">
                Language
              </Label>
              <Select value={timeLang.language} onValueChange={(v) => setTimeLang((p) => ({ ...p, language: v }))}>
                <SelectTrigger id="language" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value={timeLang.language}>{timeLang.language}</SelectItem>
                  ) : langItems.length > 0 ? (
                    langItems.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={timeLang.language}>{timeLang.language}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
