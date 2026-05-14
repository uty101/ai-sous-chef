export type Units = 'metric' | 'imperial';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fmt(n: number): string {
  return n === Math.floor(n) ? String(n) : String(n);
}

export function convertText(text: string, units: Units): string {
  if (units === 'metric') return text;

  // kg → lb  (must run before the g rule)
  text = text.replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, (_, n) => {
    const lb = round1(parseFloat(n) * 2.20462);
    return `${fmt(lb)}lb`;
  });

  // g → oz or lb
  text = text.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, n) => {
    const g = parseFloat(n);
    if (g >= 454) {
      const lb = round1(g / 453.592);
      return `${fmt(lb)}lb`;
    }
    const oz = round1(g / 28.3495);
    return `${fmt(oz)}oz`;
  });

  // ml → fl oz or pints (UK measures)
  text = text.replace(/(\d+(?:\.\d+)?)\s*ml\b/gi, (_, n) => {
    const ml = parseFloat(n);
    if (ml >= 568) {
      const pints = round1(ml / 568.261);
      return `${fmt(pints)} pint${pints === 1 ? '' : 's'}`;
    }
    const floz = round1(ml / 28.4131);
    return `${fmt(floz)}fl oz`;
  });

  // l / litres / liters → pints (UK) — negative lookahead to avoid matching "lb"
  text = text.replace(/(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l(?!b))\b/gi, (_, n) => {
    const pints = round1(parseFloat(n) * 1.75975);
    return `${fmt(pints)} pint${pints === 1 ? '' : 's'}`;
  });

  // °C → °F; round oven temps (≥100°C) to nearest 25°F
  text = text.replace(/(\d+)\s*°C\b/g, (_, n) => {
    const c = parseInt(n, 10);
    const f = c * 9 / 5 + 32;
    return c >= 100 ? `${Math.round(f / 25) * 25}°F` : `${Math.round(f)}°F`;
  });

  return text;
}
