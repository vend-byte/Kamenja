'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard, ShoppingBag, Tags, Database, Settings, Plus, Trash2, Edit, X, LogOut,
  Download, Upload, FileSpreadsheet, MapPin, Phone, Mail, Save, AlertCircle, Search,
  MessageSquare, CheckCircle, Copy, TrendingUp, Package, BarChart3, Star, Zap,
  Users, ShieldCheck, FileText, Globe, Printer, ShoppingCart, Image as ImageIcon,
  Bell, Truck, ArrowDown, ArrowUp, RefreshCcw, History, Activity, Building2, Tag,
  Calendar, DollarSign, PieChart, LineChart
} from 'lucide-react';
import {
  saveProductAction, deleteProductAction, duplicateProductAction,
  saveCategoryAction, deleteCategoryAction,
  updateSettingsAction, updateQuoteStatusAction, deleteQuoteAction,
  importProductsAction, backupDatabaseAction, restoreDatabaseAction,
  updateOrderStatusAction, logoutAdminAction,
  saveCustomerAction, deleteCustomerAction,
  saveSupplierAction, deleteSupplierAction,
  recordStockMovementAction,
  markNotificationReadAction, markAllNotificationsReadAction, deleteNotificationAction,
  savePromotionAction, deletePromotionAction
} from '@/app/admin/actions';
import ProductManager from './ProductManager';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category { id: number; name: string; slug: string; description: string | null; image: string | null; isActive: boolean; }
interface Product {
  id: number; code: string; barcode: string | null; name: string; nameLocal: string | null; nameChinese: string | null; slug: string; categoryId: number | null;
  supplier: string | null; description: string | null; features: string | null; specifications: string | null;
  buyingPriceRmb: number; buyingPrice: number; wholesalePrice: number; discountPrice: number | null; vatPercent: number;
  qtyPerCarton: number; middlePack: number | null; weight: number;
  stockQuantity: number; openingStock: number; minStockLevel: number; maxStockLevel: number;
  reorderLevel?: number;
  stockStatus: string; images: string; featuredImage: string | null;
  isActive: boolean; isFeatured: boolean; isNewArrival: boolean; isBestSeller: boolean;
  isOnOffer: boolean; isHotDeal: boolean; isLimitedStock: boolean; isComingSoon: boolean;
  offerPercent: number | null; offerStartDate: any; offerEndDate: any;
  createdAt: any; updatedAt: any;
}
interface Quote { id: number; customerName: string; businessName: string | null; email: string | null; phone: string; whatsappNumber: string | null; location: string | null; message: string | null; status: string; createdAt: any; items: string; }
interface Customer { id: number; name: string; phone: string; email: string | null; location: string | null; businessName: string | null; totalSpent: number; totalOrders: number; lastOrderDate: any; createdAt: any; }
interface Order { id: number; orderNumber: string; customerId: number | null; customerName: string | null; status: string; totalAmount: number; paymentMethod: string | null; deliveryStatus: string | null; items: string; createdAt: any; updatedAt: any; }
interface Supplier { id: number; name: string; contactPerson: string | null; phone: string | null; email: string | null; country: string | null; address: string | null; notes: string | null; totalOrders: number; totalSpent: number; isActive: boolean; createdAt: any; }
interface NotificationItem { id: number; type: string; title: string; message: string; isRead: boolean; link: string | null; priority: string; createdAt: any; }
interface Promotion { id: number; code: string; name: string; type: string; value: number; minPurchase: number; maxDiscount: number | null; usageLimit: number | null; usedCount: number; startDate: any; endDate: any; isActive: boolean; createdAt: any; }
interface StockMovement { id: number; productId: number | null; productName: string | null; type: string; quantity: number; previousStock: number; newStock: number; reason: string | null; reference: string | null; performedBy: string | null; createdAt: any; }
type Tab = 'dashboard' | 'products' | 'categories' | 'inventory' | 'orders' | 'customers' | 'suppliers' | 'offers' | 'promotions' | 'quotes' | 'reports' | 'notifications' | 'users' | 'import' | 'settings';

