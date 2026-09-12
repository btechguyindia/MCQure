"use client";

import { useEffect, useState } from "react";
import { CheckIcon, SparklesIcon } from "@/components/icons";

const STORAGE_KEY = "mcqure:mindset:today";

type CheckIn = { focus: number; energy: number; mood: number; intention: string; date: string };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function MindsetCheckIn() {
  const [focus, setFocus] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [intention, setIntention] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Deferred so we never call setState synchronously within the effect.
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as CheckIn;
        if (parsed.date !== todayKey()) return;
        setFocus(parsed.focus);
        setEnergy(parsed.energy);
        setMood(parsed.mood);
        setIntention(parsed.intention);
        setSaved(true);
      } catch {}
    });
  }, []);

  function save() {
    const data: CheckIn = { focus, energy, mood, intention: intention.trim(), date: todayKey() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="aurora opacity-60" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kicker">Today&apos;s check-in</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">How are you showing up?</h2>
            <p className="mt-1 text-sm text-muted-fg">2-minute reset. No streaks, no judgment — just awareness.</p>
          </div>
          {saved ? (
            <span className="badge badge-ok gap-1">
              <CheckIcon className="h-3.5 w-3.5" /> Saved
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Slider label="Focus" value={focus} onChange={setFocus} />
          <Slider label="Energy" value={energy} onChange={setEnergy} />
          <Slider label="Mood" value={mood} onChange={setMood} />
        </div>

        <label className="mt-4 block">
          <span className="label">One intention for today</span>
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="e.g. Finish 25 Qs without rushing, or review mistakes calmly"
            className="input"
            maxLength={120}
          />
        </label>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={save} className="btn btn-primary">
            <SparklesIcon className="h-4 w-4" />
            Save check-in
          </button>
          <span className="text-xs text-subtle-fg">Stored locally on this device — resets tomorrow.</span>
        </div>

        <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-xs leading-relaxed text-muted-fg">
          <span className="font-semibold text-ink">Exam temperament:</span> Awareness first, action second. If focus or energy is low (1–2), choose a 15-minute revision instead of a mock — protect the habit, not the number.
        </p>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-fg">{label}</span>
        <span className="badge badge-neutral tabular-nums">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--mcq-brand)]"
      />
      <div className="mt-1 flex justify-between text-[0.6rem] uppercase tracking-wider text-subtle-fg">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
