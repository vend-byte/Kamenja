import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  categories: { id: number; name: string; slug: string }[];
  settings: {
    business_name: string;
    tagline: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    location: string;
  };
}

export default function Footer({ categories, settings }: FooterProps) {
  // Safe WhatsApp link generator
  const getWhatsAppLink = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <footer className="bg-primary text-gray-100 mt-auto border-t-4 border-secondary">
      {/* 1. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Col 1: About Company */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary flex items-center justify-center rounded text-white font-extrabold text-base border-2 border-white">
              K
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">
              KAMENJA <span className="text-secondary">ENTERPRISES</span>
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {settings.tagline}
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">
            We work directly with manufacturers and importers to supply high-quality products at competitive wholesale prices to shop owners, hardware stores, supermarkets, wholesalers, and institutions across Kenya.
          </p>
          <div className="flex items-center gap-2 text-xs bg-white/10 p-2.5 rounded border border-white/5">
            <ShieldCheck className="w-4 h-4 text-secondary flex-shrink-0" />
            <span className="font-semibold text-gray-200">100% Genuine Certified Goods Only</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/15 pb-2">
            Quick Links
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-secondary transition-colors block py-0.5">
                Home Page
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-secondary transition-colors block py-0.5">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-secondary transition-colors block py-0.5">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-secondary transition-colors block py-0.5">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-secondary transition-colors block py-0.5 font-semibold text-blue-300">
                Admin Dashboard Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Categories */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/15 pb-2">
            Wholesale Categories
          </h3>
          <ul className="space-y-2 text-xs">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/products?category=${c.slug}`} className="hover:text-secondary transition-colors block py-0.5">
                    {c.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-400">Loading categories...</li>
            )}
            {categories.length > 6 && (
              <li>
                <Link href="/products" className="text-secondary hover:underline text-[11px] font-bold block mt-1">
                  View All Categories ({categories.length}) →
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Col 4: Contact & Support */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/15 pb-2">
            Contact Wholesale Office
          </h3>
          <ul className="space-y-3.5 text-xs text-gray-300">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Headquarters:</strong><br />
                Meru Town, Meru County, Kenya
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <a href={`tel:${settings.phone_primary}`} className="hover:text-white transition-colors block">
                  {settings.phone_primary}
                </a>
                <a href={`tel:${settings.phone_secondary}`} className="hover:text-white transition-colors block">
                  {settings.phone_secondary}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors break-all">
                {settings.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Mon - Sat:</strong> 8:00 AM - 6:00 PM<br />
                <strong>Sunday & Holidays:</strong> Closed
              </span>
            </li>
          </ul>

          {/* Quick WhatsApp Button */}
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Quick WhatsApp Inquiry</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={getWhatsAppLink(settings.phone_primary, "Hello KAMENJA ENTERPRISES, I would like to make an inquiry about wholesale products.")}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-2 rounded text-center text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Line 1</span>
              </a>
              <a
                href={getWhatsAppLink(settings.phone_secondary, "Hello KAMENJA ENTERPRISES, I would like to make an inquiry about wholesale products.")}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-2 rounded text-center text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Line 2</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* 2. BOTTOM BAR (Copyright & Legals) */}
      <div className="bg-primary/95 text-gray-400 text-xs py-4 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-center sm:text-left text-gray-400">
            Copyright © {new Date().getFullYear()} <strong className="text-white font-bold">{settings.business_name}</strong>. All Rights Reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