interface Props {
  initialCategories: Category[]; initialProducts: Product[]; initialQuotes: Quote[];
  initialCustomers: Customer[]; initialOrders: Order[]; initialSettings: Record<string, string>;
  initialSuppliers?: Supplier[]; initialNotifications?: NotificationItem[];
  initialPromotions?: Promotion[]; initialStockMovements?: StockMovement[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
const parseImg = (s: string): string => { try { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a[0]; } catch {} return s || 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=300'; };
const emptyProduct = (): Partial<Product> => ({
  code: '', barcode: '', name: '', nameLocal: '', nameChinese: '', categoryId: 0, supplier: '', description: '', features: '', specifications: '',
  buyingPriceRmb: 0, buyingPrice: 0, wholesalePrice: 0, vatPercent: 16, qtyPerCarton: 1, middlePack: undefined as any, weight: 0,
  stockQuantity: 100, openingStock: 100, minStockLevel: 5, maxStockLevel: 500,
  images: '', featuredImage: '', isActive: true, isFeatured: false, isNewArrival: true, isBestSeller: false, isOnOffer: false, isHotDeal: false, isLimitedStock: false, isComingSoon: false,
});

export default function AdminPanel({ 
  initialCategories, initialProducts, initialQuotes, initialCustomers, initialOrders, initialSettings,
  initialSuppliers = [], initialNotifications = [], initialPromotions = [], initialStockMovements = []
}: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [cats, setCats] = useState(initialCategories);
  const [prods, setProds] = useState(initialProducts);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [customers, setCustomers] = useState(initialCustomers);
  const [orders, setOrders] = useState(initialOrders);
  const [sMap, setSMap] = useState(initialSettings);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [notifs, setNotifs] = useState(initialNotifications);
  const [promos, setPromos] = useState(initialPromotions);
  const [stockMoves, setStockMoves] = useState(initialStockMovements);

  // Customer / Supplier / Promo modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [curCustomer, setCurCustomer] = useState<any>({ name: '', phone: '', email: '', location: '', businessName: '' });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [curSupplier, setCurSupplier] = useState<any>({ name: '', contactPerson: '', phone: '', email: '', country: '', address: '', isActive: true });
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [curPromo, setCurPromo] = useState<any>({ code: '', name: '', type: 'percentage', value: 10, isActive: true });
  const [showStockMoveModal, setShowStockMoveModal] = useState(false);
  const [curStockMove, setCurStockMove] = useState<any>({ productId: 0, type: 'IN', quantity: 0, reason: '', reference: '' });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  
  // Search & Filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatF, setProdCatF] = useState('all');
  const [prodSort, setProdSort] = useState('newest');

  // Modals
  const [showProdModal, setShowProdModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [curProd, setCurProd] = useState<Partial<Product>>(emptyProduct());
  const [curCat, setCurCat] = useState<Partial<Category>>({ name: '', description: '', image: '', isActive: true });

  const showToast = (type: 'ok' | 'err', msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };
  const run = async <T,>(fn: () => Promise<T>) => { setLoading(true); try { return await fn(); } finally { setLoading(false); } };

  // ── Stats Calculations ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    let tStock = 0, tBuy = 0, tSell = 0, low = 0, out = 0, feat = 0, offer = 0, recentAdded = 0;
    const now = Date.now();
    prods.forEach(p => {
      tStock += p.stockQuantity;
      tBuy += (p.buyingPrice * p.stockQuantity);
      tSell += (p.wholesalePrice * p.stockQuantity);
      if (p.stockStatus === 'Low Stock') low++;
      if (p.stockStatus === 'Out of Stock') out++;
      if (p.isFeatured) feat++;
      if (p.isOnOffer) offer++;
      if (now - new Date(p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000) recentAdded++;
    });
    return { tStock, tBuy, tSell, pft: tSell - tBuy, low, out, feat, offer, recentAdded };
  }, [prods]);

  const filteredProds = useMemo(() => {
    let res = prods.filter(p => {
      const q = prodSearch.toLowerCase();
      return (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q))) &&
             (prodCatF === 'all' || p.categoryId === Number(prodCatF));
    });
    if (prodSort === 'price-asc') res.sort((a,b) => a.wholesalePrice - b.wholesalePrice);
    else if (prodSort === 'price-desc') res.sort((a,b) => b.wholesalePrice - a.wholesalePrice);
    else if (prodSort === 'stock-asc') res.sort((a,b) => a.stockQuantity - b.stockQuantity);
    else if (prodSort === 'stock-desc') res.sort((a,b) => b.stockQuantity - a.stockQuantity);
    return res;
  }, [prods, prodSearch, prodCatF, prodSort]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, field: 'featured'|'gallery'|'category') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (field === 'featured') setCurProd(p => ({ ...p, featuredImage: data.url }));
        if (field === 'gallery') {
          let arr = []; try { arr = JSON.parse(curProd.images||'[]'); } catch {}
          setCurProd(p => ({ ...p, images: JSON.stringify([...(Array.isArray(arr)?arr:[]), data.url]) }));
        }
        if (field === 'category') setCurCat(c => ({ ...c, image: data.url }));
        showToast('ok', 'Image uploaded successfully!');
      } else throw new Error(data.error);
    } catch (err: any) {
      showToast('err', err.message || 'Image upload failed.');
    } finally { setLoading(false); }
  };

  const handleSaveProd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curProd.name || !curProd.code || !curProd.categoryId) { showToast('err', 'Name, Code, and Category are required.'); return; }
    const res = await run(() => saveProductAction(curProd as any));
    if ((res as any).success) { showToast('ok', 'Product saved!'); setShowProdModal(false); window.location.reload(); }
    else showToast('err', (res as any).error || 'Save failed.');
  };
  const handleDeleteProd = async (id: number) => {
    if (!confirm('Delete product?')) return;
    const res = await run(() => deleteProductAction(id));
    if ((res as any).success) { setProds(p => p.filter(x => x.id !== id)); showToast('ok', 'Product deleted.'); }
  };
  const handleDupeProd = async (id: number) => {
    const res = await run(() => duplicateProductAction(id));
    if ((res as any).success) { showToast('ok', 'Duplicated.'); setTimeout(() => window.location.reload(), 800); }
  };
  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(() => saveCategoryAction(curCat as any));
    if ((res as any).success) { setShowCatModal(false); showToast('ok', 'Category saved.'); window.location.reload(); }
  };
  const handleDeleteCat = async (id: number) => {
    if (!confirm('Delete category?')) return;
    const res = await run(() => deleteCategoryAction(id));
    if ((res as any).success) { setCats(c => c.filter(x => x.id !== id)); showToast('ok', 'Category deleted.'); }
  };
  const handleExportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers, ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`))].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const currentProfit = (Number(curProd.wholesalePrice) || 0) - (Number(curProd.buyingPrice) || 0);
  const currentMargin = (Number(curProd.wholesalePrice) || 0) > 0 ? (currentProfit / Number(curProd.wholesalePrice)) * 100 : 0;

  // ── Menu ──────────────────────────────────────────────────────────────────
  const unreadNotifs = notifs.filter(n => !n.isRead).length;
  const menu: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <ShoppingBag className="w-4 h-4" />, badge: prods.length },
    { id: 'categories', label: 'Categories', icon: <Tags className="w-4 h-4" />, badge: cats.length },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, badge: stats.low + stats.out },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" />, badge: orders.filter(o=>o.status==='Pending').length },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" />, badge: customers.length },
    { id: 'suppliers', label: 'Suppliers', icon: <Building2 className="w-4 h-4" />, badge: suppliers.length },
    { id: 'promotions', label: 'Promotions', icon: <Tag className="w-4 h-4" />, badge: promos.length },
    { id: 'quotes', label: 'Quotations', icon: <FileText className="w-4 h-4" />, badge: quotes.filter(q=>q.status==='Pending').length },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadNotifs },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-sm font-sans flex flex-col">
      <header className="bg-[#0B2C63] text-white px-4 sm:px-6 py-3 flex justify-between items-center z-30 sticky top-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center font-black text-lg border-2 border-white/20">K</div>
          <div><h1 className="text-sm sm:text-base font-black tracking-tight leading-none">KAMENJA ENTERPRISES</h1><p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">Admin Management System</p></div>
        </div>
        <button onClick={async () => { await logoutAdminAction(); window.location.reload(); }} className="bg-red-500 hover:bg-red-600 text-white font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Logout</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:flex flex-col shadow-sm z-20">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-sm"><ShieldCheck className="w-5 h-5 text-secondary" /></div>
              <div><p className="font-bold text-gray-800 text-xs">Super Admin</p><p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online</p></div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menu.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-primary'}`}>
                {t.icon}<span>{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'}`}>{t.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
          
          {/* Toast & Loading Overlays */}
          {toast && <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-2xl text-xs font-bold border-2 animate-in fade-in slide-in-from-top-4 ${toast.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{toast.type === 'ok' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />} {toast.msg}</div>}
          {loading && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center"><div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl"><div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" /><span className="text-sm font-bold text-gray-800">Processing...</span></div></div>}

          {/* ════ 1. DASHBOARD ════ */}
          {tab === 'dashboard' && (() => {
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
            const todaySales = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            const monthOrders = orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
            const monthSales = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
            const pendingOrders = orders.filter(o => o.status === 'Pending').length;
            const recentOrders = orders.slice(0, 5);
            const recentCustomers = customers.slice(0, 5);
            
            // Best selling products (calculate from orders)
            const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
            orders.forEach(o => {
              try {
                const items = JSON.parse(o.items);
                if (Array.isArray(items)) items.forEach((it: any) => {
                  const k = it.name || it.code || 'Unknown';
                  if (!productSales[k]) productSales[k] = { name: k, qty: 0, revenue: 0 };
                  productSales[k].qty += Number(it.qty) || 1;
                  productSales[k].revenue += (Number(it.qty) || 1) * (Number(it.wholesalePrice || it.price) || 0);
                });
              } catch {}
            });
            const bestSelling = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

            // Sales graph data (last 7 days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i));
              const dStr = d.toDateString();
              const dayTotal = orders.filter(o => new Date(o.createdAt).toDateString() === dStr).reduce((s, o) => s + o.totalAmount, 0);
              return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: dayTotal };
            });
            const maxSales = Math.max(...last7Days.map(d => d.value), 1);

            return (
              <div className="space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">Dashboard Overview</h2>
                    <p className="text-xs text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
                  </div>
                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setTab('products')} className="bg-primary hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm"><Plus className="w-3 h-3"/> Add Product</button>
                    <button onClick={() => setTab('orders')} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm"><ShoppingCart className="w-3 h-3"/> View Orders</button>
                    <button onClick={() => setTab('customers')} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm"><Users className="w-3 h-3"/> Customers</button>
                    <button onClick={() => setTab('reports')} className="bg-secondary hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm"><BarChart3 className="w-3 h-3"/> Reports</button>
                  </div>
                </div>

                {/* PRIMARY STAT CARDS — 12 items */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { l: 'Total Products', v: prods.length, i: <ShoppingBag className="text-blue-500"/>, b: 'bg-blue-50' },
                    { l: 'Categories', v: cats.length, i: <Tags className="text-indigo-500"/>, b: 'bg-indigo-50' },
                    { l: 'Total Orders', v: orders.length, i: <ShoppingCart className="text-pink-500"/>, b: 'bg-pink-50' },
                    { l: 'Customers', v: customers.length, i: <Users className="text-teal-500"/>, b: 'bg-teal-50' },
                    { l: 'Suppliers', v: suppliers.length, i: <Building2 className="text-cyan-500"/>, b: 'bg-cyan-50' },
                    { l: 'Pending Orders', v: pendingOrders, i: <RefreshCcw className="text-amber-500"/>, b: 'bg-amber-50' },
                    { l: 'Low Stock', v: stats.low, i: <AlertCircle className="text-yellow-600"/>, b: 'bg-yellow-50' },
                    { l: 'Out of Stock', v: stats.out, i: <X className="text-red-500"/>, b: 'bg-red-50' },
                  ].map((c, i) => (
                    <div key={i} className={`${c.b} rounded-2xl p-4 border border-white/40 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all`}>
                      <div className="flex justify-between items-start"><span className="text-[10px] font-black uppercase text-gray-500 leading-tight">{c.l}</span><div className="bg-white p-1.5 rounded-lg shadow-sm [&>svg]:w-4 [&>svg]:h-4">{c.i}</div></div>
                      <span className="text-xl sm:text-2xl font-black text-gray-800">{c.v}</span>
                    </div>
                  ))}
                </div>

                {/* FINANCIAL CARDS — 4 items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Inventory Value</p><DollarSign className="w-4 h-4 text-blue-600"/></div>
                    <p className="text-2xl font-black text-blue-700">{fmt(stats.tSell)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Expected Profit</p><TrendingUp className="w-4 h-4 text-green-600"/></div>
                    <p className="text-2xl font-black text-green-700">{fmt(stats.pft)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Today's Sales</p><Calendar className="w-4 h-4 text-purple-600"/></div>
                    <p className="text-2xl font-black text-purple-700">{fmt(todaySales)}</p>
                    <p className="text-[10px] text-purple-600 font-bold mt-1">{todayOrders.length} order(s)</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Monthly Sales</p><LineChart className="w-4 h-4 text-orange-600"/></div>
                    <p className="text-2xl font-black text-orange-700">{fmt(monthSales)}</p>
                    <p className="text-[10px] text-orange-600 font-bold mt-1">{monthOrders.length} order(s) this month</p>
                  </div>
                </div>

                {/* SALES GRAPH + NOTIFICATIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Sales Graph (last 7 days) */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-secondary"/> Sales — Last 7 Days</h3>
                        <p className="text-[10px] text-gray-500">Revenue trend per day</p>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold">Max: {fmt(maxSales)}</p>
                    </div>
                    <div className="flex items-end justify-between gap-2 h-48 px-2">
                      {last7Days.map((d, i) => {
                        const heightPct = (d.value / maxSales) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                            <div className="text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{fmt(d.value)}</div>
                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-blue-400 rounded-t-lg transition-all group-hover:from-secondary group-hover:to-orange-400" 
                                style={{ height: `${heightPct}%`, minHeight: d.value > 0 ? '4px' : '0' }}
                              />
                            </div>
                            <div className="text-[10px] font-bold text-gray-700">{d.day}</div>
                            <div className="text-[9px] text-gray-400">{d.date}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notification Panel */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b pb-3">
                      <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-secondary"/> Notifications</h3>
                      {unreadNotifs > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadNotifs}</span>}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {/* Auto-generated notifications */}
                      {stats.out > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded text-xs">
                          <p className="font-bold text-red-700">⚠️ {stats.out} Out of Stock</p>
                          <p className="text-[10px] text-red-600 mt-0.5">Restock needed urgently</p>
                        </div>
                      )}
                      {stats.low > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-2.5 rounded text-xs">
                          <p className="font-bold text-yellow-700">📦 {stats.low} Low Stock</p>
                          <p className="text-[10px] text-yellow-600 mt-0.5">Products below reorder level</p>
                        </div>
                      )}
                      {pendingOrders > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-2.5 rounded text-xs">
                          <p className="font-bold text-blue-700">🔔 {pendingOrders} Pending Orders</p>
                          <p className="text-[10px] text-blue-600 mt-0.5">Awaiting your action</p>
                        </div>
                      )}
                      {quotes.filter(q => q.status === 'Pending').length > 0 && (
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-2.5 rounded text-xs">
                          <p className="font-bold text-purple-700">💬 {quotes.filter(q => q.status === 'Pending').length} New Quotes</p>
                          <p className="text-[10px] text-purple-600 mt-0.5">Customer inquiries waiting</p>
                        </div>
                      )}
                      {notifs.filter(n => !n.isRead).slice(0, 3).map(n => (
                        <div key={n.id} className="bg-gray-50 border-l-4 border-gray-400 p-2.5 rounded text-xs">
                          <p className="font-bold text-gray-800">{n.title}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                      {stats.out === 0 && stats.low === 0 && pendingOrders === 0 && (
                        <p className="text-xs text-gray-400 text-center py-6">No notifications</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RECENT ORDERS + RECENT CUSTOMERS + BEST SELLING */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Recent Orders */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b pb-3">
                      <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-pink-500"/> Recent Orders</h3>
                      <button onClick={() => setTab('orders')} className="text-[10px] text-primary font-bold hover:underline">View All →</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentOrders.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">No orders yet</p> : recentOrders.map(o => (
                        <div key={o.id} className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer" onClick={() => setTab('orders')}>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{o.orderNumber}</p>
                            <p className="text-[10px] text-gray-500">{o.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-primary">{fmt(o.totalAmount)}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Customers */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b pb-3">
                      <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-teal-500"/> Recent Customers</h3>
                      <button onClick={() => setTab('customers')} className="text-[10px] text-primary font-bold hover:underline">View All →</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentCustomers.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">No customers yet</p> : recentCustomers.map(c => (
                        <div key={c.id} className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer" onClick={() => setTab('customers')}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-teal-100 text-teal-700 font-black rounded-full flex items-center justify-center text-[10px]">{c.name.charAt(0)}</div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{c.name}</p>
                              <p className="text-[10px] text-gray-500">{c.phone}</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-green-600">{fmt(c.totalSpent)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Selling Products */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b pb-3">
                      <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500"/> Best Sellers</h3>
                      <button onClick={() => setTab('products')} className="text-[10px] text-primary font-bold hover:underline">View All →</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bestSelling.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">No sales data yet</p> : bestSelling.map((p, i) => (
                        <div key={i} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2.5 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{p.name}</p>
                              <p className="text-[10px] text-gray-500">{p.qty} sold</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-green-600">{fmt(p.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════ 2. PRODUCTS — Full ProductManager ════ */}
          {tab === 'products' && (
            <ProductManager initialProducts={prods as any} categories={cats as any} />
          )}

          {/* ════ 3. CATEGORIES ════ */}
          {tab === 'categories' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-black text-gray-800">Categories Management</h2>
                <button onClick={() => { setCurCat({ name: '', description: '', isActive: true }); setShowCatModal(true); }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cats.map(c => {
                  const count = prods.filter(p => p.categoryId === c.id).length;
                  return (
                    <div key={c.id} className={`border rounded-xl p-5 hover:shadow-lg transition-all ${!c.isActive?'opacity-60 bg-gray-50':'bg-white'}`}>
                      <h3 className="font-black text-primary text-base uppercase mb-1">{c.name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono mb-2">{c.slug}</p>
                      <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md text-[10px]">{count} Products</span>
                      <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
                        <button onClick={() => { setCurCat(c); setShowCatModal(true); }} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1.5"><Edit className="w-3.5 h-3.5"/> Edit</button>
                        <button onClick={() => handleDeleteCat(c.id)} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1.5"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 4. ORDERS ════ */}
          {tab === 'orders' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <h2 className="text-xl font-black text-gray-800 border-b pb-4">Order Management</h2>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {['Pending', 'Processing', 'Delivered', 'Cancelled', 'Refunded'].map(s => (
                  <div key={s} className="bg-gray-50 border p-3 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-500">{s}</p>
                    <p className="text-lg font-black text-primary">{orders.filter(o=>o.status===s).length}</p>
                  </div>
                ))}
              </div>
              <div className="border rounded-xl overflow-x-auto">
                <table className="min-w-full text-xs text-left divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                    <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-center">Payment</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td className="px-4 py-3 font-mono font-bold text-secondary">{o.orderNumber}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{o.customerName}</td>
                        <td className="px-4 py-3 text-right font-black text-primary">{fmt(o.totalAmount)}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-500">{o.paymentMethod || 'N/A'}</td>
                        <td className="px-4 py-3 text-center"><select value={o.status} onChange={async (e) => { await run(()=>updateOrderStatusAction(o.id, e.target.value)); window.location.reload(); }} className="bg-gray-50 border border-gray-300 rounded px-2 py-1 outline-none font-bold text-[10px] uppercase"><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option><option value="Refunded">Refunded</option></select></td>
                        <td className="px-4 py-3 text-center"><button className="text-blue-600 font-bold flex justify-center items-center gap-1 mx-auto hover:underline"><Printer className="w-3.5 h-3.5"/> Invoice</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ 5. CUSTOMERS ════ */}
          {tab === 'customers' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Customer Directory</h2>
                  <p className="text-xs text-gray-500 mt-1">{customers.length} customer(s)</p>
                </div>
                <button onClick={() => { setCurCustomer({ name: '', phone: '', email: '', location: '', businessName: '' }); setShowCustomerModal(true); }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md"><Plus className="w-4 h-4" /> Add Customer</button>
              </div>
              {customers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-sm">No customers yet</p>
                  <p className="text-xs mt-1">Customers are added automatically when they submit quotes, or you can add them manually</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-x-auto">
                  <table className="min-w-full text-xs text-left divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                      <tr><th className="px-4 py-3">Name / Business</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3 text-center">Location</th><th className="px-4 py-3 text-center">Total Orders</th><th className="px-4 py-3 text-right">Amount Spent</th><th className="px-4 py-3 text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {customers.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><p className="font-bold text-gray-800 text-sm">{c.name}</p><p className="text-[10px] text-gray-500 font-bold">{c.businessName || 'Independent'}</p></td>
                          <td className="px-4 py-3"><p className="font-bold text-secondary">{c.phone}</p><p className="text-[10px] text-gray-500">{c.email}</p></td>
                          <td className="px-4 py-3 text-center font-medium text-gray-600">{c.location || '—'}</td>
                          <td className="px-4 py-3 text-center font-black bg-gray-50">{c.totalOrders}</td>
                          <td className="px-4 py-3 text-right font-black text-primary text-sm">{fmt(c.totalSpent)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => { setCurCustomer(c); setShowCustomerModal(true); }} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"><Edit className="w-3.5 h-3.5"/></button>
                              <button onClick={async () => { if (!confirm('Delete customer?')) return; const r: any = await deleteCustomerAction(c.id); if (r.success) { setCustomers(p => p.filter(x => x.id !== c.id)); showToast('ok', 'Deleted.'); } }} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════ SUPPLIERS ════ */}
          {tab === 'suppliers' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Suppliers Management</h2>
                  <p className="text-xs text-gray-500 mt-1">{suppliers.length} supplier(s) registered</p>
                </div>
                <button onClick={() => { setCurSupplier({ name: '', contactPerson: '', phone: '', email: '', country: '', address: '', isActive: true }); setShowSupplierModal(true); }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md"><Plus className="w-4 h-4" /> Add Supplier</button>
              </div>
              {suppliers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-sm">No suppliers yet</p>
                  <p className="text-xs mt-1">Add your first supplier to track product sources</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map(s => {
                    const supplierProds = prods.filter(p => p.supplier === s.name).length;
                    return (
                      <div key={s.id} className={`border-2 rounded-xl p-5 transition-all ${s.isActive ? 'border-gray-200 bg-white hover:border-primary' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-black text-primary text-sm">{s.name}</h3>
                            {s.contactPerson && <p className="text-[10px] text-gray-500">Contact: {s.contactPerson}</p>}
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {s.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-secondary"/> {s.phone}</p>}
                          {s.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-secondary"/> {s.email}</p>}
                          {s.country && <p className="flex items-center gap-1"><Globe className="w-3 h-3 text-secondary"/> {s.country}</p>}
                        </div>
                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary">{supplierProds} products</span>
                          <div className="flex gap-1">
                            <button onClick={() => { setCurSupplier(s); setShowSupplierModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-3.5 h-3.5"/></button>
                            <button onClick={async () => { if (!confirm('Delete supplier?')) return; const r: any = await deleteSupplierAction(s.id); if (r.success) { setSuppliers(p => p.filter(x => x.id !== s.id)); showToast('ok', 'Deleted.'); } }} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ INVENTORY (Stock Management) ════ */}
          {tab === 'inventory' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Inventory Management</h2>
                  <p className="text-xs text-gray-500 mt-1">Track stock IN, OUT, transfers, adjustments, damaged & returned items</p>
                </div>
                <button onClick={() => { setCurStockMove({ productId: prods[0]?.id || 0, type: 'IN', quantity: 0, reason: '', reference: '' }); setShowStockMoveModal(true); }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md"><Plus className="w-4 h-4" /> New Stock Movement</button>
              </div>

              {/* Inventory Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-xl text-center"><p className="text-[9px] uppercase font-bold text-gray-500">Total Stock Units</p><p className="text-xl font-black text-blue-700">{stats.tStock}</p></div>
                <div className="bg-green-50 p-3 rounded-xl text-center"><p className="text-[9px] uppercase font-bold text-gray-500">Inventory Value</p><p className="text-base font-black text-green-700">{fmt(stats.tSell)}</p></div>
                <div className="bg-yellow-50 p-3 rounded-xl text-center"><p className="text-[9px] uppercase font-bold text-gray-500">Low Stock Alert</p><p className="text-xl font-black text-yellow-700">{stats.low}</p></div>
                <div className="bg-red-50 p-3 rounded-xl text-center"><p className="text-[9px] uppercase font-bold text-gray-500">Out of Stock</p><p className="text-xl font-black text-red-700">{stats.out}</p></div>
              </div>

              {/* Stock Movement History */}
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-secondary"/> Stock Movement History</h3>
                <div className="border rounded-xl overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-3 text-left">Date</th>
                        <th className="px-3 py-3 text-left">Product</th>
                        <th className="px-3 py-3 text-center">Type</th>
                        <th className="px-3 py-3 text-center">Qty</th>
                        <th className="px-3 py-3 text-center">Before</th>
                        <th className="px-3 py-3 text-center">After</th>
                        <th className="px-3 py-3 text-left">Reason</th>
                        <th className="px-3 py-3 text-left">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stockMoves.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                          <History className="w-10 h-10 mx-auto mb-2 text-gray-300"/>
                          <p className="font-bold">No stock movements recorded yet</p>
                          <p className="text-[10px]">Click "New Stock Movement" to log your first entry</p>
                        </td></tr>
                      ) : stockMoves.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-500">{new Date(m.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2.5 font-bold text-gray-800">{m.productName}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.type === 'IN' || m.type === 'RETURNED' ? 'bg-green-100 text-green-700' : m.type === 'ADJUSTMENT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                              {m.type === 'IN' ? <ArrowDown className="w-3 h-3 inline"/> : m.type === 'OUT' ? <ArrowUp className="w-3 h-3 inline"/> : null} {m.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-black">{m.quantity}</td>
                          <td className="px-3 py-2.5 text-center text-gray-500">{m.previousStock}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-primary">{m.newStock}</td>
                          <td className="px-3 py-2.5 text-[10px] text-gray-600 max-w-[200px] truncate">{m.reason || '—'}</td>
                          <td className="px-3 py-2.5 text-[10px] text-gray-500">{m.performedBy || 'Admin'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock + Out of Stock Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-sm font-black text-yellow-800 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Low Stock Alerts ({stats.low})</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {prods.filter(p => p.stockStatus === 'Low Stock').map(p => (
                      <div key={p.id} className="bg-white p-2 rounded-lg flex justify-between text-xs">
                        <div><p className="font-bold text-gray-800">{p.name}</p><p className="text-[10px] text-gray-500 font-mono">{p.code}</p></div>
                        <div className="text-right"><p className="font-black text-yellow-700">{p.stockQuantity} left</p><p className="text-[10px] text-gray-500">Min: {p.minStockLevel}</p></div>
                      </div>
                    ))}
                    {stats.low === 0 && <p className="text-[10px] text-gray-400 text-center py-2">All stock levels normal</p>}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-black text-red-800 mb-3 flex items-center gap-2"><X className="w-4 h-4"/> Out of Stock ({stats.out})</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {prods.filter(p => p.stockStatus === 'Out of Stock').map(p => (
                      <div key={p.id} className="bg-white p-2 rounded-lg flex justify-between items-center text-xs">
                        <div><p className="font-bold text-gray-800">{p.name}</p><p className="text-[10px] text-gray-500 font-mono">{p.code}</p></div>
                        <button onClick={() => { setCurStockMove({ productId: p.id, type: 'IN', quantity: 0, reason: 'Restock', reference: '' }); setShowStockMoveModal(true); }} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-600">Restock</button>
                      </div>
                    ))}
                    {stats.out === 0 && <p className="text-[10px] text-gray-400 text-center py-2">No out of stock items</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ PROMOTIONS ════ */}
          {tab === 'promotions' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Promotions & Discounts</h2>
                  <p className="text-xs text-gray-500 mt-1">Create coupons, flash sales, and special offers</p>
                </div>
                <button onClick={() => { setCurPromo({ code: '', name: '', type: 'percentage', value: 10, isActive: true }); setShowPromoModal(true); }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md"><Plus className="w-4 h-4" /> Create Promotion</button>
              </div>
              {promos.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-sm">No promotions yet</p>
                  <p className="text-xs mt-1">Create your first coupon, flash sale, or special offer</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promos.map(p => {
                    const isExpired = p.endDate && new Date(p.endDate) < new Date();
                    return (
                      <div key={p.id} className={`border-2 rounded-xl p-5 ${isExpired ? 'border-gray-200 bg-gray-50 opacity-60' : p.isActive ? 'border-secondary bg-orange-50/30' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-black text-primary text-base">{p.name}</h3>
                            <p className="text-[10px] text-secondary font-mono font-bold mt-0.5">{p.code}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isExpired ? 'bg-gray-200 text-gray-600' : p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{isExpired ? 'Expired' : p.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg mb-3">
                          <p className="text-[9px] text-gray-500 uppercase font-bold">Discount</p>
                          <p className="text-2xl font-black text-red-500">{p.type === 'percentage' ? `${p.value}%` : fmt(p.value)}</p>
                          <p className="text-[10px] text-gray-500">{p.type.replace('_', ' ').toUpperCase()}</p>
                        </div>
                        <div className="text-xs space-y-1 text-gray-600">
                          {p.minPurchase > 0 && <p>Min Purchase: <strong>{fmt(p.minPurchase)}</strong></p>}
                          <p>Used: <strong>{p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</strong></p>
                          {p.endDate && <p>Expires: <strong>{new Date(p.endDate).toLocaleDateString()}</strong></p>}
                        </div>
                        <div className="mt-3 pt-3 border-t flex justify-end gap-1">
                          <button onClick={() => { setCurPromo(p); setShowPromoModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-3.5 h-3.5"/></button>
                          <button onClick={async () => { if (!confirm('Delete promotion?')) return; const r: any = await deletePromotionAction(p.id); if (r.success) { setPromos(x => x.filter(z => z.id !== p.id)); showToast('ok', 'Deleted.'); } }} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ REPORTS ════ */}
          {tab === 'reports' && (() => {
            const today = new Date();
            const thisMonth = today.getMonth();
            const thisYear = today.getFullYear();
            const monthOrders = orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
            const yearOrders = orders.filter(o => new Date(o.createdAt).getFullYear() === thisYear);
            const handleExport = (data: any[], filename: string) => {
              if (!data.length) return showToast('err', 'No data to export.');
              const headers = Object.keys(data[0]);
              const csv = [headers, ...data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`))].map(r => r.join(',')).join('\n');
              const a = document.createElement('a');
              a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
              a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
              showToast('ok', 'Report downloaded.');
            };
            
            const reports = [
              { id: 1, name: 'Sales Report', desc: 'All orders with totals & status', icon: <BarChart3 className="text-blue-500"/>, count: orders.length, action: () => handleExport(orders.map(o => ({ OrderNumber: o.orderNumber, Customer: o.customerName, Amount: o.totalAmount, Status: o.status, Payment: o.paymentMethod, Date: new Date(o.createdAt).toLocaleString() })), 'sales-report.csv') },
              { id: 2, name: 'Profit Report', desc: 'Inventory profit projections', icon: <TrendingUp className="text-green-500"/>, count: `${fmt(stats.pft)}`, action: () => handleExport(prods.map(p => ({ Code: p.code, Name: p.name, Stock: p.stockQuantity, BuyPrice: p.buyingPrice, SellPrice: p.wholesalePrice, ProfitPerUnit: p.wholesalePrice - p.buyingPrice, TotalProfit: (p.wholesalePrice - p.buyingPrice) * p.stockQuantity })), 'profit-report.csv') },
              { id: 3, name: 'Inventory Report', desc: 'Full stock valuation', icon: <Package className="text-purple-500"/>, count: prods.length, action: () => handleExport(prods.map(p => ({ Code: p.code, Name: p.name, Category: cats.find(c=>c.id===p.categoryId)?.name, Stock: p.stockQuantity, MinLevel: p.minStockLevel, Status: p.stockStatus, BuyValue: p.buyingPrice * p.stockQuantity, SellValue: p.wholesalePrice * p.stockQuantity })), 'inventory-report.csv') },
              { id: 4, name: 'Orders Report', desc: 'Detailed order analysis', icon: <ShoppingCart className="text-pink-500"/>, count: orders.length, action: () => handleExport(orders.map(o => ({ OrderNumber: o.orderNumber, Customer: o.customerName, Status: o.status, Total: o.totalAmount, Payment: o.paymentMethod, Delivery: o.deliveryStatus, Date: new Date(o.createdAt).toLocaleDateString() })), 'orders-report.csv') },
              { id: 5, name: 'Customers Report', desc: 'Customer purchase history', icon: <Users className="text-teal-500"/>, count: customers.length, action: () => handleExport(customers.map(c => ({ Name: c.name, Phone: c.phone, Email: c.email || '', Business: c.businessName || '', Location: c.location || '', TotalOrders: c.totalOrders, TotalSpent: c.totalSpent })), 'customers-report.csv') },
              { id: 6, name: 'Suppliers Report', desc: 'Supplier directory & metrics', icon: <Building2 className="text-indigo-500"/>, count: suppliers.length, action: () => handleExport(suppliers.map(s => ({ Name: s.name, Contact: s.contactPerson || '', Phone: s.phone || '', Email: s.email || '', Country: s.country || '', Active: s.isActive ? 'Yes' : 'No' })), 'suppliers-report.csv') },
              { id: 7, name: 'Low Stock Report', desc: 'Items needing reorder', icon: <AlertCircle className="text-yellow-500"/>, count: stats.low + stats.out, action: () => handleExport(prods.filter(p => p.stockStatus !== 'In Stock').map(p => ({ Code: p.code, Name: p.name, CurrentStock: p.stockQuantity, MinLevel: p.minStockLevel, ReorderLevel: p.reorderLevel, Status: p.stockStatus })), 'low-stock-report.csv') },
              { id: 8, name: 'Monthly Sales', desc: `${today.toLocaleString('en', { month: 'long' })} ${thisYear}`, icon: <Calendar className="text-orange-500"/>, count: `${fmt(monthOrders.reduce((s, o) => s + o.totalAmount, 0))}`, action: () => handleExport(monthOrders.map(o => ({ OrderNumber: o.orderNumber, Customer: o.customerName, Amount: o.totalAmount, Date: new Date(o.createdAt).toLocaleDateString() })), 'monthly-sales.csv') },
              { id: 9, name: 'Annual Sales', desc: `Year ${thisYear}`, icon: <LineChart className="text-cyan-500"/>, count: `${fmt(yearOrders.reduce((s, o) => s + o.totalAmount, 0))}`, action: () => handleExport(yearOrders.map(o => ({ OrderNumber: o.orderNumber, Customer: o.customerName, Amount: o.totalAmount, Month: new Date(o.createdAt).toLocaleString('en', { month: 'long' }), Date: new Date(o.createdAt).toLocaleDateString() })), 'annual-sales.csv') },
            ];
            return (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-black text-gray-800">Business Reports</h2>
                  <p className="text-xs text-gray-500 mt-1">Generate and export reports as CSV (compatible with Excel & PDF tools)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-white p-2.5 rounded-lg shadow-sm [&>svg]:w-5 [&>svg]:h-5">{r.icon}</div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{r.count} records</span>
                      </div>
                      <h3 className="font-black text-primary text-sm">{r.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 mb-4">{r.desc}</p>
                      <button onClick={r.action} className="w-full bg-primary hover:bg-blue-800 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"><Download className="w-3.5 h-3.5"/> Download CSV</button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Need printable PDF reports?</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Use the browser's Print → Save as PDF feature on any page</p>
                  </div>
                  <button onClick={() => window.print()} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"><Printer className="w-3.5 h-3.5"/> Print Now</button>
                </div>
              </div>
            );
          })()}

          {/* ════ NOTIFICATIONS ════ */}
          {tab === 'notifications' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Notifications Centre</h2>
                  <p className="text-xs text-gray-500 mt-1">{unreadNotifs} unread · {notifs.length} total</p>
                </div>
                {unreadNotifs > 0 && (
                  <button onClick={async () => { const r: any = await markAllNotificationsReadAction(); if (r.success) { setNotifs(n => n.map(x => ({ ...x, isRead: true }))); showToast('ok', 'All marked as read.'); } }} className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-xs">Mark All as Read</button>
                )}
              </div>

              {/* Auto-generated alerts */}
              <div className="space-y-2">
                {stats.out > 0 && <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex justify-between items-center"><div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500"/><div><p className="text-xs font-black text-red-700">{stats.out} products are OUT OF STOCK</p><p className="text-[10px] text-red-600">Urgent restocking required</p></div></div><button onClick={() => setTab('inventory')} className="text-[10px] font-bold text-red-700 hover:underline">View Inventory →</button></div>}
                {stats.low > 0 && <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg flex justify-between items-center"><div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-yellow-500"/><div><p className="text-xs font-black text-yellow-700">{stats.low} products are LOW ON STOCK</p><p className="text-[10px] text-yellow-600">Consider reordering soon</p></div></div><button onClick={() => setTab('inventory')} className="text-[10px] font-bold text-yellow-700 hover:underline">View Inventory →</button></div>}
                {orders.filter(o => o.status === 'Pending').length > 0 && <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-lg flex justify-between items-center"><div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-orange-500"/><div><p className="text-xs font-black text-orange-700">{orders.filter(o => o.status === 'Pending').length} orders pending</p><p className="text-[10px] text-orange-600">Awaiting your action</p></div></div><button onClick={() => setTab('orders')} className="text-[10px] font-bold text-orange-700 hover:underline">View Orders →</button></div>}
                {quotes.filter(q => q.status === 'Pending').length > 0 && <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-r-lg flex justify-between items-center"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-purple-500"/><div><p className="text-xs font-black text-purple-700">{quotes.filter(q => q.status === 'Pending').length} quote requests</p><p className="text-[10px] text-purple-600">From website customers</p></div></div><button onClick={() => setTab('quotes')} className="text-[10px] font-bold text-purple-700 hover:underline">View Quotes →</button></div>}
              </div>

              {/* Stored notifications */}
              {notifs.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-black text-gray-700 mb-3">All Notifications</h3>
                  <div className="space-y-2">
                    {notifs.map(n => (
                      <div key={n.id} className={`p-3 rounded-lg flex justify-between items-start gap-3 ${n.isRead ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${n.isRead ? 'text-gray-600' : 'text-gray-800'}`}>{n.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1">
                          {!n.isRead && <button onClick={async () => { const r: any = await markNotificationReadAction(n.id); if (r.success) { setNotifs(x => x.map(z => z.id === n.id ? { ...z, isRead: true } : z)); } }} className="text-blue-600 text-[10px] font-bold hover:underline">Mark Read</button>}
                          <button onClick={async () => { const r: any = await deleteNotificationAction(n.id); if (r.success) { setNotifs(x => x.filter(z => z.id !== n.id)); showToast('ok', 'Deleted.'); } }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {notifs.length === 0 && stats.out === 0 && stats.low === 0 && orders.filter(o => o.status === 'Pending').length === 0 && quotes.filter(q => q.status === 'Pending').length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-sm">All caught up!</p>
                  <p className="text-xs mt-1">No new notifications</p>
                </div>
              )}
            </div>
          )}

          {/* ════ 6. SETTINGS ════ */}
          {tab === 'settings' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
              <h2 className="text-xl font-black text-gray-800 border-b pb-4">Website Settings</h2>
              <form onSubmit={async (e) => { e.preventDefault(); const res = await run(()=>updateSettingsAction(sMap)); if((res as any).success) showToast('ok','Saved!'); }} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl text-xs">
                
                <div className="space-y-4">
                  <h3 className="font-black text-secondary uppercase tracking-wider text-[11px] border-b pb-1">Business Identity</h3>
                  <div><label className="block font-bold text-gray-700 mb-1">Business Name</label><input value={sMap.business_name||''} onChange={e=>setSMap(p=>({...p,business_name:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                  <div><label className="block font-bold text-gray-700 mb-1">Tagline</label><input value={sMap.tagline||''} onChange={e=>setSMap(p=>({...p,tagline:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block font-bold text-gray-700 mb-1">Currency</label><input value={sMap.currency||'KES'} onChange={e=>setSMap(p=>({...p,currency:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                    <div><label className="block font-bold text-gray-700 mb-1">Tax Rate (%)</label><input type="number" value={sMap.tax_rate||'16'} onChange={e=>setSMap(p=>({...p,tax_rate:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-secondary uppercase tracking-wider text-[11px] border-b pb-1">Contact & Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block font-bold text-gray-700 mb-1">Phone 1</label><input value={sMap.phone_primary||''} onChange={e=>setSMap(p=>({...p,phone_primary:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                    <div><label className="block font-bold text-gray-700 mb-1">Phone 2 (WhatsApp)</label><input value={sMap.phone_secondary||''} onChange={e=>setSMap(p=>({...p,phone_secondary:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                  </div>
                  <div><label className="block font-bold text-gray-700 mb-1">Email</label><input value={sMap.email||''} onChange={e=>setSMap(p=>({...p,email:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                  <div><label className="block font-bold text-gray-700 mb-1">Business Address</label><input value={sMap.location||''} onChange={e=>setSMap(p=>({...p,location:e.target.value}))} className="w-full p-2 border rounded-lg outline-none focus:border-primary"/></div>
                </div>

                <div className="col-span-full flex justify-end border-t pt-4">
                  <button type="submit" className="bg-primary hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl flex gap-2"><Save className="w-4 h-4"/> Save All Settings</button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>


      {/* ════ CATEGORY MODAL ════ */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-[#0B2C63] text-white px-5 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-sm uppercase">{curCat.id ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowCatModal(false)} className="hover:text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveCat} className="p-6 space-y-4 text-xs">
              <div><label className="block font-bold text-gray-700 mb-1">Name *</label><input required value={curCat.name||''} onChange={e=>setCurCat(p=>({...p, name:e.target.value}))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Description</label><textarea rows={3} value={curCat.description||''} onChange={e=>setCurCat(p=>({...p, description:e.target.value}))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary resize-none"/></div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2"/>
                <p className="font-bold text-primary mb-1">Category Image</p>
                <label className="bg-secondary text-white px-3 py-1 rounded cursor-pointer text-[10px] font-bold">Upload <input type="file" className="hidden" accept="image/*" onChange={e=>handleUploadImage(e,'category')}/></label>
                {curCat.image && <img src={curCat.image} className="w-16 h-16 object-cover mx-auto mt-2 rounded border"/>}
              </div>

              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={curCat.isActive!==false} onChange={e=>setCurCat(p=>({...p, isActive:e.target.checked}))} /> Active</label>
              <div className="flex justify-end gap-3 pt-4 border-t"><button type="submit" className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md">Save Category</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ════ SUPPLIER MODAL ════ */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#0B2C63] text-white px-5 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-sm uppercase">{curSupplier.id ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowSupplierModal(false)} className="hover:text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); const r: any = await run(() => saveSupplierAction(curSupplier)); if (r.success) { setShowSupplierModal(false); showToast('ok', 'Saved.'); window.location.reload(); } else showToast('err', r.error || 'Failed.'); }} className="p-6 space-y-3 text-xs">
              <div><label className="block font-bold text-gray-700 mb-1">Supplier Name *</label><input required value={curSupplier.name || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Contact Person</label><input value={curSupplier.contactPerson || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, contactPerson: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-gray-700 mb-1">Phone</label><input value={curSupplier.phone || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, phone: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
                <div><label className="block font-bold text-gray-700 mb-1">Country</label><input value={curSupplier.country || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, country: e.target.value }))} placeholder="e.g. China" className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              </div>
              <div><label className="block font-bold text-gray-700 mb-1">Email</label><input type="email" value={curSupplier.email || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, email: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Address</label><textarea rows={2} value={curSupplier.address || ''} onChange={e => setCurSupplier((p: any) => ({ ...p, address: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary resize-none"/></div>
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={curSupplier.isActive !== false} onChange={e => setCurSupplier((p: any) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
              <button type="submit" className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md mt-3">Save Supplier</button>
            </form>
          </div>
        </div>
      )}

      {/* ════ PROMOTION MODAL ════ */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#0B2C63] text-white px-5 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-sm uppercase">{curPromo.id ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button onClick={() => setShowPromoModal(false)} className="hover:text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); const r: any = await run(() => savePromotionAction(curPromo)); if (r.success) { setShowPromoModal(false); showToast('ok', 'Saved.'); window.location.reload(); } else showToast('err', r.error || 'Failed.'); }} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-gray-700 mb-1">Code *</label><input required value={curPromo.code || ''} onChange={e => setCurPromo((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SALE10" className="w-full p-2.5 border rounded-xl outline-none focus:border-primary font-mono uppercase"/></div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Type *</label>
                  <select value={curPromo.type} onChange={e => setCurPromo((p: any) => ({ ...p, type: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary bg-white">
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="flash_sale">Flash Sale</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>
              <div><label className="block font-bold text-gray-700 mb-1">Promotion Name *</label><input required value={curPromo.name || ''} onChange={e => setCurPromo((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Christmas Sale" className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-gray-700 mb-1">{curPromo.type === 'percentage' ? 'Discount %' : 'Discount Amount'}</label><input type="number" value={curPromo.value || 0} onChange={e => setCurPromo((p: any) => ({ ...p, value: Number(e.target.value) }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
                <div><label className="block font-bold text-gray-700 mb-1">Min Purchase (KES)</label><input type="number" value={curPromo.minPurchase || 0} onChange={e => setCurPromo((p: any) => ({ ...p, minPurchase: Number(e.target.value) }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-gray-700 mb-1">Start Date</label><input type="date" value={curPromo.startDate ? String(curPromo.startDate).slice(0,10) : ''} onChange={e => setCurPromo((p: any) => ({ ...p, startDate: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
                <div><label className="block font-bold text-gray-700 mb-1">End Date</label><input type="date" value={curPromo.endDate ? String(curPromo.endDate).slice(0,10) : ''} onChange={e => setCurPromo((p: any) => ({ ...p, endDate: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              </div>
              <div><label className="block font-bold text-gray-700 mb-1">Usage Limit (Optional)</label><input type="number" value={curPromo.usageLimit || ''} onChange={e => setCurPromo((p: any) => ({ ...p, usageLimit: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Unlimited if blank" className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={curPromo.isActive !== false} onChange={e => setCurPromo((p: any) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
              <button type="submit" className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md mt-3">Save Promotion</button>
            </form>
          </div>
        </div>
      )}

      {/* ════ STOCK MOVEMENT MODAL ════ */}
      {showStockMoveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#0B2C63] text-white px-5 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-sm uppercase">Record Stock Movement</h3>
              <button onClick={() => setShowStockMoveModal(false)} className="hover:text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const r: any = await run(() => recordStockMovementAction(curStockMove));
              if (r.success) { setShowStockMoveModal(false); showToast('ok', `Stock updated. New balance: ${r.newStock}`); setTimeout(() => window.location.reload(), 800); }
              else showToast('err', r.error || 'Failed.');
            }} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product *</label>
                <select required value={curStockMove.productId} onChange={e => setCurStockMove((p: any) => ({ ...p, productId: Number(e.target.value) }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary bg-white">
                  <option value="">— Select Product —</option>
                  {prods.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name} (Stock: {p.stockQuantity})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Movement Type *</label>
                  <select value={curStockMove.type} onChange={e => setCurStockMove((p: any) => ({ ...p, type: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary bg-white">
                    <option value="IN">📥 Stock IN (Received)</option>
                    <option value="OUT">📤 Stock OUT (Sold/Issued)</option>
                    <option value="TRANSFER">🔄 Transfer</option>
                    <option value="ADJUSTMENT">✏️ Adjustment (Set Exact)</option>
                    <option value="DAMAGED">⚠️ Damaged</option>
                    <option value="RETURNED">↩️ Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quantity *</label>
                  <input type="number" required min={0} value={curStockMove.quantity} onChange={e => setCurStockMove((p: any) => ({ ...p, quantity: Number(e.target.value) }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/>
                </div>
              </div>
              <div><label className="block font-bold text-gray-700 mb-1">Reason / Notes</label><textarea rows={2} value={curStockMove.reason || ''} onChange={e => setCurStockMove((p: any) => ({ ...p, reason: e.target.value }))} placeholder="e.g. Received from supplier, sold to customer..." className="w-full p-2.5 border rounded-xl outline-none focus:border-primary resize-none"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Reference (Optional)</label><input value={curStockMove.reference || ''} onChange={e => setCurStockMove((p: any) => ({ ...p, reference: e.target.value }))} placeholder="e.g. Invoice #1234, Order #5678" className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <button type="submit" className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md mt-3">Record Movement</button>
            </form>
          </div>
        </div>
      )}

      {/* ════ CUSTOMER MODAL ════ */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-[#0B2C63] text-white px-5 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-sm uppercase">{curCustomer.id ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setShowCustomerModal(false)} className="hover:text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); const r: any = await run(() => saveCustomerAction(curCustomer)); if (r.success) { setShowCustomerModal(false); showToast('ok', 'Saved.'); window.location.reload(); } else showToast('err', r.error || 'Failed.'); }} className="p-6 space-y-3 text-xs">
              <div><label className="block font-bold text-gray-700 mb-1">Full Name *</label><input required value={curCustomer.name || ''} onChange={e => setCurCustomer((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Phone *</label><input required value={curCustomer.phone || ''} onChange={e => setCurCustomer((p: any) => ({ ...p, phone: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div><label className="block font-bold text-gray-700 mb-1">Email</label><input type="email" value={curCustomer.email || ''} onChange={e => setCurCustomer((p: any) => ({ ...p, email: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold text-gray-700 mb-1">Business Name</label><input value={curCustomer.businessName || ''} onChange={e => setCurCustomer((p: any) => ({ ...p, businessName: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
                <div><label className="block font-bold text-gray-700 mb-1">Location</label><input value={curCustomer.location || ''} onChange={e => setCurCustomer((p: any) => ({ ...p, location: e.target.value }))} className="w-full p-2.5 border rounded-xl outline-none focus:border-primary"/></div>
              </div>
              <button type="submit" className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md mt-3">Save Customer</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
