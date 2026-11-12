"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBasket } from "lucide-react";
import { useCart } from "./CartProvider";

/**
 * Floating cart, bottom-right. Adding a product never opens anything: the
 * product photo flies into this button, the count goes up and the button
 * bounces. Clicking it opens the pre-order panel.
 */
export function FloatingCart({
  products,
  hideOn,
  labels,
}: {
  products: Array<{ id: string; name: string; image: string | null }>;
  /** Path prefixes where the floating cart is not shown (pre-order pages). */
  hideOn: string[];
  labels: { open: string; added: string };
}) {
  const { count, ready, openDrawer, drawerOpen, lastAdded } = useCart();
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [bump, setBump] = useState(0);
  const [plus, setPlus] = useState<{ qty: number; key: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const hidden = !ready || count === 0 || hideOn.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!lastAdded) return;
    const product = byId.get(lastAdded.id);
    setAnnounce(`${labels.added} : ${product?.name ?? ""}`);
    const land = () => {
      setBump((b) => b + 1);
      setPlus({ qty: lastAdded.qty, key: lastAdded.at });
    };
    const target = btnRef.current?.getBoundingClientRect();
    const origin = lastAdded.origin;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !origin || !target || typeof document.body.animate !== "function") {
      land();
      return;
    }
    // The product photo (or a basket) flies along an arc into the cart.
    const size = 64;
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed",
      left: `${origin.x - size / 2}px`,
      top: `${origin.y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      zIndex: "80",
      pointerEvents: "none",
      backgroundColor: "#f39a1e",
      backgroundSize: "cover",
      backgroundPosition: "center",
      boxShadow: "0 10px 30px -10px rgb(22 21 21 / 0.55), 0 0 0 3px #fbf8f2",
    } satisfies Partial<CSSStyleDeclaration>);
    if (product?.image) el.style.backgroundImage = `url(${JSON.stringify(product.image)})`;
    document.body.appendChild(el);
    const dx = target.left + target.width / 2 - origin.x;
    const dy = target.top + target.height / 2 - origin.y;
    const anim = el.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.85)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.5 },
      ],
      { duration: 750, easing: "cubic-bezier(0.55, 0, 0.35, 1)" },
    );
    anim.onfinish = () => {
      el.remove();
      land();
    };
    return () => {
      anim.cancel();
      el.remove();
    };
  }, [lastAdded, byId, labels.added]);

  useEffect(() => {
    if (!plus) return;
    const t = setTimeout(() => setPlus(null), 1100);
    return () => clearTimeout(t);
  }, [plus]);

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
      {!hidden && (
        <div className={`floating-cart fixed bottom-4 right-4 z-[60] sm:bottom-8 sm:right-8 ${drawerOpen ? "pointer-events-none opacity-0" : "animate-pop-in"} transition-opacity`}>
          <button
            ref={btnRef}
            type="button"
            onClick={openDrawer}
            aria-haspopup="dialog"
            aria-label={labels.open.replace("{n}", String(count))}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-forest-950 text-cream shadow-[0_18px_40px_-14px_rgb(22_21_21/0.7)] ring-4 ring-cream transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-wood"
          >
            <span key={bump} className={bump ? "animate-cart-bump" : ""}>
              <ShoppingBasket className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <span
              key={`n-${bump}`}
              className={`absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-wood px-1.5 text-[0.8rem] font-bold tabular-nums text-ink ring-2 ring-cream ${bump ? "animate-badge-pop" : ""}`}
            >
              {count}
            </span>
            {plus && (
              <span key={plus.key} className="animate-plus-up pointer-events-none absolute -top-3 left-1/2 rounded-full bg-forest-950 px-2 py-0.5 text-xs font-bold text-wood">
                +{plus.qty}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
