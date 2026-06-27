'use server';

import { db } from '@/db';
import { categories, products, settings, quotes, customers, orders, suppliers, stockMovements, notifications, promotions, activityLogs } from '@/db/schema';
import { eq, desc, asc, sql, like, ilike, and, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

// ─── AUTHENTICATION ──────────────────────────────────────────────────────────

export async function loginAdminAction(username: string, password: string) {
  if (username === 'admin' && password === 'Kamenja2') {
    const cookieStore = await cookies();
    cookieStore.set('kamenja_admin_session', 'authenticated', {
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60 * 24 * 7, path: '/'
    });
    return { success: true };
  }
  return { error: 'Incorrect username or password.' };
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.set('kamenja_admin_session', '', {
    httpOnly: true, secure: true, sameSite: 'none', maxAge: 0, path: '/'
  });
  return { success: true };
}

// ─── PRODUCT CODE AUTO-GENERATOR ─────────────────────────────────────────────

export async function generateProductCodeAction(categorySlug?: string) {
  try {
    // Get a 3-letter category prefix
    let prefix = 'GEN';
    if (categorySlug) {
      const slugParts = categorySlug.split('-');
      prefix = (slugParts[0] || 'GEN').substring(0, 3).toUpperCase();
    }
    
    // Count how many products exist with this prefix
    const allProds = await db.select({ code: products.code }).from(products);
    const matching = allProds.filter(p => p.code.startsWith(`KM-${prefix}-`));
    const nextNum = String(matching.length + 1).padStart(4, '0');
    
    return { success: true, code: `KM-${prefix}-${nextNum}` };
  } catch (err: any) {
    return { error: err.message || 'Failed to generate code.' };
  }
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export async function saveProductAction(data: any) {
  try {
    const categoryId = Number(data.categoryId);
    const trimmedName = data.name?.toString().trim() ?? '';
    let trimmedCode = data.code?.toString().trim() ?? '';

    if (!trimmedCode && categoryId > 0) {
      try {
        const categoryResult = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, categoryId)).limit(1);
        if (categoryResult[0]) {
          const slugParts = categoryResult[0].slug.split('-');
          const prefix = (slugParts[0] || 'GEN').substring(0, 3).toUpperCase();
          const allProds = await db.select({ code: products.code }).from(products);
          const matching = allProds.filter(p => p.code.startsWith(`KM-${prefix}-`));
          const nextNum = String(matching.length + 1).padStart(4, '0');
          trimmedCode = `KM-${prefix}-${nextNum}`;
        }
      } catch {
        const slug = (data.categorySlug || 'general').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const prefix = (slug.split('-')[0] || 'GEN').substring(0, 3).toUpperCase();
        const suffix = String(Date.now()).slice(-4);
        trimmedCode = `KM-${prefix}-${suffix}`;
      }
    }

    if (!trimmedCode) {
      const slug = (data.categorySlug || 'general').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const prefix = (slug.split('-')[0] || 'GEN').substring(0, 3).toUpperCase();
      const suffix = String(Date.now()).slice(-4);
      trimmedCode = `KM-${prefix}-${suffix}`;
    }

    // Validation
    if (!trimmedName) return { error: 'Product name is required.' };
    if (!trimmedCode) return { error: 'Product code is required.' };
    if (!categoryId || categoryId <= 0) return { error: 'Category is required.' };
    if (Number(data.buyingPrice) < 0 || Number(data.wholesalePrice) < 0) return { error: 'Prices cannot be negative.' };
    
    // Check for duplicate code (only if creating new or code changed)
    if (!data.id) {
      const existing = await db.select().from(products).where(eq(products.code, trimmedCode.toUpperCase())).limit(1);
      if (existing.length > 0) return { error: `Product code "${data.code}" already exists.` };
    }
    
    // Check for duplicate barcode if provided
    if (data.barcode?.trim()) {
      const existingBarcode = await db.select().from(products).where(eq(products.barcode, data.barcode.trim())).limit(1);
      if (existingBarcode.length > 0 && existingBarcode[0].id !== data.id) {
        return { error: `Barcode "${data.barcode}" already exists.` };
      }
    }

    const slug = slugify(trimmedName) + '-' + trimmedCode.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Handle images: array of URLs
    let finalImages = '[]';
    if (data.images) {
      if (Array.isArray(data.images)) {
        finalImages = JSON.stringify(data.images.filter(Boolean));
      } else if (typeof data.images === 'string') {
        if (data.images.trim().startsWith('[')) {
          try { JSON.parse(data.images); finalImages = data.images; } catch { finalImages = JSON.stringify([data.images]); }
        } else if (data.images.trim()) {
          finalImages = JSON.stringify([data.images.trim()]);
        }
      }
    }

    const sq = Number(data.stockQuantity) || 0;
    const minSl = Number(data.minStockLevel) || 5;
    let stockStatus = 'In Stock';
    if (sq <= 0) stockStatus = 'Out of Stock';
    else if (sq <= minSl) stockStatus = 'Low Stock';

    const payload: any = {
      code: trimmedCode.toUpperCase(),
      barcode: data.barcode?.trim() || null,
      sku: data.sku?.trim() || null,
      name: trimmedName,
      nameLocal: data.nameLocal?.trim() || null,
      nameChinese: data.nameChinese?.trim() || null,
      brand: data.brand?.trim() || null,
      model: data.model?.trim() || null,
      slug,
      categoryId: categoryId > 0 ? categoryId : null,
      subcategory: data.subcategory?.trim() || null,
      supplier: data.supplier?.trim() || null,
      countryOfOrigin: data.countryOfOrigin?.trim() || null,
      warranty: data.warranty?.trim() || null,
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      features: data.features || '',
      specifications: data.specifications || '',
      
      // Pricing
      buyingPriceRmb: Number(data.buyingPriceRmb) || 0,
      exchangeRate: Number(data.exchangeRate) || 20,
      buyingPrice: Number(data.buyingPrice) || 0,
      wholesalePrice: Number(data.wholesalePrice) || 0,
      retailPrice: Number(data.retailPrice) || 0,
      discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
      vatPercent: Number(data.vatPercent) || 16,
      taxPercent: Number(data.taxPercent) || 0,
      transportCost: Number(data.transportCost) || 0,
      importCost: Number(data.importCost) || 0,
      otherExpenses: Number(data.otherExpenses) || 0,
      
      // Packaging
      qtyPerCarton: Number(data.qtyPerCarton) || 1,
      middlePack: data.middlePack ? Number(data.middlePack) : null,
      piecesPerPack: data.piecesPerPack ? Number(data.piecesPerPack) : null,
      weight: Number(data.weight) || 0,
      length: data.length ? Number(data.length) : null,
      width: data.width ? Number(data.width) : null,
      height: data.height ? Number(data.height) : null,
      unit: data.unit || 'pcs',
      
      // Stock
      stockQuantity: sq,
      openingStock: Number(data.openingStock) || sq,
      minStockLevel: minSl,
      maxStockLevel: Number(data.maxStockLevel) || 500,
      reorderLevel: Number(data.reorderLevel) || 10,
      stockStatus,
      storageLocation: data.storageLocation?.trim() || null,
      shelfNumber: data.shelfNumber?.trim() || null,
      warehouse: data.warehouse?.trim() || null,
      
      // Attributes
      color: data.color?.trim() || null,
      material: data.material?.trim() || null,
      size: data.size?.trim() || null,
      packagingType: data.packagingType?.trim() || null,
      serialNumber: data.serialNumber?.trim() || null,
      batchNumber: data.batchNumber?.trim() || null,
      manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      tags: data.tags || '',
      keywords: data.keywords || '',
      
      // Delivery
      deliveryTime: data.deliveryTime?.trim() || null,
      shippingWeight: data.shippingWeight ? Number(data.shippingWeight) : null,
      shippingCharges: Number(data.shippingCharges) || 0,
      freeDelivery: !!data.freeDelivery,
      courierOptions: data.courierOptions || '',
      fragile: !!data.fragile,
      returnable: data.returnable !== false,
      cashOnDelivery: data.cashOnDelivery !== false,
      
      // Visibility
      showOnHomepage: !!data.showOnHomepage,
      showOnFeatured: !!data.showOnFeatured,
      showOnNewArrivals: data.showOnNewArrivals !== false,
      isHidden: !!data.isHidden,
      availableOnline: data.availableOnline !== false,
      availableInStore: data.availableInStore !== false,
      
      images: finalImages,
      featuredImage: data.featuredImage || null,
      
      isActive: data.isActive !== false,
      isFeatured: !!data.isFeatured,
      isNewArrival: !!data.isNewArrival,
      isBestSeller: !!data.isBestSeller,
      isOnOffer: !!data.isOnOffer,
      isHotDeal: !!data.isHotDeal,
      isLimitedStock: !!data.isLimitedStock,
      isComingSoon: !!data.isComingSoon,
      isDraft: !!data.isDraft,
      isArchived: !!data.isArchived,
      
      updatedAt: new Date(),
    };

    let result;
    if (data.id) {
      result = await db.update(products).set(payload).where(eq(products.id, data.id)).returning({ id: products.id });
    } else {
      result = await db.insert(products).values(payload).returning({ id: products.id });
    }
    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');
    return { success: true, id: result[0]?.id };
  } catch (err: any) {
    console.error('saveProductAction:', err);
    return { error: err.message || 'Failed to save product.' };
  }
}

