"use client";

import { BoltIcon } from "@/components/icons";
import { useGoMode } from "@/components/theme";

export function GoModeControl({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { on, busy, toggle } = useGoMode();

  const switchBtn = (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Toggle Go mode"
      title={on ? "Go / NEO mode is active" : "Unlock Go / NEO mode"}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className={`go-switch ${busy ? "go-busy" : ""}`}
    />
  );

  if (compact) return switchBtn;

  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
      onClick={(e) => {
        // Allow clicks anywhere on the row to toggle.
        if ((e.target as HTMLElement).closest("button")) return;
        toggle();
      }}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          on ? "bg-brand-soft text-brand" : "bg-canvas text-muted-fg"
        }`}
      >
        <BoltIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold tracking-tight">Go</span>
        <span className="block text-xs text-muted-fg">
          {on ? "Next-gen dynamic UI is active" : "Activate the next-gen dynamic interface"}
        </span>
      </span>
      {switchBtn}
    </div>
  );
}
