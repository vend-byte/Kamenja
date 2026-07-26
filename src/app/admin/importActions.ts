'use server';

import { db } from '@/db';
import { importBatches, importBatchItems, products, categories } from '@/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { calculateSellingPrice, PricingRule } from '@/lib/pricingEngine';
import { slugify, CanonicalField } from '@/lib/importFields';

// ─── HISTORY ──────────────────────────────────────────────────────────────

export async function listImportBatchesAction() {
  const rows = await db.select().from(importBatches).orderBy(sql`${importBatches.createdAt} desc`).limit(50);
  return rows;
}

export async function getImportBatchAction(batchId: number) {
  const [batch] = await db.select().from(importBatches).where(eq(importBatches.id, batchId)).limit(1);
  return batch || null;
}

export async function deleteImportBatchAction(batchId: number) {
  try {
    await db.delete(importBatches).where(eq(importBatches.id, batchId));
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete import batch.' };
  }
}

// ─── STEP 2: COLUMN MAPPING (re-mapping uses stored rawData, no re-upload needed) ───

export async function updateColumnMappingAction(batchId: number, mapping: Partial<Record<CanonicalField, string>>) {
  try {
    const items = await db.select().from(importBatchItems).where(eq(importBatchItems.batchId, batchId));

    let readyCount = 0, duplicateCount = 0, invalidCount = 0;
    const brandsFound = new Set<string>();
    const categoriesFound = new Set<string>();
    const seen = new Set<string>();

    const existing = await db.select({ sku: products.sku, name: products.name, brand: products.brand }).from(products);
    const existingSkuSet = new Set(existing.filter(p => p.sku).map(p => p.sku!.trim().toLowerCase()));
    const existingNameBrandSet = new Set(existing.map(p => `${p.name.trim().toLowerCase()}::${(p.brand || '').trim().toLowerCase()}`));

    for (const item of items) {
      const raw: Record<string, string> = JSON.parse(item.rawData);
      const mapped: Record<string, string> = {};
      for (const field of Object.keys(mapping) as CanonicalField[]) {
        const col = mapping[field];
        if (col) mapped[field] = raw[col] ?? '';
      }
      // preserve image mapping/matches from original analysis (image columns aren't re-derived here)
      for (const imgField of ['image1', 'image2', 'image3', 'image4', 'image5', 'images']) {
        const oldMapped = JSON.parse(item.mappedData);
        if (oldMapped[imgField] !== undefined) mapped[imgField] = oldMapped[imgField];
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
        if ((sku && existingSkuSet.has(sku)) || existingNameBrandSet.has(key) || seen.has(key)) {
          isDuplicate = true;
          warnings.push('Possible duplicate: a product with this name/brand (or SKU) already exists or appears earlier in this file.');
        }
        seen.add(key);
      }

      const missingImages: string[] = JSON.parse(item.missingImages || '[]');
      if (missingImages.length) warnings.push(`Missing image(s): ${missingImages.join(', ')}`);

      if (mapped.category) categoriesFound.add(mapped.category.trim());
      if (mapped.brand) brandsFound.add(mapped.brand.trim());

      let status = 'ready';
      if (errors.length) { status = 'invalid'; invalidCount++; }
      else if (isDuplicate) { status = 'duplicate'; duplicateCount++; }
      else { readyCount++; }

      await db.update(importBatchItems).set({
        mappedData: JSON.stringify(mapped),
        buyingPrice,
        status,
        isDuplicate,
        errors: errors.length ? JSON.stringify(errors) : null,
        warnings: warnings.length ? JSON.stringify(warnings) : null,
      }).where(eq(importBatchItems.id, item.id));
    }

    await db.update(importBatches).set({
      columnMapping: JSON.stringify(mapping),
      status: 'analyzed',
      readyRows: readyCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      brandsFound: JSON.stringify(Array.from(brandsFound).sort()),
      categoriesFound: JSON.stringify(Array.from(categoriesFound).sort()),
    }).where(eq(importBatches.id, batchId));

    return { success: true, readyRows: readyCount, duplicateRows: duplicateCount, invalidRows: invalidCount };
  } catch (err: any) {
    return { error: err.message || 'Failed to update column mapping.' };
  }
}

// ─── STEP 5: PRICING RULES ─────────────────────────────────────────────────

