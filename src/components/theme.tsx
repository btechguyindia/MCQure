"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeColor = "teal" | "purple" | "blue-gold";
export type Appearance = "system" | "light" | "dark";

export const THEME_COLORS: Array<{
  value: ThemeColor;
  label: string;
  description: string;
  swatch: [string, string, string];
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
];

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

function isThemeColor(v: string | null): v is ThemeColor {
  return v === "teal" || v === "purple" || v === "blue-gold";
}

function isAppearance(v: string | null): v is Appearance {
  return v === "system" || v === "light" || v === "dark";
}

/** Apply a theme combination to the document + persist it. */
export function applyTheme(color: ThemeColor, appearance: Appearance) {
  const root = document.documentElement;

  // Smooth cross-fade of surfaces/text while tokens swap.
  root.classList.add("theming");
  window.setTimeout(() => root.classList.remove("theming"), 400);

  root.setAttribute("data-theme", color);
  localStorage.setItem(COLOR_KEY, color);

  const dark =
    appearance === "dark" ||
    (appearance === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  localStorage.setItem(APPEARANCE_KEY, appearance);
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

  return { ...state, ready, setColor, setAppearance };
}
