import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import { CANONICAL_FIELDS, CanonicalField, REQUIRED_FIELDS, slugify } from './importFields';

export { CANONICAL_FIELDS, REQUIRED_FIELDS, slugify };
export type { CanonicalField };

// Alias lists in priority order (first match wins). Keep 'description' as a low
// priority fallback alias for name, per spec, but description itself is checked first.
// Generic single-word aliases (name, price, code) are placed LAST in each list so a more
// specific match (e.g. "Product Name", "Cost Price") always wins when both are present,
// while still catching bare supplier columns like NAME / PRICE / CODE when that's all there is.
const FIELD_ALIASES: Record<CanonicalField, string[]> = {
  name: ['product name', 'item name', 'product', 'title', 'name'],
  description: ['description', 'desc', 'details', 'product description'],
  sku: ['sku', 'item code', 'product code', 'item no', 'article number', 'code'],
  barcode: ['barcode', 'ean', 'upc', 'bar code'],
  category: ['category', 'cat'],
  subcategory: ['subcategory', 'sub category', 'sub-category'],
  brand: ['brand', 'manufacturer', 'make'],
  model: ['model', 'model number', 'model no'],
  buyingPrice: ['buying price', 'cost price', 'purchase price', 'supplier price', 'unit cost', 'cost', 'buy price', 'price'],
  stockQuantity: ['stock quantity', 'stock qty', 'quantity', 'qty', 'stock'],
  supplier: ['supplier', 'vendor'],
  countryOfOrigin: ['country of origin', 'origin', 'made in', 'country'],
  warranty: ['warranty'],
  weight: ['weight'],
  unit: ['unit', 'uom', 'unit of measure'],
  color: ['color', 'colour'],
  material: ['material'],
  size: ['size'],
  tags: ['tags', 'keywords'],
  // Optional packaging/logistics columns — never required, never invalidate a row.
  qtyPerCarton: ['quantity per carton', 'qty per carton', 'master carton', 'box qty', 'carton qty', 'ctn qty'],
  middlePack: ['middle pack', 'pack size', 'inner pack'],
  image1: ['image1', 'image 1', 'img1', 'photo1'],
  image2: ['image2', 'image 2', 'img2', 'photo2'],
  image3: ['image3', 'image 3', 'img3', 'photo3'],
  image4: ['image4', 'image 4', 'img4', 'photo4'],
  image5: ['image5', 'image 5', 'img5', 'photo5'],
  // 'picture'/'photo' catches suppliers who label an embedded-image column loosely.
  images: ['images', 'image', 'photos', 'pictures', 'picture', 'photo'],
};

function normalize(h: string): string {
  return h.toString().toLowerCase().trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
}

export interface ColumnMappingResult {
  mapping: Partial<Record<CanonicalField, string>>;
  /** true if every required field matched via an exact (not just "contains") alias match */
  highConfidence: boolean;
}

export function autoMapColumns(columns: string[]): ColumnMappingResult {
  const mapping: Partial<Record<CanonicalField, string>> = {};
  const exactMatchFields = new Set<CanonicalField>();
  const normalizedCols = columns.map(c => ({ raw: c, norm: normalize(c) }));

  for (const field of CANONICAL_FIELDS) {
    const aliases = FIELD_ALIASES[field];
    let bestMatch: string | undefined;

    // 1. exact normalized match (high confidence)
    for (const alias of aliases) {
      const exact = normalizedCols.find(c => c.norm === alias);
      if (exact) { bestMatch = exact.raw; exactMatchFields.add(field); break; }
    }
    // 2. contains match (lower confidence, skip for the generic 'description' fallback of name)
    if (!bestMatch) {
      for (const alias of aliases) {
        const contains = normalizedCols.find(c => c.norm.includes(alias));
        if (contains) { bestMatch = contains.raw; break; }
      }
    }
    if (bestMatch) mapping[field] = bestMatch;
  }

  // Don't let 'description' column double as both name and description mapping
  // unless nothing better was found for name.
  if (mapping.name && mapping.description === mapping.name) {
    delete mapping.description;
  }

  // High confidence = every required field (name, buyingPrice) was matched exactly,
  // so we can skip the manual mapping screen entirely for this catalogue.
  const highConfidence = REQUIRED_FIELDS.every(f => mapping[f] && exactMatchFields.has(f));

  return { mapping, highConfidence };
}

