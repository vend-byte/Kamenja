import { pgTable, serial, text, integer, timestamp, varchar, boolean, real } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  image: text('image'),
  isActive: boolean('is_active').notNull().default(true),
  productCount: integer('product_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),

  // ─── Basic Information ───
  code: varchar('code', { length: 255 }).notNull().unique(),
  barcode: varchar('barcode', { length: 255 }),
  sku: varchar('sku', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  nameLocal: varchar('name_local', { length: 255 }),
  nameChinese: varchar('name_chinese', { length: 255 }),
  brand: varchar('brand', { length: 255 }),
  model: varchar('model', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  subcategory: varchar('subcategory', { length: 255 }),
  supplier: varchar('supplier', { length: 255 }),
  countryOfOrigin: varchar('country_of_origin', { length: 100 }),
  warranty: varchar('warranty', { length: 255 }),

  description: text('description'),
  shortDescription: text('short_description'),
  features: text('features'),
  specifications: text('specifications'),

  // ─── Pricing (extended) ───
  buyingPriceRmb: real('buying_price_rmb').notNull().default(0),
  exchangeRate: real('exchange_rate').notNull().default(20),
  buyingPrice: integer('buying_price').notNull().default(0),
  wholesalePrice: integer('wholesale_price').notNull().default(0),
  retailPrice: integer('retail_price').notNull().default(0),
  discountPrice: integer('discount_price'),
  vatPercent: real('vat_percent').notNull().default(16),
  taxPercent: real('tax_percent').notNull().default(0),
  transportCost: integer('transport_cost').notNull().default(0),
  importCost: integer('import_cost').notNull().default(0),
  otherExpenses: integer('other_expenses').notNull().default(0),

  // ─── Packaging & Logistics ───
  qtyPerCarton: integer('qty_per_carton').notNull().default(1),
  middlePack: integer('middle_pack'),
  piecesPerPack: integer('pieces_per_pack'),
  weight: real('weight').notNull().default(0),
  length: real('length'),
  width: real('width'),
  height: real('height'),
  unit: varchar('unit', { length: 50 }).default('pcs'),

  // ─── Stock ───
  stockQuantity: integer('stock_quantity').notNull().default(0),
  openingStock: integer('opening_stock').notNull().default(0),
  minStockLevel: integer('min_stock_level').notNull().default(5),
  maxStockLevel: integer('max_stock_level').notNull().default(500),
  reorderLevel: integer('reorder_level').notNull().default(10),
  stockStatus: varchar('stock_status', { length: 50 }).notNull().default('In Stock'),
  storageLocation: varchar('storage_location', { length: 255 }),
  shelfNumber: varchar('shelf_number', { length: 50 }),
  warehouse: varchar('warehouse', { length: 100 }),

  // ─── Attributes ───
  color: varchar('color', { length: 100 }),
  material: varchar('material', { length: 100 }),
  size: varchar('size', { length: 100 }),
  packagingType: varchar('packaging_type', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  manufacturingDate: timestamp('manufacturing_date'),
  expirationDate: timestamp('expiration_date'),
  tags: text('tags'),
  keywords: text('keywords'),

  // ─── Delivery ───
  deliveryTime: varchar('delivery_time', { length: 100 }),
  shippingWeight: real('shipping_weight'),
  shippingCharges: integer('shipping_charges').notNull().default(0),
  freeDelivery: boolean('free_delivery').notNull().default(false),
  courierOptions: text('courier_options'),
  fragile: boolean('fragile').notNull().default(false),
  returnable: boolean('returnable').notNull().default(true),
  cashOnDelivery: boolean('cash_on_delivery').notNull().default(true),

  // ─── Visibility ───
  showOnHomepage: boolean('show_on_homepage').notNull().default(false),
  showOnFeatured: boolean('show_on_featured').notNull().default(false),
  showOnNewArrivals: boolean('show_on_new_arrivals').notNull().default(true),
  isHidden: boolean('is_hidden').notNull().default(false),
  availableOnline: boolean('available_online').notNull().default(true),
  availableInStore: boolean('available_in_store').notNull().default(true),

  // ─── Images ───
  images: text('images').notNull().default('[]'),
  featuredImage: text('featured_image'),

  // ─── Status flags ───
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  isNewArrival: boolean('is_new_arrival').notNull().default(true),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isOnOffer: boolean('is_on_offer').notNull().default(false),
  isHotDeal: boolean('is_hot_deal').notNull().default(false),
  isLimitedStock: boolean('is_limited_stock').notNull().default(false),
  isComingSoon: boolean('is_coming_soon').notNull().default(false),
  isDraft: boolean('is_draft').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),

  // ─── Offer fields ───
  offerPercent: integer('offer_percent'),
  offerStartDate: timestamp('offer_start_date'),
  offerEndDate: timestamp('offer_end_date'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  location: varchar('location', { length: 255 }),
  businessName: varchar('business_name', { length: 255 }),
  totalSpent: integer('total_spent').notNull().default(0),
  totalOrders: integer('total_orders').notNull().default(0),
  lastOrderDate: timestamp('last_order_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  totalAmount: integer('total_amount').notNull().default(0),
  paymentMethod: varchar('payment_method', { length: 50 }),
  deliveryStatus: varchar('delivery_status', { length: 50 }).default('Pending'),
  items: text('items').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  location: varchar('location', { length: 255 }),
  message: text('message'),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  items: text('items').notNull(),
});

export const settings = pgTable('settings', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
});

// ─── NEW TABLES ────────────────────────────────────────────────────────────

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  country: varchar('country', { length: 100 }),
  address: text('address'),
  notes: text('notes'),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  productName: varchar('product_name', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(), // 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'DAMAGED', 'RETURNED'
  quantity: integer('quantity').notNull(),
  previousStock: integer('previous_stock').notNull().default(0),
  newStock: integer('new_stock').notNull().default(0),
  reason: text('reason'),
  reference: varchar('reference', { length: 255 }),
  performedBy: varchar('performed_by', { length: 100 }).default('Admin'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'order', 'stock', 'customer', 'payment', 'supplier'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  link: varchar('link', { length: 255 }),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Manager'), // 'Super Admin', 'Manager', 'Sales', 'Inventory Staff'
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(), // 'login', 'logout', 'create', 'update', 'delete'
  entity: varchar('entity', { length: 50 }), // 'product', 'order', 'customer', etc.
  entityId: integer('entity_id'),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const promotions = pgTable('promotions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'percentage', 'fixed', 'flash_sale', 'free_shipping'
  value: integer('value').notNull().default(0), // discount value
  minPurchase: integer('min_purchase').notNull().default(0),
  maxDiscount: integer('max_discount'),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
