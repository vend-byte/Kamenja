// Automatic SEO metadata generation for products. Used at bulk-import ingestion
// time (so every imported product gets a slug, meta title, and meta description
// without any manual entry) and shared with the product detail page as a
// fallback for products that predate this feature or were created manually
// without SEO fields filled in.

const SITE_NAME = 'KAMENJA ENTERPRISES';

/** Strip HTML-ish tags, collapse whitespace, and trim — never inject markup into meta tags. */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Truncate to a max length on a word boundary, appending an ellipsis if cut. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export interface SeoInput {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  brand?: string | null;
}

/**
 * Optimized <title> tag content: "Product Name – Brand | Category | Site Name",
 * trimmed to fit Google's ~60 character display limit while staying descriptive.
 */
export function generateMetaTitle({ name, brand, category }: SeoInput): string {
  const cleanName = cleanText(name || '').trim();
  if (!cleanName) return SITE_NAME;

  const parts = [cleanName];
  if (brand && brand.trim() && !cleanName.toLowerCase().includes(brand.trim().toLowerCase())) {
    parts.push(brand.trim());
  }
  let title = parts.join(' – ');

  // Only add category/site name if there's room left within the ~60 char budget.
  const withCategory = category && category.trim() ? `${title} | ${category.trim()}` : title;
  const withSite = `${withCategory} | ${SITE_NAME}`;

  if (withSite.length <= 60) return withSite;
  if (withCategory.length <= 60) return withCategory;
  if (title.length <= 60) return title;
  return truncate(title, 60);
}

/**
 * Optimized meta description: prefers the product's own description/short description,
 * falls back to a generated sentence from name/brand/category, always truncated to
 * Google's ~155-160 character display limit.
 */
export function generateMetaDescription({ name, description, shortDescription, category, brand }: SeoInput): string {
  const cleanName = cleanText(name || '').trim();
  const source = cleanText(shortDescription || description || '');

  if (source) {
    return truncate(source, 158);
  }

  const bits: string[] = [];
  if (cleanName) bits.push(`Buy ${cleanName}`);
  if (brand && brand.trim()) bits.push(`by ${brand.trim()}`);
  if (category && category.trim()) bits.push(`in ${category.trim()}`);
  const lead = bits.join(' ') || cleanName || SITE_NAME;

  const description2 = `${lead} at wholesale prices from ${SITE_NAME}. Genuine, brand-sourced stock with fast delivery across Kenya.`;
  return truncate(description2, 158);
}

/** Convenience helper: generate both fields at once for insertion into the products table. */
export function generateProductSeo(input: SeoInput): { metaTitle: string; metaDescription: string } {
  return {
    metaTitle: generateMetaTitle(input),
    metaDescription: generateMetaDescription(input),
  };
}
