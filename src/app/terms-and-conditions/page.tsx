import React from 'react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6 text-xs sm:text-sm text-gray-600 leading-relaxed">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Terms & Conditions</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary border-b pb-3">Terms & Conditions - KAMENJA ENTERPRISES</h1>
        <p className="italic text-gray-500">Effective Date: January 1, 2026</p>

        <p>
          Welcome to the B2B wholesale platform of KAMENJA ENTERPRISES. These terms and conditions outline the rules and regulations for doing wholesale business with us. By accessing this website or requesting price quotes, we assume you accept these terms in full.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">1. Wholesale Only Definition</h2>
        <p>
          KAMENJA ENTERPRISES is a dedicated wholesale supplier. The pricing displayed on our website represents <strong>Wholesale Carton Pricing</strong>. We do not sell single items for household end-use on this platform. The quantities listed in carton packaging represent the minimum purchase thresholds.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">2. Quotation and Price Adjustments</h2>
        <p>
          Submitting a "Quotation Request" through this platform does not constitute a binding transaction. Prices are subject to market forces, import tariffs, and logistics constraints. Official pricing is only guaranteed once a written invoice/receipt is issued by our Meru sales office and signed by an authorized manager.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">3. Delivery and Pickups</h2>
        <p>
          Buyers can choose to pickup purchased goods directly from our warehouse station in Meru Town, Kenya. Alternatively, we facilitate bulk transport delivery via registered Kenyan logistics companies. Any transit risk or breakage refunds will be resolved in accordance with our specific cargo policies.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">4. Payments</h2>
        <p>
          All wholesale orders are processed through approved business accounts (MPESA Paybill, bank transfers, or cash deposits upon verification). Credit terms are exclusively restricted to pre-registered partner supermarkets, hardware groups, or schools that have signed formal supply contracts.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">5. Returns and Replacements</h2>
        <p>
          If any wholesale carton contains factory defects or incorrect models, the buyer must report it within 48 hours of delivery. Upon inspection of the seal and model codes, KAMENJA ENTERPRISES will issue an immediate replacement or credit note.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">6. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of Kenya. Any disputes arising out of trading with KAMENJA ENTERPRISES shall be settled in competent courts in Kenya.
        </p>
      </div>
    </div>
  );
}
