import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getSettings } from '@/db/settings';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { QuoteProvider } from '@/context/QuoteContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuoteDrawer from '@/components/QuoteDrawer';

export async function generateMetadata(): Promise<Metadata> {
  const settingsData = await getSettings();
  return {
    title: `${settingsData.business_name} - ${settingsData.hero_subheading}`,
    description: settingsData.hero_description,
    keywords: ["wholesale supplier Kenya", "hardware tools wholesale Meru", "locks and security padlocks Kenya", "bulk kitchen appliances", "abrasives cutting discs", "Kamenja Enterprises"],
    authors: [{ name: "Kamenja Enterprises" }],
    metadataBase: new URL("https://kamenjaenterprises.com"),
    openGraph: {
      title: `${settingsData.business_name} | Wholesale Supplier Kenya`,
      description: settingsData.hero_description,
      type: "website",
      locale: "en_US",
      siteName: settingsData.business_name,
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Fetch active categories and site settings
  let catsList: any[] = [];
  let settingsData: any = null;

  try {
    catsList = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug
    }).from(categories);
    
    settingsData = await getSettings();
  } catch (error) {
    console.error("Error loading layout data, using fallbacks:", error);
    catsList = [];
    settingsData = {
      business_name: 'KAMENJA ENTERPRISES',
      tagline: 'Supplying Quality Products to Shop Owners at Wholesale Prices.',
      location: 'Meru, Kenya',
      phone_primary: '0708952210',
      phone_secondary: '0723456382',
      email: 'lopezbrycen@gmail.com',
      whatsapp_url_1: 'https://wa.me/254708952210',
      whatsapp_url_2: 'https://wa.me/254723456382',
    };
  }

  return (
    <html lang="en">
      <body className="font-sans text-gray-800 bg-white min-h-screen flex flex-col antialiased">
        <QuoteProvider>
          <Header categories={catsList} settings={settingsData} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer categories={catsList} settings={settingsData} />
          <QuoteDrawer />
        </QuoteProvider>
      </body>
    </html>
  );
}
