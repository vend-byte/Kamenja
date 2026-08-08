'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// How long a remembered scroll position stays valid. Keeps sessionStorage
// from accumulating stale entries for filter combinations the visitor
// isn't actively browsing anymore.
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function storageKey(pathname: string, search: string) {
  return `catalog-scroll:${pathname}${search ? `?${search}` : ''}`;
}

// Renders nothing — just keeps the current catalog view's scroll position
// saved to sessionStorage as the visitor scrolls, and restores it the
// moment they land back on that exact view (same category/sort/stock/
// search combination). This is what makes "Back to Catalog" return you to
// the same row and column you were looking at, instead of the top of the
// page, on both mobile and desktop.
export default function CatalogScrollRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = storageKey(pathname, searchParams.toString());
  const rafRef = useRef<number | null>(null);

  // Restore on mount / whenever the filter combination changes.
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { y, savedAt } = JSON.parse(raw);
        if (typeof y === 'number' && Date.now() - savedAt < MAX_AGE_MS) {
          // Product images can still be loading/laying out right after
          // mount, which shifts page height — restore once immediately,
          // then correct shortly after everything has settled.
          const restore = () => { if (!cancelled) window.scrollTo(0, y); };
          requestAnimationFrame(restore);
          const t1 = setTimeout(restore, 120);
          const t2 = setTimeout(restore, 400);
          return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
        }
      }
    } catch {
      // sessionStorage unavailable (private browsing, etc.) — just skip restoring.
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Continuously remember the scroll position for this exact view so it's
  // ready the moment the visitor navigates away (clicking into a product)
  // and comes back.
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ y: window.scrollY, savedAt: Date.now() }));
      } catch {
        // Ignore storage errors (quota, private browsing, etc.)
      }
    };
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        save();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      save(); // capture the final position on unmount too
    };
  }, [key]);

  return null;
}
