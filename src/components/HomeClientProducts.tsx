'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Eye, Minus, Plus, ShoppingCart, CheckCircle2 } from 'lucide-react';

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
  const { addItem } = useCart();

  // Track chosen quantity per product (defaults to 1 the first time a card is seen)
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const getQty = (id: number) => quantities[id] ?? 1;
  const setQty = (id: number, value: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));

  // Brief "Added!" flash after tapping Add to Cart
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(price);

  const handleAddToCart = (p: Product) => {
    addItem(
      { id: p.id, code: p.code, name: p.name, wholesalePrice: p.wholesalePrice, images: p.images, stockStatus: p.stockStatus },
      getQty(p.id)
    );
    setJustAdded(p.id);
    setTimeout(() => setJustAdded(null), 1800);
  };

  const parseImg = (s: string) => {
    if (!s) return 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200';
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a) && a.length) {
        const firstValid = a.find((item: unknown) => typeof item === 'string' && item.trim().length > 0);
        return firstValid || 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200';
      }
    } catch {}
    if (typeof s === 'string' && s.trim().startsWith('[')) {
      return 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200';
    }
    return s;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {products.map((p) => {
        const img = parseImg(p.images);

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
                  className="absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200';
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

              {/* Code */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  {p.code}
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

              {/* Quantity stepper */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Qty
                </span>
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQty(p.id, getQty(p.id) - 1)}
                    className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer border-r border-gray-200 touch-manipulation"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={getQty(p.id)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      setQty(p.id, digits ? parseInt(digits, 10) : 1);
                    }}
                    className="w-10 text-center text-sm font-black text-primary bg-white outline-none border-none touch-manipulation"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty(p.id, getQty(p.id) + 1)}
                    className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors cursor-pointer border-l border-gray-200 touch-manipulation"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ══════════════════════════════════════════
                  TWO ACTION BUTTONS
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

                {/* Row 2: Add to Cart (full-width) */}
                <button
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer border-2 touch-manipulation ${
                    justAdded === p.id
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-secondary border-secondary text-white hover:bg-orange-600 hover:border-orange-600'
                  }`}
                >
                  {justAdded === p.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
