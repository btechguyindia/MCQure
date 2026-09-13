"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeColor = "teal" | "purple" | "blue-gold" | "claude" | "gold" | "silver" | "royal" | "custom" | "neo" | "city";
/** Account identity granted by a paid plan (maps to a ThemeColor). */
export type AccountTier = "ROYAL" | "PREMIUM_PLUS" | "PREMIUM";
export type Appearance = "system" | "light" | "dark";

/** The two colors the user picks for the custom theme (brand + accent). */
const CUSTOM_PRIMARY_KEY = "mcqure-custom-primary";
const CUSTOM_SECONDARY_KEY = "mcqure-custom-secondary";
export const CUSTOM_DEFAULT_PRIMARY = "#0f9d8a";
export const CUSTOM_DEFAULT_SECONDARY = "#0ea5a4";

export const THEME_COLORS: Array<{
  value: ThemeColor;
  label: string;
  description: string;
  swatch: [string, string, string];
  /** Hidden from pickers; unlocked automatically by the matching account tier. */
  tierOnly?: true;
  tier?: AccountTier;
  /** Hidden from pickers; only reachable through the Go switch. */
  hidden?: true;
}> = [
  {
    value: "teal",
    label: "Teal",
    description: "Fresh · educational · focused",
    swatch: ["#0F9D8A", "#14B8A6", "#0EA5A4"],
  },
  {
    value: "purple",
    label: "Purple",
    description: "Intelligent · premium · AI",
    swatch: ["#7C3AED", "#8B5CF6", "#6366F1"],
  },
  {
    value: "blue-gold",
    label: "Blue + Gold",
    description: "Academic · elite · achievement",
    swatch: ["#2563EB", "#3B82F6", "#C9961A"],
  },
  {
    value: "claude",
    label: "Claude",
    description: "Warm · editorial · conversational",
    swatch: ["#D97757", "#C05F3C", "#C9961A"],
  },
  {
    value: "custom",
    label: "Custom",
    description: "Your two colors, your whole app",
    swatch: ["#0f9d8a", "#0ea5a4", "#7C3AED"],
  },
  {
    value: "gold",
    label: "Gold",
    description: "Exclusive to Premium Plus accounts",
    swatch: ["#B8860B", "#EAB308", "#F5C542"],
    tierOnly: true,
    tier: "PREMIUM_PLUS",
  },
  {
    value: "silver",
    label: "Silver",
    description: "Exclusive to Premium accounts",
    swatch: ["#475569", "#94A3B8", "#CBD5E1"],
    tierOnly: true,
    tier: "PREMIUM",
  },
  {
    value: "royal",
    label: "Royal",
    description: "Exclusive to Royal accounts",
    swatch: ["#7C2D12", "#C2410C", "#EAB308"],
    tierOnly: true,
    tier: "ROYAL",
  },
  {
    value: "neo",
    label: "Go · NEO",
    description: "Next-gen dynamic interface — unlocked by the Go switch",
    swatch: ["#06B6D4", "#6366F1", "#F59E0B"],
    hidden: true,
  },
  {
    value: "city",
    label: "Neon City",
    description: "Retro 8-bit neon city — unlocked by the GO arcade button",
    swatch: ["#D946EF", "#7C3AED", "#F59E0B"],
    hidden: true,
  },
];

export const PICKABLE_THEMES = THEME_COLORS.filter((t) => !t.tierOnly && !t.hidden);

const TIER_THEME: Record<AccountTier, ThemeColor> = {
  ROYAL: "royal",
  PREMIUM_PLUS: "gold",
  PREMIUM: "silver",
};

export const APPEARANCES: Array<{
  value: Appearance;
  label: string;
  description: string;
}> = [
  { value: "system", label: "System", description: "Follow your device setting" },
  { value: "light", label: "Light", description: "Clean & bright" },
  { value: "dark", label: "Dark", description: "Cinematic & deep" },
];

const COLOR_KEY = "mcqure-theme-color";
const APPEARANCE_KEY = "mcqure-appearance";
/** Account-driven override; when present it wins over the personal choice. */
const TIER_KEY = "mcqure-tier-theme";
/** Go mode master flag — "on" persistently arms the NEO identity. */
export const GO_KEY = "mcqure-go";
/** Fired by the Go switch; the GoReactor runs the sequence. */
export const GO_EVENT = "mcqure:go";
/** Neon City master flag — "on" persistently arms the 8-bit identity. */
export const GO8_KEY = "mcqure-go8";
/** Fired by the GO arcade button; the GoReactor runs the sequence. */
export const GO8_EVENT = "mcqure:go8";
/** Fired by the GoReactor when a run finishes (success or revert). */
export const GO_DONE_EVENT = "mcqure:go:done";

