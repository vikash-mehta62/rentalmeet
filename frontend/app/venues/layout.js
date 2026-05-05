export const metadata = {
  title: 'Browse Venues - RentalMeet',
  description: 'Find and book premium meeting venues, conference halls, and event spaces across India. Filter by city, capacity, and amenities.',
  openGraph: {
    title: 'Browse Venues - RentalMeet',
    description: 'Find and book premium meeting venues, conference halls, and event spaces across India.',
    url: 'https://rentalmeet.com/venues',
    siteName: 'RentalMeet',
    images: [{ url: 'https://rentalmeet.com/android-chrome-512x512.png', width: 512, height: 512, alt: 'RentalMeet Venues' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Venues - RentalMeet',
    description: 'Find and book premium meeting venues across India.',
    images: ['https://rentalmeet.com/android-chrome-512x512.png'],
  },
};

export default function VenuesLayout({ children }) {
  return children;
}
