import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import venueTypeData, { getVenueTypeBySlug } from '@/data/venueTypeData';

const BASE_URL = 'https://rentalmeet.com';

// Tell Next.js all valid slugs at build time
export function generateStaticParams() {
  return venueTypeData.map(v => ({ slug: v.slug }));
}

// Generate metadata dynamically per slug
export async function generateMetadata({ params }) {
  const data = getVenueTypeBySlug(params.slug);
  if (!data) return {};

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      url: `${BASE_URL}/venues/type/${data.slug}`,
      siteName: 'RentalMeet',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
          alt: data.label,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: [`${BASE_URL}/android-chrome-512x512.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/venues/type/${data.slug}`,
    },
  };
}

export default function VenueTypePage({ params }) {
  const data = getVenueTypeBySlug(params.slug);

  if (!data) notFound();

  const filterUrl = `/venues?venueType=${encodeURIComponent(data.dbName)}`;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950">
      <Navbar />

      <main className="pt-28 lg:pt-32 pb-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6"
        >
          <ol className="flex items-center gap-2 text-xs text-slate-400">
            <li>
              <Link href="/" className="hover:text-primary-500 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/venues" className="hover:text-primary-500 transition-colors">
                Venues
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-600 dark:text-slate-300 font-medium">{data.label}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="inline-block border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {data.label}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-5">
            {data.h1}
          </h1>
          {data.intro.map((para, i) => (
            <p
              key={i}
              className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-4"
            >
              {para}
            </p>
          ))}
          <div className="mt-8">
            <Link
              href={filterUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59F0A] hover:bg-[#D97706] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm"
            >
              Browse {data.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Suitable For */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
              Suitable For
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.suitableFor.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Other venue type links */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Explore Other Venue Types
          </h2>
          <div className="flex flex-wrap gap-2">
            {venueTypeData
              .filter(v => v.slug !== data.slug)
              .map(v => (
                <Link
                  key={v.slug}
                  href={`/venues/type/${v.slug}`}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-primary-300 text-slate-600 dark:text-slate-300 hover:text-primary-600 rounded-full text-xs font-medium transition-all"
                >
                  {v.label}
                </Link>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
