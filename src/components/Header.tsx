'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';
import {
  Search,
  FileText,
  Menu,
  X,
  ChevronDown,
  UserCircle2,
  ShoppingBag,
  Tag
} from 'lucide-react';

interface HeaderProps {
  categories: { id: number; name: string; slug: string }[];
  settings: {
    business_name: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    location: string;
    whatsapp_url_1: string;
    whatsapp_url_2: string;
  };
}

export default function Header({ categories, settings }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { items, setIsOpen } = useQuote();
  const itemsCount = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

  // Search state
  const [searchQuery, setSearchQuery]     = useState('');
  const [suggestions, setSuggestions]     = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching]     = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Mobile / dropdown state
  const [mobileMenuOpen, setMobileMenuOpen]         = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSuggestions(await res.json());
      } catch {}
      finally { setIsSearching(false); }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setSearchQuery(''); setShowSuggestions(false);
    router.push(`/products/${slug}`);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

  const parseImg = (s: string) => {
    try { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a[0]; } catch {}
    if (s && !s.startsWith('[')) return s;
    return '/uploads/placeholder.svg';
  };

  return (
    <header className="w-full z-40 bg-white shadow-sm relative">

      {/* ═══════════════════════════════════════════════════════════
          1. TOP BAR — Business name left · Admin icon right
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-primary text-white px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Left — Business identity */}
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm leading-none">K</span>
            </div>

            <div className="leading-tight">
              <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-none">
                {settings.business_name}
              </p>
              <p className="text-[10px] text-blue-200 font-medium hidden sm:block">
                Wholesale Supplier · Meru, Kenya
              </p>
            </div>
          </div>

          {/* Right — Admin icon button */}
          <Link
            href="/admin"
            title="Admin Dashboard"
            className="group flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-2.5 py-1 transition-all"
          >
            <UserCircle2 className="w-5 h-5 text-secondary group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-blue-100 group-hover:text-white transition-colors hidden sm:inline tracking-wider uppercase">
              Admin
            </span>
          </Link>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2. STICKY MAIN NAV — Logo · Search · Nav links
          ═══════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center gap-3">

          {/* ── Logo row (always visible) ── */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center border-2 border-secondary shadow-sm">
                <span className="text-white font-black text-lg leading-none">K</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-primary tracking-tight block leading-none">
                  KAMENJA <span className="text-secondary">ENTERPRISES</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">
                  Kenya's Trusted Wholesale Supplier
                </span>
              </div>
            </Link>

            {/* Mobile icon cluster */}
            <div className="flex items-center gap-1 lg:hidden">
              {/* Quote list */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-primary hover:bg-gray-100 rounded-full"
                title="Quote List"
              >
                <FileText className="w-5 h-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-secondary text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full border border-white">
                    {itemsCount}
                  </span>
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="p-2 text-primary hover:bg-gray-100 rounded-full"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="w-full lg:max-w-md xl:max-w-lg relative flex-1" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="flex w-full">
              <input
                type="text"
                placeholder="Search by product name, code or category..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-3.5 pr-10 py-2 text-sm border border-gray-300 rounded-l-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                className="px-4 bg-primary hover:bg-blue-800 text-white rounded-r-lg flex items-center justify-center transition-colors border border-primary"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Live suggestions */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-xs text-gray-400 text-center">Searching...</div>
                ) : suggestions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {suggestions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSuggestionClick(p.slug)}
                        className="w-full text-left p-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <img
                          src={parseImg(p.images)}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/uploads/placeholder.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary truncate">{p.name}</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                            <span>Code: <strong className="text-secondary font-mono">{p.code}</strong></span>
                            <span className="font-bold text-primary">{formatPrice(p.wholesalePrice)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="p-2 bg-gray-50 text-center border-t">
                      <button onClick={handleSearchSubmit} className="text-xs text-primary font-bold hover:underline">
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-400 text-center">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold flex-shrink-0">

            <Link href="/"
              className={`hover:text-secondary transition-colors ${pathname === '/' ? 'text-secondary' : 'text-primary'}`}>
              Home
            </Link>

            <Link href="/products"
              className={`hover:text-secondary transition-colors ${pathname.startsWith('/products') && !pathname.includes('/categories') ? 'text-secondary' : 'text-primary'}`}>
              Browse Products
            </Link>

            {/* Categories dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-primary hover:text-secondary transition-colors cursor-pointer py-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-0 mt-0 bg-white border border-gray-100 rounded-lg shadow-xl py-1.5 w-60 hidden group-hover:block z-50">
                <Link href="/products/categories"
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-primary bg-gray-50 hover:bg-primary hover:text-white transition-colors border-b border-gray-100">
                  <Tag className="w-3.5 h-3.5" />
                  View All Categories →
                </Link>
                {categories.map(c => (
                  <Link key={c.id} href={`/products?category=${c.slug}`}
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/about"
              className={`hover:text-secondary transition-colors ${pathname === '/about' ? 'text-secondary' : 'text-primary'}`}>
              About Us
            </Link>

            <Link href="/contact"
              className={`hover:text-secondary transition-colors ${pathname === '/contact' ? 'text-secondary' : 'text-primary'}`}>
              Contact
            </Link>

            {/* Quote list button */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 bg-secondary hover:bg-orange-600 text-white px-3.5 py-2 rounded-lg transition-colors relative cursor-pointer flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Quotes</span>
              {itemsCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {itemsCount}
                </span>
              )}
            </button>

          </nav>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. MOBILE DRAWER MENU
          ═══════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col divide-y divide-gray-100">

          <Link href="/" onClick={() => setMobileMenuOpen(false)}
            className={`py-3 text-sm font-bold ${pathname === '/' ? 'text-secondary' : 'text-primary'}`}>
            Home
          </Link>

          <Link href="/products" onClick={() => setMobileMenuOpen(false)}
            className={`py-3 text-sm font-bold ${pathname.startsWith('/products') && !pathname.includes('/categories') ? 'text-secondary' : 'text-primary'}`}>
            Browse Products
          </Link>

          {/* Mobile categories accordion */}
          <div>
            <button
              onClick={() => setCategoriesDropdownOpen(v => !v)}
              className="w-full flex items-center justify-between py-3 text-sm font-bold text-primary"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-secondary" />
                Categories
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {categoriesDropdownOpen && (
              <div className="pb-2 pl-4 border-l-2 border-secondary/30 ml-2 flex flex-col gap-1">
                <Link href="/products/categories"
                  onClick={() => { setCategoriesDropdownOpen(false); setMobileMenuOpen(false); }}
                  className="py-1.5 text-xs font-bold text-primary flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-secondary" />
                  View All Categories
                </Link>
                {categories.map(c => (
                  <Link key={c.id} href={`/products?category=${c.slug}`}
                    onClick={() => { setCategoriesDropdownOpen(false); setMobileMenuOpen(false); }}
                    className="py-1 text-xs text-gray-600 hover:text-primary">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/about" onClick={() => setMobileMenuOpen(false)}
            className={`py-3 text-sm font-bold ${pathname === '/about' ? 'text-secondary' : 'text-primary'}`}>
            About Us
          </Link>

          <Link href="/contact" onClick={() => setMobileMenuOpen(false)}
            className={`py-3 text-sm font-bold ${pathname === '/contact' ? 'text-secondary' : 'text-primary'}`}>
            Contact Us
          </Link>

          {/* Admin link */}
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
            className="py-3 text-sm font-bold text-blue-600 flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" />
            Admin Dashboard
          </Link>

          {/* Open quote drawer */}
          <button
            onClick={() => { setMobileMenuOpen(false); setIsOpen(true); }}
            className="mt-1 w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Open Quote List{itemsCount > 0 ? ` (${itemsCount})` : ''}
          </button>
        </div>
      )}

    </header>
  );
}
