import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { getSettings } from '@/db/settings';
import { eq, desc } from 'drizzle-orm';
import { 
  Lock, 
  Wrench, 
  Hammer, 
  Layers, 
  Home as HomeIcon, 
  Utensils, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Truck, 
  Award, 
  Clock, 
  Percent, 
  FileText,
  Eye,
  CornerDownRight,
  Cog,
  Package,
  Box,
  Briefcase
} from 'lucide-react';
import HomeClientProducts from '@/components/HomeClientProducts';

// Map slugs to standard Lucide icons for all 10 categories
function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'locks-security':
      return <Lock className="w-8 h-8 text-secondary" />;
    case 'hand-tools':
      return <Wrench className="w-8 h-8 text-secondary" />;
    case 'power-tools':
      return <Hammer className="w-8 h-8 text-secondary" />;
    case 'drill-bits-accessories':
      return <Cog className="w-8 h-8 text-secondary" />;
    case 'abrasives-grinding':
      return <Layers className="w-8 h-8 text-secondary" />;
    case 'home-storage-organization':
      return <HomeIcon className="w-8 h-8 text-secondary" />;
    case 'kitchen-home-appliances':
      return <Utensils className="w-8 h-8 text-secondary" />;
    case 'electrical-products':
      return <Zap className="w-8 h-8 text-secondary" />;
    case 'hardware-accessories':
      return <Package className="w-8 h-8 text-secondary" />;
    case 'tool-sets':
      return <Briefcase className="w-8 h-8 text-secondary" />;
    default:
      return <Box className="w-8 h-8 text-secondary" />;
  }
}

export default async function HomePage() {
  const settingsData = await getSettings();
  
  // Fetch categories
  const catsList = await db.select().from(categories);

  // Fetch 8 featured products (join category to display category name)
  const featuredProductsRaw = await db
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
      categoryName: categories.name,
      categorySlug: categories.slug
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .limit(8)
    .orderBy(desc(products.id));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-br from-[#0B2C63] to-[#0F3D91] text-white py-16 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block bg-secondary text-white font-bold text-xs px-3 py-1 rounded uppercase tracking-wider">
              Meru's Premier Wholesale Hub
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
              {settingsData.hero_heading}
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-orange-400">
              {settingsData.hero_subheading}
            </p>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              {settingsData.hero_description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="bg-secondary hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Products</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="bg-white hover:bg-gray-100 text-primary font-bold text-sm px-6 py-3 rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Contact Sales Office</span>
              </Link>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-800 text-center max-w-xl">
              <div>
                <span className="block text-2xl font-black text-secondary">10,000+</span>
                <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Potential Catalog Items</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-secondary">100%</span>
                <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Original Sourced Goods</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-secondary">Meru, KE</span>
                <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Central Distribution Hub</span>
              </div>
            </div>
          </div>

          {/* Hero Right Banner Card */}
          <div className="lg:col-span-5 bg-white text-gray-800 p-6 sm:p-8 rounded-lg shadow-xl border-t-4 border-secondary flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-primary mb-3">How to Request a Price Quote</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                We make bulk purchases easy for hardware stores, supermarkets, shop owners, and schools across Kenya.
              </p>
              
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Browse & Add to Quote</h4>
                    <p className="text-[11px] text-gray-500">Select any locks, tools, abrasives, or appliances, specify carton quantities, and click 'Add to Quote'.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Review Selected Quote List</h4>
                    <p className="text-[11px] text-gray-500">Open your Quote List from the navigation, review your request value, and input your name and phone number.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Submit and Receive Price List</h4>
                    <p className="text-[11px] text-gray-500">Our sales agents will draft a formal invoice/quotation with bulk discounts and call you instantly.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-secondary" /> 0708952210</span>
              <span className="font-bold text-primary">Fast 2-Hour Feedback</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES GRID */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Browse by Category</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Click any category to view all available wholesale products, pricing, and carton details.
              </p>
            </div>
            <Link
              href="/products/categories"
              className="self-start sm:self-auto bg-primary hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>All Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {catsList.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:border-secondary shadow-sm text-center flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all group"
              >
                <div className="p-3 bg-primary/5 rounded-full group-hover:bg-secondary/10 transition-colors">
                  {getCategoryIcon(cat.slug)}
                </div>
                <h3 className="text-xs font-extrabold text-primary group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">View Products →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRUST / WHY CHOOSE US */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 rounded-lg bg-[#F7F7F7]">
            <Truck className="w-12 h-12 text-secondary flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Fast & Secure Delivery</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We organize reliable transport directly from Meru town to your retail outlet or hardware yard anywhere across Meru County and beyond.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 rounded-lg bg-[#F7F7F7]">
            <Award className="w-12 h-12 text-secondary flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Direct Sourcing Prices</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Because we work directly with manufacturers and major importers, our wholesale prices give you the highest retail profit margins in the market.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 rounded-lg bg-[#F7F7F7]">
            <Percent className="w-12 h-12 text-secondary flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Flexible Volume Discounts</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                The larger your order size in cartons, the bigger the percentage discount we apply on your final quote. Ideal for high-turnover traders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS CATALOG GRID (Client Interaction Supported) */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">New Wholesale Arrivals</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Explore our newly uploaded items ready for bulk orders. Added items count directly to your Quotation List.
              </p>
            </div>
            <Link
              href="/products"
              className="bg-primary hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            >
              <span>View Full Catalog ({featuredProductsRaw.length ? '10,000+' : '0'} products)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProductsRaw.length === 0 ? (
            <div className="bg-gray-50 text-center py-16 rounded border border-gray-100">
              <p className="text-gray-500 font-semibold text-sm">No products uploaded yet.</p>
              <Link href="/admin" className="text-xs text-secondary font-bold underline mt-2 block">
                Log in to Admin Panel and add some products!
              </Link>
            </div>
          ) : (
            <HomeClientProducts products={featuredProductsRaw} settings={settingsData} />
          )}
        </div>
      </section>

      {/* 5. ABOUT COMPANY SUMMARY BANNER */}
      <section className="py-16 px-4 sm:px-6 bg-[#0F3D91] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Who is KAMENJA ENTERPRISES?</h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            {settingsData.about_who_we_are}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/about"
              className="bg-secondary hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded transition-colors"
            >
              Learn More About Us
            </Link>
            <Link
              href="/contact"
              className="bg-white text-primary hover:bg-gray-100 font-bold text-xs px-5 py-2.5 rounded transition-colors"
            >
              Get Location Map
            </Link>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION: Supermarkets & Hardware Stores */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary">Are you a Shop Owner, Institution, or Supermarket?</h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We specialize in custom bulk supply contracts. Register your store with us today to receive customized catalogs, credit line facilitation for repeat purchasers, and scheduled weekly deliveries directly to your business in Meru or surrounding counties.
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> Dedicated Account Manager
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> Custom Pricelist Export
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> Flexible Payments
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> Multi-carton discounts
              </li>
            </ul>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-auto">
            <a
              href={`https://wa.me/254708952210?text=Hello%20Kamenja%20Enterprises,%20I%20own%20a%20shop%20and%20would%20like%20to%20register%20as%20a%20regular%20wholesale%20buyer.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded text-center text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Register via WhatsApp</span>
            </a>
            <Link
              href="/contact"
              className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-6 rounded text-center text-xs transition-colors"
            >
              Contact Sales Division
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
