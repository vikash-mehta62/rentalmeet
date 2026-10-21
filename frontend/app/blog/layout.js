export const metadata = {
  title: 'RentalMeet Blog - Venue & Event Booking Insights',
  description: 'Expert tips, event planning advice, venue management guides, and industry news for banquet halls, farmhouses, and party spaces.',
  alternates: {
    canonical: 'https://www.rentalmeet.com/blog',
    types: {
      'application/rss+xml': 'https://www.rentalmeet.com/blog/feed.xml',
    },
  },
};

export default function BlogLayout({ children }) {
  return children;
}
