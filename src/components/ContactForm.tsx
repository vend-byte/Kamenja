'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, Send } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Product Catalog Inquiry');
  const [message, setMessage] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setIsSending(true);

    // Simulate sending form content
    setTimeout(() => {
      setIsSending(false);
      setSuccess(true);
      // Clear fields
      setName('');
      setPhone('');
      setEmail('');
      setSubject('Product Catalog Inquiry');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
      <h3 className="text-base font-extrabold text-primary mb-1 uppercase tracking-wider">Send us a direct message</h3>
      <p className="text-xs text-gray-500 mb-6">Our office response team typically responds via email or call within 1-2 hours.</p>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded p-5 text-center text-xs space-y-2">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
          <h4 className="font-extrabold text-primary">Message Sent Successfully!</h4>
          <p className="text-gray-600">
            Thank you for contacting KAMENJA ENTERPRISES. We have received your message and will get back to you shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs text-primary font-bold hover:underline block pt-2 mx-auto cursor-pointer"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Your Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Brycen Lopez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Your Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                placeholder="e.g. 0708952210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Your Email <span className="text-gray-400">(Optional)</span></label>
              <input
                type="email"
                placeholder="e.g. buyer@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Inquiry Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white outline-none focus:border-primary"
              >
                <option value="Product Catalog Inquiry">Product Catalog Inquiry</option>
                <option value="Bulk Discount Quotation">Bulk Discount Quotation</option>
                <option value="Supermarket Supply Agreement">Supermarket Supply Agreement</option>
                <option value="Hardware Store Partnership">Hardware Store Partnership</option>
                <option value="Database/Import Assistance">Database/Import Assistance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Your Message <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={4}
              placeholder="State the products, brands, or general feedback you want to send to Kamenja Enterprises..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded bg-white outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !name.trim() || !phone.trim() || !message.trim()}
            className="w-full bg-secondary hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-2.5 rounded transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sending message...' : 'Send Message'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
