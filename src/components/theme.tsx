"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeColor = "teal" | "purple" | "blue-gold" | "claude" | "gold" | "silver" | "royal" | "custom";
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
];

export const PICKABLE_THEMES = THEME_COLORS.filter((t) => !t.tierOnly);

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
// Account-driven override; when present it wins over the personal choice.
const TIER_KEY = "mcqure-tier-theme";

function isThemeColor(v: string | null): v is ThemeColor {
  return (
    v === "teal" ||
    v === "purple" ||
    v === "blue-gold" ||
    v === "claude" ||
    v === "gold" ||
    v === "silver" ||
    v === "royal" ||
    v === "custom"
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

/** Apply a theme combination to the document (+ optionally persist it). */
export function applyTheme(color: ThemeColor, appearance: Appearance, persist = true) {
  const root = document.documentElement;

  // Smooth cross-fade of surfaces/text while tokens swap.
  root.classList.add("theming");
  window.setTimeout(() => root.classList.remove("theming"), 400);

  root.setAttribute("data-theme", color);
  // Tier overrides are transient: they must not overwrite the personal pick.
  if (persist && color !== "gold" && color !== "silver" && color !== "royal") {
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
function effectiveColor(): ThemeColor {
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
