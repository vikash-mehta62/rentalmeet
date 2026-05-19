'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

// ── Social icon SVGs (matching react-icons/si style) ─────────────────────
const FacebookIcon  = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const InstagramIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const XIcon        = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const YoutubeIcon  = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const LinkedinIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const WhatsappIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

const SOCIAL_DEFS = [
  { key: 'facebook',  Icon: FacebookIcon,  label: 'Facebook',    color: 'hover:text-blue-600'  },
  { key: 'instagram', Icon: InstagramIcon, label: 'Instagram',   color: 'hover:text-pink-500'  },
  { key: 'twitter',   Icon: XIcon,         label: 'X (Twitter)', color: 'hover:text-gray-900'  },
  { key: 'youtube',   Icon: YoutubeIcon,   label: 'YouTube',     color: 'hover:text-red-600'   },
  { key: 'linkedin',  Icon: LinkedinIcon,  label: 'LinkedIn',    color: 'hover:text-blue-700'  },
  { key: 'whatsapp',  Icon: WhatsappIcon,  label: 'WhatsApp',    color: 'hover:text-green-500' },
];

const quickLinks = [
  // { name: 'Home',               href: '/'               },
  // { name: 'Browse Venues',      href: '/venues'         },
  // { name: 'Premium Services',   href: '/other-services' },
  { name: 'How to Use',         href: '/faqs'           },
  { name: 'About Us',           href: '/about'          },
  { name: 'FAQs',               href: '/faqs'           },
  { name: 'Terms & Conditions', href: '/terms'          },
];

const businessLinks = [
  { name: 'List Your Venue',    href: '/register-venue'     },
  { name: 'Register as Vendor', href: '/register?role=vendor'},
  { name: 'User Registration',  href: '/register-customer'  },
  { name: 'Privacy Policy',     href: '/privacy'        },
  { name: 'Terms of Service',   href: '/terms'          },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [contact, setContact] = useState({
    address:      'G-137, Gautam Nagar, Near Chetak Bridge, Bhopal',
    address2:     '',
    phone:        '+91 9425796767',
    phone2:       '',
    email:        'booking@rentalmeet.com',
    email2:       '',
    availability: '24/7 Available',
    socialMedia:  {},
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact-settings`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setContact(prev => ({ ...prev, ...d.data, socialMedia: { ...prev.socialMedia, ...(d.data.socialMedia || {}) } })); })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">

        {/* 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Col 1 — Brand */}
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-2 mb-2 group">
              <img
                src="/logo.png"
                alt="RentalMeet"
                className="h-12 sm:h-16 lg:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <div className="mb-8 flex gap-2">
              <span className="text-7xl text-primary-300 dark:text-primary-700 font-serif leading-[0.8] select-none flex-shrink-0 self-start -mt-3">&ldquo;</span>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed flex-1 self-center">
                Premium meeting spaces and event venues for every occasion. Experience luxury venues with world-class facilities for your corporate events, meetings, and celebrations.
              </p>
              <span className="text-7xl text-primary-300 dark:text-primary-700 font-serif leading-[0.8] select-none flex-shrink-0 self-end -mb-3">&rdquo;</span>
            </div>

            {/* Social links */}
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
                Follow Us
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {SOCIAL_DEFS.map(({ key, Icon, label, color }) => {
                  const url = contact.socialMedia?.[key];
                  if (!url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`text-gray-400 dark:text-slate-500 transition-colors ${color} p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800`}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              {quickLinks.map(item => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — For Business */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">For Business</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              {businessLinks.map(item => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                <span>{contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <a href={`tel:${contact.phone?.replace(/\s/g,'')}`} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                  {contact.email}
                </a>
              </li>
              {contact.address2 && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                  <span>{contact.address2}</span>
                </li>
              )}
              {contact.phone2 && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  <a href={`tel:${contact.phone2?.replace(/\s/g,'')}`} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                    {contact.phone2}
                  </a>
                </li>
              )}
              {contact.email2 && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  <a href={`mailto:${contact.email2}`} className="hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                    {contact.email2}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <span> {contact.availability}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400 dark:text-slate-500">
            &copy; {year} RentalMeet. All rights reserved.
          </p>
          
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-gray-400 dark:text-slate-500 hover:text-primary-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 dark:text-slate-500 hover:text-primary-500 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
