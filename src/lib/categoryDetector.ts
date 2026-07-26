// Rule-based category detection for the bulk importer. When a supplier row has no
// category value (or an unrecognized one), this classifies the product from its
// name/description/brand text using weighted keyword matching.
//
// Note: this is text-based keyword matching, not image recognition or OCR — that
// would require a vision model call per product image, which isn't wired up here.
// For products with a clear, describable name this gets the vast majority right;
// low-confidence rows are flagged in the import preview for manual review instead
// of being silently mis-filed.

export const STORE_CATEGORIES = [
  'Hand Tools', 'Power Tools', 'Plumbing', 'Electrical', 'Paints & Accessories',
  'Locks & Security', 'Building Materials', 'Garden Supplies', 'Hardware Accessories',
  'Home Improvement', 'General',
] as const;

export type StoreCategory = typeof STORE_CATEGORIES[number];

const CATEGORY_KEYWORDS: Record<Exclude<StoreCategory, 'General'>, string[]> = {
  'Hand Tools': [
    'spanner', 'wrench', 'screwdriver', 'plier', 'hammer', 'hand saw', 'hacksaw',
    'chisel', 'file set', 'tape measure', 'measuring tape', 'level', 'spirit level',
    'allen key', 'hex key', 'socket set', 'tool set', 'tool kit', 'crowbar', 'clamp',
    'utility knife', 'cutter', 'vice', 'vise',
  ],
  'Power Tools': [
    'drill', 'grinder', 'angle grinder', 'jigsaw', 'circular saw', 'chainsaw',
    'sander', 'planer', 'router', 'impact driver', 'rotary hammer', 'welding machine',
    'welder', 'compressor', 'generator', 'blower', 'cordless', 'bosch', 'makita',
    'dewalt', 'ingco', 'total tools', 'power tool',
  ],
  'Plumbing': [
    'pipe', 'faucet', 'tap', 'valve', 'plumbing', 'fitting', 'elbow', 'coupling',
    'pvc', 'hose', 'sink', 'toilet', 'cistern', 'shower head', 'water heater',
    'pressure pump', 'submersible pump', 'water pump', 'union', 'nipple fitting',
  ],
  'Electrical': [
    'cable', 'wire', 'switch', 'socket outlet', 'circuit breaker', 'mcb', 'fuse',
    'led bulb', 'bulb', 'light fitting', 'electrical tape', 'extension cable',
    'distribution board', 'conduit', 'electrical panel', 'transformer', 'inverter',
    'battery', 'solar panel', 'ballast', 'relay',
  ],
  'Paints & Accessories': [
    'paint', 'varnish', 'primer', 'undercoat', 'roller', 'paint brush', 'brush set',
    'thinner', 'emulsion', 'gloss paint', 'spray paint', 'sealant', 'putty',
    'sandpaper', 'masking tape', 'wall filler',
  ],
  'Locks & Security': [
    'padlock', 'lock', 'door lock', 'deadbolt', 'hinge', 'security', 'safe box',
    'cctv', 'camera', 'alarm', 'key cutting', 'keyhole', 'latch', 'bolt lock',
    'chain lock',
  ],
  'Building Materials': [
    'cement', 'sand', 'ballast', 'aggregate', 'steel bar', 'rebar', 'wire mesh',
    'roofing sheet', 'iron sheet', 'timber', 'plywood', 'block', 'brick', 'tile',
    'gypsum', 'insulation', 'scaffolding', 'nail', 'screw', 'bolt and nut',
    'wood glue',
  ],
  'Garden Supplies': [
    'garden', 'hose pipe', 'sprinkler', 'lawn mower', 'wheelbarrow', 'shovel',
    'spade', 'rake', 'hoe', 'pruning shears', 'secateurs', 'fertilizer', 'seed',
    'watering can', 'greenhouse',
  ],
  'Hardware Accessories': [
    'bracket', 'fastener', 'washer', 'rivet', 'anchor bolt', 'hardware kit',
    'cable tie', 'adhesive', 'glue gun', 'hook', 'handle', 'knob', 'caster wheel',
  ],
  'Home Improvement': [
    'curtain rod', 'blind', 'wallpaper', 'flooring', 'ceiling', 'door handle',
    'cabinet', 'shelf', 'shelving', 'mirror', 'ladder', 'storage box',
    'furniture fitting',
  ],
};

export interface CategoryMatch {
  category: StoreCategory;
  confidence: number; // 0–1
}

/** High-confidence threshold above which we accept the auto-detected category without flagging for review. */
export const CATEGORY_CONFIDENCE_THRESHOLD = 0.5;

export function detectCategory(name: string, description?: string, brand?: string): CategoryMatch {
  const text = `${name || ''} ${description || ''}`.toLowerCase();
  if (!text.trim()) return { category: 'General', confidence: 0 };

  let bestCategory: StoreCategory = 'General';
  let bestScore = 0;
  let totalHits = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Exclude<StoreCategory, 'General'>, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        // Longer / more specific keywords count for more (e.g. "angle grinder" > "grinder").
        score += kw.split(' ').length;
        totalHits++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (bestScore === 0) return { category: 'General', confidence: 0 };

  // Confidence: how dominant the winning category's score is vs total keyword hits across all categories,
  // scaled by the raw score so a single weak match doesn't look artificially certain.
  const dominance = totalHits > 0 ? bestScore / totalHits : 0;
  const strength = Math.min(bestScore / 3, 1); // 3+ keyword-words matched = full strength
  const confidence = Math.min(dominance * 0.6 + strength * 0.4, 1);

  return { category: bestCategory, confidence };
}