export interface ParsedSpreadsheet {
  columns: string[];
  rows: Record<string, string>[];
}

export function parseSpreadsheetBuffer(buffer: Buffer, filename: string): ParsedSpreadsheet {
  const isCsv = filename.toLowerCase().endsWith('.csv');
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false, codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { columns: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!json.length) return { columns: [], rows: [] };
  const columns = Object.keys(json[0]);
  const rows = json.map(r => {
    const out: Record<string, string> = {};
    for (const c of columns) out[c] = r[c] === undefined || r[c] === null ? '' : String(r[c]).trim();
    return out;
  });
  return { columns, rows };
}

export interface ExtractedZip {
  spreadsheet: { buffer: Buffer; filename: string } | null;
  images: Map<string, Buffer>; // lowercase basename -> file bytes
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

export function extractZipPackage(buffer: Buffer): ExtractedZip {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const images = new Map<string, Buffer>();
  let spreadsheet: { buffer: Buffer; filename: string } | null = null;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;
    const base = name.split('/').pop() || name;
    const lowerBase = base.toLowerCase();
    const ext = lowerBase.slice(lowerBase.lastIndexOf('.'));

    if (!spreadsheet && (ext === '.xlsx' || ext === '.csv') && !lowerBase.startsWith('~$')) {
      spreadsheet = { buffer: entry.getData(), filename: base };
      continue;
    }
    if (IMAGE_EXTENSIONS.includes(ext)) {
      images.set(lowerBase, entry.getData());
    }
  }

  return { spreadsheet, images };
}

export function isSupportedImageFormat(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function isImageUrl(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  return /^https?:\/\/\S+$/i.test(v);
}

// ─── EMBEDDED EXCEL IMAGES ──────────────────────────────────────────────
//
// An .xlsx is itself a zip. Images placed inside cells live under xl/media/*,
// and are anchored to a worksheet row/col via xl/drawings/drawingN.xml, which is
// linked to the worksheet through xl/worksheets/_rels/sheetN.xml.rels and to the
// actual media file through xl/drawings/_rels/drawingN.xml.rels. We parse just
// enough of that relationship chain (via lightweight regex, since the structure
// is simple and well-defined) to map each image back to the data row it belongs to.

function getEntryText(zip: AdmZip, path: string): string | null {
  const entry = zip.getEntry(path);
  if (!entry) return null;
  return entry.getData().toString('utf8');
}

function resolveRelativePath(basePath: string, relTarget: string): string {
  if (relTarget.startsWith('/')) return relTarget.slice(1);
  const baseDir = basePath.split('/').slice(0, -1); // drop filename
  const parts = relTarget.split('/');
  const stack = [...baseDir];
  for (const part of parts) {
    if (part === '..') stack.pop();
    else if (part === '.') continue;
    else stack.push(part);
  }
  return stack.join('/');
}

function parseRelsFile(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const tagRe = /<Relationship\b[^>]*\/?>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(xml))) {
    const tag = tagMatch[0];
    const id = tag.match(/\bId="([^"]+)"/)?.[1];
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) map.set(id, target);
  }
  return map;
}

/**
 * Extract every image embedded in worksheet cells, mapped to its 0-based DATA row
 * index (i.e. header row = -1, first data row = 0), matching the indexing used by
 * parseSpreadsheetBuffer's `rows` array. Best-effort: assumes the header occupies
 * worksheet row 1 (Excel's 1-based numbering) with data starting at row 2.
 */
