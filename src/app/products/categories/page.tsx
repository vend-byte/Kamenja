import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { 
  Lock, Wrench, Hammer, Layers, Home as HomeIcon,
  Utensils, Zap, Package, Briefcase, Cog,
  ChevronRight, ShoppingBag, Grid3X3
} from 'lucide-react';

function getCategoryIcon(slug: string, size = 'w-10 h-10') {
  const cls = `${size} text-secondary`;
  switch (slug) {
    case 'locks-security':       return <Lock className={cls} />;
    case 'hand-tools':           return <Wrench className={cls} />;
    case 'power-tools':          return <Hammer className={cls} />;
    case 'drill-bits-accessories': return <Cog className={cls} />;
    case 'abrasives-grinding':   return <Layers className={cls} />;
    case 'home-storage-organization': return <HomeIcon className={cls} />;
    case 'kitchen-home-appliances':   return <Utensils className={cls} />;
    case 'electrical-products':  return <Zap className={cls} />;
    case 'hardware-accessories': return <Package className={cls} />;
    case 'tool-sets':            return <Briefcase className={cls} />;
    default:                     return <ShoppingBag className={cls} />;
  }
}

// Sub-items per category for display
const categorySubItems: Record<string, string[]> = {
  'locks-security': [
    'Beam Locks','Flat Beam Locks','Half-Covered Beam Locks','Full-Shackle Locks',
    'Spring Locks','Arc Locks','Rectangular Iron Locks','Brass Padlocks',
    'Diamond Brass Locks','Hammer Brass Locks','Waterproof Locks',
    'Combination Locks','Brass Combination Locks','TSA Combination Locks',
    'Alarm Locks','Aluminum Alloy Alarm Locks','Smart Padlocks',
    'Fingerprint Padlocks','Square Locks','Chain Locks','Motorcycle Chain Locks',
    'Bicycle Locks','Cable Locks','Computer Key Padlocks',
    'Atomic Imitation Brass Locks','Stainless Steel Arc Locks',
    'Stainless Steel Leaf Blade Locks','Pin Tumbler Locks',
    'Lingzhi Key Locks','Tablet Pattern Locks','Antique Bronze Arc Locks',
    'Disc Locks','Plastic Shell Locks',
  ],
  'hand-tools': [
    'Screwdrivers','Screwdriver Sets','Combination Wrench Sets','Allen Key Sets',
    'Water Pump Pliers','Wire Stripping Pliers','Locking Pliers','Aviation Snips',
    'Metal Shears','Nut Crackers','Staple Guns','Utility Knives',
    'Hacksaw Frames','Hacksaw Blades','Electrical Test Pens',
  ],
  'power-tools': [
    'Electric Circular Saw','Angle Grinder','Rotary Hammer Drill',
    'Impact Drills','Brushless Cordless Drills','Power Tool Accessories',
  ],
  'drill-bits-accessories': [
    'SDS-Plus Rotary Hammer Bits','Masonry Drill Bits','Metal HSS Drill Bits',
    'Grinding Stone Sets','TCT Circular Saw Blades','Grinding Accessories',
  ],
  'abrasives-grinding': [
    'Red Flap Discs (P60)','Black Flap Discs (P80)','Blue Flap Discs (P120)',
    'Metal Cutting Discs','Grinding Discs','Sanding Discs (Hook & Loop)',
    'Polishing Wool Discs','Sandpaper Sheet Assortments',
  ],
  'home-storage-organization': [
    'Shoe Racks','Shoe Cabinets','Storage Shelves','Multi-Tier Shelves',
    'Bathroom Corner Shelves','Dish Drainer Racks','Laundry Drying Racks','Rolling Storage Carts',
  ],
  'kitchen-home-appliances': [
    'Air Fryers','Rice Cookers','Electric Kettles','Blenders',
    'Sandwich Makers','Coffee Makers','Electric Steam Irons',
    'Vacuum Cleaners','Hair Clippers','Hair Dryers',
  ],
  'electrical-products': [
    'Extension Sockets (5-Way)','Extension Leads (4-Way)','Electrician Tool Kits',
    'VDE Insulated Screwdriver Sets','Electrical Insulating Tape',
  ],
  'hardware-accessories': [
    'Hacksaw Frames & Blades','Utility Knife Blades','Wood Screw Assortments',
    'Wall Anchor & Screw Sets','Self-Tapping Sheet Metal Screws',
  ],
  'tool-sets': [
    'Combination Wrench Sets (12pcs)','Screwdriver Sets (15pcs)',
    'VDE Electrician Tool Sets','Home Tool Kits (52pcs)','Allen Key Sets',
  ],
};

export default async function CategoriesPage() {
  // Fetch all active categories with their product counts
  const catsList = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      isActive: categories.isActive,
    })
    .from(categories)
    .where(eq(categories.isActive, true));

  // Count products per category
  const productCounts: Record<number, number> = {};
  for (const cat of catsList) {
    const [result] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.isActive, true)));
    productCounts[cat.id] = result?.count ?? 0;
  }

  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white min-h-screen">

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B2C63] to-[#0F3D91] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          <nav className="text-xs text-blue-200 flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <span>/</span>
            <span className="text-white font-semibold">All Categories</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Grid3X3 className="w-8 h-8 text-secondary" />
            Browse Products by Category
          </h1>
          <p className="text-sm text-blue-100 max-w-2xl">
            Explore all <strong>{catsList.length}</strong> wholesale product categories covering{' '}
            <strong>{totalProducts}+</strong> products. Click any category to view available items.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {catsList.map((cat) => {
            const subItems = categorySubItems[cat.slug] || [];
            const prodCount = productCounts[cat.id] || 0;

            return (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary to-[#1a4fa8] p-5 flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl flex-shrink-0 group-hover:bg-white/20 transition-colors">
                    {getCategoryIcon(cat.slug, 'w-8 h-8')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-extrabold text-white">{cat.name}</h2>
                    <p className="text-[11px] text-blue-200 line-clamp-1 mt-0.5">
                      {cat.description || 'Professional wholesale products'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="bg-secondary text-white text-xs font-black px-2.5 py-1 rounded-full">
                      {prodCount} items
                    </span>
                  </div>
                </div>

                {/* Sub-items list */}
                <div className="p-5 space-y-4">
                  {subItems.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        What's included:
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {subItems.slice(0, 10).map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                        {subItems.length > 10 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-secondary font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                            <span>+{subItems.length - 10} more types</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="w-full flex items-center justify-between bg-[#F7F7F7] hover:bg-primary hover:text-white border border-gray-200 text-primary font-bold text-xs py-2.5 px-4 rounded-lg transition-all group/btn mt-2"
                  >
                    <span>
                      {prodCount > 0
                        ? `View ${prodCount} Available Products`
                        : 'Browse Category'}
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 text-center space-y-3">
          <h3 className="text-base font-extrabold text-primary">Can't find a specific product?</h3>
          <p className="text-xs text-gray-600 max-w-lg mx-auto">
            Our catalog is constantly growing. Contact our Meru wholesale office directly for custom bulk orders,
            unlisted products, or special category requests.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/products"
              className="bg-primary hover:bg-blue-800 text-white font-bold text-xs py-2 px-5 rounded transition-colors"
            >
              Search All Products
            </Link>
            <Link
              href="/contact"
              className="bg-secondary hover:bg-orange-600 text-white font-bold text-xs py-2 px-5 rounded transition-colors"
            >
              Contact Wholesale Office
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
