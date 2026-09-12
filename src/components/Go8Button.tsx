"use client";

import { useGoMode } from "@/components/theme";

export function Go8Button({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { on, busy, toggle } = useGoMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Toggle Go mode"
      title={on ? "Go / NEO mode is active" : "Unlock Go / NEO mode"}
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