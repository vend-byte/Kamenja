import React from 'react';
import Link from 'next/link';
import { getSettings } from '@/db/settings';
import { Phone, Mail, MapPin, MessageSquare, Clock, Building, Compass } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

export default async function ContactPage() {
  const settingsData = await getSettings();

  // Create WhatsApp URL
  const getWhatsAppLink = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Contact Us</span>
        </nav>

        {/* Title */}
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Contact KAMENJA ENTERPRISES</h1>
          <p className="text-xs text-gray-500 mt-1">
            Get in touch with our Meru sales and logistics office directly via Call, WhatsApp, Email or Contact Form.
          </p>
        </div>

        {/* Info & Form Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Contact Information (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Headquarters details */}
            <div className="bg-primary text-white rounded-lg p-6 space-y-4 shadow border-b-4 border-secondary">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-secondary flex-shrink-0" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Wholesale Head Office</h3>
              </div>
              
              <ul className="space-y-4 text-xs">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white block font-bold text-sm">KAMENJA ENTERPRISES</strong>
                    <span>Meru Town, Meru County, Kenya</span>
                    <span className="block text-[11px] text-blue-200 mt-0.5">Central Distribution Station, accessible for pickups</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white block font-bold">Call Phone Lines:</strong>
                    <div className="flex flex-col gap-1 mt-1 text-sm font-semibold">
                      <a href={`tel:${settingsData.phone_primary}`} className="hover:text-secondary transition-colors">
                        {settingsData.phone_primary} (Primary)
                      </a>
                      <a href={`tel:${settingsData.phone_secondary}`} className="hover:text-secondary transition-colors">
                        {settingsData.phone_secondary} (Logistics)
                      </a>
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white block">Email Address:</strong>
                    <a href={`mailto:${settingsData.email}`} className="hover:text-secondary transition-colors underline break-all">
                      {settingsData.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white block">Office Working Hours:</strong>
                    <span>Monday - Saturday: 8:00 AM - 6:00 PM</span>
                    <span className="block text-orange-300 font-semibold">Sundays & Public Holidays: Closed</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Direct WhatsApp Buttons */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span>Instant WhatsApp Chats</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Click a line below to directly initiate a WhatsApp conversation with a sales executive with prefilled wholesale templates.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <a
                  href={getWhatsAppLink(settingsData.phone_primary, "Hello KAMENJA ENTERPRISES, I would like to make an inquiry about your wholesale product catalog prices.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Line 1 (Sales)</span>
                </a>

                <a
                  href={getWhatsAppLink(settingsData.phone_secondary, "Hello KAMENJA ENTERPRISES, I am checking on the shipping schedule or current status of my quotation order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Line 2 (Shipping)</span>
                </a>
              </div>
            </div>

            {/* Google Maps / Directions Helper Visual */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-secondary" />
                <span>Warehouse Directions</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Our main offices and wholesale warehouse is strategically located in Meru, Kenya, off the Meru-Nanyuki highway, offering easy access for pickup lorries and transit transport.
              </p>
              
              {/* Nice interactive vector map placeholder */}
              <div className="bg-white border rounded p-4 text-center space-y-1 bg-gradient-to-tr from-gray-100 to-white">
                <MapPin className="w-8 h-8 text-primary mx-auto" />
                <p className="font-bold text-xs text-primary">KAMENJA ENTERPRISES WAREHOUSE</p>
                <p className="text-[10px] text-gray-500">Meru Central Business District, Kenya</p>
                <span className="inline-block mt-2 bg-secondary text-white font-bold text-[10px] px-2.5 py-1 rounded">
                  GPS Latitude: 0.0503° N, Longitude: 37.6491° E
                </span>
              </div>
            </div>

          </div>

          {/* Right Panel: Interactive Form (Col span 7) */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

        </div>

      </div>
    </div>
  );
}
