'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';

interface CartDrawerProps {
  settings: {
    phone_primary: string;
  };
}

export default function CartDrawer({ settings }: CartDrawerProps) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart } = useCart();

  if (!isOpen) return null;

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

  const parseImg = (s: string) => {
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a) && a.length) return a[0];
    } catch {}
    if (s && !s.startsWith('[')) return s;
    return '/placeholder.svg';
  };

  const lineTotal = (item: typeof items[number]) => item.wholesalePrice * item.quantity;
  const grandTotal = items.reduce((acc, item) => acc + lineTotal(item), 0);
  const totalPieces = items.reduce((acc, item) => acc + item.quantity, 0);

  const buildWhatsAppMessage = () => {
    const lines = items.map(
      (item, i) =>
        `${i + 1}. *${item.name}* (Code: ${item.code}) — ${item.quantity} piece${item.quantity > 1 ? 's' : ''} × ${formatPrice(item.wholesalePrice)} = ${formatPrice(lineTotal(item))}`
    );
    return (
      `Hello KAMENJA ENTERPRISES. I would like to inquire about the following items:\n\n` +
      lines.join('\n') +
      `\n\n*Total: ${totalPieces} piece${totalPieces > 1 ? 's' : ''}, ${formatPrice(grandTotal)}*` +
      `\n\nPlease confirm price and availability.`
    );
  };

  const whatsAppHref = () => {
    const raw = settings.phone_primary.replace(/[^0-9]/g, '');
    const phone = raw.startsWith('0') ? '254' + raw.slice(1) : raw;
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-primary text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              Your Cart {items.length > 0 && `(${totalPieces} pc${totalPieces > 1 ? 's' : ''})`}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors touch-manipulation"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-gray-400">
              <ShoppingCart className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">Your cart is empty.</p>
              <p className="text-xs">Browse products and tap "Add to Cart" to build your inquiry list.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border border-gray-200 rounded-xl p-3"
                >
                  <img
                    src={parseImg(item.images)}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-primary leading-snug line-clamp-2">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 touch-manipulation"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{item.code}</span>

                    <div className="flex items-center justify-between mt-1">
                      {/* Stepper */}
                      <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors touch-manipulation"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, '');
                            updateQuantity(item.id, digits ? parseInt(digits, 10) : 1);
                          }}
                          className="w-9 text-center text-xs font-black text-primary bg-white outline-none border-none touch-manipulation"
                          style={{ fontSize: '16px' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors touch-manipulation"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <strong className="text-xs text-primary font-black">{formatPrice(lineTotal(item))}</strong>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="text-[11px] text-gray-400 hover:text-red-500 font-semibold transition-colors mt-2"
              >
                Clear entire cart
              </button>
            </div>
          )}
        </div>

        {/* Footer — total + WhatsApp CTA */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Estimated Total</span>
              <span className="text-lg font-black text-primary">{formatPrice(grandTotal)}</span>
            </div>
            <a
              href={whatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Send Inquiry via WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
