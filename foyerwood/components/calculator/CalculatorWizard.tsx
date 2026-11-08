"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Flame,
  Home,
  Info,
  MapPin,
  Mountain,
  RotateCcw,
  ShoppingBasket,
  TreePine,
  Warehouse,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { calculateAction, type CalculatorResponse } from "@/app/[site]/actions";
import { climateFor, type AltitudeBand } from "@/lib/climate";
import { fuelsForAppliance, type Appliance, type FuelChoice, type Housing, type Insulation, type Months, type Usage } from "@/lib/calculator";
import { isValidPostalCode } from "@/lib/regions";
import type { Dict } from "@/lib/i18n";
import type { MarketId } from "@/lib/markets";
import { useCart } from "@/components/cart/CartProvider";
import { ProductArt } from "@/components/art/ProductArt";
import { btn } from "@/components/ui";

type L = Dict["calculator"];

interface Props {
  siteId: string;
  market: MarketId;
  locale: string;
  currency: string;
  t: L;
  common: { quantity: string; perUnit: string; added: string; viewPreorder: string; addToPreorder: string };
  productBase: string;
  preorderHref: string;
  postalPlaceholder: string;
  otherCountries: Array<{ href: string; label: string }>;
}

const TOTAL = 7;

export function CalculatorWizard(p: Props) {
  const { t } = p;
  const [step, setStep] = useState(1);
  const [postal, setPostal] = useState("");
  const [altitude, setAltitude] = useState<AltitudeBand>("low");
  const [area, setArea] = useState("");
  const [housing, setHousing] = useState<Housing>("house");
  const [insulation, setInsulation] = useState<Insulation>("average");
  const [appliance, setAppliance] = useState<Appliance>("wood_stove");
  const [fuel, setFuel] = useState<FuelChoice>("hardwood");
  const [usage, setUsage] = useState<Usage>("daily");
  const [months, setMonths] = useState<Months>(5);
  const [touched, setTouched] = useState(false);
  const [response, setResponse] = useState<CalculatorResponse | null>(null);
  const [pending, start] = useTransition();
  const top = useRef<HTMLDivElement>(null);
  const recRef = useRef<HTMLDivElement>(null);

  const areaUnit = p.market === "fr" ? t.steps.area.unit_m2 : t.steps.area.unit_sqft;
  const [minArea, maxArea] = p.market === "fr" ? [10, 2000] : [100, 20000];
  const postalOk = isValidPostalCode(p.market, postal);
  const areaNum = Number(area.replace(",", "."));
  const areaOk = Number.isFinite(areaNum) && areaNum >= minArea && areaNum <= maxArea;
  const climate = useMemo(() => (postalOk ? climateFor(p.market, postal, altitude) : null), [postalOk, p.market, postal, altitude]);
  const fuels = fuelsForAppliance(appliance);
  const nf = (v: number, d = 1) => new Intl.NumberFormat(p.locale, { maximumFractionDigits: d }).format(v);
  const money = (cents: number) => new Intl.NumberFormat(p.locale, { style: "currency", currency: p.currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  const unitName = (u: string, q: number) => {
    const pair = t.result.units[u as keyof typeof t.result.units];
    return q >= 2 || q === 0 ? pair[1] : pair[0];
  };

  const canNext = step === 1 ? postalOk : step === 2 ? areaOk : true;
  const scrollTop = () => top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const go = (n: number) => {
    setTouched(false);
    setStep(n);
    scrollTop();
  };
  const next = () => {
    if (!canNext) {
      setTouched(true);
      return;
    }
    if (step < TOTAL) go(step + 1);
    else compute();
  };
  const compute = () => {
    start(async () => {
      const res = await calculateAction(p.siteId, {
        postalCode: postal,
        altitude,
        area: areaNum,
        housing,
        insulation,
        appliance,
        fuel: fuels.includes(fuel) ? fuel : fuels[0],
        usage,
        months,
      });
      setResponse(res);
      setStep(TOTAL + 1);
      scrollTop();
    });
  };
  const restart = () => {
    setResponse(null);
    go(1);
  };

  const opt = <T extends string>(value: T, current: T, set: (v: T) => void, label: string, hint: string, Icon?: React.ComponentType<{ className?: string }>) => (
    <button
      key={value}
      type="button"
      role="radio"
      aria-checked={value === current}
      onClick={() => set(value)}
      className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left ring-1 transition sm:p-5 ${
        value === current ? "bg-forest text-cream ring-forest shadow-[var(--shadow-lift)]" : "bg-white text-charcoal ring-line hover:ring-pine/40"
      }`}
    >
      {Icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${value === current ? "bg-cream/10 text-wood-100" : "bg-cream text-wood-600"}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        <span className={`mt-0.5 block text-sm ${value === current ? "text-cream/70" : "text-stone"}`}>{hint}</span>
      </span>
      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${value === current ? "bg-wood ring-wood" : "ring-line"}`}>
        {value === current && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );

  const result = response?.ok ? response.result : null;

  return (
    <div ref={top} className="scroll-mt-28">
      {step <= TOTAL && (
        <div className="card overflow-hidden">
          <div className="border-b border-line px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-forest">{t.step.replace("{n}", String(step)).replace("{total}", String(TOTAL))}</span>
              <span className="text-stone">{Math.round(((step - 1) / TOTAL) * 100)} %</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-200">
              <div className="h-full rounded-full bg-gradient-to-r from-pine to-wood transition-all duration-500" style={{ width: `${(step / TOTAL) * 100}%` }} />
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10" key={step}>
            <div className="animate-fade-up">
              {step === 1 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.location.title}</legend>
                  <p className="mt-2 text-stone">{t.steps.location.help}</p>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="calc-postal">{t.steps.location.postal}</label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
                        <input
                          id="calc-postal"
                          className="field pl-10 text-lg uppercase"
                          value={postal}
                          onChange={(e) => setPostal(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && next()}
                          placeholder={p.postalPlaceholder}
                          autoComplete="postal-code"
                          aria-invalid={touched && !postalOk}
                          autoFocus
                        />
                      </div>
                      {touched && !postalOk && <p className="field-error">{t.steps.location.invalid}</p>}
                    </div>
                    {p.market === "fr" && (
                      <div>
                        <label className="field-label" htmlFor="calc-alt">{t.steps.location.altitude}</label>
                        <div className="relative">
                          <Mountain className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
                          <select id="calc-alt" className="field pl-10 text-lg" value={altitude} onChange={(e) => setAltitude(e.target.value as AltitudeBand)}>
                            {(Object.keys(t.steps.location.altitudes) as AltitudeBand[]).map((k) => (
                              <option key={k} value={k}>{t.steps.location.altitudes[k]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  {climate && (
                    <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-2 text-sm text-pine animate-fade-in">
                      <Check className="h-4 w-4" /> {t.steps.location.detected.replace("{label}", climate.label)} · {nf(climate.hdd, 0)} {p.locale.startsWith("fr") ? "DJ" : "HDD"}
                    </p>
                  )}
                  <p className="mt-6 text-sm text-stone">
                    {t.steps.location.otherCountry}{" "}
                    {p.otherCountries.map((c, i) => (
                      <span key={c.href}>
                        {i > 0 && " · "}
                        <Link href={c.href} className="font-medium text-pine underline underline-offset-2">{c.label}</Link>
                      </span>
                    ))}
                  </p>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.area.title}</legend>
                  <p className="mt-2 text-stone">{t.steps.area.help}</p>
                  <div className="mt-7 max-w-xs">
                    <label className="field-label" htmlFor="calc-area">{t.steps.area.label}</label>
                    <div className="relative">
                      <input
                        id="calc-area"
                        className="field pr-16 text-2xl font-semibold tabular-nums"
                        inputMode="decimal"
                        value={area}
                        onChange={(e) => setArea(e.target.value.replace(/[^0-9.,]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && next()}
                        placeholder={p.market === "fr" ? "120" : "1500"}
                        aria-invalid={touched && !areaOk}
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-stone">{areaUnit}</span>
                    </div>
                    {touched && !areaOk && (
                      <p className="field-error">{t.steps.area.invalid.replace("{min}", `${nf(minArea, 0)} ${areaUnit}`).replace("{max}", `${nf(maxArea, 0)} ${areaUnit}`)}</p>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {(p.market === "fr" ? [60, 90, 120, 160, 220] : [800, 1200, 1600, 2200, 3000]).map((v) => (
                      <button key={v} type="button" onClick={() => setArea(String(v))} className={`rounded-full px-4 py-2 text-sm ring-1 transition ${area === String(v) ? "bg-forest text-cream ring-forest" : "bg-white ring-line hover:ring-pine/40"}`}>
                        {nf(v, 0)} {areaUnit}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.housing.title}</legend>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {opt("house", housing, setHousing, t.steps.housing.options.house.label, t.steps.housing.options.house.hint, Home)}
                    {opt("chalet", housing, setHousing, t.steps.housing.options.chalet.label, t.steps.housing.options.chalet.hint, TreePine)}
                    {opt("apartment", housing, setHousing, t.steps.housing.options.apartment.label, t.steps.housing.options.apartment.hint, Building2)}
                    {opt("other", housing, setHousing, t.steps.housing.options.other.label, t.steps.housing.options.other.hint, Warehouse)}
                  </div>
                </fieldset>
              )}

              {step === 4 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.insulation.title}</legend>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {(["excellent", "good", "average", "poor"] as Insulation[]).map((k) =>
                      opt(k, insulation, setInsulation, t.steps.insulation.options[k].label, t.steps.insulation.options[k].hint),
                    )}
                  </div>
                </fieldset>
              )}

              {step === 5 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.appliance.title}</legend>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
                    {(["open_fireplace", "wood_stove", "insert", "pellet_stove", "wood_boiler", "other"] as Appliance[]).map((k) =>
                      opt(
                        k,
                        appliance,
                        (v) => {
                          setAppliance(v);
                          const f = fuelsForAppliance(v);
                          if (!f.includes(fuel)) setFuel(f[0]);
                        },
                        t.steps.appliance.options[k].label,
                        t.steps.appliance.options[k].hint,
                        Flame,
                      ),
                    )}
                  </div>
                  <p className="mt-8 font-display text-2xl text-forest">{t.steps.appliance.fuelTitle}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
                    {fuels.map((k) => opt(k, fuel, setFuel, t.steps.appliance.fuels[k].label, t.steps.appliance.fuels[k].hint))}
                  </div>
                </fieldset>
              )}

              {step === 6 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.usage.title}</legend>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {(["occasional", "few_hours", "daily", "main"] as Usage[]).map((k) => opt(k, usage, setUsage, t.steps.usage.options[k].label, t.steps.usage.options[k].hint))}
                  </div>
                </fieldset>
              )}

              {step === 7 && (
                <fieldset>
                  <legend className="font-display text-3xl text-forest">{t.steps.duration.title}</legend>
                  <p className="mt-2 text-stone">{t.steps.duration.help}</p>
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup">
                    {([1, 2, 3, 4, 5, 6, "season"] as Months[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={months === m}
                        onClick={() => setMonths(m)}
                        className={`rounded-2xl px-4 py-4 text-center font-medium ring-1 transition ${m === "season" ? "col-span-2" : ""} ${
                          months === m ? "bg-forest text-cream ring-forest" : "bg-white ring-line hover:ring-pine/40"
                        }`}
                      >
                        {m === "season" ? t.steps.duration.season : t.steps.duration.month.replace("{n}", String(m))}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line bg-cream/60 px-6 py-4 sm:px-8">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 1} className={btn("ghost", "md")}>
              <ArrowLeft className="h-4 w-4" /> {t.prev}
            </button>
            <button type="button" onClick={next} disabled={pending} className={btn(step === TOTAL ? "wood" : "primary", "md", "min-w-[180px]")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? t.computing : step === TOTAL ? t.compute : t.next}
              {!pending && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {step > TOTAL && response && !response.ok && (
        <div className="card p-8 text-center">
          <p className="text-danger">{t.steps.location.invalid}</p>
          <button type="button" onClick={restart} className={btn("primary", "md", "mt-4")}>
            <RotateCcw className="h-4 w-4" /> {t.restart}
          </button>
        </div>
      )}

      {step > TOTAL && result && response && (
        <ResultView p={p} result={result} response={response} nf={nf} money={money} unitName={unitName} restart={restart} recRef={recRef} />
      )}
    </div>
  );
}

function ResultView({
  p,
  result,
  response,
  nf,
  money,
  unitName,
  restart,
  recRef,
}: {
  p: Props;
  result: NonNullable<CalculatorResponse["result"]>;
  response: CalculatorResponse;
  nf: (v: number, d?: number) => string;
  money: (c: number) => string;
  unitName: (u: string, q: number) => string;
  restart: () => void;
  recRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = p;
  const { add } = useCart();
  const [added, setAdded] = useState<string[]>([]);
  const [primary, ...others] = result.quantities;
  const s = t.steps;
  const input = result.input;
  const areaUnit = p.market === "fr" ? s.area.unit_m2 : s.area.unit_sqft;
  const dd = p.locale.startsWith("fr") ? "DJ" : "HDD";
  const rows: Array<[string, string]> = [
    [t.result.rows.location, `${input.postalCode.toUpperCase()}`],
    [t.result.rows.area, `${nf(input.area, 0)} ${areaUnit}`],
    [t.result.rows.housing, s.housing.options[input.housing].label],
    [t.result.rows.insulation, s.insulation.options[input.insulation].label],
    [t.result.rows.appliance, s.appliance.options[input.appliance].label],
    [t.result.rows.fuel, s.appliance.fuels[input.fuel].label],
    [t.result.rows.usage, s.usage.options[input.usage].label],
    [t.result.rows.duration, input.months === "season" ? s.duration.season : s.duration.month.replace("{n}", String(input.months))],
    [t.result.rows.climate, `${result.climate.label} · ${nf(result.climate.hdd, 0)} ${dd}`],
    [t.result.rows.degreeDays, nf(result.periodDegreeDays, 0)],
    [t.result.rows.efficiency, `${nf(result.efficiency * 100, 0)} %`],
    [t.result.rows.energy, t.result.energyValue.replace("{low}", nf(result.fuelEnergyKwh.low, 0)).replace("{high}", nf(result.fuelEnergyKwh.high, 0))],
  ];

  const addLine = (id: string, qty: number) => {
    add(id, qty, { calculationId: response.calculationId ?? undefined });
    setAdded((a) => [...a, id]);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="relative overflow-hidden rounded-md bg-forest text-cream">
        <div className="grain absolute inset-0" aria-hidden />
        <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:p-12">
          <div>
            <p className="kicker text-wood-100">{t.result.title}</p>
            <p className="mt-6 text-sm uppercase tracking-wider text-cream/60">{t.result.need}</p>
            <p className="mt-2 font-display text-5xl leading-none sm:text-7xl">
              {t.result.range.replace("{low}", nf(primary.low)).replace("{high}", nf(primary.high))}
            </p>
            <p className="mt-3 text-xl text-wood-100">{unitName(primary.unit, primary.high)}</p>
            <p className="mt-4 text-cream/75">{t.result.central.replace("{value}", `${nf(primary.central)} ${unitName(primary.unit, primary.central)}`)}</p>
            {others.length > 0 && (
              <p className="mt-2 text-cream/75">
                {t.result.or}{" "}
                {others
                  .map((q) => `${t.result.range.replace("{low}", nf(q.low)).replace("{high}", nf(q.high))} ${unitName(q.unit, q.high)}`)
                  .join(` ${t.result.or} `)}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => recRef.current?.scrollIntoView({ behavior: "smooth" })} className={btn("wood", "lg", "uppercase tracking-wide")}>
                <ShoppingBasket className="h-5 w-5" /> {t.result.recommendedCta}
              </button>
              <button type="button" onClick={restart} className={btn("outline-light", "lg")}>
                <RotateCcw className="h-5 w-5" /> {t.restart}
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-cream/[0.07] p-5 ring-1 ring-cream/15">
            <p className="text-sm font-semibold text-cream">{t.result.summary}</p>
            <dl className="mt-3 divide-y divide-cream/10 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-cream/60">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w) => (
            <p key={w} className="flex items-start gap-3 rounded-xl bg-wood-100/70 px-4 py-3 text-sm text-wood-600 ring-1 ring-wood/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {t.result.warnings[w]}
            </p>
          ))}
        </div>
      )}

      <p className="flex items-start gap-3 rounded-xl bg-white px-5 py-4 text-sm leading-relaxed text-stone ring-1 ring-line">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
        {t.result.disclaimer.replace("{pct}", nf(result.uncertainty * 100, 0))}
      </p>

      <details className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-medium text-forest">
          {t.result.method}
          <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
        </summary>
        <ol className="list-decimal space-y-2 border-t border-line px-10 py-5 text-sm leading-relaxed text-charcoal/85 marker:text-wood">
          {t.result.methodPoints.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
      </details>

      <section ref={recRef} className="scroll-mt-28">
        <h2 className="text-3xl text-forest">{t.result.recommendedTitle}</h2>
        {response.recommendations && response.recommendations.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {response.recommendations.map(({ product, suggestedQty, coversPct }) => (
              <article key={product.id} className="card flex flex-col overflow-hidden">
                <Link href={`${p.productBase}/${product.slug}`} className="block aspect-[16/10] overflow-hidden">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ProductArt art={product.art} species={product.species} seed={product.slug} className="h-full w-full" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <Link href={`${p.productBase}/${product.slug}`} className="font-display text-xl leading-snug text-forest hover:text-pine">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-stone">
                    {money(product.priceCents)} {p.common.perUnit.replace("{unit}", product.unitLabel)}
                  </p>
                  <div className="mt-4 rounded-xl bg-cream p-3">
                    <p className="text-sm font-semibold text-charcoal">
                      {t.result.suggested.replace("{qty}", `${suggestedQty} ${suggestedQty > 1 ? product.unitLabelPlural : product.unitLabel}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-stone">
                      {money(product.priceCents * suggestedQty)}
                      {coversPct ? ` · ${t.result.covers.replace("{pct}", String(coversPct))}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addLine(product.id, suggestedQty)}
                    className={btn(added.includes(product.id) ? "secondary" : "primary", "md", "mt-4 w-full")}
                  >
                    {added.includes(product.id) ? <Check className="h-4 w-4" /> : <ShoppingBasket className="h-4 w-4" />}
                    {added.includes(product.id) ? t.result.added : t.result.addSuggested}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-white p-5 text-stone ring-1 ring-line">{t.result.noProducts}</p>
        )}

        {response.complements && response.complements.length > 0 && (
          <div className="mt-8">
            <p className="kicker mb-3">{t.result.complements}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {response.complements.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-line">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                    <ProductArt art={c.art} species={c.species} seed={c.slug} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`${p.productBase}/${c.slug}`} className="block truncate font-medium text-forest hover:text-pine">{c.name}</Link>
                    <p className="text-sm text-stone">{money(c.priceCents)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addLine(c.id, c.minQty)}
                    aria-label={p.common.addToPreorder}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition ${added.includes(c.id) ? "bg-pine text-cream ring-pine" : "ring-line hover:bg-forest hover:text-cream"}`}
                  >
                    {added.includes(c.id) ? <Check className="h-4 w-4" /> : <ShoppingBasket className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {added.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sage-100 px-6 py-4 animate-fade-in">
            <p className="flex items-center gap-2 font-medium text-pine">
              <Check className="h-5 w-5" /> {p.common.added}
            </p>
            <Link href={p.preorderHref} className={btn("primary", "md")}>
              {p.common.viewPreorder} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
