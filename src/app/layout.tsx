import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { getSettings } from "@/db/settings";
import { db } from "@/db";
import { categories } from "@/db/schema";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const fallbackSettings = {
  business_name: "KAMENJA ENTERPRISES",
  tagline: "Supplying Quality Products to Shop Owners at Wholesale Prices.",
  location: "Meru, Kenya",
  phone_primary: "0708952210",
  phone_secondary: "0723456382",
  email: "lopezbrycen@gmail.com",
  whatsapp_url_1: "https://wa.me/254708952210",
  whatsapp_url_2: "https://wa.me/254723456382",
  hero_heading: "KAMENJA ENTERPRISES",
  hero_subheading: "Kenya's Trusted Wholesale Supplier",
  hero_description:
    "We supply high-quality wholesale products across Kenya."
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();

    return {
      title: `${settings.business_name} - ${settings.hero_subheading}`,
      description: settings.hero_description,
      metadataBase: new URL("https://kamenjaenterprises.com"),
    };
  } catch (error) {
    console.error("Metadata Error:", error);

    return {
      title: "KAMENJA ENTERPRISES",
      description:
        "Supplying Quality Products to Shop Owners at Wholesale Prices.",
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  let catsList: any[] = [];
  let settingsData = fallbackSettings;

  try {
    catsList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);

    console.log("✅ Categories loaded:", catsList.length);
  } catch (error) {
    console.error("❌ CATEGORY QUERY FAILED");
    console.error(error);
  }

  try {
    settingsData = await getSettings();
    console.log("✅ Settings loaded");
  } catch (error) {
    console.error("❌ SETTINGS QUERY FAILED");
    console.error(error);
  }

  return (
    <html lang="en">
      <body className="font-sans text-gray-800 bg-white min-h-screen flex flex-col antialiased">
        <CartProvider>
          <Header
            categories={catsList}
            settings={settingsData}
          />

          <main className="flex-1">
            {children}
          </main>

          <Footer
            categories={catsList}
            settings={settingsData}
          />

          <FloatingWhatsAppButton phone={settingsData.phone_primary} />
          <CartDrawer settings={settingsData} />
        </CartProvider>
      </body>
    </html>
  );
}