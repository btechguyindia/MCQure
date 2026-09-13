"use client";

import { useGo8Mode } from "@/components/theme";

export function Go8Button({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { on, busy, toggle } = useGo8Mode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Toggle Neon City mode"
      title={on ? "Neon City mode is active" : "Unlock the 8-bit Neon City mode"}
      disabled={busy}
      onClick={toggle}
      className={`go8 ${on ? "go8-on" : ""} ${size === "sm" ? "go8-sm" : ""} ${
        busy ? "go-busy" : ""
      } ${className ?? ""}`}
    >
      GO
    </button>
  );
}