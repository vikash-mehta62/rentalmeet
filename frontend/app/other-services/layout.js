export const metadata = {
  title: 'Vendor Services - RentalMeet',
  description: 'Discover and book premium vendor services — photography, catering, decoration, entertainment and more for your events.',
  openGraph: {
    title: 'Vendor Services - RentalMeet',
    description: 'Discover and book premium vendor services for your events — photography, catering, decoration, entertainment and more.',
    url: 'https://rentalmeet.com/other-services',
    siteName: 'RentalMeet',
    images: [{ url: 'https://rentalmeet.com/android-chrome-512x512.png', width: 512, height: 512, alt: 'RentalMeet Services' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vendor Services - RentalMeet',
    description: 'Discover and book premium vendor services for your events.',
    images: ['https://rentalmeet.com/android-chrome-512x512.png'],
  },
};

export default function OtherServicesLayout({ children }) {
  return children;
}
