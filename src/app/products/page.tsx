import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { getSettings } from '@/db/settings';
import { eq, and, or, ilike, asc, desc, sql } from 'drizzle-orm';
import { Filter, RotateCcw, AlertCircle, ChevronRight, Grid3X3, Tag } from 'lucide-react';
import HomeClientProducts from '@/components/HomeClientProducts';
import {
  Lock, Wrench, Hammer, Layers, Home as HomeIcon,
  Utensils, Zap, Package, Briefcase, Cog, ShoppingBag
} from 'lucide-react';

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'locks-security':            return <Lock className="w-4 h-4" />;
    case 'hand-tools':                return <Wrench className="w-4 h-4" />;
    case 'power-tools':               return <Hammer className="w-4 h-4" />;
    case 'drill-bits-accessories':    return <Cog className="w-4 h-4" />;
    case 'abrasives-grinding':        return <Layers className="w-4 h-4" />;
    case 'home-storage-organization': return <HomeIcon className="w-4 h-4" />;
    case 'kitchen-home-appliances':   return <Utensils className="w-4 h-4" />;
    case 'electrical-products':       return <Zap className="w-4 h-4" />;
    case 'hardware-accessories':      return <Package className="w-4 h-4" />;
    case 'tool-sets':                 return <Briefcase className="w-4 h-4" />;
    default:                          return <ShoppingBag className="w-4 h-4" />;
  }
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    stock?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeSearch   = params.search   || '';
  const activeCategory = params.category || '';
  const activeSort     = params.sort     || 'newest';
  const activeStock    = params.stock    || 'all';
  const activeMinPrice = params.minPrice ? parseInt(params.minPrice) : null;
  const activeMaxPrice = params.maxPrice ? parseInt(params.maxPrice) : null;

  const settingsData = await getSettings();
  const cats = await db.select().from(categories).where(eq(categories.isActive, true));

  // Build conditions
  const conditions: any[] = [eq(products.isActive, true)];

  if (activeSearch) {
    conditions.push(
      or(
        ilike(products.name, `%${activeSearch}%`),
        ilike(products.code, `%${activeSearch}%`)
      )
    );
  }
  if (activeCategory) {
    const matchedCat = cats.find(c => c.slug === activeCategory);
    if (matchedCat) conditions.push(eq(products.categoryId, matchedCat.id));
  }
  if (activeStock === 'in-stock') conditions.push(eq(products.stockStatus, 'In Stock'));
  if (activeMinPrice !== null) conditions.push(sql`${products.wholesalePrice} >= ${activeMinPrice}`);
  if (activeMaxPrice !== null) conditions.push(sql`${products.wholesalePrice} <= ${activeMaxPrice}`);

  let orderClause: any;
  switch (activeSort) {
    case 'price-asc':   orderClause = asc(products.wholesalePrice);  break;
    case 'price-desc':  orderClause = desc(products.wholesalePrice); break;
    case 'alpha-asc':   orderClause = asc(products.name);            break;
    case 'alpha-desc':  orderClause = desc(products.name);           break;
    default:            orderClause = desc(products.id);             break;
  }

  const results = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      slug: products.slug,
      wholesalePrice: products.wholesalePrice,
      qtyPerCarton: products.qtyPerCarton,
      stockStatus: products.stockStatus,
      images: products.images,
      description: products.description,
      isOnOffer: products.isOnOffer,
      discountPrice: products.discountPrice,
      isFeatured: products.isFeatured,
      isNewArrival: products.isNewArrival,
      isBestSeller: products.isBestSeller,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderClause);

  const currentCatObj = cats.find(c => c.slug === activeCategory);
  const currentCatName = currentCatObj ? currentCatObj.name : 'All Products';
  const hasFilters = !!(activeCategory || activeSearch || activeStock !== 'all' || activeSort !== 'newest');

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header Bar */}
      <div className="bg-gradient-to-r from-[#0B2C63] to-primary text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-2">
          <nav className="text-xs text-blue-200 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white">Products</Link>
            {activeCategory && currentCatObj && (
              <>
                <span>/</span>
                <span className="text-white font-semibold">{currentCatName}</span>
              </>
            )}
          </nav>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {activeSearch
              ? `Search Results: "${activeSearch}"`
              : activeCategory && currentCatObj
                ? currentCatName
                : 'Browse Products'}
          </h1>
          <p className="text-xs text-blue-200">
            {results.length} wholesale product{results.length !== 1 ? 's' : ''} found
            {activeCategory && currentCatObj ? ` in ${currentCatName}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── SIDEBAR FILTER ── */}
          <aside className="lg:col-span-1 space-y-5">
            <div className="bg-[#F7F7F7] border border-gray-200 rounded-xl p-4 space-y-5 sticky top-24">

              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="font-extrabold text-sm text-primary flex items-center gap-2">
                  <Filter className="w-4 h-4 text-secondary" />
                  FILTER
                </span>
                {hasFilters && (
                  <Link href="/products"
                    className="text-[10px] bg-white border border-gray-300 text-gray-600 hover:text-red-600 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Link>
                )}
              </div>

              {/* Browse All Categories Link */}
              <Link
                href="/products/categories"
                className="flex items-center justify-between gap-2 bg-primary text-white text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Grid3X3 className="w-3.5 h-3.5 text-secondary" />
                  All Categories
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              {/* Category list */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filter by Category</h3>
                <Link
                  href={`/products?sort=${activeSort}&stock=${activeStock}${activeSearch ? `&search=${activeSearch}` : ''}`}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors font-semibold ${
                    !activeCategory ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  All Products
                </Link>
                {cats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}&sort=${activeSort}&stock=${activeStock}${activeSearch ? `&search=${activeSearch}` : ''}`}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors ${
                      activeCategory === c.slug
                        ? 'bg-secondary text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(c.slug)}
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>

              {/* Stock filter */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Availability</h3>
                {[
                  { val: 'all', label: 'All Products' },
                  { val: 'in-stock', label: 'In Stock Only' },
                ].map(opt => (
                  <Link
                    key={opt.val}
                    href={`/products?category=${activeCategory}&sort=${activeSort}&stock=${opt.val}${activeSearch ? `&search=${activeSearch}` : ''}`}
                    className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${
                      activeStock === opt.val ? 'font-bold text-primary border-l-2 border-secondary pl-2' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>

              {/* Sort */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sort By</h3>
                {[
                  { val: 'newest',    label: 'Newest Arrivals' },
                  { val: 'price-asc', label: 'Price: Low → High' },
                  { val: 'price-desc',label: 'Price: High → Low' },
                  { val: 'alpha-asc', label: 'A → Z' },
                  { val: 'alpha-desc',label: 'Z → A' },
                ].map(opt => (
                  <Link
                    key={opt.val}
                    href={`/products?category=${activeCategory}&sort=${opt.val}&stock=${activeStock}${activeSearch ? `&search=${activeSearch}` : ''}`}
                    className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${
                      activeSort === opt.val ? 'font-bold text-primary border-l-2 border-secondary pl-2' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="p-3 bg-secondary/10 border border-secondary/15 rounded-lg text-xs space-y-2 pt-3 border-t border-gray-200">
                <p className="font-bold text-primary text-[11px]">Need bulk pricing?</p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Order 10+ cartons and get exclusive volume discounts.
                </p>
                <a
                  href="https://wa.me/254708952210?text=Hello%20Kamenja%20Enterprises,%20I%20need%20bulk%20pricing."
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center bg-primary hover:bg-blue-800 text-white font-bold py-1.5 rounded text-[10px] transition-colors"
                >
                  Ask Wholesale Manager
                </a>
              </div>
            </div>
          </aside>

          {/* ── PRODUCTS GRID ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Active category banner */}
            {activeCategory && currentCatObj && (
              <div className="bg-[#F7F7F7] border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {getCategoryIcon(activeCategory)}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-primary">{currentCatName}</h2>
                  <p className="text-xs text-gray-500">{currentCatObj.description}</p>
                </div>
              </div>
            )}

            {/* Count bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>
                Showing <strong className="text-primary">{results.length}</strong> products
              </span>
              <Link href="/products/categories" className="text-secondary font-bold hover:underline flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Browse by Category
              </Link>
            </div>

            {/* No results */}
            {results.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl py-16 px-4 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-primary">No Products Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No products match your current filters. Try resetting or searching for something else.
                </p>
                <Link href="/products"
                  className="inline-block bg-primary hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded transition-colors">
                  Reset All Filters
                </Link>
              </div>
            ) : (
              <HomeClientProducts products={results} settings={settingsData} />
            )}

            {/* Footer note */}
            <div className="bg-gray-50 rounded-xl border border-gray-150 p-4 text-center text-xs text-gray-500">
              Our catalog supports <strong>10,000+ dynamic products</strong>. If you don't find a specific item,
              call us at <strong>{settingsData.phone_primary}</strong> or email <strong>{settingsData.email}</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
