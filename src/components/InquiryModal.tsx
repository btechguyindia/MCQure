"use client";

import { useState } from "react";
import { CheckIcon, CloseIcon, MailIcon, SendIcon } from "@/components/icons";
import { INQUIRY_SUBJECTS } from "@/lib/validation";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

interface Props {
  onClose: () => void;
  /** Logged-in user used to prefill the form (null for anonymous visitors). */
  user: { name: string; email: string } | null;
  /** The plan the user is currently on (null for anonymous / no subscription). */
  plan: PlanId | null;
}

type Status = "idle" | "submitting" | "sent" | "error";

export function InquiryModal({ onClose, user, plan }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState<string>(INQUIRY_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submitting = status === "submitting";

  async function submit() {
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/support/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, plan: plan ?? undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? "Could not submit your inquiry");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your inquiry");
      setStatus("idle");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Raise an inquiry"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-line bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-brand">
              <MailIcon className="h-3.5 w-3.5" />
              Contact admin
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Raise an inquiry</h3>
            <p className="mt-1 text-sm text-muted-fg">
              {plan ? (
                <>
                  About your current plan —{" "}
                  <span className="font-semibold text-ink">{PLANS[plan].name}</span>
                </>
              ) : (
                "Questions, feedback or billing help — we reply on email."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-1.5 text-muted-fg hover:bg-canvas hover:text-ink disabled:opacity-50"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft text-ok">
              <CheckIcon className="h-6 w-6" />
            </span>
            <p className="font-semibold">Inquiry submitted successfully</p>
            <p className="max-w-sm text-sm text-muted-fg">
              Thanks for reaching out — we&apos;ve received your message and will get back to
              you at {email || "your email"}.
            </p>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm mt-2">
              Done
            </button>
          </div>
        ) : (
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inq-name" className="label">
                  Name
                </label>
                <input
                  id="inq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="Your name"
                  className="input"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="inq-email" className="label">
                  Email
                </label>
                <input
                  id="inq-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={160}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inq-subject" className="label">
                Subject
              </label>
              <select
                id="inq-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
              >
                {INQUIRY_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inq-message" className="label">
                Message
              </label>
              <textarea
                id="inq-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={5}
                maxLength={4000}
                rows={5}
                placeholder="What would you like help with?"
                className="input resize-none"
              />
              <p className="mt-1 text-right text-[0.65rem] text-subtle-fg">{message.length}/4000</p>
            </div>

            {status === "error" && error ? (
              <p role="alert" className="rounded-xl border border-bad/30 bg-bad-soft px-3 py-2 text-xs text-bad">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-brand border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  <>
                    <SendIcon className="h-4 w-4" />
                    Send inquiry
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}