export async function deleteProductAction(id: number) {
  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete product.' };
  }
}

export async function bulkDeleteProductsAction(ids: number[]) {
  try {
    for (const id of ids) {
      await db.delete(products).where(eq(products.id, id));
    }
    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');
    return { success: true, count: ids.length };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete products.' };
  }
}

export async function bulkUpdateProductsAction(ids: number[], updates: any) {
  try {
    for (const id of ids) {
      await db.update(products).set({ ...updates, updatedAt: new Date() }).where(eq(products.id, id));
    }
    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');
    return { success: true, count: ids.length };
  } catch (err: any) {
    return { error: err.message || 'Failed to update products.' };
  }
}

export async function duplicateProductAction(id: number) {
  try {
    const [orig] = await db.select().from(products).where(eq(products.id, id));
    if (!orig) return { error: 'Product not found.' };
    const newCode = orig.code + '-COPY-' + Date.now().toString().slice(-4);
    const newSlug = orig.slug + '-copy-' + Date.now();
    await db.insert(products).values({ ...orig, id: undefined as any, code: newCode, slug: newSlug, name: orig.name + ' (Copy)', updatedAt: new Date(), createdAt: new Date() });
    revalidatePath('/products'); revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to duplicate product.' };
  }
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function saveCategoryAction(data: any) {
  try {
    const slug = slugify(data.name);
    const payload = { name: data.name.trim(), slug, description: data.description || '', image: data.image || null, isActive: data.isActive !== false };
    if (data.id) {
      await db.update(categories).set(payload).where(eq(categories.id, data.id));
    } else {
      await db.insert(categories).values(payload);
    }
    revalidatePath('/'); revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to save category.' };
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath('/'); revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete category.' };
  }
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export async function updateSettingsAction(data: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        await db.insert(settings).values({ key, value: String(value) })
          .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
      }
    }
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update settings.' };
  }
}

