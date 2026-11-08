"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingBasket } from "lucide-react";
import { useCart } from "./CartProvider";
import { btn } from "@/components/ui";

export function QuantityInput({
  value,
  onChange,
  min,
  max,
  labels,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max?: number | null;
  labels: { decrease: string; increase: string; quantity: string };
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const clamp = (v: number) => Math.max(1, Math.min(max ?? 9999, v));
  return (
    <div className={`inline-flex ${h} items-center rounded-full bg-white ring-1 ring-line`}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label={labels.decrease}
        className={`flex ${h} w-10 items-center justify-center rounded-full text-forest transition hover:bg-cream disabled:opacity-30`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max ?? undefined}
        value={value}
        aria-label={labels.quantity}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 1))}
        className={`w-12 bg-transparent text-center font-semibold tabular-nums text-charcoal focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${
          value < min ? "text-danger" : ""
        }`}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={max != null && value >= max}
        aria-label={labels.increase}
        className={`flex ${h} w-10 items-center justify-center rounded-full text-forest transition hover:bg-cream disabled:opacity-30`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AddToCart({
  productId,
  minQty,
  maxQty,
  disabled,
  labels,
  preorderHref,
}: {
  productId: string;
  minQty: number;
  maxQty: number | null;
  disabled?: boolean;
  labels: { add: string; added: string; view: string; decrease: string; increase: string; quantity: string; min: string };
  preorderHref: string;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(minQty);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 3500);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityInput value={qty} onChange={setQty} min={minQty} max={maxQty} labels={labels} />
        <button
          type="button"
          disabled={disabled || qty < minQty}
          onClick={() => {
            add(productId, qty);
            setDone(true);
          }}
          className={btn("wood", "lg", "flex-1 min-w-[220px]")}
        >
          {done ? <Check className="h-5 w-5" /> : <ShoppingBasket className="h-5 w-5" />}
          {done ? labels.added : labels.add}
        </button>
      </div>
      {qty < minQty && <p className="text-sm text-danger">{labels.min}</p>}
      {done && (
        <p className="flex items-center gap-2 text-sm text-pine animate-fade-in" role="status">
          <Check className="h-4 w-4" /> {labels.added} —{" "}
          <Link href={preorderHref} className="font-medium underline underline-offset-2">
            {labels.view}
          </Link>
        </p>
      )}
    </div>
  );
}

export function QuickAdd({ productId, minQty, label, addedLabel }: { productId: string; minQty: number; label: string; addedLabel: string }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      onClick={() => {
        add(productId, minQty);
        setDone(true);
      }}
      aria-label={done ? addedLabel : label}
      title={done ? addedLabel : label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition ${
        done ? "bg-pine text-cream ring-pine" : "bg-white text-forest ring-line hover:bg-forest hover:text-cream hover:ring-forest"
      }`}
    >
      {done ? <Check className="h-[18px] w-[18px]" /> : <ShoppingBasket className="h-[18px] w-[18px]" />}
    </button>
  );
}

/** Full-width "add to pre-order" button used on product cards. */
export function AddButton({ productId, minQty, label, addedLabel, disabled }: { productId: string; minQty: number; label: string; addedLabel: string; disabled?: boolean }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2200);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(productId, minQty);
        setDone(true);
      }}
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[0.88rem] font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cream-300 disabled:text-stone ${
        done ? "bg-pine text-cream" : "bg-wood text-ink hover:bg-wood-600 hover:shadow-[0_8px_18px_-8px_rgb(192_112_10/0.8)]"
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingBasket className="h-4 w-4" />}
      {done ? addedLabel : label}
    </button>
  );
}
