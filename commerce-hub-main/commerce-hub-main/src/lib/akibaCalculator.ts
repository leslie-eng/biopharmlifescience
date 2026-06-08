export const AKIBA_CALCULATOR_PATH = "/akiba-calculator";

export type RestockFrequencyDays = 7 | 14 | 30;

export type CalculatorItem = {
  id: string;
  name: string;
  monthlyUsage: string;
  safetyBuffer: string;
  unitCost: string;
};

export type ItemResult = {
  name: string;
  min: number;
  max: number;
  cycleQty: number;
  minPct: number;
  freqLabel: string;
  capitalSaved: number;
  verdict: { type: "ok" | "warn" | "bad"; text: string };
};

const LEAD_DAYS = 2;
const SAVINGS_RATE = 0.15;

export function getFreqLabel(days: number): string {
  if (days === 7) return "Weekly";
  if (days === 14) return "Biweekly";
  return "Monthly";
}

export function getRecommendedFreq(monthly: number): RestockFrequencyDays {
  const weeklyQty = (monthly / 30) * 7;
  const biweeklyQty = (monthly / 30) * 14;
  if (weeklyQty >= 10) return 7;
  if (biweeklyQty >= 10) return 14;
  return 30;
}

export function buildVerdict(
  selectedDays: RestockFrequencyDays,
  recommendedDays: RestockFrequencyDays,
  cycleQty: number,
): ItemResult["verdict"] {
  const freqLabel = getFreqLabel(selectedDays);

  if (selectedDays === recommendedDays) {
    return {
      type: "ok",
      text: `${freqLabel} delivery works well for this item. Delivery quantity: ${cycleQty} units.`,
    };
  }

  if (selectedDays < recommendedDays) {
    return {
      type: "warn",
      text: `${freqLabel} delivery is tight — only ${cycleQty} units per run. Less frequent drop cycles would be more efficient.`,
    };
  }

  return {
    type: "bad",
    text: `${freqLabel} delivery risks sudden stockouts based on your high consumption. Biolink recommends a more frequent restock framework.`,
  };
}

export function calculateParLevels(
  items: CalculatorItem[],
  selectedFreqDays: RestockFrequencyDays,
): { results: ItemResult[]; annualSavings: number } | null {
  const results: ItemResult[] = [];
  let cumulativeCapitalSaved = 0;
  const freqLabel = getFreqLabel(selectedFreqDays);

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const name = item.name.trim() || `Material Stream #${idx + 1}`;
    const monthly = parseFloat(item.monthlyUsage);
    const buffer = parseFloat(item.safetyBuffer);
    const unitCost = parseFloat(item.unitCost) || 0;

    if (!monthly || !buffer) continue;

    const daily = monthly / 30;
    const min = Math.round(daily * LEAD_DAYS + daily * buffer);
    const cycleQty = Math.round(daily * selectedFreqDays);
    const max = Math.round(min + cycleQty);
    const minPct = max > 0 ? Math.round((min / max) * 100) : 0;

    const recommendedDays = getRecommendedFreq(monthly);
    const capitalSaved = Math.round(monthly * unitCost * SAVINGS_RATE);
    cumulativeCapitalSaved += capitalSaved;

    results.push({
      name,
      min,
      max,
      cycleQty,
      minPct,
      freqLabel,
      capitalSaved,
      verdict: buildVerdict(selectedFreqDays, recommendedDays, cycleQty),
    });
  }

  if (results.length === 0) return null;

  return {
    results,
    annualSavings: cumulativeCapitalSaved * 12,
  };
}

export function formatKes(amount: number): string {
  return amount.toLocaleString("en-KE");
}

export function akibaCalculatorWhatsAppMessage(annualSavings: number): string {
  return `Hi Biolink, I just ran our facility metrics on the Akiba Calculator and would love to schedule our free site procurement audit. Our estimated cost efficiency dividend is KSh ${formatKes(annualSavings)} per year.`;
}
