"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface UpgradeContextValue {
  isOpen: boolean;
  message: string | null;
  openUpgrade: (message?: string) => void;
  closeUpgrade: () => void;
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

/**
 * Provider installed once at the root layout. Gives any component a way to pop
 * the upgrade modal (`useUpgrade().openUpgrade()`) and — importantly — watches
 * every fetch for a 403 "requires an upgraded plan" entitlement denial and
 * raises the blocker automatically, so limited-access features surface an
 * upgrade interface without ad-hoc wiring in each page.
 */
export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openUpgrade(msg?: string) {
    setMessage(msg ?? null);
    setIsOpen(true);
  }
  function closeUpgrade() {
    setIsOpen(false);
    setMessage(null);
  }

  useEffect(() => {
    const original = window.fetch;
    const interceptor: typeof window.fetch = async (...args) => {
      const res = await original(...args);
      if (res.status === 403) {
        try {
          const body = (await res.clone().json()) as { error?: string };
          if (
            typeof body?.error === "string" &&
            /requires an upgraded plan/.test(body.error)
          ) {
            openUpgrade(body.error);
          }
        } catch {
          // not JSON — ignore
        }
      }
      return res;
    };
    window.fetch = interceptor;
    return () => {
      window.fetch = original;
    };
  }, []);

  return (
    <UpgradeContext.Provider value={{ isOpen, message, openUpgrade, closeUpgrade }}>
      {children}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade(): UpgradeContextValue {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error("useUpgrade must be used within <UpgradeProvider>");
  return ctx;
}