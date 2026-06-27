'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface QuoteItem {
  id: number;
  code: string;
  name: string;
  wholesalePrice: number;
  qtyPerCarton: number;
  quantity: number;
  image: string;
  stockStatus: string;
}

interface QuoteContextType {
  items: QuoteItem[];
  addItem: (product: {
    id: number;
    code: string;
    name: string;
    wholesalePrice: number;
    qtyPerCarton: number;
    images: string; // JSON array of string
    stockStatus: string;
  }, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearQuoteList: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load quote list from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kamenja_quote_list');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse quote list', e);
    }
    setIsLoaded(true);
  }, []);

  // Save quote list to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('kamenja_quote_list', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (product: {
    id: number;
    code: string;
    name: string;
    wholesalePrice: number;
    qtyPerCarton: number;
    images: string;
    stockStatus: string;
  }, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let imageUrl = '/images/placeholder.jpg';
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageUrl = parsed[0];
        }
      } catch (e) {
        if (product.images && !product.images.startsWith('[')) {
          imageUrl = product.images;
        }
      }

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            code: product.code,
            name: product.name,
            wholesalePrice: product.wholesalePrice,
            qtyPerCarton: product.qtyPerCarton,
            quantity: quantity,
            image: imageUrl,
            stockStatus: product.stockStatus
          }
        ];
      }
    });
    // Open the drawer/modal automatically so user sees it added
    setIsOpen(true);
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearQuoteList = () => {
    setItems([]);
  };

  return (
    <QuoteContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearQuoteList,
        isOpen,
        setIsOpen
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}
