export type PricingMode = 'margin' | 'fixed' | 'category' | 'brand' | 'formula';

export interface PricingRule {
  mode: PricingMode;
  marginPercent?: number;          // OPTION 1: percentage profit margin
  fixedAmount?: number;            // OPTION 2: fixed amount added to buying price
  categoryMargins?: Record<string, number>; // OPTION 3: category name -> % margin
  brandMargins?: Record<string, number>;    // OPTION 4: brand name -> % margin
  defaultMarginPercent?: number;   // fallback margin when category/brand not found
  formula?: string;                // OPTION 5: e.g. "buyingPrice * 1.25 + 200"
}

export function defaultPricingRule(): PricingRule {
  return { mode: 'margin', marginPercent: 25, defaultMarginPercent: 20 };
}

/**
 * Safely evaluate a simple arithmetic formula containing only the token
 * `buyingPrice`, numbers, parentheses and + - * / operators. Never uses raw eval
 * on untrusted input — the buyingPrice substitution is numeric only, and the
 * final expression is validated against a strict whitelist before evaluation.
 */
export function evaluateFormula(formula: string, buyingPrice: number): number {
  if (!formula || !formula.trim()) return buyingPrice;
  const substituted = formula.replace(/buyingprice/gi, String(buyingPrice));
  if (!/^[0-9+\-*/.() \s]+$/.test(substituted)) {
    throw new Error('Formula contains unsupported characters. Only numbers, buyingPrice, and + - * / ( ) are allowed.');
  }
  try {
    const result = Function(`"use strict"; return (${substituted});`)();
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Formula did not evaluate to a valid number.');
    return result;
  } catch {
    throw new Error(`Invalid pricing formula: "${formula}"`);
  }
}

export function calculateSellingPrice(
  buyingPrice: number,
  rule: PricingRule,
  context: { category?: string | null; brand?: string | null }
): number {
  const bp = Number(buyingPrice) || 0;

  switch (rule.mode) {
    case 'margin': {
      const margin = Number(rule.marginPercent) || 0;
      return round2(bp + bp * (margin / 100));
    }
    case 'fixed': {
      const add = Number(rule.fixedAmount) || 0;
      return round2(bp + add);
    }
    case 'category': {
      const cat = (context.category || '').trim().toLowerCase();
      const map = rule.categoryMargins || {};
      const matchKey = Object.keys(map).find(k => k.trim().toLowerCase() === cat);
      const margin = matchKey ? map[matchKey] : (rule.defaultMarginPercent ?? 20);
      return round2(bp + bp * (margin / 100));
    }
    case 'brand': {
      const brand = (context.brand || '').trim().toLowerCase();
      const map = rule.brandMargins || {};
      const matchKey = Object.keys(map).find(k => k.trim().toLowerCase() === brand);
      const margin = matchKey ? map[matchKey] : (rule.defaultMarginPercent ?? 20);
      return round2(bp + bp * (margin / 100));
    }
    case 'formula': {
      return round2(evaluateFormula(rule.formula || 'buyingPrice', bp));
    }
    default:
      return bp;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
