"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function CatalogFilters({
  categories,
  species,
  packagings,
  showCategory,
  labels,
}: {
  categories: Array<{ value: string; label: string }>;
  species: Array<{ value: string; label: string }>;
  packagings: Array<{ value: string; label: string }>;
  showCategory: boolean;
  labels: {
    filters: string;
    category: string;
    allCategories: string;
    species: string;
    allSpecies: string;
    packaging: string;
    allPackaging: string;
    availableOnly: string;
    sort: string;
    sortOptions: Record<string, string>;
    reset: string;
    search: string;
    searchPlaceholder: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };
  const hasFilters = ["category", "species", "packaging", "available", "q", "sort"].some((k) => params.get(k));
  const select = "field h-10 py-0 pr-8 text-sm";

  return (
    <div className={`card p-4 transition ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-end gap-3">
        <p className="mr-2 flex items-center gap-2 self-center text-sm font-semibold text-forest">
          <SlidersHorizontal className="h-4 w-4" /> {labels.filters}
        </p>
        <form
          className="relative min-w-[200px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update("q", String(new FormData(e.currentTarget).get("q") ?? "").trim() || null);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            name="q"
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.search}
            className="field h-10 py-0 pl-9 text-sm"
          />
        </form>
        {showCategory && (
          <select aria-label={labels.category} className={`${select} w-auto`} value={params.get("category") ?? ""} onChange={(e) => update("category", e.target.value || null)}>
            <option value="">{labels.allCategories}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
        {species.length > 1 && (
          <select aria-label={labels.species} className={`${select} w-auto`} value={params.get("species") ?? ""} onChange={(e) => update("species", e.target.value || null)}>
            <option value="">{labels.allSpecies}</option>
            {species.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
        {packagings.length > 1 && (
          <select aria-label={labels.packaging} className={`${select} w-auto`} value={params.get("packaging") ?? ""} onChange={(e) => update("packaging", e.target.value || null)}>
            <option value="">{labels.allPackaging}</option>
            {packagings.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
        <select aria-label={labels.sort} className={`${select} w-auto`} value={params.get("sort") ?? "featured"} onChange={(e) => update("sort", e.target.value === "featured" ? null : e.target.value)}>
          {Object.entries(labels.sortOptions).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-charcoal">
          <input type="checkbox" className="h-4 w-4 accent-pine" checked={params.get("available") === "1"} onChange={(e) => update("available", e.target.checked ? "1" : null)} />
          {labels.availableOnly}
        </label>
        {hasFilters && (
          <button type="button" onClick={() => start(() => router.replace(pathname, { scroll: false }))} className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-wood-600 hover:bg-wood-100">
            <X className="h-4 w-4" /> {labels.reset}
          </button>
        )}
      </div>
    </div>
  );
}
