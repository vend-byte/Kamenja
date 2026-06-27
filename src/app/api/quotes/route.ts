import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      businessName,
      email,
      phone,
      whatsappNumber,
      location,
      message,
      items
    } = body;

    if (!customerName || !phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, phone, and items are required.' },
        { status: 400 }
      );
    }

    // Insert into db
    const [inserted] = await db.insert(quotes).values({
      customerName,
      businessName,
      email: email || null,
      phone,
      whatsappNumber: whatsappNumber || null,
      location: location || null,
      message: message || null,
      items: JSON.stringify(items),
      status: 'Pending',
    }).returning({ id: quotes.id });

    return NextResponse.json({
      success: true,
      quoteId: inserted.id,
      message: 'Quotation request submitted successfully!'
    });
  } catch (error: any) {
    console.error('Error submitting quotation request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error. Please try again later.' },
      { status: 500 }
    );
  }
}
