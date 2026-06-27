import React from 'react';
import Link from 'next/link';
import { getSettings } from '@/db/settings';
import { 
  ShieldCheck, 
  Target, 
  Eye, 
  Award, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Heart, 
  Handshake, 
  Sparkles, 
  Clock, 
  Banknote, 
  Lightbulb, 
  Users,
  ChevronRight,
  Store,
  Building,
  Truck,
  Star
} from 'lucide-react';

export default async function AboutPage() {
  const settingsData = await getSettings();

  const coreValues = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-white" />,
      title: 'Integrity',
      description: 'We conduct our business honestly and transparently. Every transaction, quotation, and partnership is built on a foundation of trust and ethical practices.'
    },
    {
      icon: <Award className="w-7 h-7 text-white" />,
      title: 'Quality',
      description: 'We supply products that meet high standards of quality and reliability. Every item in our catalog is sourced from reputable manufacturers and verified for durability.'
    },
    {
      icon: <Heart className="w-7 h-7 text-white" />,
      title: 'Customer Satisfaction',
      description: 'We prioritize our customers\' needs and strive to exceed their expectations. From the first inquiry to final delivery, your satisfaction is our benchmark.'
    },
    {
      icon: <Clock className="w-7 h-7 text-white" />,
      title: 'Reliability',
      description: 'We ensure consistent product availability and timely delivery. Our warehouse in Meru is always stocked so your business never runs dry.'
    },
    {
      icon: <Banknote className="w-7 h-7 text-white" />,
      title: 'Affordability',
      description: 'We provide competitive wholesale prices that help businesses maximize profitability. Our thin-margin pricing model ensures your retail margins stay healthy.'
    },
    {
      icon: <Lightbulb className="w-7 h-7 text-white" />,
      title: 'Innovation',
      description: 'We continually improve our products, services, and business processes. From digital catalogs to instant WhatsApp support, we embrace modern solutions.'
    },
    {
      icon: <Handshake className="w-7 h-7 text-white" />,
      title: 'Partnership',
      description: 'We believe in building strong, long-term relationships with our customers and suppliers. Your growth is our growth, and we succeed together.'
    }
  ];

  const whoWeServe = [
    { icon: <Store className="w-6 h-6 text-secondary" />, label: 'Shop Owners & Retailers' },
    { icon: <Building className="w-6 h-6 text-secondary" />, label: 'Supermarkets & Hardware Stores' },
    { icon: <Users className="w-6 h-6 text-secondary" />, label: 'Institutions & Schools' },
    { icon: <Truck className="w-6 h-6 text-secondary" />, label: 'Wholesalers & Distributors' }
  ];

  const whatWeSupply = [
    'Locks & Security Products',
    'Hand & Power Tools',
    'Drill Bits & Cutting Accessories',
    'Abrasives & Grinding Supplies',
    'Hardware Accessories & Fasteners',
    'Kitchen & Home Appliances',
    'Home Storage & Organization',
    'Electrical Products & Accessories',
    'Professional Tool Sets',
    'And Many More Categories...'
  ];

  return (
    <div className="bg-white min-h-screen">
      
      {/* 1. HERO BANNER */}
      <section className="bg-gradient-to-br from-[#0B2C63] to-[#0F3D91] text-white py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          {/* Breadcrumb */}
          <nav className="text-xs text-blue-200 flex items-center justify-center gap-1.5 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-semibold">About Us</span>
          </nav>

          <span className="inline-block bg-secondary text-white font-bold text-[10px] px-3 py-1 rounded uppercase tracking-widest">
            Learn More About Us
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Welcome to KAMENJA ENTERPRISES
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Your Trusted Wholesale Supplier Based in Meru, Kenya
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* 2. WELCOME / WHO WE ARE - Full Content */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Who We Are</h2>
          </div>

          <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-6 sm:p-8 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <strong className="text-primary">KAMENJA ENTERPRISES</strong> is a trusted wholesale supplier based in Meru, Kenya, committed to providing high-quality products at competitive wholesale prices. We proudly serve shop owners, supermarkets, hardware stores, institutions, wholesalers, and retailers by supplying a wide range of reliable products, including locks and security products, hand and power tools, hardware accessories, kitchen appliances, home organization solutions, electrical products, and many more.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Our business is built on integrity, reliability, and customer satisfaction. We source quality products from reputable manufacturers and suppliers to ensure our customers receive durable products at affordable prices. Whether you are starting a new business or restocking your shelves, <strong className="text-primary">KAMENJA ENTERPRISES</strong> is your dependable wholesale partner.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              We believe that every business deserves access to quality products, consistent supply, and excellent customer service. Our goal is to build long-term relationships with our customers by offering competitive prices, dependable deliveries, and professional support.
            </p>
          </div>

          {/* Who We Serve Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {whoWeServe.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 text-center space-y-2 hover:border-secondary transition-colors">
                <div className="flex justify-center">{item.icon}</div>
                <p className="text-xs font-bold text-primary">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. OUR MISSION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Our Mission</h2>
          </div>

          <div className="bg-gradient-to-r from-primary to-[#0B2C63] text-white rounded-lg p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="bg-secondary/20 p-3 rounded-full flex-shrink-0">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-sm sm:text-base text-blue-50 leading-relaxed">
                To provide retailers, wholesalers, and businesses across Kenya with high-quality products at affordable wholesale prices while delivering exceptional customer service, reliable supply, and lasting business partnerships.
              </p>
            </div>
          </div>
        </section>

        {/* 4. OUR VISION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Our Vision</h2>
          </div>

          <div className="bg-gradient-to-r from-[#0B2C63] to-primary text-white rounded-lg p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="bg-secondary/20 p-3 rounded-full flex-shrink-0">
                <Eye className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-sm sm:text-base text-blue-50 leading-relaxed">
                To become Kenya's leading and most trusted wholesale supplier by offering a diverse range of quality products, embracing innovation, maintaining competitive pricing, and supporting the growth and success of businesses nationwide.
              </p>
            </div>
          </div>
        </section>

        {/* 5. OUR CORE VALUES - 7 Values Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Our Core Values</h2>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            These seven fundamental principles guide every decision we make, every product we supply, and every relationship we build with our customers and suppliers across Kenya.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreValues.slice(0, 6).map((value, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-primary p-4 flex items-center gap-3">
                  <div className="bg-secondary/20 p-2 rounded-full">
                    {value.icon}
                  </div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{value.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 7th value - Partnership (Full width card) */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row">
              <div className="bg-primary p-5 flex items-center gap-3 sm:w-64 flex-shrink-0">
                <div className="bg-secondary/20 p-2 rounded-full">
                  {coreValues[6].icon}
                </div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{coreValues[6].title}</h3>
              </div>
              <div className="p-5 flex items-center">
                <p className="text-xs text-gray-600 leading-relaxed">{coreValues[6].description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. WHAT WE SUPPLY */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">What We Supply</h2>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            KAMENJA ENTERPRISES offers a comprehensive catalog of wholesale products organized into professional categories for easy browsing:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {whatWeSupply.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. WHY CHOOSE KAMENJA */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-secondary rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Why Choose KAMENJA ENTERPRISES?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-secondary" />
                <h3 className="text-sm font-extrabold text-primary uppercase">Trusted Reputation</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Hundreds of shop owners, hardware stores, and supermarkets across Meru County and beyond trust us as their primary wholesale supplier. Our reputation is built on years of consistent service.
              </p>
            </div>

            <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-secondary" />
                <h3 className="text-sm font-extrabold text-primary uppercase">Reliable Delivery</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                We ensure timely delivery to your business doorstep. Our logistics network covers Meru County and extends to neighboring counties, keeping your shelves stocked without delays.
              </p>
            </div>

            <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-secondary" />
                <h3 className="text-sm font-extrabold text-primary uppercase">Best Wholesale Prices</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                We work directly with manufacturers and importers, cutting out middlemen to pass maximum savings to you. The more cartons you order, the bigger the discount we apply.
              </p>
            </div>
          </div>
        </section>

        {/* 8. CALL TO ACTION */}
        <section className="bg-gradient-to-r from-primary to-[#0B2C63] text-white p-8 sm:p-10 rounded-lg text-center space-y-5">
          <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider">Ready to Partner with KAMENJA?</h3>
          <p className="text-sm text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of successful shop owners, hardware stores, supermarkets, and institutions who trust KAMENJA ENTERPRISES as their wholesale supplier. Browse our catalog of over 10,000 products, build your quote list, and let us supply your business at the best wholesale prices in Kenya.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/products"
              className="bg-secondary hover:bg-orange-600 text-white font-bold text-sm py-3 px-6 rounded transition-colors flex items-center gap-2"
            >
              <span>Browse Wholesale Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-sm py-3 px-6 rounded transition-colors"
            >
              Contact Our Sales Office
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
