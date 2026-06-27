import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6 text-xs sm:text-sm text-gray-600 leading-relaxed">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Privacy Policy</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary border-b pb-3">Privacy Policy - KAMENJA ENTERPRISES</h1>
        <p className="italic text-gray-500">Effective Date: January 1, 2026</p>

        <p>
          At KAMENJA ENTERPRISES, accessible from Meru, Kenya, one of our main priorities is the privacy of our visitors and B2B clients. This Privacy Policy document contains types of information that is collected and recorded by KAMENJA ENTERPRISES and how we use it.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">1. Information We Collect</h2>
        <p>
          When you request a quotation or contact us, we collect standard operational business details including:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your Full Name</li>
          <li>Your Shop/Business Name</li>
          <li>Primary and Secondary Phone Numbers</li>
          <li>WhatsApp Contact Number</li>
          <li>Physical Location/Town in Kenya</li>
          <li>Email Address</li>
          <li>The list of specific wholesale products and quantities requested.</li>
        </ul>

        <h2 className="text-base font-bold text-primary pt-3">2. How We Use Your Information</h2>
        <p>
          We use the information we collect in various ways, primarily to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Draft, compute, and issue custom wholesale price quotations.</li>
          <li>Initiate phone calls or WhatsApp chats to confirm delivery and payment terms.</li>
          <li>Arrange logistics and transport to deliver purchased goods to your retail business.</li>
          <li>Maintain order and quotation history on our secure Admin Portal.</li>
          <li>Prevent fraudulent activities or duplicate requests.</li>
        </ul>

        <h2 className="text-base font-bold text-primary pt-3">3. Data Security and Storage</h2>
        <p>
          Your requested products and business information are securely recorded in our private PostgreSQL database. Only authorized staff at KAMENJA ENTERPRISES have access to this information to process your quotes. We do not sell, rent, or lease your personal information to third parties.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">4. Cookies</h2>
        <p>
          We use standard cookies on our website. For general visitors, cookies are used only to store your active Quotation List (locally on your browser). For administrators, cookies are used securely to maintain authenticated dashboard sessions.
        </p>

        <h2 className="text-base font-bold text-primary pt-3">5. Contact Us</h2>
        <p>
          If you have any questions or require more information about our Privacy Policy, do not hesitate to contact our wholesale offices in Meru, Kenya, via phone at <strong>0708952210</strong> or email <strong>lopezbrycen@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
}
