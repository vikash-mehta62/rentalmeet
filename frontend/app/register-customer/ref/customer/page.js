import { redirect } from 'next/navigation';

export default function CustomerToCustomerReferralPage({ searchParams }) {
  const ref = (searchParams?.ref || '').toString().trim();
  const url = `/register-customer?target=customer${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`;
  redirect(url);
}

