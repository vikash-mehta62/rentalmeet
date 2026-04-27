import { redirect } from 'next/navigation';

export default function CustomerToVendorReferralPage({ searchParams }) {
  const ref = (searchParams?.ref || '').toString().trim();
  const url = `/register-customer?target=vendor${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
  redirect(url);
}

