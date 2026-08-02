'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface Product {
  id: number;
  code: string;
  name: string;
  wholesalePrice: number; // price per single piece
  images: string;
  stockStatus: string;
  stockQuantity?: number;
}

interface DetailClientActionsProps {
  product: Product;
  settings: {
    phone_primary: string;
    phone_secondary: string;
  };
}

export default function DetailClientActions({ product, settings }: DetailClientActionsProps) {
  const [qty, setQty] = useState(1);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

  const subtotal = product.wholesalePrice * qty;

  /* ── WhatsApp helpers ──────────────────────────────────────────── */
  const buildWaUrl = (phone: string, message: string) => {
    const raw     = phone.replace(/[^0-9]/g, '');
    const cleaned = raw.startsWith('0') ? '254' + raw.slice(1) : raw;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  };

  // General inquiry message (same format as the product cards)
  const inquiryMsg =
    `Hello KAMENJA ENTERPRISES. I would like to inquire about *${product.name}* ` +
    `(Code: ${product.code}). Please provide the wholesale price and availability.`;

  // Order-specific message (with quantity details from this page)
  const orderMsg =
    `Hello KAMENJA ENTERPRISES. I would like to inquire about *${product.name}* ` +
    `(Code: ${product.code}). I need *${qty} piece${qty > 1 ? 's' : ''}*. ` +
    `Please provide the price and availability.`;

  /* ── Handlers ──────────────────────────────────────────────────── */
  const decrement = () => setQty((v) => Math.max(1, v - 1));
  const increment = () => setQty((v) => v + 1);

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Quantity selector ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Select Quantity
          </span>

          {/* Stepper */}
          <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button type="button" onClick={decrement}
              className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 font-bold text-lg transition-colors cursor-pointer border-r border-gray-200 touch-manipulation"
              aria-label="Decrease quantity">
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" value={qty}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                setQty(digits ? Math.max(1, parseInt(digits, 10)) : 1);
              }}
              className="w-14 text-center text-base font-black text-primary bg-white outline-none border-none py-2 touch-manipulation"
              style={{ fontSize: '16px' }}
            />
            <button type="button" onClick={increment}
              className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 font-bold text-lg transition-colors cursor-pointer border-l border-gray-200 touch-manipulation"
              aria-label="Increase quantity">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-xs overflow-hidden">
          <div className="flex justify-between items-center px-3 py-2.5">
            <span className="text-gray-500 font-medium">Pieces ordered</span>
            <strong className="text-primary font-black">{qty} Pc{qty > 1 ? 's' : ''}</strong>
          </div>
          <div className="flex justify-between items-center px-3 py-2.5">
            <span className="text-gray-500 font-medium">Price per piece</span>
            <strong className="text-gray-700 font-bold">{formatPrice(product.wholesalePrice)}</strong>
          </div>
          <div className="flex justify-between items-center px-3 py-2.5 bg-primary/5">
            <span className="text-gray-700 font-bold">Estimated subtotal</span>
            <strong className="text-primary font-black text-sm">{formatPrice(subtotal)}</strong>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TWO ACTION BUTTONS
          ══════════════════════════════════════════════ */}
      <div className="flex flex-col gap-2.5">

        {/* 1. WhatsApp Inquiry ← green, primary CTA */}
        <a
          href={buildWaUrl(settings.phone_primary, inquiryMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-xl text-sm transition-colors border-2 border-[#25D366] hover:border-[#1ebe5d]"
        >
          <svg className="w-5 h-5 flex-shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>WhatsApp Inquiry</span>
        </a>

        {/* 2. Secondary WhatsApp with quantity pre-filled */}
        <a
          href={buildWaUrl(settings.phone_secondary, orderMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#25D366] font-bold py-2.5 rounded-xl text-xs transition-colors border-2 border-[#25D366]/40 hover:border-[#25D366]"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>Order via WhatsApp Line 2 ({settings.phone_secondary})</span>
        </a>

      </div>

      {/* ── Small disclaimer ── */}
      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        * Prices shown are per single piece. Final quote issued after office review.
        <br />Call <a href={`tel:${settings.phone_primary}`} className="text-primary font-bold hover:underline">{settings.phone_primary}</a> for urgent orders.
      </p>

    </div>
  );
}
