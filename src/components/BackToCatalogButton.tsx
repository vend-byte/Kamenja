'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackToCatalogButtonProps {
  // The exact catalog URL to return to (category/sort/stock/search all
  // included when known), or the product's category page as a fallback.
  href: string;
}

// "Back to Catalog" link. Two things make it land the visitor back at the
// same row/column instead of the top of the page:
//  1. `scroll={false}` tells Next.js not to force-scroll to the top on this
//     navigation (Next.js does that by default on every navigation).
//  2. `href` is the visitor's *exact* previous catalog URL (see how it's
//     built in src/app/products/[slug]/page.tsx), so when that page loads,
//     CatalogScrollRestorer (src/components/CatalogScrollRestorer.tsx)
//     finds a matching saved scroll position for that exact URL and
//     restores it.
export default function BackToCatalogButton({ href }: BackToCatalogButtonProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to Catalog</span>
    </Link>
  );
}
