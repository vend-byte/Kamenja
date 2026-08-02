import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { importBatches, importBatchItems, products } from '@/db/schema';
import { cloudinary } from '@/lib/cloudinary';
import {
  parseSpreadsheetBuffer, extractZipPackage, autoMapColumns, extractImageFilenames,
  extractEmbeddedImages, isImageUrl, CanonicalField,
} from '@/lib/importParser';
import { detectCategory, CATEGORY_CONFIDENCE_THRESHOLD } from '@/lib/categoryDetector';
import { adminSessionCookieName } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const IMAGE_UPLOAD_CONCURRENCY = 8;

function detectFileType(filename: string): 'xlsx' | 'csv' | 'zip' | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.zip')) return 'zip';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
  if (lower.endsWith('.csv')) return 'csv';
  return null;
}

async function uploadImageBuffer(buffer: Buffer): Promise<string> {
  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'kamenja-enterprises/bulk-import', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, res) => (error ? reject(error) : resolve(res))
    );
    Readable.from(buffer).pipe(stream);
  });
  return result.secure_url as string;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(adminSessionCookieName)?.value;
    if (session !== 'authenticated') {
      return NextResponse.json({
        error: 'Your admin session could not be verified, so the upload was blocked. Try logging out and back in. ' +
          'If this happens immediately after a fresh login, your admin session cookie likely isn\'t being stored — ' +
          'this typically means the app is being served without HTTPS while running in production mode.',
      }, { status: 401 });
    }

    // The browser sends the catalogue file straight to this route as multipart
    // form data. We previously routed it through a direct-to-Cloudinary upload
    // (to avoid Vercel's 4.5MB Function body limit), but Cloudinary's `raw`
    // resource type doesn't return CORS headers on this account/plan — signed
    // browser uploads to /raw/upload get blocked by the browser's CORS check
    // before Cloudinary's response is ever readable, regardless of a valid
    // signature. Since catalogue files are normally well under 4.5MB, sending
    // them directly here sidesteps that limitation entirely. (If a genuinely
    // oversized catalogue ever needs support, chunked upload or a non-raw
    // Cloudinary resource_type workaround would need to be revisited.)
    const form = await request.formData().catch(() => null);
    const file = form?.get('file') as File | null;
    const filename: string = file?.name || 'upload';
    if (!file) {
      return NextResponse.json({ error: 'No file was received.' }, { status: 400 });
    }

    const fileType = detectFileType(filename);
    if (!fileType) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload .xlsx, .csv, or a .zip package.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let sheetBuffer: Buffer = buffer;
    let sheetFilename = filename;
    let imageMap = new Map<string, Buffer>();

    if (fileType === 'zip') {
      const extracted = extractZipPackage(buffer);
      if (!extracted.spreadsheet) {
        return NextResponse.json({ error: 'No spreadsheet (.xlsx or .csv) found inside the ZIP package.' }, { status: 400 });
      }
      sheetBuffer = Buffer.from(extracted.spreadsheet.buffer);
      sheetFilename = extracted.spreadsheet.filename;
      imageMap = extracted.images;
    }

    const { columns, rows } = parseSpreadsheetBuffer(sheetBuffer, sheetFilename);
    if (!columns.length || !rows.length) {
      return NextResponse.json({ error: 'The spreadsheet appears to be empty or unreadable.' }, { status: 400 });
    }

    // Embedded Excel images (images pasted/anchored directly into cells) — keyed by 0-based data row.
    const embeddedByRow = extractEmbeddedImages(sheetBuffer);

    const { mapping, highConfidence } = autoMapColumns(columns);

    // Existing products for duplicate detection (by SKU or name+brand)
    const existing = await db.select({ sku: products.sku, name: products.name, brand: products.brand }).from(products);
    const existingSkuSet = new Set(existing.filter(p => p.sku).map(p => p.sku!.trim().toLowerCase()));
    const existingNameBrandSet = new Set(existing.map(p => `${p.name.trim().toLowerCase()}::${(p.brand || '').trim().toLowerCase()}`));

    const brandsFound = new Set<string>();
    const categoriesFound = new Set<string>();
    const seenInBatch = new Set<string>();

    let duplicateCount = 0;
    let invalidCount = 0;
    let categoriesAutoAssignedCount = 0;
    let lowConfidenceCategoryCount = 0;

    interface PreparedItem {
      rowIndex: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
      imageFilenames: string[];
      buyingPrice: number;
      status: string;
      isDuplicate: boolean;
      errors: string[];
      warnings: string[];
    }

    const prepared: PreparedItem[] = rows.map((row, i) => {
      const mapped: Record<string, string> = {};
      for (const field of Object.keys(mapping) as CanonicalField[]) {
        const col = mapping[field];
        if (col) mapped[field] = row[col] ?? '';
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const name = (mapped.name || '').trim();
      const buyingPriceRaw = (mapped.buyingPrice || '0').replace(/[^0-9.]/g, '');
      const buyingPrice = parseFloat(buyingPriceRaw) || 0;

      if (!name) errors.push('Missing product name.');
      if (!mapped.buyingPrice || buyingPrice <= 0) errors.push('Missing or invalid buying price.');

      let isDuplicate = false;
      if (name) {
        const brand = (mapped.brand || '').trim().toLowerCase();
        const key = `${name.toLowerCase()}::${brand}`;
        const sku = (mapped.sku || '').trim().toLowerCase();
        if ((sku && existingSkuSet.has(sku)) || existingNameBrandSet.has(key) || seenInBatch.has(key)) {
          isDuplicate = true;
          warnings.push('Possible duplicate: a product with this name/brand (or SKU) already exists or appears earlier in this file.');
        }
        seenInBatch.add(key);
      }

      // ── AI category detection ──
      // Only auto-assign when the supplier sheet didn't already give us a category;
      // an explicit category value from the spreadsheet is always trusted as-is.
      if (!mapped.category || !mapped.category.trim()) {
        const detected = detectCategory(name, mapped.description, mapped.brand);
        mapped.category = detected.category;
        categoriesAutoAssignedCount++;
        if (detected.confidence < CATEGORY_CONFIDENCE_THRESHOLD) {
          lowConfidenceCategoryCount++;
          warnings.push(`Category auto-assigned as "${detected.category}" with low confidence — please review.`);
        }
      }

      if (mapped.category) categoriesFound.add(mapped.category.trim());
      if (mapped.brand) brandsFound.add(mapped.brand.trim());

      const imageFilenames = extractImageFilenames(mapped);

      let status = 'ready';
      if (errors.length) { status = 'invalid'; invalidCount++; }
      else if (isDuplicate) { status = 'duplicate'; duplicateCount++; }

      return { rowIndex: i, rawData: row, mappedData: mapped, imageFilenames, buyingPrice, status, isDuplicate, errors, warnings };
    });

    // Resolve images per row from whichever source applies: embedded Excel image > direct URL > ZIP filename lookup.
    const matchedImagesByItem: Record<number, string[]> = {};
    const missingImagesByItem: Record<number, string[]> = {};
    const uploadCache = new Map<string, string>(); // lowercase filename -> cloudinary url (avoid re-uploading same image)
    let embeddedImagesFound = 0, filenameImagesFound = 0, urlImagesFound = 0;

    // 1. Embedded images — upload every buffer found for each row, in parallel.
    const embeddedEntries = Array.from(embeddedByRow.entries());
    if (embeddedEntries.length > 0) {
      const flatUploads: { rowIndex: number; buffer: Buffer }[] = [];
      for (const [rowIndex, buffers] of embeddedEntries) flatUploads.push(...buffers.map(buffer => ({ rowIndex, buffer })));

      const urls = await mapWithConcurrency(flatUploads, IMAGE_UPLOAD_CONCURRENCY, async ({ buffer }) => {
        try { return await uploadImageBuffer(buffer); } catch { return null; }
      });

      flatUploads.forEach(({ rowIndex }, i) => {
        const url = urls[i];
        if (url) {
          (matchedImagesByItem[rowIndex] ||= []).push(url);
          embeddedImagesFound++;
        }
      });
    }

    // 2. Filename references (Image1-5 / Images columns) — split into direct URLs vs ZIP filename lookups.
    const allImageRefs: { itemIdx: number; filename: string }[] = [];
    prepared.forEach((item, idx) => {
      // Skip rows already fully covered by an embedded image, to avoid double-attaching.
      if (matchedImagesByItem[idx]?.length) return;
      item.imageFilenames.forEach(fn => allImageRefs.push({ itemIdx: idx, filename: fn }));
    });

    const urlRefs = allImageRefs.filter(r => isImageUrl(r.filename));
    const filenameRefs = allImageRefs.filter(r => !isImageUrl(r.filename));

    for (const ref of urlRefs) {
      (matchedImagesByItem[ref.itemIdx] ||= []).push(ref.filename.trim());
      urlImagesFound++;
    }

    if (imageMap.size > 0 && filenameRefs.length > 0) {
      const uniqueFilenames = Array.from(new Set(filenameRefs.map(r => r.filename.toLowerCase().split('/').pop() || r.filename.toLowerCase())));
      const toUpload = uniqueFilenames.filter(fn => imageMap.has(fn));

      await mapWithConcurrency(toUpload, IMAGE_UPLOAD_CONCURRENCY, async (fn) => {
        const buf = imageMap.get(fn)!;
        try {
          const url = await uploadImageBuffer(buf);
          uploadCache.set(fn, url);
        } catch {
          // leave unmapped; will show as missing
        }
      });
    }

    for (const ref of filenameRefs) {
      const base = ref.filename.toLowerCase().split('/').pop() || ref.filename.toLowerCase();
      const url = uploadCache.get(base);
      if (url) {
        (matchedImagesByItem[ref.itemIdx] ||= []).push(url);
        filenameImagesFound++;
      } else {
        (missingImagesByItem[ref.itemIdx] ||= []).push(ref.filename);
      }
    }

    const imagesFoundCount = embeddedImagesFound + filenameImagesFound + urlImagesFound;
    const imagesMissingCount = Object.values(missingImagesByItem).reduce((sum, arr) => sum + arr.length, 0);

    for (const item of prepared) {
      if (missingImagesByItem[item.rowIndex]?.length) {
        item.warnings.push(`Missing image(s): ${missingImagesByItem[item.rowIndex].join(', ')}`);
      }
    }

    const readyCount = prepared.filter(p => p.status === 'ready').length;

    const [batch] = await db.insert(importBatches).values({
      fileName: filename,
      fileType,
      status: 'analyzed',
      rawColumns: JSON.stringify(columns),
      columnMapping: JSON.stringify(mapping),
      pricingRule: '{}',
      totalRows: prepared.length,
      readyRows: readyCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      imagesFound: imagesFoundCount,
      imagesMissing: imagesMissingCount,
      embeddedImagesFound,
      filenameImagesFound,
      urlImagesFound,
      categoriesAutoAssigned: categoriesAutoAssignedCount,
      categoriesLowConfidence: lowConfidenceCategoryCount,
      brandsFound: JSON.stringify(Array.from(brandsFound).sort()),
      categoriesFound: JSON.stringify(Array.from(categoriesFound).sort()),
    }).returning();

    // Bulk insert items in chunks to avoid overly large single statements
    const CHUNK = 200;
    for (let i = 0; i < prepared.length; i += CHUNK) {
      const chunk = prepared.slice(i, i + CHUNK);
      await db.insert(importBatchItems).values(chunk.map(item => ({
        batchId: batch.id,
        rowIndex: item.rowIndex,
        rawData: JSON.stringify(item.rawData),
        mappedData: JSON.stringify(item.mappedData),
        imageFilenames: JSON.stringify(item.imageFilenames),
        matchedImages: JSON.stringify(matchedImagesByItem[item.rowIndex] || []),
        missingImages: JSON.stringify(missingImagesByItem[item.rowIndex] || []),
        buyingPrice: item.buyingPrice,
        sellingPrice: 0,
        status: item.status,
        isDuplicate: item.isDuplicate,
        errors: item.errors.length ? JSON.stringify(item.errors) : null,
        warnings: item.warnings.length ? JSON.stringify(item.warnings) : null,
      })));
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      columns,
      mapping,
      highConfidence,
      totalRows: prepared.length,
      readyRows: readyCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      imagesFound: imagesFoundCount,
      imagesMissing: imagesMissingCount,
      embeddedImagesFound,
      filenameImagesFound,
      urlImagesFound,
      categoriesAutoAssigned: categoriesAutoAssignedCount,
      categoriesLowConfidence: lowConfidenceCategoryCount,
      brandsFound: Array.from(brandsFound).sort(),
      categoriesFound: Array.from(categoriesFound).sort(),
    });
  } catch (err: any) {
    console.error('Bulk import upload error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process the uploaded file.' }, { status: 500 });
  }
}