/** True when the Go/NEO mode has been permanently armed. */
export function goIsOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GO_KEY) === "on";
}

/** True when the Neon City (GO arcade) identity has been permanently armed. */
export function go8IsOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GO8_KEY) === "on";
}

function isThemeColor(v: string | null): v is ThemeColor {
  return (
    v === "teal" ||
    v === "purple" ||
    v === "blue-gold" ||
    v === "claude" ||
    v === "gold" ||
    v === "silver" ||
    v === "royal" ||
    v === "custom" ||
    v === "neo" ||
    v === "city"
  );
}

function isHex(v: string | null): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

/** Read the saved custom colors (falling back to defaults). */
function readCustomColors(): { primary: string; secondary: string } {
  const p = localStorage.getItem(CUSTOM_PRIMARY_KEY);
  const s = localStorage.getItem(CUSTOM_SECONDARY_KEY);
  return {
    primary: isHex(p) ? p : CUSTOM_DEFAULT_PRIMARY,
    secondary: isHex(s) ? s : CUSTOM_DEFAULT_SECONDARY,
  };
}

/** Inject the user's two colors onto :root so the custom theme can derive. */
function applyCustomColors() {
  const { primary, secondary } = readCustomColors();
  const root = document.documentElement;
  root.style.setProperty("--mcq-u-primary", primary);
  root.style.setProperty("--mcq-u-secondary", secondary);
}

function isAppearance(v: string | null): v is Appearance {
  return v === "system" || v === "light" || v === "dark";
}

/** The current appearance preference, falling back to "system". */
export function currentAppearance(): Appearance {
  if (typeof window === "undefined") return "system";
  const a = localStorage.getItem(APPEARANCE_KEY);
  return isAppearance(a) ? a : "system";
}

