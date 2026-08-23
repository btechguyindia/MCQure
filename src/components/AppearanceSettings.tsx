"use client";

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
  const { color, appearance, ready, setColor, setAppearance } = useTheme();
  const activeTier = THEME_COLORS.find((t) => t.tierOnly && t.value === color);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <header>
        <p className="kicker">Settings</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-muted-fg">
          Choose your visual experience — a color identity and an appearance
          mode. Six combinations, one product.
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
