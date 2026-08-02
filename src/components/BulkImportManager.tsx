'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, FileArchive, CheckCircle2, AlertTriangle, XCircle,
  Loader2, ArrowRight, ArrowLeft, Image as ImageIcon, DollarSign, Percent,
  Tag, Building2, Calculator, Download, RefreshCcw, History, Trash2, Eye,
  ChevronDown, ChevronUp, PackageCheck, PackageX, Copy,
} from 'lucide-react';
import {
  updateColumnMappingAction, applyPricingRuleAction, overrideItemPriceAction,
  getImportPreviewAction, runImportChunkAction, getImportReportAction,
  listImportBatchesAction, deleteImportBatchAction,
} from '@/app/admin/importActions';
import { FIELD_LABELS, CANONICAL_FIELDS, REQUIRED_FIELDS, CanonicalField } from '@/lib/importFields';
import { PricingMode, PricingRule } from '@/lib/pricingEngine';

type Step = 'upload' | 'mapping' | 'pricing' | 'preview' | 'importing' | 'report';

interface AnalysisResult {
  batchId: number;
  columns: string[];
  mapping: Partial<Record<CanonicalField, string>>;
  highConfidence: boolean;
  totalRows: number; readyRows: number; duplicateRows: number; invalidRows: number;
  imagesFound: number; imagesMissing: number;
  embeddedImagesFound: number; filenameImagesFound: number; urlImagesFound: number;
  categoriesAutoAssigned: number; categoriesLowConfidence: number;
  brandsFound: string[]; categoriesFound: string[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);

const DATA_FIELDS: CanonicalField[] = ['name', 'description', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'model', 'buyingPrice', 'stockQuantity', 'supplier', 'countryOfOrigin', 'warranty', 'weight', 'unit', 'color', 'material', 'size', 'tags', 'qtyPerCarton', 'middlePack'];

export default function BulkImportManager() {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<CanonicalField, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricingMode, setPricingMode] = useState<PricingMode>('margin');
  const [marginPercent, setMarginPercent] = useState(25);
  const [fixedAmount, setFixedAmount] = useState(500);
  const [defaultMarginPercent, setDefaultMarginPercent] = useState(20);
  const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>({});
  const [brandMargins, setBrandMargins] = useState<Record<string, number>>({});
  const [formula, setFormula] = useState('buyingPrice * 1.25');
  const [applyingPricing, setApplyingPricing] = useState(false);

  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<string | undefined>(undefined);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, imported: 0, updated: 0, skipped: 0, failed: 0 });

  const [report, setReport] = useState<any>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Upload ──────────────────────────────────────────────────────────
  // Reads a fetch Response defensively: a non-2xx or non-JSON body (e.g. a
  // platform-level 413 "Request Entity Too Large" plain-text page, or a 502/504
  // from a proxy) must never be handed to res.json(), which would throw a
  // confusing "Unexpected token" parse error instead of a useful message.
  const parseJsonResponse = async (res: Response, context: string) => {
    const text = await res.text();
    let data: any = {};
    if (text) {
      try { data = JSON.parse(text); }
      catch {
        throw new Error(
          res.status === 413
            ? 'The file is too large for the server to accept. Try a smaller catalogue, or fewer/lower-resolution embedded images.'
            : `${context} failed (HTTP ${res.status}). The server returned an unexpected response instead of JSON.`
        );
      }
    }
    if (!res.ok || data.error) throw new Error(data.error || `${context} failed.`);
    return data;
  };

  const handleFile = useCallback(async (file: File) => {
    setUploading(true); setUploadError('');
    try {
      // Send the catalogue file straight to our own server as multipart form data.
      // (Previously this went browser -> Cloudinary -> our server, to route around
      // Vercel's 4.5MB Function body limit — but Cloudinary's `raw` resource type
      // doesn't return CORS headers on this account, so that direct browser upload
      // was blocked by the browser's CORS check before it could ever succeed,
      // regardless of a valid signature. Catalogue files are normally well under
      // 4.5MB, so sending them here directly avoids that limitation entirely.)
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const res = await fetch('/api/admin/import/upload', {
        method: 'POST',
        body: uploadForm,
      });
      const data = await parseJsonResponse(res, 'Analyzing catalogue');

      setAnalysis(data);
      setMapping(data.mapping);
      const initialCatMargins: Record<string, number> = {};
      (data.categoriesFound || []).forEach((c: string) => { initialCatMargins[c] = 25; });
      setCategoryMargins(initialCatMargins);
      const initialBrandMargins: Record<string, number> = {};
      (data.brandsFound || []).forEach((b: string) => { initialBrandMargins[b] = 25; });
      setBrandMargins(initialBrandMargins);
      // Fully-automatic path: when required fields (Product Name, Buying Price) were matched
      // with high confidence, skip the manual mapping screen entirely and go straight to pricing.
      // The admin can still jump back with "Review Column Mapping" on the pricing step.
      setStep(data.highConfidence ? 'pricing' : 'mapping');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and analyze the file.');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Mapping ─────────────────────────────────────────────────────────
  const [confirmingMapping, setConfirmingMapping] = useState(false);
  const confirmMapping = async () => {
    if (!analysis) return;
    setConfirmingMapping(true);
    try {
      const res = await updateColumnMappingAction(analysis.batchId, mapping);
      if ('error' in res && res.error) throw new Error(res.error);
      setAnalysis({ ...analysis, readyRows: res.readyRows!, duplicateRows: res.duplicateRows!, invalidRows: res.invalidRows! });
      setStep('pricing');
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setConfirmingMapping(false);
    }
  };

  const missingRequired = REQUIRED_FIELDS.filter(f => !mapping[f]);

  // ── Pricing ─────────────────────────────────────────────────────────
  const buildRule = (): PricingRule => {
    switch (pricingMode) {
      case 'margin': return { mode: 'margin', marginPercent };
      case 'fixed': return { mode: 'fixed', fixedAmount };
      case 'category': return { mode: 'category', categoryMargins, defaultMarginPercent };
      case 'brand': return { mode: 'brand', brandMargins, defaultMarginPercent };
      case 'formula': return { mode: 'formula', formula };
    }
  };

  const applyPricing = async () => {
    if (!analysis) return;
    setApplyingPricing(true); setUploadError('');
    try {
      const rule = buildRule();
      const res = await applyPricingRuleAction(analysis.batchId, rule);
      if (res.error) throw new Error(res.error);
      await loadPreview(analysis.batchId, 0, undefined);
      setStep('preview');
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setApplyingPricing(false);
    }
  };

  // ── Preview ─────────────────────────────────────────────────────────
  const loadPreview = async (batchId: number, offset: number, filter: string | undefined) => {
    setLoadingPreview(true);
    try {
      const res = await getImportPreviewAction(batchId, offset, 25, filter);
      setPreviewItems(res.items); setPreviewTotal(res.total); setPreviewOffset(offset); setPreviewFilter(filter);
    } finally {
      setLoadingPreview(false);
    }
  };

  const overridePrice = async (itemId: number, price: number) => {
    await overrideItemPriceAction(itemId, price);
    setPreviewItems(items => items.map(i => i.id === itemId ? { ...i, sellingPrice: price, sellingPriceOverridden: true } : i));
  };

  // ── Import ──────────────────────────────────────────────────────────
  const startImport = async () => {
    if (!analysis) return;
    setStep('importing'); setImporting(true);
    setImportProgress({ processed: 0, total: analysis.readyRows + analysis.duplicateRows, imported: 0, updated: 0, skipped: 0, failed: 0 });

    let done = false;
    while (!done) {
      const res: any = await runImportChunkAction(analysis.batchId, duplicateStrategy);
      if (res.error) { setUploadError(res.error); break; }
      done = res.done;
      if (res.batch) {
        setImportProgress({
          processed: res.batch.processedRows, total: res.batch.readyRows + res.batch.duplicateRows,
          imported: res.batch.importedRows, updated: res.batch.updatedRows,
          skipped: res.batch.skippedRows, failed: res.batch.failedRows,
        });
      }
    }
    setImporting(false);
    const rep = await getImportReportAction(analysis.batchId);
    setReport(rep);
    setStep('report');
  };

  // ── History ─────────────────────────────────────────────────────────
  const loadHistory = async () => {
    const rows = await listImportBatchesAction();
    setHistory(rows);
    setShowHistory(true);
  };

  const startOver = () => {
    setStep('upload'); setAnalysis(null); setMapping({}); setPreviewItems([]);
    setReport(null); setUploadError(''); setImportProgress({ processed: 0, total: 0, imported: 0, updated: 0, skipped: 0, failed: 0 });
  };

  const downloadReportCsv = () => {
    if (!report) return;
    const header = ['Row', 'Product Name', 'Status', 'Buying Price', 'Selling Price', 'Warnings', 'Errors'];
    const lines = [header.join(',')];
    for (const r of report.rows) {
      lines.push([r.row, `"${(r.name || '').replace(/"/g, '""')}"`, r.status, r.buyingPrice, r.sellingPrice, `"${(r.warnings || '').replace(/"/g, '""')}"`, `"${(r.errors || '').replace(/"/g, '""')}"`].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `import-report-batch-${report.batch.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' }, { key: 'mapping', label: 'Mapping' }, { key: 'pricing', label: 'Pricing Rules' },
    { key: 'preview', label: 'Preview' }, { key: 'importing', label: 'Import' }, { key: 'report', label: 'Report' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bulk Product Import</h2>
          <p className="text-sm text-gray-500">Upload a supplier catalogue and import hundreds of products in one operation.</p>
        </div>
        <button onClick={loadHistory} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary border border-gray-200 rounded-lg px-3 py-2">
          <History size={16} /> Import History
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${i === stepIdx ? 'bg-primary text-white' : i < stepIdx ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {i < stepIdx ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>} {s.label}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-gray-300 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {uploadError}
        </div>
      )}

      {/* ── STEP: UPLOAD ── */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-colors ${dragOver ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin text-primary mb-3" size={36} />
              <p className="font-semibold text-gray-700">Reading spreadsheet, matching images, uploading to Cloudinary...</p>
              <p className="text-sm text-gray-500 mt-1">This can take a moment for large catalogues with many images.</p>
            </>
          ) : (
            <>
              <div className="flex gap-3 mb-4">
                <FileSpreadsheet className="text-green-600" size={32} />
                <FileArchive className="text-amber-600" size={32} />
              </div>
              <p className="font-bold text-gray-800 mb-1">Drag & drop your supplier catalogue here</p>
              <p className="text-sm text-gray-500 mb-4">Supports .xlsx, .csv, or a .zip package containing a spreadsheet + an images folder</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90"
              >
                <Upload size={16} /> Choose File
              </button>
              <input
                ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.zip" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </>
          )}
        </div>
      )}

      {/* ── STEP: MAPPING ── */}
      {step === 'mapping' && analysis && (
        <div className="space-y-5">
          <SummaryGrid analysis={analysis} />

          <div>
            <h3 className="font-bold text-gray-800 mb-1">Confirm Column Mapping</h3>
            <p className="text-sm text-gray-500 mb-3">We auto-detected these columns from your spreadsheet. Adjust any that look wrong before continuing.</p>
            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl p-3 mb-3">
                <AlertTriangle size={16} /> Please map required fields: {missingRequired.map(f => FIELD_LABELS[f]).join(', ')}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {DATA_FIELDS.map(field => (
                <div key={field} className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-3 py-2">
                  <span className={`text-sm font-semibold ${REQUIRED_FIELDS.includes(field) ? 'text-gray-800' : 'text-gray-600'}`}>
                    {FIELD_LABELS[field]}{REQUIRED_FIELDS.includes(field) && <span className="text-red-500">*</span>}
                  </span>
                  <select
                    value={mapping[field] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || undefined })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 max-w-[55%] bg-white"
                  >
                    <option value="">— Not mapped —</option>
                    {analysis.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><ImageIcon size={12} /> Image1–Image5 / Images columns were auto-matched to files in your ZIP package and don&apos;t need mapping here.</p>
          </div>

          <div className="flex justify-between">
            <button onClick={startOver} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Start Over</button>
            <button
              disabled={missingRequired.length > 0 || confirmingMapping}
              onClick={confirmMapping}
              className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
            >
              {confirmingMapping ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Continue to Pricing Rules
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PRICING ── */}
      {step === 'pricing' && analysis && (
        <div className="space-y-5">
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Pricing Rules</h3>
            <p className="text-sm text-gray-500 mb-3">Choose how selling prices should be calculated from buying prices for this import.</p>
          </div>

          {analysis.highConfidence && (
            <div className="flex items-center justify-between gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Columns auto-detected with high confidence — no manual mapping needed.</span>
              <button onClick={() => setStep('mapping')} className="font-semibold underline shrink-0">Review Column Mapping</button>
            </div>
          )}

          <div className="grid sm:grid-cols-5 gap-2">
            {[
              { m: 'margin', label: 'Margin %', icon: Percent },
              { m: 'fixed', label: 'Fixed Amount', icon: DollarSign },
              { m: 'category', label: 'Category Margins', icon: Tag },
              { m: 'brand', label: 'Brand Margins', icon: Building2 },
              { m: 'formula', label: 'Custom Formula', icon: Calculator },
            ].map(opt => (
              <button
                key={opt.m}
                onClick={() => setPricingMode(opt.m as PricingMode)}
                className={`flex flex-col items-center gap-1.5 border rounded-xl p-3 text-xs font-bold transition-colors ${pricingMode === opt.m ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <opt.icon size={18} /> {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {pricingMode === 'margin' && (
              <div className="max-w-xs">
                <label className="text-sm font-semibold text-gray-700">Profit Margin (%)</label>
                <input type="number" value={marginPercent} onChange={e => setMarginPercent(Number(e.target.value))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500 mt-2">Example: Buying Price {fmt(1000)} → Selling Price {fmt(1000 * (1 + marginPercent / 100))}</p>
              </div>
            )}
            {pricingMode === 'fixed' && (
              <div className="max-w-xs">
                <label className="text-sm font-semibold text-gray-700">Fixed Amount (KSh)</label>
                <input type="number" value={fixedAmount} onChange={e => setFixedAmount(Number(e.target.value))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500 mt-2">Example: Buying Price {fmt(2000)} → Selling Price {fmt(2000 + fixedAmount)}</p>
              </div>
            )}
            {pricingMode === 'category' && (
              <div className="space-y-2">
                <div className="max-w-xs">
                  <label className="text-sm font-semibold text-gray-700">Default Margin (%) — used for categories not listed below</label>
                  <input type="number" value={defaultMarginPercent} onChange={e => setDefaultMarginPercent(Number(e.target.value))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
                </div>
                {analysis.categoriesFound.length === 0 && <p className="text-sm text-gray-500">No categories detected in this file — the default margin above will be used for all products.</p>}
                {analysis.categoriesFound.map(cat => (
                  <div key={cat} className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-gray-700">{cat}</span>
                    <div className="flex items-center gap-1">
                      <input type="number" value={categoryMargins[cat] ?? 25} onChange={e => setCategoryMargins({ ...categoryMargins, [cat]: Number(e.target.value) })} className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pricingMode === 'brand' && (
              <div className="space-y-2">
                <div className="max-w-xs">
                  <label className="text-sm font-semibold text-gray-700">Default Margin (%) — used for brands not listed below</label>
                  <input type="number" value={defaultMarginPercent} onChange={e => setDefaultMarginPercent(Number(e.target.value))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
                </div>
                {analysis.brandsFound.length === 0 && <p className="text-sm text-gray-500">No brands detected in this file — the default margin above will be used for all products.</p>}
                {analysis.brandsFound.map(brand => (
                  <div key={brand} className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-gray-700">{brand}</span>
                    <div className="flex items-center gap-1">
                      <input type="number" value={brandMargins[brand] ?? 25} onChange={e => setBrandMargins({ ...brandMargins, [brand]: Number(e.target.value) })} className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pricingMode === 'formula' && (
              <div className="max-w-md">
                <label className="text-sm font-semibold text-gray-700">Custom Formula</label>
                <input type="text" value={formula} onChange={e => setFormula(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm" placeholder="buyingPrice * 1.25 + 200" />
                <p className="text-xs text-gray-500 mt-2">Use <code className="bg-gray-200 px-1 rounded">buyingPrice</code> with + − × / and parentheses. Example: <code className="bg-gray-200 px-1 rounded">buyingPrice * 1.18 + 200</code></p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('mapping')} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Back</button>
            <button onClick={applyPricing} disabled={applyingPricing} className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40">
              {applyingPricing ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Calculate Prices & Preview
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: PREVIEW ── */}
      {step === 'preview' && analysis && (
        <div className="space-y-4">
          <SummaryGrid analysis={analysis} />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              {[undefined, 'ready', 'duplicate', 'invalid'].map(f => (
                <button key={f || 'all'} onClick={() => analysis && loadPreview(analysis.batchId, 0, f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${previewFilter === f ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500'}`}>
                  {f ? f[0].toUpperCase() + f.slice(1) : 'All'}
                </button>
              ))}
            </div>
            {analysis.duplicateRows > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-semibold">Duplicates:</span>
                <select value={duplicateStrategy} onChange={e => setDuplicateStrategy(e.target.value as any)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                  <option value="skip">Skip duplicates</option>
                  <option value="update">Update existing products</option>
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-2.5">Product</th>
                  <th className="text-left p-2.5">Buying Price</th>
                  <th className="text-left p-2.5">Selling Price</th>
                  <th className="text-left p-2.5">Stock</th>
                  <th className="text-left p-2.5">Category</th>
                  <th className="text-left p-2.5">Images</th>
                  <th className="text-left p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingPreview ? (
                  <tr><td colSpan={7} className="text-center p-6"><Loader2 className="animate-spin inline text-primary" /></td></tr>
                ) : previewItems.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-6 text-gray-400">No rows in this filter.</td></tr>
                ) : previewItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-2.5">
                      <div className="flex items-start gap-2.5">
                        {item.matchedImages[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.matchedImages[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><ImageIcon size={14} className="text-gray-300" /></div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{item.mappedData.name || <span className="text-red-500 italic">Missing name</span>}</div>
                          {(item.warnings.length > 0 || item.errors.length > 0) && (
                            <div className="text-xs mt-0.5 space-y-0.5">
                              {item.errors.map((e: string, i: number) => <div key={i} className="text-red-600 flex items-center gap-1"><XCircle size={10} />{e}</div>)}
                              {item.warnings.map((w: string, i: number) => <div key={i} className="text-amber-600 flex items-center gap-1"><AlertTriangle size={10} />{w}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-gray-600">{fmt(item.buyingPrice)}</td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={item.sellingPrice}
                        onChange={e => setPreviewItems(items => items.map(i => i.id === item.id ? { ...i, sellingPrice: Number(e.target.value) } : i))}
                        onBlur={e => overridePrice(item.id, Number(e.target.value))}
                        className={`w-24 border rounded-lg px-2 py-1 text-sm ${item.sellingPriceOverridden ? 'border-primary text-primary font-bold' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="p-2.5 text-gray-600">{item.mappedData.stockQuantity || '-'}</td>
                    <td className="p-2.5 text-gray-600">{item.mappedData.category || '-'}</td>
                    <td className="p-2.5">
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                        <ImageIcon size={12} /> {item.matchedImages.length}
                        {item.missingImages.length > 0 && <span className="text-amber-600">(+{item.missingImages.length} missing)</span>}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <StatusPill status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewTotal > 25 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <button disabled={previewOffset === 0} onClick={() => loadPreview(analysis.batchId, Math.max(0, previewOffset - 25), previewFilter)} className="disabled:opacity-30 font-semibold">← Prev</button>
              <span>{previewOffset + 1}–{Math.min(previewOffset + 25, previewTotal)} of {previewTotal}</span>
              <button disabled={previewOffset + 25 >= previewTotal} onClick={() => loadPreview(analysis.batchId, previewOffset + 25, previewFilter)} className="disabled:opacity-30 font-semibold">Next →</button>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('pricing')} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Back</button>
            <button onClick={startImport} disabled={analysis.readyRows + analysis.duplicateRows === 0} className="flex items-center gap-2 bg-secondary text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40">
              <PackageCheck size={16} /> Import {analysis.readyRows + (duplicateStrategy !== 'skip' ? analysis.duplicateRows : 0)} Products
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: IMPORTING ── */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="font-bold text-gray-800 text-lg">Importing products...</p>
          <div className="w-full max-w-md bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-3 transition-all" style={{ width: `${importProgress.total ? Math.round((importProgress.processed / importProgress.total) * 100) : 0}%` }} />
          </div>
          <p className="text-sm text-gray-500">
            {importProgress.processed} / {importProgress.total} processed
            ({importProgress.total ? Math.round((importProgress.processed / importProgress.total) * 100) : 0}%)
          </p>
          <div className="flex gap-4 text-xs font-semibold text-gray-600">
            <span className="text-green-600">✓ {importProgress.imported} imported</span>
            <span className="text-blue-600">↻ {importProgress.updated} updated</span>
            <span className="text-gray-400">⊘ {importProgress.skipped} skipped</span>
            <span className="text-red-600">✕ {importProgress.failed} failed</span>
          </div>
        </div>
      )}

      {/* ── STEP: REPORT ── */}
      {step === 'report' && report && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 className="text-green-600" size={28} />
            <div>
              <p className="font-bold text-green-800">Import Complete</p>
              <p className="text-sm text-green-700">{report.batch.importedRows} products imported, {report.batch.updatedRows} updated, {report.batch.skippedRows} skipped, {report.batch.failedRows} failed.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Imported" value={report.batch.importedRows} color="green" />
            <MetricCard label="Updated" value={report.batch.updatedRows} color="blue" />
            <MetricCard label="Skipped" value={report.batch.skippedRows} color="gray" />
            <MetricCard label="Failed" value={report.batch.failedRows} color="red" />
          </div>

          <div className="flex gap-3">
            <button onClick={downloadReportCsv} className="flex items-center gap-2 text-sm font-semibold border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50">
              <Download size={16} /> Download Report (CSV)
            </button>
            <button onClick={startOver} className="flex items-center gap-2 bg-primary text-white text-sm font-semibold rounded-xl px-4 py-2">
              <RefreshCcw size={16} /> Import Another File
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                <tr><th className="text-left p-2.5">Row</th><th className="text-left p-2.5">Product</th><th className="text-left p-2.5">Status</th><th className="text-left p-2.5">Notes</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.rows.map((r: any) => (
                  <tr key={r.row}>
                    <td className="p-2.5 text-gray-400">{r.row}</td>
                    <td className="p-2.5 font-semibold text-gray-700">{r.name || '-'}</td>
                    <td className="p-2.5"><StatusPill status={r.status} /></td>
                    <td className="p-2.5 text-xs text-gray-500">{r.warnings || r.errors || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HISTORY MODAL ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">Import History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No previous imports yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(b => (
                  <div key={b.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{b.fileName}</p>
                      <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleString()} • {b.status} • {b.importedRows} imported / {b.totalRows} total</p>
                    </div>
                    <button onClick={async () => { await deleteImportBatchAction(b.id); loadHistory(); }} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHistory(false)} className="mt-4 text-sm font-semibold text-gray-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryGrid({ analysis }: { analysis: AnalysisResult }) {
  const cards = [
    { label: 'Total Products', value: analysis.totalRows, color: 'bg-blue-50 text-blue-700' },
    { label: 'Ready to Import', value: analysis.readyRows, color: 'bg-green-50 text-green-700' },
    { label: 'Duplicates', value: analysis.duplicateRows, color: 'bg-amber-50 text-amber-700' },
    { label: 'Invalid Rows', value: analysis.invalidRows, color: 'bg-red-50 text-red-700' },
    { label: 'Embedded Images', value: analysis.embeddedImagesFound, color: 'bg-fuchsia-50 text-fuchsia-700' },
    { label: 'Filename Images', value: analysis.filenameImagesFound, color: 'bg-purple-50 text-purple-700' },
    { label: 'Image URLs', value: analysis.urlImagesFound, color: 'bg-cyan-50 text-cyan-700' },
    { label: 'Images Missing', value: analysis.imagesMissing, color: 'bg-orange-50 text-orange-700' },
    { label: 'Brands Found', value: analysis.brandsFound.length, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Categories Found', value: analysis.categoriesFound.length, color: 'bg-teal-50 text-teal-700' },
    { label: 'Categories Auto-Assigned', value: analysis.categoriesAutoAssigned, color: 'bg-lime-50 text-lime-700' },
    { label: 'Needs Category Review', value: analysis.categoriesLowConfidence, color: 'bg-rose-50 text-rose-700' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.color} rounded-xl p-3`}>
          <p className="text-xs font-semibold opacity-70">{c.label}</p>
          <p className="text-xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = { green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', gray: 'bg-gray-100 text-gray-600', red: 'bg-red-50 text-red-700' };
  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold opacity-70">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: 'bg-green-100 text-green-700', duplicate: 'bg-amber-100 text-amber-700', invalid: 'bg-red-100 text-red-700',
    imported: 'bg-green-100 text-green-700', updated: 'bg-blue-100 text-blue-700', skipped: 'bg-gray-100 text-gray-500', failed: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>;
}
