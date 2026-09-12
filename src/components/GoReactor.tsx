"use client";

import { useEffect, useRef, useState } from "react";
import {
  GO_EVENT,
  GO_DONE_EVENT,
  GO_KEY,
  applyTheme,
  currentAppearance,
  effectiveColor,
} from "@/components/theme";

type Phase = "boot" | "gate" | "charge" | "flash" | null;

export function GoReactor() {
  const [phase, setPhase] = useState<Phase>(null);
  const [pct, setPct] = useState(0);
  const timers = useRef<number[]>([]);
  const frames = useRef<number[]>([]);

  function clearAll() {
    timers.current.forEach(clearTimeout);
    frames.current.forEach(cancelAnimationFrame);
    timers.current = [];
    frames.current = [];
  }

  function finish() {
    setPhase("flash");
    applyTheme("neo", currentAppearance());
    timers.current.push(
      window.setTimeout(() => {
        setPhase(null);
        document.body.style.overflow = "";
        window.dispatchEvent(new CustomEvent(GO_DONE_EVENT));
      }, 650),
    );
  }

  function skip() {
    clearAll();
    setPct(100);
    setPhase("flash");
    applyTheme("neo", currentAppearance());
    timers.current.push(
      window.setTimeout(() => {
        setPhase(null);
        document.body.style.overflow = "";
        window.dispatchEvent(new CustomEvent(GO_DONE_EVENT));
      }, 550),
    );
  }

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ on?: boolean }>).detail;
      if (typeof detail?.on !== "boolean") return;

      clearAll();

      if (detail.on === false) {
        setPhase(null);
        localStorage.removeItem(GO_KEY);
        applyTheme(effectiveColor(), currentAppearance());
        window.dispatchEvent(new CustomEvent(GO_DONE_EVENT));
        return;
      }

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const R = reduce ? 0.42 : 1;

      setPct(0);
      setPhase("boot");
      document.body.style.overflow = "hidden";

      // Stage transitions
      timers.current.push(
        window.setTimeout(() => setPhase("gate"), Math.round(1700 * R)),
        window.setTimeout(() => {
          setPhase("charge");
          const start = performance.now();
          const dur = Math.round(1100 * R);
          let done = false;
          const tick = () => {
            if (done) return;
            const v = Math.min(100, Math.floor(((performance.now() - start) / dur) * 100));
            setPct(v);
            if (v < 100) {
              frames.current.push(requestAnimationFrame(tick));
            } else {
              done = true;
              finish();
            }
          };
          frames.current.push(requestAnimationFrame(tick));
        }, Math.round(3400 * R)),
      );
    };

    window.addEventListener(GO_EVENT, onEvent);
    return () => {
      window.removeEventListener(GO_EVENT, onEvent);
      clearAll();
      document.body.style.overflow = "";
    };
  }, []);

  if (!phase) return null;

  return (
    <div
      className={`goz goz-stage-${phase === "flash" ? "charge" : phase} ${
        phase === "flash" ? "goz-flashing" : ""
      }`}
      onClick={skip}
      aria-hidden
    >
      {/* Grid texture & scanning beam are handled by CSS ::before / ::after */}

      {/* Stage 1 — spinning rings + log lines */}
      <div className="goz-boot">
        <div className="goz-rings">
          <span className="goz-ring-a" />
          <span className="goz-ring-b" />
          <span className="goz-core" />
        </div>

        <div className="goz-log">
          <i>
            <b>{"// "}</b>access-controller<b>.exe</b>
          </i>
          <i>
            escalation attempt <em>detected</em>
          </i>
          <i>
            runtime profile <em>escalating</em>
          </i>
          <i>
            <b>NEO</b> environment compiling<b>...</b>
          </i>
        </div>
      </div>

      {/* Stage 2 — glitch phrase reveal */}
      <div className="goz-gate">
        <p className="goz-gate-sub">{"// "}running deep token override</p>
        <p
          className="goz-phrase"
          data-text="You are still not ready for this"
        >
          You are still not ready for this
        </p>
        <p className="goz-gate-sub">press anywhere to skip</p>
      </div>

      {/* Stage 3 — progress bar + percentage → flash + apply */}
      <div className="goz-charge">
        <div className="goz-charge-label">
          <span>Compiling new design language</span>
          <b>{pct}%</b>
        </div>
        <div className="goz-track">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="goz-charge-note">
          <b>NEO</b> identity will apply at 100%
        </p>
      </div>

      {/* Flash overlay on completion */}
      <div className="goz-flash" />
    </div>
  );
}
