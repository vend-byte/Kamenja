'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, Copy, Eye, Archive, X, Save, Upload, Download,
  Printer, RefreshCw, Filter, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Image as ImageIcon, Package, Star, Zap, AlertTriangle, FileSpreadsheet,
  QrCode, History, MoreVertical, Box, Tag, DollarSign, Truck, Globe, Layers,
  TrendingUp, ShoppingBag, Sparkles, Loader2
} from 'lucide-react';
import {
  saveProductAction, deleteProductAction, bulkDeleteProductsAction,
  bulkUpdateProductsAction, duplicateProductAction, generateProductCodeAction,
  importProductsAction
} from '@/app/admin/actions';

// ───────── Types ──────────────────────────────────────────────────────────────
interface Category { id: number; name: string; slug: string; isActive: boolean; }
interface Product {
  id: number; code: string; barcode: string | null; sku: string | null;
  name: string; nameLocal: string | null; nameChinese: string | null;
  brand: string | null; model: string | null;
  slug: string; categoryId: number | null; subcategory: string | null;
  supplier: string | null; countryOfOrigin: string | null; warranty: string | null;
  description: string | null; shortDescription: string | null;
  features: string | null; specifications: string | null;
  buyingPriceRmb: number; exchangeRate: number; buyingPrice: number;
  wholesalePrice: number; retailPrice: number; discountPrice: number | null;
  vatPercent: number; taxPercent: number;
  transportCost: number; importCost: number; otherExpenses: number;
  qtyPerCarton: number; middlePack: number | null; piecesPerPack: number | null;
  weight: number; length: number | null; width: number | null; height: number | null;
  unit: string | null;
  stockQuantity: number; openingStock: number; minStockLevel: number;
  maxStockLevel: number; reorderLevel: number; stockStatus: string;
  storageLocation: string | null; shelfNumber: string | null; warehouse: string | null;
  color: string | null; material: string | null; size: string | null;
  packagingType: string | null; serialNumber: string | null; batchNumber: string | null;
  manufacturingDate: any; expirationDate: any; tags: string | null; keywords: string | null;
  deliveryTime: string | null; shippingWeight: number | null; shippingCharges: number;
  freeDelivery: boolean; courierOptions: string | null;
  fragile: boolean; returnable: boolean; cashOnDelivery: boolean;
  showOnHomepage: boolean; showOnFeatured: boolean; showOnNewArrivals: boolean;
  isHidden: boolean; availableOnline: boolean; availableInStore: boolean;
  images: string; featuredImage: string | null;
  isActive: boolean; isFeatured: boolean; isNewArrival: boolean;
  isBestSeller: boolean; isOnOffer: boolean; isHotDeal: boolean;
  isLimitedStock: boolean; isComingSoon: boolean;
  isDraft: boolean; isArchived: boolean;
  offerPercent: number | null; offerStartDate: any; offerEndDate: any;
  createdAt: any; updatedAt: any;
}

