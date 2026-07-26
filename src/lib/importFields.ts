// Client-safe constants shared between the upload API route, server actions,
// and the wizard UI. Keep this file free of any Node-only imports (fs, adm-zip, xlsx)
// so it can be safely bundled into client components.

export const CANONICAL_FIELDS = [
  'name', 'description', 'sku', 'barcode', 'category', 'subcategory', 'brand',
  'model', 'buyingPrice', 'stockQuantity', 'supplier', 'countryOfOrigin',
  'warranty', 'weight', 'unit', 'color', 'material', 'size', 'tags',
  'qtyPerCarton', 'middlePack',
  'image1', 'image2', 'image3', 'image4', 'image5', 'images',
] as const;

export type CanonicalField = typeof CANONICAL_FIELDS[number];

export const FIELD_LABELS: Record<CanonicalField, string> = {
  name: 'Product Name', description: 'Description', sku: 'SKU', barcode: 'Barcode',
  category: 'Category', subcategory: 'Subcategory', brand: 'Brand', model: 'Model',
  buyingPrice: 'Buying Price', stockQuantity: 'Stock Quantity', supplier: 'Supplier',
  countryOfOrigin: 'Country of Origin', warranty: 'Warranty', weight: 'Weight',
  unit: 'Unit', color: 'Color', material: 'Material', size: 'Size', tags: 'Tags',
  qtyPerCarton: 'Qty per Carton (optional)', middlePack: 'Middle Pack / Pack Size (optional)',
  image1: 'Image 1', image2: 'Image 2', image3: 'Image 3', image4: 'Image 4', image5: 'Image 5',
  images: 'Images (combined column)',
};

export const REQUIRED_FIELDS: CanonicalField[] = ['name', 'buyingPrice'];

export function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}
