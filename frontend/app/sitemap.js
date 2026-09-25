import venueTypeData from '@/data/venueTypeData';

const BASE_URL = 'https://rentalmeet.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Sitemap revalidation — 6 hours
 *
 * Next.js re-generates sitemap.xml in the background every 6 hours.
 * When a new venue or service is approved, it appears in the sitemap
 * automatically within 6 hours — no redeploy needed.
 *
 * Change 21600 → 3600 for 1-hour refresh, → 86400 for once a day.
 */
export const revalidate = 21600; // seconds

// Static public pages
const staticRoutes = [
  { url: '/',                  priority: 1.0,  changeFrequency: 'daily'   },
  { url: '/venues',            priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/other-services',    priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/about',             priority: 0.6,  changeFrequency: 'monthly' },
  { url: '/faqs',              priority: 0.6,  changeFrequency: 'weekly'  },
  { url: '/privacy',           priority: 0.4,  changeFrequency: 'yearly'  },
  { url: '/terms',             priority: 0.4,  changeFrequency: 'yearly'  },
  { url: '/login',             priority: 0.5,  changeFrequency: 'yearly'  },
  { url: '/register',          priority: 0.5,  changeFrequency: 'yearly'  },
  { url: '/register-customer', priority: 0.5,  changeFrequency: 'yearly'  },
  { url: '/register-venue',    priority: 0.5,  changeFrequency: 'yearly'  },
  { url: '/forgot-password',   priority: 0.3,  changeFrequency: 'yearly'  },
];

export default async function sitemap() {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticEntries = staticRoutes.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // ── Venue type SEO landing pages (static, from venueTypeData.js) ──────────
  const venueTypeEntries = venueTypeData.map(vt => ({
    url: `${BASE_URL}/venues/type/${vt.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  // ── Approved venues (auto-refreshes every 6 hours via revalidate above) ───
  let venueEntries = [];
  try {
    const res = await fetch(`${API_URL}/venues?status=approved&limit=5000`, {
      // cache: 'no-store' ensures fresh data on every revalidation cycle
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.venues)) {
      venueEntries = data.venues
        .filter(v => v.sku && v.isActive !== false)
        .map(v => ({
          url: `${BASE_URL}/venues/${v.sku}`,
          lastModified: v.updatedAt ? new Date(v.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch venues', e);
  }

  // ── Approved vendor services (auto-refreshes every 6 hours) ──────────────
  let serviceEntries = [];
  try {
    const res = await fetch(`${API_URL}/vendor-services?status=approved&limit=5000`, {
      cache: 'no-store',
    });
    const data = await res.json();
    const services = data.services || data.data || [];
    if (Array.isArray(services)) {
      serviceEntries = services
        .filter(s => s.isActive !== false && (s.slug || s._id))
        .map(s => ({
          // Use slug if available, fall back to MongoDB _id for old records
          url: `${BASE_URL}/other-services/${s.slug || s._id}`,
          lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch services', e);
  }

  return [...staticEntries, ...venueTypeEntries, ...venueEntries, ...serviceEntries];
}
