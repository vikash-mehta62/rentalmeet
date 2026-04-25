'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Briefcase, GraduationCap, Utensils, TreePine, Monitor, Landmark, BedDouble, UtensilsCrossed, School, PartyPopper, Leaf, Laptop, BookOpen, Home, Flower2 } from 'lucide-react';

const staticCategories = [
  { name: 'Meeting Hall',        icon: Building2,      count: 48, price: 1000 },
  { name: 'Farm House',          icon: TreePine,       count: 32, price: 3000 },
  { name: 'Conference Hall',     icon: Monitor,        count: 56, price: 5000 },
  { name: 'Govt. Auditorium',    icon: Landmark,       count: 18, price: 3000 },
  { name: 'Hotel',               icon: BedDouble,      count: 74, price: 4000 },
  { name: 'Private Auditorium',  icon: Briefcase,      count: 22, price: 6000 },
  { name: 'Restaurant',          icon: UtensilsCrossed,count: 61, price: 2000 },
  { name: 'School Auditorium',   icon: School,         count: 29, price: 2500 },
  { name: 'Function Hall',       icon: PartyPopper,    count: 85, price: 7000 },
  { name: 'College Auditorium',  icon: GraduationCap,  count: 24, price: 3000 },
  { name: 'Open Lawn',           icon: Leaf,           count: 43, price: 5000 },
  { name: 'Co-Work Space',       icon: Laptop,         count: 37, price: 500 },
  { name: 'Banquet Hall',        icon: Utensils,       count: 69, price: 6000 },
  { name: 'Guest House',         icon: Home,           count: 41, price: 1500 },
  { name: 'Training Center',     icon: BookOpen,       count: 28, price: 2000 },
  { name: 'Marriage Garden',     icon: Flower2,        count: 53, price: 8000 },
];

export default function VenueCategoriesSection() {
  const router = useRouter();
  const [categories, setCategories] = useState(staticCategories);

  useEffect(() => {
    const iconPriceMap = Object.fromEntries(
      staticCategories.map(c => [c.name, { icon: c.icon, price: c.price }])
    );

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types`).then(r => r.json()).catch(() => ({})),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues`).then(r => r.json()).catch(() => ({})),
    ])
      .then(([typesRes, venuesRes]) => {
        const typeNames = typesRes?.success && typesRes.venueTypes?.length
          ? typesRes.venueTypes.map(vt => vt.name)
          : staticCategories.map(c => c.name);

        const venues = venuesRes?.success && Array.isArray(venuesRes.venues) ? venuesRes.venues : [];
        const counts = {};

        venues.forEach((venue) => {
          const types = Array.isArray(venue.venueType)
            ? venue.venueType
            : venue.venueType
              ? [venue.venueType]
              : [];

          types.forEach((typeName) => {
            if (!typeName) return;
            counts[typeName] = (counts[typeName] || 0) + 1;
          });
        });

        const merged = typeNames.map((name, i) => {
          const fallback = staticCategories[i % staticCategories.length];
          return {
            name,
            icon: iconPriceMap[name]?.icon || fallback.icon || Building2,
            price: iconPriceMap[name]?.price ?? fallback.price ?? 0,
            count: counts[name] || 0,
          };
        });

        setCategories(merged);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-5 lg:py-5 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Browse by Category</p>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Venue Categories
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            From intimate meeting halls to grand marriage gardens - find the perfect venue type for your meeting hall and events.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => router.push(`/venues?type=${encodeURIComponent(cat.name)}`)}
                className="group flex flex-col items-center text-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs leading-tight text-gray-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors">{cat.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{cat.count} venues</p>
                  <p className="text-[10px] text-primary-500 font-medium mt-0.5">Rs.{cat.price.toLocaleString()}/hr</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* View All */}
        <div className="text-center mt-5">
          <button
            onClick={() => router.push('/venues')}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-500 transition-all"
          >
            Browse All Categories <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

