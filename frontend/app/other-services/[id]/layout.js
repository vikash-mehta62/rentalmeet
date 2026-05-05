const BASE_URL = 'https://rentalmeet.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API_URL}/vendor-services/${params.id}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (!data.success) throw new Error('not found');

    const svc = data.service;
    const image = svc.featuredImage || svc.images?.[0] || `${BASE_URL}/android-chrome-512x512.png`;
    const title = `${svc.title} - RentalMeet`;
    const city = [svc.city, svc.state].filter(Boolean).join(', ');
    const description = `${svc.category} service${city ? ' in ' + city : ''}. ${svc.description?.slice(0, 140) || 'Book premium vendor services on RentalMeet.'}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/other-services/${params.id}`,
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
