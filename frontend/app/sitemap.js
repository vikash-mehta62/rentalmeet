const BASE_URL = 'https://rentalmeet.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  // Build static entries
  const staticEntries = staticRoutes.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Fetch all approved venues
  let venueEntries = [];
  try {
    const res = await fetch(`${API_URL}/venues?status=approved&limit=2000`, {
      next: { revalidate: 3600 }, // revalidate every hour
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

  // Fetch all active vendor services
  let serviceEntries = [];
  try {
    const res = await fetch(`${API_URL}/vendor-services?status=approved&limit=2000`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const services = data.services || data.data || [];
    if (Array.isArray(services)) {
      serviceEntries = services
        .filter(s => s._id && s.isActive !== false)
        .map(s => ({
          url: `${BASE_URL}/other-services/${s._id}`,
          lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch services', e);
  }

  return [...staticEntries, ...venueEntries, ...serviceEntries];
}