export async function applyPricingRuleAction(batchId: number, rule: PricingRule) {
  try {
    const items = await db.select().from(importBatchItems)
      .where(and(eq(importBatchItems.batchId, batchId)));

    for (const item of items) {
      const mapped: Record<string, string> = JSON.parse(item.mappedData);
      const sellingPrice = calculateSellingPrice(item.buyingPrice, rule, {
        category: mapped.category, brand: mapped.brand,
      });
      await db.update(importBatchItems).set({ sellingPrice, sellingPriceOverridden: false }).where(eq(importBatchItems.id, item.id));
    }

    await db.update(importBatches).set({ pricingRule: JSON.stringify(rule), status: 'ready' }).where(eq(importBatches.id, batchId));
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to apply pricing rule.' };
  }
}

export async function overrideItemPriceAction(itemId: number, sellingPrice: number) {
  try {
    await db.update(importBatchItems).set({ sellingPrice, sellingPriceOverridden: true }).where(eq(importBatchItems.id, itemId));
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update price.' };
  }
}

// ─── STEP 6: PREVIEW ─────────────────────────────────────────────────────

export async function getImportPreviewAction(batchId: number, offset = 0, limit = 50, filterStatus?: string) {
  const whereClause = filterStatus
    ? and(eq(importBatchItems.batchId, batchId), eq(importBatchItems.status, filterStatus))
    : eq(importBatchItems.batchId, batchId);

  const items = await db.select().from(importBatchItems)
    .where(whereClause)
    .orderBy(asc(importBatchItems.rowIndex))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(importBatchItems).where(whereClause);

  return {
    total: count,
    items: items.map(i => ({
      id: i.id,
      rowIndex: i.rowIndex,
      mappedData: JSON.parse(i.mappedData),
      matchedImages: JSON.parse(i.matchedImages),
      missingImages: JSON.parse(i.missingImages),
      buyingPrice: i.buyingPrice,
      sellingPrice: i.sellingPrice,
      sellingPriceOverridden: i.sellingPriceOverridden,
      status: i.status,
      isDuplicate: i.isDuplicate,
      errors: i.errors ? JSON.parse(i.errors) : [],
      warnings: i.warnings ? JSON.parse(i.warnings) : [],
    })),
  };
}

// ─── STEP 7: IMPORT (processed in batches from the client so a progress bar can be shown) ───

const IMPORT_CHUNK_SIZE = 25;

async function nextProductCode(prefix: string): Promise<string> {
  const allCodes = await db.select({ code: products.code }).from(products);
  const matching = allCodes.filter(p => p.code.startsWith(`KM-${prefix}-`));
  const nextNum = String(matching.length + 1).padStart(6, '0');
  return `KM-${prefix}-${nextNum}`;
}

