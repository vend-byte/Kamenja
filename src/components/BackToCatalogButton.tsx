'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackToCatalogButtonProps {
  // Where to send the visitor if there's no in-app history to go back to
  // (e.g. they opened the product page directly from a shared link, a new
  // tab, or a search engine result).
  fallbackHref: string;
}

// Renders exactly like the old "Back to Catalog" link, but when the visitor
// actually navigated here FROM the catalog listing page, clicking it uses
// the browser's native back action instead of a fresh navigation. Native
// back restores the exact scroll position (the same row and column in the
// product grid) automatically — on both desktop and mobile — instead of
// reloading the catalog from the top. If they didn't come from the catalog
// (direct link, new tab, etc.), it behaves as a normal link.
export default function BackToCatalogButton({ fallbackHref }: BackToCatalogButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return;
    const ref = document.referrer;
    if (!ref) return;
    try {
      const refUrl = new URL(ref);
      const cameFromCatalog = refUrl.origin === window.location.origin && refUrl.pathname === '/products';
      if (cameFromCatalog && window.history.length > 1) {
        e.preventDefault();
        router.back();
      }
    } catch {
      // Malformed/unavailable referrer — fall through to the normal link.
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to Catalog</span>
    </Link>
  );
}
