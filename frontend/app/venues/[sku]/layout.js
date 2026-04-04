export async function generateMetadata({ params }) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/venues/sku/${params.sku}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (!data.success) throw new Error('not found');
    const venue = data.venue;
    const image = venue.images?.[0]?.url || 'https://rentalmeet.com/her-img2.jpg';
    const title = `${venue.businessName} - RentalMeet`;
    const description = `Book ${venue.businessName} in ${venue.location?.city}. Capacity: ${venue.capacity}. ${venue.description?.slice(0, 120) || ''}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://rentalmeet.com/venues/${params.sku}`,
        siteName: 'RentalMeet',
        images: [{ url: image, width: 1200, height: 630, alt: venue.businessName }],
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
      title: 'Venue - RentalMeet',
      description: 'Book premium venues on RentalMeet',
    };
  }
}

export default function VenueLayout({ children }) {
  return children;
}