/** Apply a theme combination to the document (+ optionally persist it). */
export function applyTheme(color: ThemeColor, appearance: Appearance, persist = true) {
  const root = document.documentElement;

  // Smooth cross-fade of surfaces/text while tokens swap.
  root.classList.add("theming");
  window.setTimeout(() => root.classList.remove("theming"), 400);

  root.setAttribute("data-theme", color);
  // Tier overrides are transient: they must not overwrite the personal pick.
  if (persist && color !== "gold" && color !== "silver" && color !== "royal" && color !== "neo" && color !== "city") {
    localStorage.setItem(COLOR_KEY, color);
  }
  // Keep the custom palette in sync whenever the custom theme is active.
  if (color === "custom") applyCustomColors();

  const dark =
    appearance === "dark" ||
    (appearance === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  localStorage.setItem(APPEARANCE_KEY, appearance);
}

/** Resolve what data-theme should be: account tier override wins over choice. */
export function effectiveColor(): ThemeColor {
  // Neon City (arcade GO) beats Go/NEO; both are top-level personal overrides.
  if (go8IsOn()) return "city";
  // Go/NEO is the top-level personal override while armed.
  if (goIsOn()) return "neo";
  const tier = localStorage.getItem(TIER_KEY);
  if (tier === "gold" || tier === "silver" || tier === "royal") return tier;
  const saved = localStorage.getItem(COLOR_KEY);
  return isThemeColor(saved) ? saved : "teal";
}

/**
 * Lock/unlock an account-exclusive theme. GOLD accounts get the gold identity,
 * SILVER get silver, FREE/null restores the user's own pick. Applies instantly.
 */
export function applyAccountTier(tier: AccountTier | null) {
  if (tier) localStorage.setItem(TIER_KEY, TIER_THEME[tier]);
  else localStorage.removeItem(TIER_KEY);
  const appearance = isAppearance(localStorage.getItem(APPEARANCE_KEY))
    ? (localStorage.getItem(APPEARANCE_KEY) as Appearance)
    : "system";
  applyTheme(effectiveColor(), appearance);
}

interface ThemeState {
  color: ThemeColor;
  appearance: Appearance;
  resolvedDark: boolean;
}

function readCurrent(): ThemeState {
  if (typeof document === "undefined") {
    return { color: "teal", appearance: "system", resolvedDark: false };
  }
  const root = document.documentElement;
  const attr = root.getAttribute("data-theme");
  return {
    color: isThemeColor(attr) ? attr : "teal",
    appearance: isAppearance(localStorage.getItem(APPEARANCE_KEY))
      ? (localStorage.getItem(APPEARANCE_KEY) as Appearance)
      : "system",
    resolvedDark: root.classList.contains("dark"),
  };
}

/**
 * Shared theme state. Reads whatever ThemeScript applied before hydration
 * (deferred to an effect so the first render matches the server output),
 * keeps `resolvedDark` in sync with the OS while appearance = system,
 * and exposes setters that apply instantly with no reload.
 */
export function useTheme() {
  const [state, setState] = useState<ThemeState>({
    color: "teal",
    appearance: "system",
    resolvedDark: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deferred so the effect never calls setState synchronously (mirrors the
    // pre-hydration state already applied by ThemeScript).
    Promise.resolve().then(() => {
      setState(readCurrent());
      setReady(true);
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setState((prev) => {
        if (prev.appearance !== "system") return prev;
        const next = { ...prev, resolvedDark: media.matches };
        // Keep the DOM class in sync without touching persisted choice.
        document.documentElement.classList.toggle("dark", media.matches);
        return next;
      });
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setAccountTier = useCallback((tier: AccountTier | null) => {
    applyAccountTier(tier);
    setState({
      color: effectiveColor(),
      appearance: readCurrent().appearance,
      resolvedDark: document.documentElement.classList.contains("dark"),
    });
  }, []);

  const setColor = useCallback(
    (color: ThemeColor) => {
      applyTheme(color, state.appearance);
      setState((prev) => ({
        ...prev,
        color,
        resolvedDark: document.documentElement.classList.contains("dark"),
      }));
    },
    [state.appearance]
  );

  const setAppearance = useCallback(
    (appearance: Appearance) => {
      applyTheme(state.color, appearance);
      setState((prev) => ({
        ...prev,
        appearance,
        resolvedDark: document.documentElement.classList.contains("dark"),
      }));
    },
    [state.color]
  );

  /**
   * Set the two custom theme colors (primary + secondary) and switch to the
   * custom theme. Persists both hex values and re-applies so the whole app
   * re-derives immediately.
   */
  const setCustomColors = useCallback(
    (primary: string, secondary: string) => {
      localStorage.setItem(CUSTOM_PRIMARY_KEY, primary);
      localStorage.setItem(CUSTOM_SECONDARY_KEY, secondary);
      const nextColor: ThemeColor = "custom";
      applyTheme(nextColor, state.appearance);
      setState((prev) => ({
        ...prev,
        color: nextColor,
        resolvedDark: document.documentElement.classList.contains("dark"),
      }));
    },
    [state.appearance]
  );

  return { ...state, ready, setColor, setAppearance, setAccountTier, setCustomColors };
}

/**
 * Reactive Go-switch state (NEO mode). `on` is optimistic while the reactor
 * runs its sequence; `busy` is true from the moment the switch is armed until
 * the reactor finishes. Toggling dispatches GO_EVENT and lets GoReactor own
 * localStorage + the actual theme swap.
 */
export function useGoMode() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Deferred so the effect never calls setState synchronously.
    Promise.resolve().then(() => setOn(goIsOn()));
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ on?: boolean }>).detail;
      if (typeof detail?.on === "boolean") {
        setOn(detail.on);
        setBusy(detail.on ? true : false);
      }
    };
    const doneEvent = () => {
      setBusy(false);
      setOn(goIsOn());
    };
    window.addEventListener(GO_EVENT, onEvent);
    window.addEventListener(GO_DONE_EVENT, doneEvent);
    return () => {
      window.removeEventListener(GO_EVENT, onEvent);
      window.removeEventListener(GO_DONE_EVENT, doneEvent);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !goIsOn();
    if (next) {
      setBusy(true);
      setOn(true);
    } else {
      setOn(false);
    }
    window.dispatchEvent(new CustomEvent(GO_EVENT, { detail: { on: next } }));
  }, []);

  return { on, busy, toggle };
}

/**
 * Reactive GO arcade-button state (Neon City / 8-bit identity). Mirrors
 * useGoMode but keyed to mcqure-go8; the reactor owns localStorage.
 */
export function useGo8Mode() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Deferred so the effect never calls setState synchronously.
    Promise.resolve().then(() => setOn(go8IsOn()));
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ on?: boolean }>).detail;
      if (typeof detail?.on === "boolean") {
        setOn(detail.on);
        setBusy(detail.on ? true : false);
      }
    };
    const doneEvent = () => {
      setBusy(false);
      setOn(go8IsOn());
    };
    window.addEventListener(GO8_EVENT, onEvent);
    window.addEventListener(GO_DONE_EVENT, doneEvent);
    return () => {
      window.removeEventListener(GO8_EVENT, onEvent);
      window.removeEventListener(GO_DONE_EVENT, doneEvent);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !go8IsOn();
    if (next) {
      setBusy(true);
      setOn(true);
    } else {
      setOn(false);
    }
    window.dispatchEvent(new CustomEvent(GO8_EVENT, { detail: { on: next } }));
  }, []);

  return { on, busy, toggle };
}