interface Props {
  initialProducts: Product[];
  categories: Category[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);

const emptyProduct = (): Partial<Product> => ({
  code: '', barcode: '', sku: '', name: '', nameChinese: '', brand: '', model: '',
  categoryId: 0, subcategory: '', supplier: '', countryOfOrigin: 'China', warranty: '',
  description: '', shortDescription: '', features: '', specifications: '',
  buyingPriceRmb: 0, exchangeRate: 20, buyingPrice: 0, wholesalePrice: 0, retailPrice: 0,
  vatPercent: 16, taxPercent: 0, transportCost: 0, importCost: 0, otherExpenses: 0,
  qtyPerCarton: 1, middlePack: undefined as any, piecesPerPack: undefined as any,
  weight: 0, length: undefined as any, width: undefined as any, height: undefined as any, unit: 'pcs',
  stockQuantity: 100, openingStock: 100, minStockLevel: 5, maxStockLevel: 500, reorderLevel: 10,
  storageLocation: '', shelfNumber: '', warehouse: 'Main Warehouse',
  color: '', material: '', size: '', packagingType: '',
  serialNumber: '', batchNumber: '', tags: '', keywords: '',
  deliveryTime: '1-3 days', shippingCharges: 0,
  freeDelivery: false, fragile: false, returnable: true, cashOnDelivery: true,
  showOnHomepage: false, showOnFeatured: false, showOnNewArrivals: true,
  isHidden: false, availableOnline: true, availableInStore: true,
  isActive: true, isFeatured: false, isNewArrival: true, isBestSeller: false,
  isOnOffer: false, isHotDeal: false, isLimitedStock: false, isComingSoon: false,
  isDraft: false, isArchived: false,
  images: '[]', featuredImage: '',
});

const buildFallbackCode = (categorySlug?: string) => {
  const slug = (categorySlug || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const prefix = (slug.split('-')[0] || 'GEN').substring(0, 3).toUpperCase();
  const suffix = String(Date.now()).slice(-4);
  return `KM-${prefix}-${suffix}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ProductManager({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [current, setCurrent] = useState<Partial<Product>>(emptyProduct());
  const [activeSection, setActiveSection] = useState<'basic' | 'images' | 'pricing' | 'stock' | 'attributes' | 'delivery' | 'visibility'>('basic');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');

  // Status
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err' | 'info'; msg: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAlerts, setShowAlerts] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});

  const showToast = (type: 'ok' | 'err' | 'info', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const focusField = (fieldName: string) => {
    const el = fieldRefs.current[fieldName];
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    let totalActive = 0, totalInactive = 0, totalFeatured = 0, totalLow = 0, totalOut = 0;
    let invValue = 0, invCost = 0, todayAdded = 0;
    const today = new Date().toDateString();
    products.forEach(p => {
      if (p.isActive) totalActive++; else totalInactive++;
      if (p.isFeatured) totalFeatured++;
      if (p.stockStatus === 'Low Stock') totalLow++;
      if (p.stockStatus === 'Out of Stock') totalOut++;
      invValue += p.wholesalePrice * p.stockQuantity;
      invCost += p.buyingPrice * p.stockQuantity;
      if (new Date(p.createdAt).toDateString() === today) todayAdded++;
    });
    return {
      total: products.length, totalActive, totalInactive, totalFeatured,
      totalLow, totalOut, invValue, invCost, expectedProfit: invValue - invCost, todayAdded,
    };
  }, [products]);

  // ─── Alert generation ───
  const alerts = useMemo(() => {
    const list: { type: 'warn' | 'err'; msg: string }[] = [];
    products.forEach(p => {
      if (p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0) list.push({ type: 'warn', msg: `"${p.name}" reached reorder level (${p.stockQuantity} left).` });
      if (p.stockQuantity === 0) list.push({ type: 'err', msg: `"${p.name}" is OUT OF STOCK.` });
      if (p.wholesalePrice > 0 && p.buyingPrice > p.wholesalePrice) list.push({ type: 'err', msg: `"${p.name}" selling price is below buying price!` });
      if (!p.featuredImage && (p.images === '[]' || !p.images)) list.push({ type: 'warn', msg: `"${p.name}" has no images.` });
      if (!p.categoryId) list.push({ type: 'warn', msg: `"${p.name}" has no category.` });
    });
    return list.slice(0, 5); // Limit shown
  }, [products]);

  // ─── Filtered & Sorted ───
  const filtered = useMemo(() => {
    let res = products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));
      const matchCat = catFilter === 'all' || p.categoryId === Number(catFilter);
      const matchStock = stockFilter === 'all' || p.stockStatus === stockFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive) ||
        (statusFilter === 'featured' && p.isFeatured) ||
        (statusFilter === 'archived' && p.isArchived);
      return matchSearch && matchCat && matchStock && matchStatus;
    });
    if (sortBy === 'price-asc') res.sort((a, b) => a.wholesalePrice - b.wholesalePrice);
    else if (sortBy === 'price-desc') res.sort((a, b) => b.wholesalePrice - a.wholesalePrice);
    else if (sortBy === 'stock-asc') res.sort((a, b) => a.stockQuantity - b.stockQuantity);
    else if (sortBy === 'stock-desc') res.sort((a, b) => b.stockQuantity - a.stockQuantity);
    else if (sortBy === 'alpha') res.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'oldest') res.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res;
  }, [products, search, catFilter, stockFilter, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ─── Live Calculations on Form ───
  const calcs = useMemo(() => {
    const bp = Number(current.buyingPrice) || 0;
    const sp = Number(current.wholesalePrice) || 0;
    const dp = Number(current.discountPrice) || 0;
    const transport = Number(current.transportCost) || 0;
    const importC = Number(current.importCost) || 0;
    const other = Number(current.otherExpenses) || 0;
    const totalCost = bp + transport + importC + other;
    const profit = sp - totalCost;
    const margin = sp > 0 ? (profit / sp) * 100 : 0;
    const discount = dp > 0 && sp > 0 ? ((sp - dp) / sp) * 100 : 0;
    const markup = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { totalCost, profit, margin, discount, markup };
  }, [current]);

  // ─── Auto Code Generation ───
  useEffect(() => {
    if (!showModal || current.id || current.code) return;
    if (current.categoryId) {
      const cat = categories.find(c => c.id === Number(current.categoryId));
      if (cat) {
        generateProductCodeAction(cat.slug).then(res => {
          if ((res as any).success) setCurrent(p => ({ ...p, code: (res as any).code }));
        });
      }
    }
  }, [showModal, current.categoryId, current.id, categories]);

  // ─── Auto KES from RMB ───
  useEffect(() => {
    if (current.buyingPriceRmb && current.exchangeRate) {
      const kes = Math.round(Number(current.buyingPriceRmb) * Number(current.exchangeRate));
      if (kes !== current.buyingPrice) {
        setCurrent(p => ({ ...p, buyingPrice: kes }));
      }
    }
  }, [current.buyingPriceRmb, current.exchangeRate]);

  // ─── Handlers ───
  const handleOpenAdd = () => {
    setCurrent({ ...emptyProduct(), categoryId: categories[0]?.id ?? 0 });
    setActiveSection('basic');
    setValidationErrors({});
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setCurrent({ ...p });
    setActiveSection('basic');
    setValidationErrors({});
    setImagePreview(null);
    setShowModal(true);
  };

  const handleUploadFiles = async (files: File[], isGallery: boolean) => {
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('err', `${file.name} exceeds 5MB limit.`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        showToast('err', `${file.name} format not supported (use JPG/PNG/WEBP).`);
        return;
      }
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) uploadedUrls.push(data.imageUrl || data.url);
      }

      if (isGallery) {
        let arr: string[] = [];
        try { arr = JSON.parse(current.images || '[]'); } catch {}
        const newImages = [...arr, ...uploadedUrls];
        setCurrent(p => ({ ...p, images: JSON.stringify(newImages) }));
      } else {
        setCurrent(p => ({ ...p, featuredImage: uploadedUrls[0] || '' }));
      }
      showToast('ok', `${uploadedUrls.length} image(s) uploaded.`);
    } catch (err: any) {
      showToast('err', 'Upload failed.');
    } finally {
      setImagePreview(null);
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!isGallery && files[0]) {
      setImagePreview(URL.createObjectURL(files[0]));
    }
    await handleUploadFiles(files, isGallery);
    if (e.target) e.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, isGallery: boolean) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    await handleUploadFiles(files, isGallery);
  };

  const removeGalleryImage = (url: string) => {
    let arr: string[] = [];
    try { arr = JSON.parse(current.images || '[]'); } catch {}
    arr = arr.filter(i => i !== url);
    setCurrent(p => ({ ...p, images: JSON.stringify(arr) }));
  };

  const handleSave = async (asDraft = false, saveAndAdd = false) => {
    setValidationErrors({});

    const trimmedName = current.name?.toString().trim() ?? '';
    const trimmedCode = current.code?.toString().trim() ?? '';
    const buyingPrice = Number(current.buyingPrice) || 0;
    const wholesalePrice = Number(current.wholesalePrice) || 0;
    const selectedCategoryId = Number(current.categoryId);
    const fallbackCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
    const resolvedCategoryId = selectedCategoryId > 0 ? selectedCategoryId : (fallbackCategory?.id ?? 0);

    let resolvedCode = trimmedCode;
    if (!resolvedCode && resolvedCategoryId > 0) {
      const selectedCategory = categories.find(c => c.id === resolvedCategoryId);
      try {
        const res = await generateProductCodeAction(selectedCategory?.slug);
        if ((res as any).success && (res as any).code) {
          resolvedCode = (res as any).code;
        }
      } catch {}
    }

    if (!resolvedCode) {
      resolvedCode = buildFallbackCode(fallbackCategory?.slug);
    }

    if (!current.categoryId && resolvedCategoryId > 0) {
      setCurrent(p => ({ ...p, categoryId: resolvedCategoryId }));
    }

    const hasImage = Boolean(current.featuredImage || current.images?.toString().trim());
    const errs: Record<string, string> = {};
    if (!trimmedName) errs.name = 'Product name is required';
    if (!resolvedCode) errs.code = 'Product code is required';
    if (!resolvedCategoryId || resolvedCategoryId <= 0) errs.category = 'Category is required';
    if (buyingPrice < 0) errs.buyingPrice = 'Buying price cannot be negative';
    if (wholesalePrice < 0) errs.wholesalePrice = 'Selling price cannot be negative';
    if (!buyingPrice) errs.buyingPrice = 'Buying price is required';
    if (!wholesalePrice) errs.wholesalePrice = 'Selling price is required';
    if (!hasImage) errs.images = 'Product image is required';

    if (!asDraft && wholesalePrice && buyingPrice && wholesalePrice < buyingPrice) {
      if (!confirm('Selling price is LOWER than buying price. This will create a loss! Continue saving?')) return;
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      const fieldOrder = ['name', 'code', 'category', 'buyingPrice', 'wholesalePrice', 'images'];
      const firstInvalid = fieldOrder.find(field => errs[field]);
      if (firstInvalid) focusField(firstInvalid);
      showToast('err', `Please complete: ${Object.values(errs).join(', ')}`);
      setActiveSection('basic');
      return;
    }

    setLoading(true);
    try {
      let resolvedImages: string[] = [];
      try {
        const parsed = JSON.parse(current.images || '[]');
        if (Array.isArray(parsed)) {
          resolvedImages = parsed.filter(Boolean);
        }
      } catch {}
      if (current.featuredImage) {
        resolvedImages = resolvedImages.filter((item) => item !== current.featuredImage);
        resolvedImages.unshift(current.featuredImage);
      }

      const payload = {
        ...current,
        name: trimmedName,
        code: resolvedCode,
        categoryId: resolvedCategoryId > 0 ? resolvedCategoryId : null,
        featuredImage: current.featuredImage || null,
        images: JSON.stringify(resolvedImages.length ? resolvedImages : (current.featuredImage ? [current.featuredImage] : [])),
        isDraft: asDraft,
      };
      const res = await saveProductAction(payload);
      if ((res as any).success) {
        showToast('ok', asDraft ? 'Draft saved!' : (current.id ? 'Product updated!' : 'Product added!'));
        if (saveAndAdd) {
          setCurrent({ ...emptyProduct(), categoryId: categories[0]?.id ?? 0 });
          setActiveSection('basic');
        } else {
          setShowModal(false);
        }
        // Reload list
        setTimeout(() => window.location.reload(), 600);
      } else {
        showToast('err', (res as any).error || 'Save failed.');
      }
    } catch (err: any) {
      showToast('err', err.message || 'Error saving.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this product?')) return;
    setLoading(true);
    const res = await deleteProductAction(id);
    setLoading(false);
    if ((res as any).success) {
      setProducts(p => p.filter(x => x.id !== id));
      showToast('ok', 'Product deleted.');
    } else {
      showToast('err', (res as any).error || 'Delete failed.');
    }
  };

  const handleDuplicate = async (id: number) => {
    setLoading(true);
    const res = await duplicateProductAction(id);
    setLoading(false);
    if ((res as any).success) {
      showToast('ok', 'Product duplicated.');
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast('err', (res as any).error || 'Duplicate failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected product(s)?`)) return;
    setLoading(true);
    const res = await bulkDeleteProductsAction(Array.from(selected));
    setLoading(false);
    if ((res as any).success) {
      setProducts(p => p.filter(x => !selected.has(x.id)));
      setSelected(new Set());
      showToast('ok', `Deleted ${(res as any).count} product(s).`);
    } else {
      showToast('err', (res as any).error || 'Bulk delete failed.');
    }
  };

  const handleBulkUpdate = async (updates: any) => {
    if (selected.size === 0) return;
    setLoading(true);
    const res = await bulkUpdateProductsAction(Array.from(selected), updates);
    setLoading(false);
    if ((res as any).success) {
      showToast('ok', `Updated ${(res as any).count} product(s).`);
      setSelected(new Set());
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(p => p.id)));
  };

  const handleExportCSV = (data: Product[]) => {
    if (!data.length) return showToast('err', 'No products to export.');
    const headers = ['Code', 'Barcode', 'Name', 'Brand', 'Category', 'Supplier', 'Buying Price', 'Selling Price', 'Stock', 'Status'];
    const rows = data.map(p => [
      p.code, p.barcode || '', p.name, p.brand || '',
      categories.find(c => c.id === p.categoryId)?.name || '',
      p.supplier || '', p.buyingPrice, p.wholesalePrice, p.stockQuantity, p.stockStatus
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `products-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('ok', 'CSV downloaded.');
  };

  const handleImport = async () => {
    if (!importContent.trim()) return showToast('err', 'Paste CSV/JSON data.');
    setLoading(true);
    const res = await importProductsAction(importContent, importFormat);
    setLoading(false);
    if ((res as any).success) {
      showToast('ok', `Imported ${(res as any).count} products.`);
      setImportContent('');
      setShowImport(false);
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast('err', (res as any).error || 'Import failed.');
    }
  };

  const parseImg = (s: string): string => {
    try { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a[0]; } catch {}
    return s || 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=200';
  };

  const galleryImages = useMemo(() => {
    try { const a = JSON.parse(current.images || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
  }, [current.images]);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-2xl text-xs font-bold border-2 ${
          toast.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'err' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
            toast.type === 'err' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
            <AlertCircle className="w-5 h-5 text-blue-600" />}
          {toast.msg}
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm font-bold text-gray-800">Processing...</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-secondary" /> Product Management
            </h1>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xl">
              Manage all wholesale products, stock levels, pricing, suppliers, and product images from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleOpenAdd}
              className="bg-primary hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={() => setShowImport(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button onClick={() => handleExportCSV(filtered)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => window.print()}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => window.location.reload()}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* INVENTORY SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {[
          { l: 'Total', v: stats.total, c: 'blue', i: <Package className="w-4 h-4" /> },
          { l: 'Active', v: stats.totalActive, c: 'green', i: <CheckCircle2 className="w-4 h-4" /> },
          { l: 'Inactive', v: stats.totalInactive, c: 'gray', i: <X className="w-4 h-4" /> },
          { l: 'Featured', v: stats.totalFeatured, c: 'yellow', i: <Star className="w-4 h-4" /> },
          { l: 'Low Stock', v: stats.totalLow, c: 'orange', i: <AlertTriangle className="w-4 h-4" /> },
          { l: 'Out of Stock', v: stats.totalOut, c: 'red', i: <AlertCircle className="w-4 h-4" /> },
          { l: 'Inventory Value', v: fmt(stats.invValue), c: 'indigo', i: <DollarSign className="w-4 h-4" />, big: true },
          { l: 'Expected Profit', v: fmt(stats.expectedProfit), c: 'emerald', i: <TrendingUp className="w-4 h-4" />, big: true },
          { l: 'Today Added', v: stats.todayAdded, c: 'purple', i: <Sparkles className="w-4 h-4" /> },
        ].map((card, i) => (
          <div key={i} className={`bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider leading-tight">{card.l}</span>
              <div className={`bg-${card.c}-50 p-1 rounded-md text-${card.c}-600`}>{card.i}</div>
            </div>
            <p className={`${card.big ? 'text-sm' : 'text-xl'} font-black text-gray-900 leading-tight`}>{card.v}</p>
          </div>
        ))}
      </div>

      {/* STOCK ALERTS */}
      {alerts.length > 0 && showAlerts && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-black text-yellow-800 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Stock Alerts ({alerts.length})
            </h3>
            <button onClick={() => setShowAlerts(false)} className="text-yellow-600 hover:text-yellow-800"><X className="w-4 h-4" /></button>
          </div>
          <ul className="space-y-1.5">
            {alerts.map((a, i) => (
              <li key={i} className={`text-xs font-semibold ${a.type === 'err' ? 'text-red-700' : 'text-yellow-700'} flex items-center gap-2`}>
                <span className={`w-1.5 h-1.5 rounded-full ${a.type === 'err' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                {a.msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, barcode, brand, supplier..."
              className="w-full pl-10 pr-3 py-2.5 text-xs border-2 border-gray-200 rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="text-xs border-2 border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary bg-white font-semibold cursor-pointer">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}
            className="text-xs border-2 border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary bg-white font-semibold cursor-pointer">
            <option value="all">All Stock</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs border-2 border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary bg-white font-semibold cursor-pointer">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
            <option value="archived">Archived</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-xs border-2 border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary bg-white font-semibold cursor-pointer">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alpha">A → Z</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="stock-asc">Stock ↑</option>
            <option value="stock-desc">Stock ↓</option>
          </select>
        </div>

        {/* BULK ACTIONS */}
        {selected.size > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-primary">{selected.size} selected</span>
            <button onClick={handleBulkDelete} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 text-[11px] font-bold rounded-md flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => handleBulkUpdate({ isActive: true })} className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 text-[11px] font-bold rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Activate
            </button>
            <button onClick={() => handleBulkUpdate({ isActive: false })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 text-[11px] font-bold rounded-md flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Deactivate
            </button>
            <button onClick={() => handleBulkUpdate({ isFeatured: true })} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 text-[11px] font-bold rounded-md flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Mark Featured
            </button>
            <button onClick={() => handleExportCSV(filtered.filter(p => selected.has(p.id)))} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 text-[11px] font-bold rounded-md flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-500 text-[11px] font-bold hover:underline">Clear</button>
          </div>
        )}
      </div>

      {/* PRODUCT TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3.5 text-left w-10">
                  <input type="checkbox" checked={selected.size > 0 && selected.size === paginated.length} onChange={toggleSelectAll} className="cursor-pointer" />
                </th>
                <th className="px-3 py-3.5 text-left">Image</th>
                <th className="px-3 py-3.5 text-left">Code / Barcode</th>
                <th className="px-3 py-3.5 text-left">Product Name</th>
                <th className="px-3 py-3.5 text-left">Category</th>
                <th className="px-3 py-3.5 text-left">Supplier</th>
                <th className="px-3 py-3.5 text-right">Pricing</th>
                <th className="px-3 py-3.5 text-right">Margin</th>
                <th className="px-3 py-3.5 text-center">Stock</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-3 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const profit = p.wholesalePrice - p.buyingPrice;
                const margin = p.wholesalePrice > 0 ? (profit / p.wholesalePrice) * 100 : 0;
                const isSelected = selected.has(p.id);
                return (
                  <tr key={p.id} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-blue-50/60' : ''} ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} className="cursor-pointer" />
                    </td>
                    <td className="px-3 py-3">
                      <img src={p.featuredImage || parseImg(p.images)} alt="" loading="lazy"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={(e) => { e.currentTarget.src = '/uploads/placeholder.svg'; }} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono font-bold text-secondary text-[11px]">{p.code}</p>
                      {p.barcode && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.barcode}</p>}
                    </td>
                    <td className="px-3 py-3 max-w-[240px]">
                      <p className="font-bold text-gray-800 line-clamp-1">{p.name}</p>
                      {p.brand && <p className="text-[10px] text-gray-500 mt-0.5">{p.brand} {p.model ? `· ${p.model}` : ''}</p>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 font-medium">{cat?.name || '—'}</td>
                    <td className="px-3 py-3 text-gray-600 text-[11px]">{p.supplier || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="text-[10px] text-gray-500">Buy: {fmt(p.buyingPrice)}</div>
                      <div className="font-bold text-primary">Sell: {fmt(p.wholesalePrice)}</div>
                      {p.discountPrice && p.discountPrice > 0 && (
                        <div className="text-[10px] text-red-500 font-bold">Sale: {fmt(p.discountPrice)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className={`font-black ${margin >= 20 ? 'text-green-600' : margin >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-gray-500">{fmt(profit)}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-black text-gray-800 block">{p.stockQuantity}</span>
                      <span className="text-[9px] text-gray-400">{p.qtyPerCarton}/ctn</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        p.stockStatus === 'In Stock' ? 'bg-green-100 text-green-700' :
                        p.stockStatus === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.stockStatus}
                      </span>
                      <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                        {p.isFeatured && <span title="Featured" className="bg-yellow-100 text-yellow-700 px-1 rounded font-bold text-[9px]">⭐</span>}
                        {p.isOnOffer && <span title="On Offer" className="bg-red-100 text-red-700 px-1 rounded font-bold text-[9px]">SALE</span>}
                        {p.isNewArrival && <span title="New" className="bg-blue-100 text-blue-700 px-1 rounded font-bold text-[9px]">NEW</span>}
                        {p.isBestSeller && <span title="Best Seller" className="bg-orange-100 text-orange-700 px-1 rounded font-bold text-[9px]">🔥</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleOpenEdit(p)} title="Edit" className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDuplicate(p.id)} title="Duplicate" className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-md transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} title="Delete" className="text-red-500 hover:bg-red-100 p-1.5 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-sm">No products found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or add a new product</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 flex justify-between items-center text-xs">
            <span className="text-gray-600 font-semibold">
              Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 font-bold">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pNum = i + 1;
                return (
                  <button key={pNum} onClick={() => setPage(pNum)}
                    className={`px-3 py-1.5 rounded-md font-bold ${page === pNum ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                    {pNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 font-bold">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ ADD/EDIT PRODUCT MODAL ═══════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B2C63] to-[#1a4fa8] text-white px-6 py-4 flex justify-between items-center rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="font-black text-base uppercase tracking-tight">
                  {current.id ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-[10px] text-blue-200 font-medium">Fill in product details across all sections</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:text-secondary p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex-shrink-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">
                <Box className="w-3.5 h-3.5" /> Basic Product Details
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 overflow-y-auto bg-gray-50/50">
              <div className="p-6 space-y-5 text-xs">

                {/* ═══ BASIC INFO ═══ */}
                {activeSection === 'basic' && (
                  <div className="space-y-5 bg-white p-5 rounded-xl border border-gray-200">
                    <div className="bg-blue-50/50 border-2 border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-6">
                      <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative flex-shrink-0 overflow-hidden shadow-sm">
                        {(imagePreview || current.featuredImage) ? (
                          <>
                            <img
                              src={imagePreview || current.featuredImage || '/uploads/placeholder.svg'}
                              alt="Product preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/uploads/placeholder.svg';
                              }}
                            />
                            <button type="button" onClick={() => { setCurrent(p => ({ ...p, featuredImage: '' })); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-110">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, false)} />
                            <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                            <span className="text-[10px] font-bold text-primary uppercase">Choose Image</span>
                          </label>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-black text-gray-800 text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-secondary" /> Product Image
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                          Upload a clear product image. This will be shown on the homepage, products page, details page and admin list.
                        </p>
                        {validationErrors.images && <p className="text-[10px] text-red-500 mt-2">{validationErrors.images}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Product Code *</label>
                        <input ref={(el) => { fieldRefs.current.code = el; }} value={current.code || ''} onChange={e => setCurrent(p => ({ ...p, code: e.target.value }))}
                          className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white ${validationErrors.code ? 'border-red-300' : 'border-gray-200'}`} />
                        {validationErrors.code && <p className="text-[10px] text-red-500 mt-1">{validationErrors.code}</p>}
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Product Name *</label>
                        <input ref={(el) => { fieldRefs.current.name = el; }} value={current.name || ''} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))}
                          className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white font-bold ${validationErrors.name ? 'border-red-300' : 'border-gray-200'}`} />
                        {validationErrors.name && <p className="text-[10px] text-red-500 mt-1">{validationErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Category *</label>
                        <select ref={(el) => { fieldRefs.current.category = el; }} value={current.categoryId || ''} onChange={e => setCurrent(p => ({ ...p, categoryId: Number(e.target.value) }))}
                          className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white ${validationErrors.category ? 'border-red-300' : 'border-gray-200'}`}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {validationErrors.category && <p className="text-[10px] text-red-500 mt-1">{validationErrors.category}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Buying Price *</label>
                          <input ref={(el) => { fieldRefs.current.buyingPrice = el; }} type="number" step="0.01" value={current.buyingPrice || ''} onChange={e => setCurrent(p => ({ ...p, buyingPrice: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white ${validationErrors.buyingPrice ? 'border-red-300' : 'border-gray-200'}`} />
                          {validationErrors.buyingPrice && <p className="text-[10px] text-red-500 mt-1">{validationErrors.buyingPrice}</p>}
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Selling Price *</label>
                          <input ref={(el) => { fieldRefs.current.wholesalePrice = el; }} type="number" step="0.01" value={current.wholesalePrice || ''} onChange={e => setCurrent(p => ({ ...p, wholesalePrice: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white font-bold text-primary ${validationErrors.wholesalePrice ? 'border-red-300' : 'border-primary'}`} />
                          {validationErrors.wholesalePrice && <p className="text-[10px] text-red-500 mt-1">{validationErrors.wholesalePrice}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Description</label>
                        <textarea ref={(el) => { fieldRefs.current.description = el; }} rows={4} value={current.description || ''} onChange={e => setCurrent(p => ({ ...p, description: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white resize-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ IMAGES ═══ */}
                {activeSection === 'images' && (
                  <div className="space-y-5">
                    {/* Featured */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" /> Main Product Image (Featured)
                      </h4>
                      {current.featuredImage ? (
                        <div className="relative inline-block">
                          <img src={current.featuredImage} alt="" className="w-48 h-48 object-cover rounded-lg border-2 border-primary" />
                          <button type="button" onClick={() => setCurrent(p => ({ ...p, featuredImage: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="block border-2 border-dashed border-gray-300 hover:border-primary rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:bg-blue-50/50 transition-colors">
                          <input type="file" className="hidden" accept="image/*"
                            onChange={e => handleUpload(e, false)} />
                          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="font-bold text-primary text-sm">Click to upload main image</p>
                          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP · Max 5MB</p>
                        </label>
                      )}
                    </div>

                    {/* Gallery */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5" /> Gallery Images ({galleryImages.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {galleryImages.map((img, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                            <button type="button" onClick={() => removeGalleryImage(img)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-gray-300 hover:border-primary rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/50 transition-colors">
                          <input type="file" className="hidden" accept="image/*" multiple
                            onChange={e => handleUpload(e, true)} />
                          <Plus className="w-6 h-6 text-gray-400" />
                          <p className="text-[10px] text-gray-500 font-bold mt-1">Add Images</p>
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3">Tip: Upload multiple images at once. Files saved permanently in /uploads/</p>
                    </div>
                  </div>
                )}

                {/* ═══ PRICING ═══ */}
                {activeSection === 'pricing' && (
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Cost Calculation (Imports from China)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Buying Price (RMB ¥)</label>
                          <input type="number" step="0.01" value={current.buyingPriceRmb || ''}
                            onChange={e => setCurrent(p => ({ ...p, buyingPriceRmb: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Exchange Rate (KES per RMB)</label>
                          <input type="number" step="0.01" value={current.exchangeRate || ''}
                            onChange={e => setCurrent(p => ({ ...p, exchangeRate: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Buying Price (KES) *</label>
                          <input ref={(el) => { fieldRefs.current.buyingPrice = el; }} type="number" required value={current.buyingPrice || ''}
                            onChange={e => setCurrent(p => ({ ...p, buyingPrice: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-blue-50 font-bold text-primary ${validationErrors.buyingPrice ? 'border-red-300' : 'border-gray-200'}`} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Transport Cost</label>
                          <input type="number" value={current.transportCost || ''}
                            onChange={e => setCurrent(p => ({ ...p, transportCost: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Import Cost</label>
                          <input type="number" value={current.importCost || ''}
                            onChange={e => setCurrent(p => ({ ...p, importCost: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Other Expenses</label>
                          <input type="number" value={current.otherExpenses || ''}
                            onChange={e => setCurrent(p => ({ ...p, otherExpenses: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Selling Prices</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Wholesale / Selling *</label>
                          <input ref={(el) => { fieldRefs.current.wholesalePrice = el; }} type="number" required value={current.wholesalePrice || ''}
                            onChange={e => setCurrent(p => ({ ...p, wholesalePrice: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white font-black text-primary ${validationErrors.wholesalePrice ? 'border-red-300' : 'border-primary'}`} />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Retail Price</label>
                          <input type="number" value={current.retailPrice || ''}
                            onChange={e => setCurrent(p => ({ ...p, retailPrice: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Discount Price</label>
                          <input type="number" value={current.discountPrice || ''}
                            onChange={e => setCurrent(p => ({ ...p, discountPrice: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-red-300 bg-white text-red-600 font-bold" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">VAT %</label>
                          <input type="number" value={current.vatPercent || 16}
                            onChange={e => setCurrent(p => ({ ...p, vatPercent: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                      </div>
                    </div>

                    {/* LIVE CALCULATIONS */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl p-5">
                      <h4 className="font-black text-green-700 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Live Profit Calculations
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Total Cost</p>
                          <p className="text-base font-black text-orange-600">{fmt(calcs.totalCost)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Profit / Item</p>
                          <p className={`text-base font-black ${calcs.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(calcs.profit)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Profit Margin</p>
                          <p className={`text-base font-black ${calcs.margin >= 20 ? 'text-green-700' : 'text-orange-500'}`}>{calcs.margin.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Markup %</p>
                          <p className="text-base font-black text-blue-600">{calcs.markup.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Discount %</p>
                          <p className="text-base font-black text-red-500">{calcs.discount.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STOCK ═══ */}
                {activeSection === 'stock' && (
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Stock Quantities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Current Stock *</label>
                          <input type="number" required value={current.stockQuantity || 0}
                            onChange={e => setCurrent(p => ({ ...p, stockQuantity: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white font-bold text-primary" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Opening Stock</label>
                          <input type="number" value={current.openingStock || 0}
                            onChange={e => setCurrent(p => ({ ...p, openingStock: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Min Stock</label>
                          <input type="number" value={current.minStockLevel || 5}
                            onChange={e => setCurrent(p => ({ ...p, minStockLevel: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Max Stock</label>
                          <input type="number" value={current.maxStockLevel || 500}
                            onChange={e => setCurrent(p => ({ ...p, maxStockLevel: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Reorder Level</label>
                          <input type="number" value={current.reorderLevel || 10}
                            onChange={e => setCurrent(p => ({ ...p, reorderLevel: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Packaging</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Qty / Carton</label>
                          <input ref={(el) => { fieldRefs.current.qtyPerCarton = el; }} type="number" value={current.qtyPerCarton || 1}
                            onChange={e => setCurrent(p => ({ ...p, qtyPerCarton: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white ${validationErrors.qtyPerCarton ? 'border-red-300' : 'border-gray-200'}`} />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Middle Pack</label>
                          <input type="number" value={current.middlePack || ''}
                            onChange={e => setCurrent(p => ({ ...p, middlePack: e.target.value ? Number(e.target.value) : undefined as any }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Pieces / Pack</label>
                          <input type="number" value={current.piecesPerPack || ''}
                            onChange={e => setCurrent(p => ({ ...p, piecesPerPack: e.target.value ? Number(e.target.value) : undefined as any }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Unit</label>
                          <select value={current.unit || 'pcs'} onChange={e => setCurrent(p => ({ ...p, unit: e.target.value }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white">
                            <option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="ltr">Liters</option>
                            <option value="m">Meters</option><option value="boxes">Boxes</option><option value="dozens">Dozens</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Dimensions & Weight</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Weight (kg)</label>
                          <input ref={(el) => { fieldRefs.current.weight = el; }} type="number" step="0.01" value={current.weight || ''}
                            onChange={e => setCurrent(p => ({ ...p, weight: Number(e.target.value) }))}
                            className={`w-full p-2.5 border-2 rounded-lg outline-none focus:border-primary bg-white ${validationErrors.weight ? 'border-red-300' : 'border-gray-200'}`} />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Length (cm)</label>
                          <input type="number" step="0.1" value={current.length || ''}
                            onChange={e => setCurrent(p => ({ ...p, length: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Width (cm)</label>
                          <input type="number" step="0.1" value={current.width || ''}
                            onChange={e => setCurrent(p => ({ ...p, width: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Height (cm)</label>
                          <input type="number" step="0.1" value={current.height || ''}
                            onChange={e => setCurrent(p => ({ ...p, height: Number(e.target.value) }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                      <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Storage Location</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Warehouse</label>
                          <input value={current.warehouse || 'Main Warehouse'} onChange={e => setCurrent(p => ({ ...p, warehouse: e.target.value }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Storage Location</label>
                          <input value={current.storageLocation || ''} onChange={e => setCurrent(p => ({ ...p, storageLocation: e.target.value }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Shelf Number</label>
                          <input value={current.shelfNumber || ''} onChange={e => setCurrent(p => ({ ...p, shelfNumber: e.target.value }))}
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ ATTRIBUTES ═══ */}
                {activeSection === 'attributes' && (
                  <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Product Attributes</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Color</label>
                        <input value={current.color || ''} onChange={e => setCurrent(p => ({ ...p, color: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Material</label>
                        <input value={current.material || ''} onChange={e => setCurrent(p => ({ ...p, material: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Size</label>
                        <input value={current.size || ''} onChange={e => setCurrent(p => ({ ...p, size: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Packaging Type</label>
                        <input value={current.packagingType || ''} onChange={e => setCurrent(p => ({ ...p, packagingType: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Serial Number</label>
                        <input value={current.serialNumber || ''} onChange={e => setCurrent(p => ({ ...p, serialNumber: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Batch Number</label>
                        <input value={current.batchNumber || ''} onChange={e => setCurrent(p => ({ ...p, batchNumber: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Manufacturing Date</label>
                        <input type="date" value={current.manufacturingDate ? String(current.manufacturingDate).slice(0,10) : ''}
                          onChange={e => setCurrent(p => ({ ...p, manufacturingDate: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Expiration Date</label>
                        <input type="date" value={current.expirationDate ? String(current.expirationDate).slice(0,10) : ''}
                          onChange={e => setCurrent(p => ({ ...p, expirationDate: e.target.value }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Tags (comma separated)</label>
                        <input value={current.tags || ''} onChange={e => setCurrent(p => ({ ...p, tags: e.target.value }))}
                          placeholder="hardware, tools, professional"
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">SEO Keywords</label>
                        <input value={current.keywords || ''} onChange={e => setCurrent(p => ({ ...p, keywords: e.target.value }))}
                          placeholder="best lock, padlock kenya, security"
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ DELIVERY ═══ */}
                {activeSection === 'delivery' && (
                  <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Delivery & Shipping Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Delivery Time</label>
                        <input value={current.deliveryTime || ''} onChange={e => setCurrent(p => ({ ...p, deliveryTime: e.target.value }))}
                          placeholder="e.g. 1-3 days"
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Shipping Weight (kg)</label>
                        <input type="number" step="0.01" value={current.shippingWeight || ''}
                          onChange={e => setCurrent(p => ({ ...p, shippingWeight: Number(e.target.value) }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Shipping Charges (KES)</label>
                        <input type="number" value={current.shippingCharges || ''}
                          onChange={e => setCurrent(p => ({ ...p, shippingCharges: Number(e.target.value) }))}
                          className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block font-bold text-gray-700 mb-1">Courier Options (comma separated)</label>
                      <input value={current.courierOptions || ''} onChange={e => setCurrent(p => ({ ...p, courierOptions: e.target.value }))}
                        placeholder="G4S, Wells Fargo, Easy Coach"
                        className="w-full p-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-primary bg-white" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        { k: 'freeDelivery', l: '🚚 Free Delivery' },
                        { k: 'fragile', l: '⚠️ Fragile Item' },
                        { k: 'returnable', l: '🔄 Returnable' },
                        { k: 'cashOnDelivery', l: '💵 Cash On Delivery' },
                      ].map(b => (
                        <label key={b.k} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                          (current as any)[b.k] ? 'bg-primary/10 border-primary' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="checkbox" checked={!!(current as any)[b.k]}
                            onChange={e => setCurrent(p => ({ ...p, [b.k]: e.target.checked }))} />
                          <span className="text-[11px] font-bold">{b.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ VISIBILITY ═══ */}
                {activeSection === 'visibility' && (
                  <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <h4 className="font-black text-secondary uppercase tracking-wider text-[11px] mb-4">Product Visibility</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { k: 'showOnHomepage', l: '🏠 Display on Homepage' },
                        { k: 'showOnFeatured', l: '⭐ Display in Featured Products' },
                        { k: 'showOnNewArrivals', l: '🆕 Display in New Arrivals' },
                        { k: 'availableOnline', l: '🌐 Available Online' },
                        { k: 'availableInStore', l: '🏪 Available In Store' },
                        { k: 'isHidden', l: '👁️ Hide Product' },
                      ].map(b => (
                        <label key={b.k} className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                          (current as any)[b.k] ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}>
                          <input type="checkbox" checked={!!(current as any)[b.k]}
                            onChange={e => setCurrent(p => ({ ...p, [b.k]: e.target.checked }))} />
                          <span className="text-xs font-bold">{b.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </form>

            {/* Footer - Save Actions */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-2 flex-shrink-0">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs">
                Cancel
              </button>
              <button type="button" onClick={() => setCurrent({ ...emptyProduct(), categoryId: categories[0]?.id ?? 0 })}
                className="px-4 py-2.5 rounded-lg font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 text-xs flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
              <button type="button" onClick={() => handleSave(true)}
                className="px-4 py-2.5 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 text-xs flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" /> Save as Draft
              </button>
              <button type="button" onClick={() => handleSave(false, true)}
                className="px-4 py-2.5 rounded-lg font-bold text-primary bg-blue-100 hover:bg-blue-200 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Save & Add Another
              </button>
              <button type="button" onClick={() => handleSave(false)}
                className="bg-gradient-to-r from-secondary to-orange-500 hover:from-orange-500 hover:to-secondary text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md">
                <Save className="w-3.5 h-3.5" /> {current.id ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ IMPORT MODAL ═══════════════ */}
      {showImport && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black uppercase text-sm">Bulk Import Products</h3>
              <button onClick={() => setShowImport(false)} className="hover:text-yellow-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3 text-xs font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={importFormat === 'csv'} onChange={() => setImportFormat('csv')} /> CSV</label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={importFormat === 'json'} onChange={() => setImportFormat('json')} /> JSON</label>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs">
                <p className="font-bold text-primary mb-1">CSV Format (paste below):</p>
                <code className="block text-[10px] bg-white p-2 rounded font-mono">
                  code,barcode,name,category,brand,supplier,description,buying_price,price,carton_qty,stock_quantity,image
                </code>
              </div>
              <textarea rows={10} value={importContent} onChange={e => setImportContent(e.target.value)}
                placeholder="Paste CSV or JSON data here..."
                className="w-full p-3 font-mono text-[11px] border-2 border-gray-200 rounded-lg outline-none focus:border-primary resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowImport(false)} className="px-4 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs">Cancel</button>
                <button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Process Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
