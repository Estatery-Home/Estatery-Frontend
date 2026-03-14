"use client";

/**
 * Feedback – rating, type (bug/feature/general/other), message.
 * On submit shows thank-you state; demo, no API.
 */
import * as React from "react";
import { Star, Send, Bug, Lightbulb, MessageSquare, HelpCircle, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { id: "bug", label: "Report a bug", desc: "Something isn't working" },
  { id: "feature", label: "Feature request", desc: "Suggest an improvement" },
  { id: "general", label: "General feedback", desc: "Share your thoughts" },
  { id: "other", label: "Other", desc: "Anything else" },
];

export default function Feedback() {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [type, setType] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  /* Validate message, set submitted (shows thank-you) */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white p-12 shadow-sm">
          <div className="flex size-20 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2e7d32] transition-all duration-500">
            <Sparkles className="size-10" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-[#1e293b]">Thank you!</h2>
          <p className="mt-2 text-center text-[#64748b]">
            Your feedback has been submitted. We appreciate you helping us improve Luxeyline.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setRating(0);
              setType(null);
              setMessage("");
            }}
            className="mt-8 rounded-xl bg-[var(--logo)] px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] hover:shadow-lg"
          >
            Submit another
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1e293b]">We'd love your feedback</h1>
          <p className="mt-2 text-[#64748b]">
            Help us improve Luxeyline by sharing your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rating */}
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[#1e293b]">How would you rate your experience?</h3>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl border-2 transition-all duration-200",
                    (hoverRating || rating) >= s
                      ? "border-[#fbbf24] bg-[#fef3c7] text-[#f59e0b]"
                      : "border-[#e2e8f0] bg-white text-[#cbd5e1] hover:border-[#fcd34d] hover:bg-[#fef9c3]"
                  )}
                >
                  <Star
                    className={cn(
                      "size-7 transition-transform duration-200",
                      (hoverRating || rating) >= s && "fill-current"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#94a3b8]">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "We'll do better"}
              {rating === 2 && "Thanks, we'll improve"}
              {rating === 3 && "Appreciate it"}
              {rating === 4 && "Great to hear!"}
              {rating === 5 && "Thank you so much!"}
            </p>
          </section>

          {/* Type */}
          <section>
            <h3 className="font-semibold text-[#1e293b]">What's this about?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FEEDBACK_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(type === item.id ? null : item.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-300",
                    type === item.id
                      ? "border-[var(--logo)] bg-[var(--logo-muted)] shadow-md"
                      : "border-[#e2e8f0] bg-white hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      type === item.id ? "bg-[var(--logo)] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                    )}
                  >
                    {item.id === "bug" && <Bug className="size-5" />}
                    {item.id === "feature" && <Lightbulb className="size-5" />}
                    {item.id === "general" && <MessageSquare className="size-5" />}
                    {item.id === "other" && <HelpCircle className="size-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-[#1e293b]">{item.label}</p>
                    <p className="text-sm text-[#64748b]">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Message */}
          <section>
            <label htmlFor="feedback-message" className="block font-semibold text-[#1e293b]">
              Your feedback
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more..."
              rows={5}
              className="mt-3 w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-[#1e293b] placeholder:text-[#94a3b8] transition-all duration-200 focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            />
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={!message.trim()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium text-white shadow-md transition-all duration-300",
              message.trim()
                ? "bg-[var(--logo)] hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] hover:shadow-lg active:translate-y-0"
                : "cursor-not-allowed bg-[#94a3b8]"
            )}
          >
            <Send className="size-5" />
            Send feedback
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
