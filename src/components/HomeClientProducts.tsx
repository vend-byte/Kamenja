'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { Eye, ShoppingBag, MessageSquare, CheckCircle2, Plus } from 'lucide-react';

interface Product {
  id: number;
  code: string;
  name: string;
  slug: string;
  wholesalePrice: number;
  discountPrice?: number | null;
  qtyPerCarton: number;
  stockStatus: string;
  images: string;
  description: string | null;
  isOnOffer?: boolean | null;
  isFeatured?: boolean | null;
  isNewArrival?: boolean | null;
  isBestSeller?: boolean | null;
  categoryName?: string | null;
  categorySlug?: string | null;
}

interface HomeClientProductsProps {
  products: Product[];
  settings: {
    phone_primary: string;
    phone_secondary: string;
  };
}

export default function HomeClientProducts({ products, settings }: HomeClientProductsProps) {
  const { addItem, items, setIsOpen } = useQuote();

  // Track which product just triggered the "added" flash animation
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(price);

  const buildWhatsAppLink = (p: Product) => {
    const raw   = settings.phone_primary.replace(/[^0-9]/g, '');
    const phone = raw.startsWith('0') ? '254' + raw.slice(1) : raw;
    const msg   =
      `Hello KAMENJA ENTERPRISES. I would like to inquire about *${p.name}* ` +
      `(Code: ${p.code}). Please provide the wholesale price and availability.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const parseImg = (s: string) => {
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a) && a.length) return a[0];
    } catch {}
    if (s && !s.startsWith('[')) return s;
    return '/uploads/placeholder.svg';
  };

  const handleAddToQuote = (p: Product) => {
    addItem(
      {
        id: p.id,
        code: p.code,
        name: p.name,
        wholesalePrice: p.wholesalePrice,
        qtyPerCarton: p.qtyPerCarton,
        images: p.images,
        stockStatus: p.stockStatus,
      },
      1
    );
    setJustAdded(p.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((p) => {
        const inList   = items.some((i) => i.id === p.id);
        const addedQty = items.find((i) => i.id === p.id)?.quantity ?? 0;
        const flashing = justAdded === p.id;
        const img      = parseImg(p.images);

        const priceDisplay = p.isOnOffer && p.discountPrice
          ? { show: p.discountPrice, was: p.wholesalePrice }
          : { show: p.wholesalePrice, was: null };

        return (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200"
          >
            {/* ── IMAGE ── */}
            <Link href={`/products/${p.slug}`} className="block relative">
              <div className="relative bg-gray-100 overflow-hidden" style={{ paddingBottom: '62%' }}>
                <img
                  src={img}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/uploads/placeholder.svg';
                  }}
                />
              </div>

              {/* Top-left: category */}
              {p.categoryName && (
                <span className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow">
                  {p.categoryName}
                </span>
              )}

              {/* Top-right: status badges stack */}
              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                {p.isOnOffer && (
                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow tracking-wide">
                    SALE
                  </span>
                )}
                {p.isBestSeller && (
                  <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                    🔥 HOT
                  </span>
                )}
                {p.isFeatured && !p.isOnOffer && (
                  <span className="bg-yellow-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                    ⭐ TOP
                  </span>
                )}
                {p.isNewArrival && !p.isFeatured && !p.isOnOffer && !p.isBestSeller && (
                  <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                    NEW
                  </span>
                )}
                {/* Stock pill */}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow text-white ${
                  p.stockStatus === 'In Stock'
                    ? 'bg-green-600'
                    : p.stockStatus === 'Low Stock'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}>
                  {p.stockStatus === 'In Stock' ? '● In Stock' : p.stockStatus === 'Low Stock' ? '● Low Stock' : '● Out of Stock'}
                </span>
              </div>
            </Link>

            {/* ── CONTENT ── */}
            <div className="flex flex-col flex-1 p-4 gap-3">

              {/* Code + Carton info */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  {p.code}
                </span>
                <span className="text-[10px] font-semibold text-secondary bg-orange-50 border border-orange-100 px-2 py-0.5 rounded whitespace-nowrap">
                  {p.qtyPerCarton} Pcs / Ctn
                </span>
              </div>

              {/* Name */}
              <h3 className="text-sm font-extrabold text-primary leading-snug line-clamp-2 hover:text-secondary transition-colors min-h-[2.5rem]">
                <Link href={`/products/${p.slug}`}>{p.name}</Link>
              </h3>

              {/* Description */}
              {p.description && (
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 flex-1">
                  {p.description}
                </p>
              )}

              {/* Price */}
              <div className="pt-2 border-t border-gray-100">
                {priceDisplay.was ? (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-base font-black text-red-600">{formatPrice(priceDisplay.show)}</span>
                    <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(priceDisplay.was)}</span>
                    <span className="text-[9px] text-red-500 font-bold bg-red-50 px-1 rounded">/ Ctn</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold">Wholesale</span>
                    <span className="text-base font-black text-primary">{formatPrice(priceDisplay.show)}</span>
                    <span className="text-[10px] text-gray-400 font-medium">/ Ctn</span>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════
                  THREE ACTION BUTTONS
                  ══════════════════════════════════════════ */}
              <div className="flex flex-col gap-2 pt-1">

                {/* Row 1: View Details (full-width) */}
                <Link
                  href={`/products/${p.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-primary border-2 border-gray-200 hover:border-primary font-bold py-2 rounded-lg text-xs transition-all"
                >
                  <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>View Details</span>
                </Link>

                {/* Row 2: Request Quote (full-width, orange) */}
                <button
                  onClick={() => handleAddToQuote(p)}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer border-2 ${
                    flashing
                      ? 'bg-green-600 border-green-600 text-white scale-95'
                      : inList
                      ? 'bg-primary border-primary text-white hover:bg-blue-800 hover:border-blue-800'
                      : 'bg-secondary border-secondary text-white hover:bg-orange-600 hover:border-orange-600'
                  }`}
                >
                  {flashing ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Added to Quote!</span>
                    </>
                  ) : inList ? (
                    <>
                      <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Add More ({addedQty} in list)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Request Quote</span>
                    </>
                  )}
                </button>

                {/* Row 3: WhatsApp Inquiry (full-width, green) */}
                <a
                  href={buildWhatsAppLink(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-2 rounded-lg text-xs transition-colors border-2 border-[#25D366] hover:border-[#1ebe5d]"
                >
                  {/* WhatsApp SVG icon */}
                  <svg className="w-3.5 h-3.5 flex-shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp Inquiry</span>
                </a>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
