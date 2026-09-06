"use client";

import { useState, useEffect } from "react";
import { APPEARANCES, PICKABLE_THEMES, THEME_COLORS, useTheme } from "@/components/theme";
import {
  CheckIcon,
  MonitorIcon,
  MoonIcon,
  MotivationIcon,
  SparklesIcon,
  SunIcon,
} from "@/components/icons";

function ColorCard({
  active,
  label,
  description,
  swatch,
  onSelect,
}: {
  active: boolean;
  label: string;
  description: string;
  swatch: readonly [string, string, string];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`card card-hover group relative overflow-hidden p-0 text-left ${
        active ? "!border-brand ring-2 ring-brand/30" : ""
      }`}
    >
      <div
        className="h-14 w-full"
        style={{
          background: `linear-gradient(120deg, ${swatch[0]}, ${swatch[1]} 55%, ${swatch[2]})`,
        }}
      />
      <div className="flex items-start justify-between gap-2 p-4">
        <div>
          <p className="font-bold tracking-tight">{label}</p>
          <p className="mt-0.5 text-xs text-muted-fg">{description}</p>
        </div>
        {active ? (
          <span className="badge badge-brand shrink-0">
            <CheckIcon className="h-3 w-3" />
            Selected
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function AppearanceSettings() {
  const { color, appearance, ready, setColor, setAppearance, setCustomColors } = useTheme();
  const activeTier = THEME_COLORS.find((t) => t.tierOnly && t.value === color);
  const [customPrimary, setLocalPrimary] = useState("#0f9d8a");
  const [customSecondary, setLocalSecondary] = useState("#0ea5a4");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Deferred so the saved color inputs hydrate without a cascading render.
    Promise.resolve().then(() => {
      const re = /^#[0-9a-f]{6}$/i;
      const p = localStorage.getItem("mcqure-custom-primary");
      const s = localStorage.getItem("mcqure-custom-secondary");
      if (re.test(p ?? "")) setLocalPrimary(p as string);
      if (re.test(s ?? "")) setLocalSecondary(s as string);
    });
  }, []);

  const commitCustom = () => setCustomColors(customPrimary, customSecondary);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <header>
        <p className="kicker">Settings</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-muted-fg">
          Choose your visual experience — a color identity and an appearance
          mode. Four identities × light &amp; dark, one product.
        </p>
      </header>

      {/* Color identity */}
      <section aria-labelledby="color-heading">
        <h2 id="color-heading" className="section-title">
          Color
        </h2>
        <div role="radiogroup" aria-labelledby="color-heading" className="stagger mt-3 grid gap-4 sm:grid-cols-3">
          {PICKABLE_THEMES.map((t) => (
            <ColorCard
              key={t.value}
              active={ready && color === t.value}
              label={t.label}
              description={t.description}
              swatch={t.swatch}
              onSelect={() => setColor(t.value)}
            />
          ))}
        </div>
        {ready && activeTier ? (
          <p className="mt-3 text-sm text-muted-fg">
            The <span className={`font-semibold ${activeTier.tier === "GOLD" ? "text-gold" : "text-silver"}`}>{activeTier.label}</span>{" "}
            identity is active — it comes with your account.
          </p>
        ) : null}
      </section>

      {/* Custom colors (color wheels) — shown/enabled with the Custom theme */}
      <section aria-labelledby="custom-heading">
        <h2 id="custom-heading" className="section-title">Your two colors</h2>
        <p className="mt-1 text-sm text-muted-fg">
          Pick a primary and a secondary color — the whole app derives its palette
          from them instantly.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-line bg-card p-4">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-line-strong">
              <input
                type="color"
                value={customPrimary}
                aria-label="Primary color"
                onChange={(e) => setLocalPrimary(e.target.value)}
                className="absolute -inset-2 h-[150%] w-[150%] cursor-pointer border-0 bg-transparent p-0"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight">Primary</span>
              <span className="block truncate font-mono text-xs text-muted-fg">{customPrimary.toUpperCase()}</span>
            </span>
            <button
              type="button"
              onClick={commitCustom}
              disabled={!ready}
              className="btn btn-primary btn-sm ml-auto"
            >
              Apply
            </button>
          </label>
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-line bg-card p-4">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-line-strong">
              <input
                type="color"
                value={customSecondary}
                aria-label="Secondary color"
                onChange={(e) => setLocalSecondary(e.target.value)}
                className="absolute -inset-2 h-[150%] w-[150%] cursor-pointer border-0 bg-transparent p-0"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight">Secondary</span>
              <span className="block truncate font-mono text-xs text-muted-fg">{customSecondary.toUpperCase()}</span>
            </span>
          </label>
        </div>
      </section>

      {/* Appearance */}
      <section aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="section-title">
          Appearance
        </h2>
        <div role="radiogroup" aria-labelledby="appearance-heading" className="stagger mt-3 grid gap-4 sm:grid-cols-3">
          {APPEARANCES.map((a) => {
            const active = ready && appearance === a.value;
            const Icon =
              a.value === "system" ? MonitorIcon : a.value === "dark" ? MoonIcon : SunIcon;
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAppearance(a.value)}
                className={`card card-hover flex flex-col items-start gap-2 p-4 text-left ${
                  active ? "!border-brand ring-2 ring-brand/30" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-brand-soft text-brand" : "bg-canvas text-muted-fg"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-bold tracking-tight">{a.label}</span>
                  {active ? <CheckIcon className="h-4 w-4 text-brand" /> : null}
                </span>
                <span className="text-xs text-muted-fg">{a.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live preview */}
      <section aria-labelledby="preview-heading" className="relative overflow-hidden rounded-3xl border border-line bg-card shadow-soft">
        <div className="aurora opacity-60" aria-hidden />
        <div className="relative p-5 sm:p-6">
          <h2 id="preview-heading" className="section-title">Preview</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="btn btn-primary btn-sm">Primary action</span>
            <span className="btn btn-secondary btn-sm">Secondary</span>
            <span className="badge badge-brand">
              <SparklesIcon className="h-3 w-3" /> Brand
            </span>
            <span className="badge badge-gold">
              <MotivationIcon className="h-3 w-3" /> Achievement
            </span>
            <span className="badge badge-ok">Correct</span>
            <span className="badge badge-warn">Marked</span>
            <span className="badge badge-bad">Incorrect</span>
          </div>
          <div className="progress mt-5">
            <div className="progress-bar" style={{ width: "72%" }} />
          </div>
        </div>
      </section>

      <p className="text-xs text-subtle-fg">
        Changes apply instantly across the entire app and are remembered on this device.
      </p>
    </div>
  );
}
