import { db } from './index';
import { settings } from './schema';
import { eq } from 'drizzle-orm';
import { ensureSeeded } from './seedData';

export interface SiteSettings {
  business_name: string;
  tagline: string;
  location: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  whatsapp_url_1: string;
  whatsapp_url_2: string;
  about_who_we_are: string;
  about_mission: string;
  about_vision: string;
  hero_heading: string;
  hero_subheading: string;
  hero_description: string;
}

const fallbackSettings: SiteSettings = {
  business_name: 'KAMENJA ENTERPRISES',
  tagline: 'Supplying Quality Products to Shop Owners at Wholesale Prices.',
  location: 'Meru, Kenya',
  phone_primary: '0708952210',
  phone_secondary: '0723456382',
  email: 'lopezbrycen@gmail.com',
  whatsapp_url_1: 'https://wa.me/254708952210',
  whatsapp_url_2: 'https://wa.me/254723456382',
  about_who_we_are: 'KAMENJA ENTERPRISES is a trusted wholesale supplier dedicated to providing retailers, hardware stores, supermarkets, and businesses with quality products at competitive wholesale prices. We work directly with leading manufacturers and importers to ensure high quality, affordability, and reliable stock availability across Meru and the rest of Kenya.',
  about_mission: 'To provide reliable, affordable, and quality wholesale products while delivering excellent customer service.',
  about_vision: 'To become Kenya\'s leading wholesale supplier by offering quality products, competitive pricing, and dependable service.',
  hero_heading: 'KAMENJA ENTERPRISES',
  hero_subheading: "Kenya's Trusted Wholesale Supplier",
  hero_description: 'We supply high-quality wholesale products to retailers, hardware stores, supermarkets, institutions, wholesalers, and distributors across Kenya at highly competitive prices.'
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(settings);
    const mapped = { ...fallbackSettings };
    for (const r of rows) {
      if (r.key in mapped) {
        (mapped as any)[r.key] = r.value;
      }
    }
    return mapped;
  } catch (err) {
    console.error('Error fetching settings, using fallbacks:', err);
    return fallbackSettings;
  }
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<void> {
  try {
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) {
        await db
          .insert(settings)
          .values({ key: k, value: v })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: v }
          });
      }
    }
  } catch (err) {
    console.error('Error updating settings:', err);
  }
}
