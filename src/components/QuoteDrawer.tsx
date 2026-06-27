'use client';

import React, { useState } from 'react';
import { useQuote } from '@/context/QuoteContext';
import { X, Trash2, Calendar, ShoppingBag, CheckCircle, MessageSquare, Phone, MapPin } from 'lucide-react';

export default function QuoteDrawer() {
  const { 
    items, 
    isOpen, 
    setIsOpen, 
    removeItem, 
    updateQuantity, 
    clearQuoteList 
  } = useQuote();

  const [customerName, setCustomerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedDetails, setSubmittedDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalWholesaleValue = items.reduce((acc, item) => acc + (item.wholesalePrice * item.quantity), 0);
  const totalCartons = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !phone.trim()) {
      setErrorMsg('Please fill in your Name and Phone Number.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your quotation list is empty. Add products to request a quote.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName,
        businessName,
        email,
        phone,
        whatsappNumber,
        location,
        message,
        items: items.map(item => ({
          productId: item.id,
          code: item.code,
          name: item.name,
          qty: item.quantity,
          wholesalePrice: item.wholesalePrice,
          totalPcs: item.quantity * item.qtyPerCarton
        }))
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setSubmitSuccess(true);
        setSubmittedDetails({
          id: resData.quoteId,
          customerName,
          phone
        });
        clearQuoteList();
        // Reset form
        setCustomerName('');
        setBusinessName('');
        setEmail('');
        setPhone('');
        setWhatsappNumber('');
        setLocation('');
        setMessage('');
      } else {
        setErrorMsg(resData.error || 'Failed to submit quote request.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Dark overlay backdrop */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={() => setIsOpen(false)}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              {/* Drawer Header */}
              <div className="bg-primary px-4 py-6 sm:px-6 text-white border-b-2 border-secondary">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2" id="slide-over-title">
                      <ShoppingBag className="w-5 h-5 text-secondary" />
                      <span>Wholesale Quote List</span>
                    </h2>
                    <p className="mt-1 text-xs text-blue-100">
                      Request bulk prices for retail, hardware & supermarkets
                    </p>
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded bg-primary text-blue-100 hover:text-white hover:bg-blue-800 p-1 cursor-pointer transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 px-4 py-6 sm:px-6">
                {submitSuccess ? (
                  /* Success State */
                  <div className="h-full flex flex-col justify-center items-center text-center py-12 px-4">
                    <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                    <h3 className="text-xl font-extrabold text-primary">Quotation Sent!</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Thank you <strong className="text-primary font-bold">{submittedDetails?.customerName}</strong>! Your wholesale quotation request has been successfully recorded.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded p-4 my-6 w-full text-left text-xs space-y-2">
                      <p><strong>Quote Reference:</strong> <span className="text-secondary font-mono font-bold">KM-QT-{submittedDetails?.id}</span></p>
                      <p><strong>Primary Phone:</strong> {submittedDetails?.phone}</p>
                      <p className="text-[11px] text-gray-500 italic mt-1">Our Meru wholesale office will review your product catalog list and contact you via phone or WhatsApp with our formal price quote within 1-2 hours.</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <a
                        href={`https://wa.me/254708952210?text=Hello%20Kamenja%20Enterprises,%20I%20have%20just%20submitted%20a%20quotation%20request%20online%20(Ref:%20KM-QT-${submittedDetails?.id}).%20Please%20review%20it.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Confirm via WhatsApp (0708952210)</span>
                      </a>
                      <button
                        onClick={() => {
                          setSubmitSuccess(false);
                          setSubmittedDetails(null);
                        }}
                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded text-sm font-bold transition-colors cursor-pointer"
                      >
                        Request Another Quotation
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full text-xs text-primary font-bold hover:underline mt-2 cursor-pointer"
                      >
                        Close and Continue Browsing
                      </button>
                    </div>
                  </div>
                ) : items.length === 0 ? (
                  /* Empty State */
                  <div className="h-full flex flex-col justify-center items-center text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-semibold">Your quote list is empty</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Browse our product catalog and click "Add to Quote" to start building your bulk pricing request list.
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="mt-4 bg-primary hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded transition-colors cursor-pointer"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  /* List and Form State */
                  <div className="space-y-6">
                    {/* Items List */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Selected Products ({items.length})
                      </h3>
                      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto border border-gray-100 rounded-md p-2 bg-gray-50">
                        {items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded bg-white border flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="font-bold text-gray-800 truncate">{item.name}</p>
                              <p className="text-gray-500 text-[11px]">Code: <span className="font-mono text-secondary font-semibold">{item.code}</span></p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] text-gray-600">
                                  {formatPrice(item.wholesalePrice)} / carton
                                </span>
                                <span className="text-gray-400">({item.qtyPerCarton} Pcs/Ctn)</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-1.5 py-0.5 bg-white text-gray-600 hover:bg-gray-100 font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-8 text-center text-xs font-bold bg-white outline-none border-none py-0.5 h-6"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-1.5 py-0.5 bg-white text-gray-600 hover:bg-gray-100 font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold">
                                {item.quantity * item.qtyPerCarton} Pcs Total
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Estimate Summary */}
                      <div className="bg-primary/5 rounded p-3 mt-3 text-xs border border-primary/10">
                        <div className="flex justify-between items-center text-gray-700 font-semibold mb-1">
                          <span>Total Cartons Selected:</span>
                          <span className="text-primary font-bold">{totalCartons} Cartons</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-primary">
                          <span>Est. Wholesale Value:</span>
                          <span className="text-secondary">{formatPrice(totalWholesaleValue)}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 italic text-center">
                          *Final quote is issued by the office after verifying discounts and delivery.
                        </p>
                      </div>
                    </div>

                    {/* Quotation Customer Form */}
                    <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-5 space-y-3.5">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Business & Contact Details
                      </h3>

                      {errorMsg && (
                        <p className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded font-medium">
                          {errorMsg}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-3.5 text-xs">
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Your Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Brycen Lopez"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Business Name <span className="text-gray-400">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Meru Wholesale Hardware"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. 0708952210"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              WhatsApp <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 0708952210"
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              Town / Location <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Meru Town"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              Email Address <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. buyer@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Additional Instructions / Message <span className="text-gray-400">(Optional)</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Specify preferred brands, colors, or urgent delivery requirements."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-secondary hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded text-center text-sm transition-colors mt-3 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Submitting Request...</span>
                        ) : (
                          <>
                            <span>Submit Quotation Request</span>
                            <span>({formatPrice(totalWholesaleValue)})</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
