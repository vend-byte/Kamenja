import React from 'react';
import { db } from '@/db';
import { categories, products, quotes, settings, customers, orders, suppliers, notifications, promotions, stockMovements } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import AdminPanel from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [catsList, prodsList, quotesList, settingsRaw, customersList, ordersList, suppliersList, notifList, promosList, stockMovesList] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(products).orderBy(desc(products.id)),
    db.select().from(quotes).orderBy(desc(quotes.id)),
    db.select().from(settings),
    db.select().from(customers).orderBy(desc(customers.totalSpent)),
    db.select().from(orders).orderBy(desc(orders.id)),
    db.select().from(suppliers).orderBy(asc(suppliers.name)),
    db.select().from(notifications).orderBy(desc(notifications.id)).limit(50),
    db.select().from(promotions).orderBy(desc(promotions.id)),
    db.select().from(stockMovements).orderBy(desc(stockMovements.id)).limit(100),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const row of settingsRaw) {
    settingsMap[row.key] = row.value;
  }

  return (
    <AdminAuthProvider>
      <AdminPanel
        initialCategories={catsList as any}
        initialProducts={prodsList as any}
        initialQuotes={quotesList as any}
        initialCustomers={customersList as any}
        initialOrders={ordersList as any}
        initialSuppliers={suppliersList as any}
        initialNotifications={notifList as any}
        initialPromotions={promosList as any}
        initialStockMovements={stockMovesList as any}
        initialSettings={settingsMap}
      />
    </AdminAuthProvider>
  );
}
