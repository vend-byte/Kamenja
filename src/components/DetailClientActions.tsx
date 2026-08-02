'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, ShoppingCart, CheckCircle2 } from 'lucide-react';

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
  const { addItem, setIsOpen: setCartOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

  const subtotal = product.wholesalePrice * qty;

  /* ── Handlers ──────────────────────────────────────────────────── */
  const decrement = () => setQty((v) => Math.max(1, v - 1));
  const increment = () => setQty((v) => v + 1);

  const handleAddToCart = () => {
    addItem(
      { id: product.id, code: product.code, name: product.name, wholesalePrice: product.wholesalePrice, images: product.images, stockStatus: product.stockStatus },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

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
          ADD TO CART
          ══════════════════════════════════════════════ */}
      <div className="flex flex-col gap-2.5">

        <button
          type="button"
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-xl text-sm transition-all cursor-pointer border-2 touch-manipulation ${
            justAdded
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-secondary border-secondary text-white hover:bg-orange-600 hover:border-orange-600'
          }`}
        >
          {justAdded ? (
            <>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Added {qty} Pc{qty > 1 ? 's' : ''} to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              <span>Add {qty} Piece{qty > 1 ? 's' : ''} to Cart</span>
            </>
          )}
        </button>

        {justAdded && (
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-primary border-2 border-primary/30 hover:border-primary font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            View Cart & Send WhatsApp Inquiry →
          </button>
        )}

      </div>

      {/* ── Small disclaimer ── */}
      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        * Prices shown are per single piece. Final quote issued after office review.
        <br />Call <a href={`tel:${settings.phone_primary}`} className="text-primary font-bold hover:underline">{settings.phone_primary}</a> for urgent orders.
      </p>

    </div>
  );
}
