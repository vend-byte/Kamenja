import { db } from './index';
import { categories, products, settings, customers, orders } from './schema';
import { eq } from 'drizzle-orm';

export const initialCategories = [
  { name: 'Locks & Security', slug: 'locks-security', description: 'High-security padlocks, smart locks, beam locks.' },
  { name: 'Hand Tools', slug: 'hand-tools', description: 'Screwdrivers, wrenches, pliers, snips.' },
  { name: 'Power Tools', slug: 'power-tools', description: 'Electric circular saws, angle grinders, impact drills.' },
  { name: 'Building Materials', slug: 'building-materials', description: 'Cement, steel bars, roofing sheets.' },
  { name: 'Plumbing', slug: 'plumbing', description: 'Pipes, fittings, water pumps, taps.' },
  { name: 'Electrical', slug: 'electrical', description: 'Cables, switches, sockets, breakers.' },
  { name: 'Paints & Accessories', slug: 'paints-accessories', description: 'Paints, brushes, rollers, thinners.' },
  { name: 'Home Improvement', slug: 'home-improvement', description: 'Lighting, decor, shelves, cabinets.' },
  { name: 'Garden Supplies', slug: 'garden-supplies', description: 'Hoses, rakes, shovels, mowers.' },
  { name: 'Hardware Accessories', slug: 'hardware-accessories', description: 'Fasteners, nails, screws, hinges.' }
];

export async function ensureSeeded() {
  try {
    const existingCats = await db.select().from(categories).limit(1);

    if (existingCats.length > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Database empty! Seeding new required data...');

    // Settings
    const defaultSettings = [
      { key: 'business_name', value: 'KAMENJA ENTERPRISES' },
      { key: 'tagline', value: "Kenya's Trusted Wholesale Supplier." },
      { key: 'location', value: 'Meru, Kenya' },
      { key: 'phone_primary', value: '0708952210' },
      { key: 'phone_secondary', value: '0723456382' },
      { key: 'email', value: 'lopezbrycen@gmail.com' },
      { key: 'whatsapp_url_1', value: 'https://wa.me/254708952210' },
      { key: 'currency', value: 'KES' },
      { key: 'tax_rate', value: '16' },
      { key: 'theme', value: 'light' }
    ];

    for (const setting of defaultSettings) {
      await db.insert(settings).values(setting).onConflictDoNothing();
    }

    // Categories
    const insertedCategories: Record<string, number> = {};

    for (const cat of initialCategories) {
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1);

      if (existing.length > 0) {
        insertedCategories[cat.slug] = existing[0].id;
        continue;
      }

      const [res] = await db
        .insert(categories)
        .values({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          isActive: true
        })
        .returning({ id: categories.id });

      insertedCategories[cat.slug] = res.id;
    }

    // Customers
    const [c1] = await db.insert(customers).values({
      name: 'Meru Hardware Ltd',
      phone: '0711223344',
      email: 'info@meruhardware.com',
      location: 'Meru CBD',
      totalSpent: 450000,
      totalOrders: 5,
      lastOrderDate: new Date()
    }).returning({ id: customers.id });

    const [c2] = await db.insert(customers).values({
      name: 'Nkubu Builders Center',
      phone: '0722334455',
      email: 'sales@nkububuilders.co.ke',
      location: 'Nkubu',
      totalSpent: 120000,
      totalOrders: 2,
      lastOrderDate: new Date(Date.now() - 86400000)
    }).returning({ id: customers.id });

    // Products
    const prodsToSeed = [
      {
        code: 'KM-LK-001',
        barcode: '8901234567890',
        name: 'Heavy Duty Beam Lock 90mm',
        nameChinese: '重型梁锁',
        categorySlug: 'locks-security',
        supplier: 'Yiwu Hardware Co.',
        buyingPriceRmb: 45,
        buyingPrice: 850,
        wholesalePrice: 1250,
        qtyPerCarton: 12,
        weight: 0.8,
        stockQuantity: 150,
        minStockLevel: 20
      },
      {
        code: 'KM-HT-001',
        barcode: '8901234567891',
        name: 'Professional Claw Hammer 16oz',
        nameChinese: '羊角锤',
        categorySlug: 'hand-tools',
        supplier: 'Shanghai Tools',
        buyingPriceRmb: 18,
        buyingPrice: 350,
        wholesalePrice: 580,
        qtyPerCarton: 24,
        weight: 0.6,
        stockQuantity: 250,
        minStockLevel: 50
      },
      {
        code: 'KM-PT-001',
        barcode: '8901234567892',
        name: 'Angle Grinder 950W',
        nameChinese: '角磨机',
        categorySlug: 'power-tools',
        supplier: 'Guangzhou Power Tools',
        buyingPriceRmb: 120,
        buyingPrice: 2400,
        wholesalePrice: 3850,
        qtyPerCarton: 6,
        weight: 2.1,
        stockQuantity: 40,
        minStockLevel: 10
      },
      {
        code: 'KM-PL-001',
        barcode: '8901234567893',
        name: 'PPR Pipe Fitting Set',
        nameChinese: 'PPR管件',
        categorySlug: 'plumbing',
        supplier: 'Zhejiang Pipes',
        buyingPriceRmb: 5,
        buyingPrice: 100,
        wholesalePrice: 250,
        qtyPerCarton: 100,
        weight: 0.1,
        stockQuantity: 500,
        minStockLevel: 100
      }
    ];

    for (const prod of prodsToSeed) {
      const catId = insertedCategories[prod.categorySlug];

      await db.insert(products).values({
        code: prod.code,
        barcode: prod.barcode,
        name: prod.name,
        nameChinese: prod.nameChinese,
        slug: prod.code.toLowerCase(),
        categoryId: catId,
        supplier: prod.supplier,
        buyingPriceRmb: prod.buyingPriceRmb,
        buyingPrice: prod.buyingPrice,
        wholesalePrice: prod.wholesalePrice,
        qtyPerCarton: prod.qtyPerCarton,
        weight: prod.weight,
        stockQuantity: prod.stockQuantity,
        openingStock: prod.stockQuantity,
        minStockLevel: prod.minStockLevel,
        stockStatus: 'In Stock',
        isActive: true
      }).onConflictDoNothing();
    }

    // Orders
    await db.insert(orders).values([
      {
        orderNumber: 'ORD-2026-0001',
        customerId: c1.id,
        customerName: 'Meru Hardware Ltd',
        status: 'Pending',
        totalAmount: 15000,
        paymentMethod: 'M-Pesa',
        deliveryStatus: 'Pending',
        items: JSON.stringify([
          { name: 'Heavy Duty Beam Lock 90mm', qty: 12, price: 1250 }
        ])
      },
      {
        orderNumber: 'ORD-2026-0002',
        customerId: c2.id,
        customerName: 'Nkubu Builders Center',
        status: 'Delivered',
        totalAmount: 23100,
        paymentMethod: 'Bank Transfer',
        deliveryStatus: 'Delivered',
        items: JSON.stringify([
          { name: 'Angle Grinder 950W', qty: 6, price: 3850 }
        ])
      }
    ]).onConflictDoNothing();

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}