export function extractEmbeddedImages(buffer: Buffer): Map<number, Buffer[]> {
  const result = new Map<number, Buffer[]>();
  try {
    const zip = new AdmZip(buffer);

    // 1. Find the first worksheet's xml path via workbook.xml + its rels
    const workbookXml = getEntryText(zip, 'xl/workbook.xml');
    const workbookRelsXml = getEntryText(zip, 'xl/_rels/workbook.xml.rels');
    if (!workbookXml || !workbookRelsXml) return result;

    const sheetTagMatch = workbookXml.match(/<sheet\b[^>]*\/>/);
    if (!sheetTagMatch) return result;
    const ridMatch = sheetTagMatch[0].match(/r:id="([^"]+)"/);
    if (!ridMatch) return result;

    const workbookRels = parseRelsFile(workbookRelsXml);
    const sheetTarget = workbookRels.get(ridMatch[1]);
    if (!sheetTarget) return result;
    const sheetPath = resolveRelativePath('xl/workbook.xml', sheetTarget);

    // 2. Find the drawing xml linked from this worksheet
    const sheetDir = sheetPath.split('/').slice(0, -1).join('/');
    const sheetFile = sheetPath.split('/').pop()!;
    const sheetRelsPath = `${sheetDir}/_rels/${sheetFile}.rels`;
    const sheetRelsXml = getEntryText(zip, sheetRelsPath);
    if (!sheetRelsXml) return result;

    const drawingTagRe = /<Relationship\b[^>]*\/?>/g;
    let drawingTagMatch: RegExpExecArray | null;
    let drawingTarget: string | null = null;
    while ((drawingTagMatch = drawingTagRe.exec(sheetRelsXml))) {
      const tag = drawingTagMatch[0];
      if (/\bType="[^"]*\/drawing"/.test(tag)) {
        drawingTarget = tag.match(/\bTarget="([^"]+)"/)?.[1] || null;
        break;
      }
    }
    if (!drawingTarget) return result;
    const drawingPath = resolveRelativePath(sheetPath, drawingTarget);

    const drawingXml = getEntryText(zip, drawingPath);
    if (!drawingXml) return result;

    // 3. Map drawing rIds -> media file paths
    const drawingDir = drawingPath.split('/').slice(0, -1).join('/');
    const drawingFile = drawingPath.split('/').pop()!;
    const drawingRelsPath = `${drawingDir}/_rels/${drawingFile}.rels`;
    const drawingRelsXml = getEntryText(zip, drawingRelsPath);
    const drawingRels = drawingRelsXml ? parseRelsFile(drawingRelsXml) : new Map<string, string>();

    // 4. Walk each anchor block, grab its `from row` and embedded image rId.
    // Namespace prefixes vary between exporters (Excel itself uses "xdr:", but tools like
    // openpyxl/LibreOffice may emit unprefixed elements) — match both by making the prefix optional.
    const anchorRe = /<(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)>/g;
    let anchorMatch: RegExpExecArray | null;
    while ((anchorMatch = anchorRe.exec(drawingXml))) {
      const block = anchorMatch[0];
      const rowMatch = block.match(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/);
      const embedMatch = block.match(/r:embed="([^"]+)"/);
      if (!rowMatch || !embedMatch) continue;

      const excelRow = parseInt(rowMatch[1], 10); // 0-based worksheet row
      const dataRowIndex = excelRow - 1; // header assumed at worksheet row 0
      if (dataRowIndex < 0) continue;

      const mediaTarget = drawingRels.get(embedMatch[1]);
      if (!mediaTarget) continue;
      const mediaPath = resolveRelativePath(drawingPath, mediaTarget);
      const mediaEntry = zip.getEntry(mediaPath);
      if (!mediaEntry) continue;

      const buf = mediaEntry.getData();
      if (!result.has(dataRowIndex)) result.set(dataRowIndex, []);
      result.get(dataRowIndex)!.push(Buffer.from(buf));
    }
  } catch {
    // Corrupt or unexpected xlsx internals — treat as "no embedded images" rather than failing the import.
    return new Map();
  }
  return result;
}

/** Pull the list of image filenames a row references, from either Image1-5 columns or a combined Images column. */
export function extractImageFilenames(mapped: Record<string, string>): string[] {
  const names: string[] = [];
  for (const key of ['image1', 'image2', 'image3', 'image4', 'image5']) {
    const v = (mapped as any)[key];
    if (v && v.trim()) names.push(v.trim());
  }
  if ((mapped as any).images) {
    const combined = (mapped as any).images as string;
    combined.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean).forEach((n: string) => names.push(n));
  }
  return Array.from(new Set(names));
}

