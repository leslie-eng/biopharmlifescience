import { useId, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  akibaCalculatorWhatsAppMessage,
  calculateParLevels,
  formatKes,
  type CalculatorItem,
  type ItemResult,
  type RestockFrequencyDays,
} from "@/lib/akibaCalculator";
import { whatsAppSendUrl } from "@/lib/contact";
import { toast } from "sonner";

const FREQ_OPTIONS: { days: RestockFrequencyDays; label: string; sub: string }[] = [
  { days: 7, label: "Weekly", sub: "Every 7 Days" },
  { days: 14, label: "Biweekly", sub: "Every 14 Days" },
  { days: 30, label: "Monthly", sub: "Every 30 Days" },
];

function newItem(): CalculatorItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    monthlyUsage: "",
    safetyBuffer: "3",
    unitCost: "1200",
  };
}

function VerdictBanner({ verdict }: { verdict: ItemResult["verdict"] }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-xs leading-relaxed",
        verdict.type === "ok" && "border-secondary/25 bg-secondary/5 text-secondary",
        verdict.type === "warn" && "border-warning/40 bg-warning/10 text-foreground",
        verdict.type === "bad" && "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      <span aria-hidden="true" className="mr-1">
        {verdict.type === "ok" ? "✓" : verdict.type === "warn" ? "⚠" : "✕"}
      </span>
      {verdict.text}
    </div>
  );
}

export const AkibaCalculator = () => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [freqDays, setFreqDays] = useState<RestockFrequencyDays>(14);
  const [items, setItems] = useState<CalculatorItem[]>(() => [newItem()]);
  const [results, setResults] = useState<ItemResult[] | null>(null);
  const [annualSavings, setAnnualSavings] = useState(0);
  const formId = useId();

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  };

  const updateItem = (id: string, field: keyof CalculatorItem, value: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleCalculate = () => {
    const computed = calculateParLevels(items, freqDays);
    if (!computed) {
      toast.error(
        "Please input monthly tracking metrics parameter configurations for a minimum of one material line item.",
      );
      return;
    }

    setResults(computed.results);
    setAnnualSavings(computed.annualSavings);

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const whatsAppUrl = whatsAppSendUrl(akibaCalculatorWhatsAppMessage(annualSavings));

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-primary">
          Biolink Solutions EA
        </span>
        <h2 className="mb-2 font-serif text-3xl font-bold tracking-tight text-foreground">
          Akiba Calculator
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Discover your optimal procurement parameters. Enter your facility metrics to map your precise safety buffer
          points and unlock potential operational cost savings.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-5">
        <Label className="mb-1 block text-sm font-medium text-foreground">Target Restocking Cadence</Label>
        <p className="mb-4 text-xs text-muted-foreground">
          We will evaluate this velocity framework against your facility storage capacity parameters.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {FREQ_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setFreqDays(opt.days)}
              className={cn(
                "cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all",
                freqDays === opt.days
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50",
              )}
            >
              {opt.label}
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Consumable Track #{index + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="cursor-pointer border-none bg-transparent text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                  Remove Item
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor={`${formId}-name-${item.id}`} className="text-xs font-medium text-muted-foreground">
                  Item Description
                </Label>
                <Input
                  id={`${formId}-name-${item.id}`}
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="e.g. Dialysis Tubing Lines"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${formId}-usage-${item.id}`} className="text-xs font-medium text-muted-foreground">
                  Monthly Usage (Units/Boxes)
                </Label>
                <Input
                  id={`${formId}-usage-${item.id}`}
                  type="number"
                  min={0}
                  value={item.monthlyUsage}
                  onChange={(e) => updateItem(item.id, "monthlyUsage", e.target.value)}
                  placeholder="200"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${formId}-buffer-${item.id}`} className="text-xs font-medium text-muted-foreground">
                  Safety Buffer (Days)
                </Label>
                <Input
                  id={`${formId}-buffer-${item.id}`}
                  type="number"
                  min={0}
                  value={item.safetyBuffer}
                  onChange={(e) => updateItem(item.id, "safetyBuffer", e.target.value)}
                  placeholder="3"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${formId}-cost-${item.id}`} className="text-xs font-medium text-muted-foreground">
                  Est. Unit Cost (KSh)
                </Label>
                <Input
                  id={`${formId}-cost-${item.id}`}
                  type="number"
                  min={0}
                  value={item.unitCost}
                  onChange={(e) => updateItem(item.id, "unitCost", e.target.value)}
                  placeholder="1200"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mb-6 w-full cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 text-sm font-medium text-primary transition-colors hover:border-primary/50"
      >
        + Add Another Product
      </button>

      <button
        type="button"
        onClick={handleCalculate}
        className="w-full cursor-pointer rounded-xl bg-primary p-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
      >
        Run Procurement Diagnostics &amp; Calculate Akiba Savings
      </button>

      {results && (
        <div ref={resultsRef} className="mt-12 scroll-mt-24 space-y-6 border-t border-border pt-8">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Your Facility Diagnostic Summary</h3>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">
              Estimated Annual Optimization Dividend
            </span>
            <div className="mb-2 text-3xl font-extrabold text-foreground">
              KSh {formatKes(annualSavings)}{" "}
              <span className="text-sm font-medium text-primary">/ year</span>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              By syncing your real facility usage with our predictive <strong>DHIBITI FRAMEWORK</strong>, you save up to
              15% on procurement by reducing emergency markup runs, inventory waste, and dead-stock liquidity locks.
            </p>
          </div>

          <div className="space-y-4">
            {results.map((r) => (
              <div key={`${r.name}-${r.min}`} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3 text-sm font-bold text-foreground">
                  <span>📦 {r.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Cycle Cost Avoidance: KSh {formatKes(r.capitalSaved)}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      Min (Reorder Trigger)
                    </span>
                    <span className="block text-lg font-bold text-destructive">{r.min}</span>
                    <span className="text-[9px] text-muted-foreground">units remaining</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      Optimal Batch Restock
                    </span>
                    <span className="block text-lg font-bold text-primary">{r.cycleQty}</span>
                    <span className="text-[9px] text-muted-foreground">units per cycle drop</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      Max Facility Cap
                    </span>
                    <span className="block text-lg font-bold text-secondary">{r.max}</span>
                    <span className="text-[9px] text-muted-foreground">units storage target</span>
                  </div>
                </div>

                <VerdictBanner verdict={r.verdict} />

                <div className="mt-4">
                  <div className="relative h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="absolute left-0 top-0 h-full bg-destructive"
                      style={{ width: `${r.minPct}%` }}
                    />
                    <div
                      className="absolute top-0 h-full bg-primary"
                      style={{ left: `${r.minPct}%`, width: `${100 - r.minPct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] font-semibold">
                    <span className="text-destructive">Reorder Threshold: {r.min}</span>
                    <span className="text-secondary">Storage Target Limit: {r.max}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary p-4 text-center text-sm font-semibold text-secondary-foreground shadow-md transition-colors hover:bg-secondary/90"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Schedule Free Site Verification Audit via WhatsApp
          </a>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Calculations are metric projections based on algorithmic lead tracking patterns. Official clinical stock
            limits will be validated and signed off by a Biolink medical operations consultant during your physical
            facility review.
          </p>
        </div>
      )}
    </div>
  );
};
