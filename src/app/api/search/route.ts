import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { ilike, or, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Search by product name, code, or category
    const decodedQuery = decodeURIComponent(query).trim();
    
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        slug: products.slug,
        wholesalePrice: products.wholesalePrice,
        images: products.images,
        stockStatus: products.stockStatus
      })
      .from(products)
      .where(
        or(
          ilike(products.name, `%${decodedQuery}%`),
          ilike(products.code, `%${decodedQuery}%`)
        )
      )
      .limit(8);

    return NextResponse.json(results);
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