export async function runImportChunkAction(batchId: number, duplicateStrategy: 'skip' | 'update' = 'skip') {
  try {
    await db.update(importBatches).set({ status: 'importing' }).where(eq(importBatches.id, batchId));

    const chunk = await db.select().from(importBatchItems)
      .where(and(eq(importBatchItems.batchId, batchId), sql`${importBatchItems.status} in ('ready','duplicate')`))
      .orderBy(asc(importBatchItems.rowIndex))
      .limit(IMPORT_CHUNK_SIZE);

    if (chunk.length === 0) {
      const [batch] = await db.select().from(importBatches).where(eq(importBatches.id, batchId)).limit(1);
      const done = batch && batch.processedRows >= batch.readyRows + batch.duplicateRows;
      if (done) {
        await db.update(importBatches).set({ status: 'completed', completedAt: new Date() }).where(eq(importBatches.id, batchId));
      }
      return { done: true, batch };
    }

    const allCats = await db.select().from(categories);
    const catCache = new Map(allCats.map(c => [c.name.toLowerCase().trim(), c.id]));

    let imported = 0, updated = 0, skipped = 0, failed = 0;

    for (const item of chunk) {
      try {
        if (item.isDuplicate && duplicateStrategy === 'skip') {
          await db.update(importBatchItems).set({ status: 'skipped' }).where(eq(importBatchItems.id, item.id));
          skipped++;
          continue;
        }

        const mapped: Record<string, string> = JSON.parse(item.mappedData);
        const matchedImages: string[] = JSON.parse(item.matchedImages);
        const name = mapped.name.trim();

        let categoryId: number | null = null;
        const catName = (mapped.category || 'General').trim();
        const catKey = catName.toLowerCase();
        if (catCache.has(catKey)) {
          categoryId = catCache.get(catKey)!;
        } else {
          const [ins] = await db.insert(categories).values({ name: catName, slug: slugify(catName), description: '' }).returning({ id: categories.id });
          categoryId = ins.id;
          catCache.set(catKey, ins.id);
        }

        const prefix = (slugify(catName).split('-')[0] || 'GEN').substring(0, 3).toUpperCase();
        const sku = mapped.sku?.trim() || undefined;
        const code = sku ? `KM-${prefix}-${sku.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}` : await nextProductCode(prefix);
        const slug = slugify(name) + '-' + code.toLowerCase().replace(/[^a-z0-9]/g, '');

        const stockQuantity = parseInt((mapped.stockQuantity || '0').replace(/[^0-9]/g, '')) || 0;
        let stockStatus = 'In Stock';
        if (stockQuantity <= 0) stockStatus = 'Out of Stock'; else if (stockQuantity <= 5) stockStatus = 'Low Stock';

        const payload = {
          code, sku: sku || null, name, slug, categoryId,
          subcategory: mapped.subcategory || null,
          brand: mapped.brand || null, model: mapped.model || null,
          supplier: mapped.supplier || null, countryOfOrigin: mapped.countryOfOrigin || null,
          warranty: mapped.warranty || null,
          description: mapped.description || null,
          buyingPrice: Math.round(item.buyingPrice),
          wholesalePrice: Math.round(item.sellingPrice),
          retailPrice: Math.round(item.sellingPrice),
          weight: parseFloat(mapped.weight || '0') || 0,
          unit: mapped.unit || 'pcs',
          color: mapped.color || null, material: mapped.material || null, size: mapped.size || null,
          tags: mapped.tags || null,
          // Optional supplier packaging/logistics info — never required, defaults kept if absent.
          qtyPerCarton: parseInt((mapped.qtyPerCarton || '').replace(/[^0-9]/g, '')) || 1,
          middlePack: mapped.middlePack ? (parseInt(mapped.middlePack.replace(/[^0-9]/g, '')) || null) : null,
          stockQuantity, openingStock: stockQuantity, minStockLevel: 5, maxStockLevel: Math.max(stockQuantity * 2, 200),
          stockStatus,
          images: JSON.stringify(matchedImages),
          featuredImage: matchedImages[0] || null,
          isActive: true, isNewArrival: true,
          updatedAt: new Date(),
        };

        if (item.isDuplicate && duplicateStrategy === 'update') {
          const existingByCode = mapped.sku
            ? await db.select().from(products).where(eq(products.sku, mapped.sku.trim())).limit(1)
            : await db.select().from(products).where(eq(products.name, name)).limit(1);
          if (existingByCode[0]) {
            await db.update(products).set(payload).where(eq(products.id, existingByCode[0].id));
            await db.update(importBatchItems).set({ status: 'updated', productId: existingByCode[0].id }).where(eq(importBatchItems.id, item.id));
            updated++;
            continue;
          }
        }

        const [inserted] = await db.insert(products).values(payload).returning({ id: products.id });
        await db.update(importBatchItems).set({ status: 'imported', productId: inserted.id }).where(eq(importBatchItems.id, item.id));
        imported++;
      } catch (err: any) {
        await db.update(importBatchItems).set({ status: 'failed', errors: JSON.stringify([err.message || 'Import failed.']) }).where(eq(importBatchItems.id, item.id));
        failed++;
      }
    }

    const [updatedBatch] = await db.update(importBatches).set({
      processedRows: sql`${importBatches.processedRows} + ${chunk.length}`,
      importedRows: sql`${importBatches.importedRows} + ${imported}`,
      updatedRows: sql`${importBatches.updatedRows} + ${updated}`,
      skippedRows: sql`${importBatches.skippedRows} + ${skipped}`,
      failedRows: sql`${importBatches.failedRows} + ${failed}`,
    }).where(eq(importBatches.id, batchId)).returning();

    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');

    return { done: false, batch: updatedBatch, processedInChunk: chunk.length };
  } catch (err: any) {
    return { error: err.message || 'Import chunk failed.' };
  }
}

// ─── REPORT ──────────────────────────────────────────────────────────────

export async function getImportReportAction(batchId: number) {
  const [batch] = await db.select().from(importBatches).where(eq(importBatches.id, batchId)).limit(1);
  if (!batch) return { error: 'Import batch not found.' };

  const items = await db.select().from(importBatchItems).where(eq(importBatchItems.batchId, batchId)).orderBy(asc(importBatchItems.rowIndex));

  const rows = items.map(i => {
    const mapped = JSON.parse(i.mappedData);
    return {
      row: i.rowIndex + 1,
      name: mapped.name || '',
      status: i.status,
      buyingPrice: i.buyingPrice,
      sellingPrice: i.sellingPrice,
      warnings: i.warnings ? JSON.parse(i.warnings).join(' | ') : '',
      errors: i.errors ? JSON.parse(i.errors).join(' | ') : '',
    };
  });

  return { batch, rows };
}
