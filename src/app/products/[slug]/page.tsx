import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { getSettings } from '@/db/settings';
import { eq, and, ne, desc } from 'drizzle-orm';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
} from 'lucide-react';
import DetailClientActions from '@/components/DetailClientActions';
import ProductImage from '@/components/ProductImage';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const productData = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      slug: products.slug,
      categoryId: products.categoryId,
      description: products.description,
      wholesalePrice: products.wholesalePrice,
      qtyPerCarton: products.qtyPerCarton,
      specifications: products.specifications,
      stockStatus: products.stockStatus,
      stockQuantity: products.stockQuantity,
      images: products.images,
      features: products.features,
      categoryName: categories.name,
      categorySlug: categories.slug
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  if (productData.length === 0) {
    notFound();
  }

  const p = productData[0];
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
        qtyPerCarton: products.qtyPerCarton,
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

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6">
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

        {/* Back Link */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        {/* Main Product */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Panel: Images */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden aspect-video relative">
              <ProductImage
                src={parsedImages[0]}
                alt={p.name}
                className="w-full h-full object-cover"
                fallback={FALLBACK}
              />
              <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded shadow text-white ${
                p.stockStatus === 'In Stock' 
                  ? 'bg-green-600' 
                  : p.stockStatus === 'Low Stock' 
                    ? 'bg-yellow-600' 
                    : 'bg-red-600'
              }`}>
                {p.stockStatus}
              </span>
            </div>

            {parsedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {parsedImages.map((imgUrl, i) => (
                  <div key={i} className="aspect-square bg-gray-50 border border-gray-200 rounded overflow-hidden">
                    <ProductImage
                      src={imgUrl}
                      alt={`${p.name} view ${i}`}
                      className="w-full h-full object-cover"
                      fallback={FALLBACK}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded border border-gray-150 text-xs space-y-2">
              <h4 className="font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>KAMENJA Wholesaler Guarantees</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-600 font-medium">
                <li className="flex items-center gap-1.5">• Packaged in Original Brand Cartons</li>
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
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-bold block uppercase tracking-wider">Wholesale Price</span>
                <span className="text-3xl font-black text-primary">{formatPrice(p.wholesalePrice)}</span>
                <span className="text-xs text-gray-400 font-medium"> per Brand Carton</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-bold block uppercase tracking-wider">Carton Packaging</span>
                <span className="text-2xl font-black text-secondary">{p.qtyPerCarton} Pcs</span>
                <span className="text-xs text-gray-400 font-medium block">in 1 complete Box</span>
              </div>
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
                      <div className="aspect-video bg-white overflow-hidden rounded border border-gray-100 mb-2">
                        <ProductImage
                          src={imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          fallback="/placeholder.svg"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">Code: {item.code}</span>
                      <h4 className="text-xs font-bold text-primary line-clamp-1 mt-1 hover:text-secondary">
                        <Link href={`/products/${item.slug}`}>{item.name}</Link>
                      </h4>
                      <p className="text-xs text-primary font-black mt-1">{formatPrice(item.wholesalePrice)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.qtyPerCarton} Pcs per Carton</p>
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