// ─── QUOTES / ORDERS ──────────────────────────────────────────────────────────

export async function updateQuoteStatusAction(id: number, status: string) {
  try {
    await db.update(quotes).set({ status }).where(eq(quotes.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function deleteQuoteAction(id: number) {
  try {
    await db.delete(quotes).where(eq(quotes.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function updateOrderStatusAction(id: number, status: string) {
  try {
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function deleteOrderAction(id: number) {
  try {
    await db.delete(orders).where(eq(orders.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

export async function saveCustomerAction(data: any) {
  try {
    if (!data.name?.trim() || !data.phone?.trim()) return { error: 'Name and phone are required.' };
    const payload: any = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      location: data.location?.trim() || null,
      businessName: data.businessName?.trim() || null,
      totalSpent: Number(data.totalSpent) || 0,
      totalOrders: Number(data.totalOrders) || 0,
    };
    if (data.id) await db.update(customers).set(payload).where(eq(customers.id, data.id));
    else await db.insert(customers).values(payload);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function deleteCustomerAction(id: number) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────

export async function saveSupplierAction(data: any) {
  try {
    if (!data.name?.trim()) return { error: 'Supplier name is required.' };
    const payload: any = {
      name: data.name.trim(),
      contactPerson: data.contactPerson?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      country: data.country?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      isActive: data.isActive !== false,
    };
    if (data.id) await db.update(suppliers).set(payload).where(eq(suppliers.id, data.id));
    else await db.insert(suppliers).values(payload);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function deleteSupplierAction(id: number) {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

// ─── STOCK MOVEMENTS (Inventory) ─────────────────────────────────────────────

export async function recordStockMovementAction(data: {
  productId: number; type: string; quantity: number; reason?: string; reference?: string;
}) {
  try {
    const [prod] = await db.select().from(products).where(eq(products.id, data.productId));
    if (!prod) return { error: 'Product not found.' };

    const qty = Number(data.quantity);
    let newStock = prod.stockQuantity;
    if (data.type === 'IN' || data.type === 'RETURNED') newStock = prod.stockQuantity + qty;
    else if (data.type === 'OUT' || data.type === 'DAMAGED' || data.type === 'TRANSFER') newStock = Math.max(0, prod.stockQuantity - qty);
    else if (data.type === 'ADJUSTMENT') newStock = qty;

    // Auto stock status
    let stockStatus = 'In Stock';
    if (newStock <= 0) stockStatus = 'Out of Stock';
    else if (newStock <= prod.minStockLevel) stockStatus = 'Low Stock';

    await db.insert(stockMovements).values({
      productId: data.productId,
      productName: prod.name,
      type: data.type,
      quantity: qty,
      previousStock: prod.stockQuantity,
      newStock,
      reason: data.reason || null,
      reference: data.reference || null,
      performedBy: 'Admin',
    });

    await db.update(products).set({ stockQuantity: newStock, stockStatus, updatedAt: new Date() }).where(eq(products.id, data.productId));
    revalidatePath('/admin'); revalidatePath('/products');
    return { success: true, newStock };
  } catch (err: any) {
    return { error: err.message || 'Failed to record movement.' };
  }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function markNotificationReadAction(id: number) {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    await db.update(notifications).set({ isRead: true });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteNotificationAction(id: number) {
  try {
    await db.delete(notifications).where(eq(notifications.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ─── PROMOTIONS ───────────────────────────────────────────────────────────────

export async function savePromotionAction(data: any) {
  try {
    if (!data.code?.trim() || !data.name?.trim()) return { error: 'Code and Name are required.' };
    const payload: any = {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      type: data.type || 'percentage',
      value: Number(data.value) || 0,
      minPurchase: Number(data.minPurchase) || 0,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: data.isActive !== false,
    };
    if (data.id) await db.update(promotions).set(payload).where(eq(promotions.id, data.id));
    else await db.insert(promotions).values(payload);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed.' };
  }
}

export async function deletePromotionAction(id: number) {
  try {
    await db.delete(promotions).where(eq(promotions.id, id));
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ─── BACKUP / RESTORE ─────────────────────────────────────────────────────────

export async function backupDatabaseAction() {
  const [cats, prods, qts, sets, custs, ords] = await Promise.all([
    db.select().from(categories),
    db.select().from(products),
    db.select().from(quotes),
    db.select().from(settings),
    db.select().from(customers),
    db.select().from(orders),
  ]);
  return { timestamp: new Date().toISOString(), categories: cats, products: prods, quotes: qts, settings: sets, customers: custs, orders: ords };
}

export async function restoreDatabaseAction(backup: any) {
  try {
    await db.delete(products); await db.delete(categories); await db.delete(quotes); await db.delete(settings); await db.delete(orders); await db.delete(customers);
    for (const c of backup.categories || []) await db.insert(categories).values({ ...c }).onConflictDoNothing();
    for (const p of backup.products || []) await db.insert(products).values({ ...p, updatedAt: new Date(), createdAt: new Date() }).onConflictDoNothing();
    for (const q of backup.quotes || []) await db.insert(quotes).values({ ...q }).onConflictDoNothing();
    for (const s of backup.settings || []) await db.insert(settings).values(s).onConflictDoNothing();
    for (const c of backup.customers || []) await db.insert(customers).values(c).onConflictDoNothing();
    for (const o of backup.orders || []) await db.insert(orders).values(o).onConflictDoNothing();
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Restore failed.' };
  }
}

// ─── IMPORT ───────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim()); return result;
}

export async function importProductsAction(fileContent: string, format: 'csv' | 'json') {
  try {
    let toImport: any[] = [];
    if (format === 'json') {
      const parsed = JSON.parse(fileContent);
      toImport = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      const lines = fileContent.split(/\r?\n/);
      if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row.' };
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const idx = (names: string[]) => names.map(n => headers.findIndex(h => h.includes(n))).find(i => i >= 0) ?? -1;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCSVLine(lines[i]);
        const name = row[idx(['name'])] || '';
        if (!name) continue;
        toImport.push({
          code: row[idx(['code'])] || `KM-IMP-${1000+i}`,
          barcode: row[idx(['barcode'])] || '',
          name,
          categoryName: row[idx(['category'])] || 'General',
          brand: row[idx(['brand'])] || '',
          supplier: row[idx(['supplier'])] || '',
          description: row[idx(['description','desc'])] || '',
          buyingPrice: parseInt((row[idx(['buying','buy_price'])] || '0').replace(/[^0-9]/g, '')) || 0,
          wholesalePrice: parseInt((row[idx(['price','wholesale','selling'])] || '0').replace(/[^0-9]/g, '')) || 0,
          qtyPerCarton: parseInt((row[idx(['carton','qty_per'])] || '1').replace(/[^0-9]/g, '')) || 1,
          stockQuantity: parseInt((row[idx(['stock_quantity','quantity'])] || '100').replace(/[^0-9]/g, '')) || 100,
          image: row[idx(['image'])] || '',
        });
      }
    }
    if (!toImport.length) return { error: 'No valid products found.' };

    const existingCats = await db.select().from(categories);
    const catCache: Record<string, number> = {};
    for (const c of existingCats) catCache[c.name.toLowerCase().trim()] = c.id;

    let count = 0;
    for (const item of toImport) {
      const catKey = (item.categoryName || 'General').toLowerCase().trim();
      let catId = catCache[catKey];
      if (!catId) {
        const [ins] = await db.insert(categories).values({ name: item.categoryName, slug: slugify(item.categoryName), description: '' }).returning({ id: categories.id });
        catId = ins.id; catCache[catKey] = catId;
      }
      const imgArr = item.image ? [item.image] : [];
      const sq = Number(item.stockQuantity) || 100;
      let ss = 'In Stock'; if (sq <= 0) ss = 'Out of Stock'; else if (sq <= 5) ss = 'Low Stock';
      const code = (item.code || `KM-IMP-${count}`).toUpperCase().trim();
      const slug = slugify(item.name) + '-' + code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = await db.select().from(products).where(eq(products.code, code));
      const payload: any = {
        code, name: item.name.trim(), slug, categoryId: catId,
        barcode: item.barcode || null, brand: item.brand || null, supplier: item.supplier || null,
        description: item.description,
        buyingPrice: Number(item.buyingPrice) || 0,
        wholesalePrice: Number(item.wholesalePrice) || 0,
        qtyPerCarton: Number(item.qtyPerCarton) || 1,
        stockQuantity: sq, openingStock: sq, minStockLevel: 5, maxStockLevel: Math.max(sq*2,200),
        stockStatus: ss, images: JSON.stringify(imgArr),
        isActive: true, isNewArrival: true, updatedAt: new Date(),
      };
      if (existing.length > 0) { await db.update(products).set(payload).where(eq(products.code, code)); }
      else { await db.insert(products).values(payload); }
      count++;
    }
    revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin');
    return { success: true, count };
  } catch (err: any) {
    return { error: err.message || 'Import failed.' };
  }
}
