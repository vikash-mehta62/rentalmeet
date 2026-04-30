import { redirect } from 'next/navigation';

export default function CustomerToVenueReferralPage({ searchParams }) {
  const ref = (searchParams?.ref || '').toString().trim();
  const url = `/register-customer?target=venue${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
  redirect(url);
}

