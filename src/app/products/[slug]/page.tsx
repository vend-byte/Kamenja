import React, { cache } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { getSettings } from '@/db/settings';
import { generateMetaTitle, generateMetaDescription } from '@/lib/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { eq, and, ne, desc } from 'drizzle-orm';
import { 
  CheckCircle2, 
  ShieldCheck, 
} from 'lucide-react';
import DetailClientActions from '@/components/DetailClientActions';
import ProductGallery from '@/components/ProductGallery';
import ProductImage from '@/components/ProductImage';
import BackToCatalogButton from '@/components/BackToCatalogButton';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SITE_URL = getSiteUrl();

// Deduped between generateMetadata and the page component (React cache() memoizes
// per-request), so we only hit the database once per request for this product.
const getProductBySlug = cache(async (slug: string) => {
  const rows = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      slug: products.slug,
      categoryId: products.categoryId,
      description: products.description,
      shortDescription: products.shortDescription,
      metaTitle: products.metaTitle,
      metaDescription: products.metaDescription,
      wholesalePrice: products.wholesalePrice,
      brand: products.brand,
      specifications: products.specifications,
      stockStatus: products.stockStatus,
      stockQuantity: products.stockQuantity,
      images: products.images,
      features: products.features,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  return rows[0] || null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'Product Not Found' };

  // Stored SEO fields win (set automatically on bulk import); fall back to generating
  // them on the fly for products created before this feature existed or manually
  // without SEO fields filled in.
  const title = p.metaTitle || generateMetaTitle({ name: p.name, brand: p.brand, category: p.categoryName });
  const description = p.metaDescription || generateMetaDescription({
    name: p.name, description: p.description, shortDescription: p.shortDescription,
    brand: p.brand, category: p.categoryName,
  });

  let ogImage: string | undefined;
  try {
    const parsed = JSON.parse(p.images || '[]');
    if (Array.isArray(parsed) && parsed[0]) ogImage = parsed[0];
  } catch {
    if (typeof p.images === 'string' && p.images.trim() && !p.images.startsWith('[')) ogImage = p.images;
  }

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/products/${slug}` },
    openGraph: {
      title, description, url: `${SITE_URL}/products/${slug}`, type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const p = await getProductBySlug(slug);
  if (!p) {
    notFound();
  }
  const settingsData = await getSettings();

  let related: any[] = [];
  if (p.categoryId) {
    related = await db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        slug: products.slug,
        wholesalePrice: products.wholesalePrice,
        stockStatus: products.stockStatus,
        images: products.images,
        description: products.description
      })
      .from(products)
      .where(
        and(
          eq(products.categoryId, p.categoryId),
          ne(products.id, p.id)
        )
      )
      .limit(4)
      .orderBy(desc(products.id));
  }

  const FALLBACK = "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200";

  let parsedImages: string[] = [];
  try {
    const parsed = JSON.parse(p.images || '[]');
    if (Array.isArray(parsed)) {
      parsedImages = parsed.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
    } else if (typeof p.images === 'string' && p.images.trim()) {
      parsedImages = [p.images];
    }
  } catch {
    parsedImages = typeof p.images === 'string' && p.images.trim() ? [p.images] : [];
  }

  if (parsedImages.length === 0) {
    parsedImages = [FALLBACK];
  }

  const specList: { name: string; value: string }[] = [];
  if (p.specifications) {
    if (p.specifications.includes('|')) {
      const parts = p.specifications.split('|');
      parts.forEach(part => {
        const item = part.split(':');
        if (item.length >= 2) {
          specList.push({ name: item[0].trim(), value: item.slice(1).join(':').trim() });
        } else {
          specList.push({ name: 'Details', value: part.trim() });
        }
      });
    } else {
      const lines = p.specifications.split('\n');
      lines.forEach(line => {
        const item = line.split(':');
        if (item.length >= 2) {
          specList.push({ name: item[0].trim(), value: item.slice(1).join(':').trim() });
        } else if (line.trim()) {
          specList.push({ name: 'Specification', value: line.trim() });
        }
      });
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(price);
  };

  const stockAvailability =
    p.stockStatus === 'In Stock' ? 'https://schema.org/InStock'
    : p.stockStatus === 'Low Stock' ? 'https://schema.org/LimitedAvailability'
    : 'https://schema.org/OutOfStock';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: parsedImages,
    description: p.metaDescription || p.shortDescription || p.description || p.name,
    sku: p.code,
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    ...(p.categoryName ? { category: p.categoryName } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${p.slug}`,
      priceCurrency: 'KES',
      price: p.wholesalePrice,
      availability: stockAvailability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: settingsData.business_name },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Wholesale Catalog', item: `${SITE_URL}/products` },
      ...(p.categorySlug ? [{
        '@type': 'ListItem', position: 3, name: p.categoryName,
        item: `${SITE_URL}/products?category=${p.categorySlug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: p.categorySlug ? 4 : 3,
        name: p.name,
        item: `${SITE_URL}/products/${p.slug}`,
      },
    ],
  };

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6">
      {/* Structured data for Google rich results (price, stock, breadcrumbs) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Wholesale Catalog</Link>
          <span>/</span>
          {p.categorySlug && (
            <>
              <Link href={`/products?category=${p.categorySlug}`} className="hover:text-primary transition-colors">{p.categoryName}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-800 font-semibold truncate max-w-[200px]">{p.name}</span>
        </nav>

        {/* Back Link — uses native browser back (preserving scroll position
            and filters) when the visitor came from the catalog listing;
            otherwise falls back to a normal link into their category. */}
        <BackToCatalogButton fallbackHref={p.categorySlug ? `/products?category=${p.categorySlug}` : '/products'} />

        {/* Main Product */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Panel: Images */}
          <div className="lg:col-span-6 space-y-4">
            <ProductGallery images={parsedImages} name={p.name} fallback={FALLBACK} stockStatus={p.stockStatus} />

            <div className="bg-gray-50 p-4 rounded border border-gray-150 text-xs space-y-2">
              <h4 className="font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>KAMENJA Wholesaler Guarantees</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-600 font-medium">
                <li className="flex items-center gap-1.5">• Genuine Brand-Sourced Products</li>
                <li className="flex items-center gap-1.5">• Sealed Protective Sourcing</li>
                <li className="flex items-center gap-1.5">• Direct Meru Store Pickups Enabled</li>
                <li className="flex items-center gap-1.5">• Transit Breakage Refunds Covered</li>
              </ul>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-secondary tracking-widest uppercase block bg-orange-50 border border-orange-100 py-1 px-2.5 rounded-full w-max">
                Wholesale Item
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">{p.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span>Product Code: <strong className="text-secondary font-mono font-bold">{p.code}</strong></span>
                <span>|</span>
                <span>Category: <strong className="text-primary font-bold">{p.categoryName || 'General'}</strong></span>
                {p.brand && (
                  <>
                    <span>|</span>
                    <span>Brand: <strong className="text-primary font-bold">{p.brand}</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-5">
              <span className="text-xs text-gray-500 font-bold block uppercase tracking-wider">Selling Price</span>
              <span className="text-3xl font-black text-primary">{formatPrice(p.wholesalePrice)}</span>
              <span className="text-xs text-gray-400 font-medium"> per piece</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-1">Product Description</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {p.description || 'No description available for this product model.'}
              </p>
            </div>

            {p.features && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-1">Key Features</h3>
                <ul className="space-y-1.5 text-xs text-gray-600 font-medium">
                  {p.features.split('\n').filter(Boolean).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span>{feat.replace(/^[-•*+]/, '').trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DetailClientActions product={p} settings={settingsData} />

            {specList.length > 0 && (
              <div className="space-y-2.5 pt-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-1">Technical Specifications</h3>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="min-w-full text-xs text-left divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {specList.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <th className="px-4 py-2.5 font-bold text-primary w-1/3 border-r border-gray-200">{spec.name}</th>
                          <td className="px-4 py-2.5 text-gray-600">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="border-t border-gray-200 pt-10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-primary uppercase tracking-wider">Related Items in {p.categoryName}</h2>
              <p className="text-xs text-gray-500 mt-1">Traders who purchased this model also reviewed these wholesale options.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((item) => {
                let imgUrl = FALLBACK;
                try {
                  const arr = JSON.parse(item.images);
                  if (Array.isArray(arr) && arr.length > 0) imgUrl = arr[0];
                } catch {
                  if (item.images && !item.images.startsWith('[')) imgUrl = item.images;
                }

                return (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col justify-between hover:shadow transition-shadow">
                    <div>
                      <div className="aspect-square bg-white overflow-hidden rounded border border-gray-100 mb-2 flex items-center justify-center p-2">
                        <ProductImage
                          src={imgUrl}
                          alt={item.name}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          fallback="/placeholder.svg"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">Code: {item.code}</span>
                      <h4 className="text-xs font-bold text-primary line-clamp-1 mt-1 hover:text-secondary">
                        <Link href={`/products/${item.slug}`}>{item.name}</Link>
                      </h4>
                      <p className="text-xs text-primary font-black mt-1">{formatPrice(item.wholesalePrice)}</p>
                    </div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="mt-3 block text-center bg-white border border-primary text-primary hover:bg-primary hover:text-white transition-colors py-1.5 rounded text-[10px] font-bold"
                    >
                      View Alternative Details
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}