const BASE_URL = 'https://rentalmeet.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata({ params }) {
  try {
    // Try slug endpoint first; fall back to ID for old links
    const isMongoId = /^[a-f\d]{24}$/i.test(params.slug);
    const url = isMongoId
      ? `${API_URL}/vendor-services/${params.slug}`
      : `${API_URL}/vendor-services/slug/${params.slug}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!data.success) throw new Error('not found');

    const svc = data.service;
    const image = svc.featuredImage || svc.images?.[0] || `${BASE_URL}/android-chrome-512x512.png`;
    const title = `${svc.title} - RentalMeet`;
    const city = [svc.city, svc.state].filter(Boolean).join(', ');
    const description = `${svc.category} service${city ? ' in ' + city : ''}. ${
      svc.description?.slice(0, 140) || 'Book premium vendor services on RentalMeet.'
    }`;

    // Always use the slug-based canonical URL
    const canonical = `${BASE_URL}/other-services/${svc.slug || params.slug}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'RentalMeet',
        images: [{ url: image, width: 1200, height: 630, alt: svc.title }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Vendor Service - RentalMeet',
      description: 'Book premium vendor services on RentalMeet',
    };
  }
}

export default function ServiceLayout({ children }) {
  return children;
}
