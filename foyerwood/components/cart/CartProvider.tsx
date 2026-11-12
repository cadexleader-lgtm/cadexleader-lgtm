"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  id: string;
  qty: number;
}

interface CartState {
  market: string;
  lines: CartLine[];
  ready: boolean;
  count: number;
  calculationId: string | null;
  /** Adds a product. `origin` (screen point of the click) feeds the fly-to-cart animation. */
  add: (id: string, qty: number, opts?: { calculationId?: string; origin?: { x: number; y: number } }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  lastAdded: { id: string; qty: number; at: number; origin?: { x: number; y: number } } | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartState | null>(null);

const key = (market: string) => `foyerwood-cart-${market}`;

export function CartProvider({ market, children }: { market: string; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [calculationId, setCalculationId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartState["lastAdded"]>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(market));
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.lines)) {
        setLines(
          parsed.lines
            .filter((l: CartLine) => typeof l?.id === "string" && Number.isFinite(l?.qty) && l.qty > 0)
            .slice(0, 50),
        );
        setCalculationId(typeof parsed.calculationId === "string" ? parsed.calculationId : null);
      }
    } catch {
      /* corrupted storage: start empty */
    }
    setReady(true);
  }, [market]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key(market), JSON.stringify({ lines, calculationId }));
    } catch {
      /* private mode */
    }
  }, [lines, calculationId, ready, market]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key(market) || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed.lines)) setLines(parsed.lines);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [market]);

  const add = useCallback((id: string, qty: number, opts?: { calculationId?: string; origin?: { x: number; y: number } }) => {
    const q = Math.max(1, Math.round(qty));
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + q } : l));
      return [...prev, { id, qty: q }];
    });
    if (opts?.calculationId) setCalculationId(opts.calculationId);
    setLastAdded({ id, qty: q, at: Date.now(), origin: opts?.origin });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const q = Math.max(1, Math.min(9999, Math.round(qty) || 1));
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: q } : l)));
  }, []);

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => {
    setLines([]);
    setCalculationId(null);
  }, []);
  const replace = useCallback((next: CartLine[]) => setLines(next), []);

  const value = useMemo<CartState>(
    () => ({
      market,
      lines,
      ready,
      count: lines.length,
      calculationId,
      add,
      setQty,
      remove,
      clear,
      replace,
      lastAdded,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [market, lines, ready, calculationId, add, setQty, remove, clear, replace, lastAdded, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
