'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

// WhatsApp icon (not in lucide)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [contactSettings, setContactSettings] = useState({
    address: 'G-137, Gautam Nagar, Near Chetak Bridge, Bhopal',
    phone: '+91 9425796767',
    email: 'booking@rentalmeet.in',
    availability: '24/7 Available',
    socialMedia: {}
  });

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact-settings`);
      const data = await response.json();
      if (data.success && data.data) {
        setContactSettings(data.data);
      }
    } catch (error) {
      // Keep default values if fetch fails
    }
  };

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Browse Venues', href: '/venues' },
    { name: 'Premium Services', href: '/other-services' },
    { name: 'About Us', href: '/about' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Terms & Conditions', href: '/terms' },
  ];

  const businessLinks = [
    { name: 'List Your Venue', href: '/register-venue' },
    { name: 'Register as Vendor', href: '/register' },
    { name: 'Client Registration', href: '/register' },
    { name: 'Pricing & Plans', href: '/venues' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ];

  const socialLinks = [
    { name: 'Facebook',  Icon: Facebook,     key: 'facebook'  },
    { name: 'Instagram', Icon: Instagram,     key: 'instagram' },
    { name: 'Twitter',   Icon: Twitter,       key: 'twitter'   },
    { name: 'YouTube',   Icon: Youtube,       key: 'youtube'   },
    { name: 'LinkedIn',  Icon: Linkedin,      key: 'linkedin'  },
    { name: 'WhatsApp',  Icon: WhatsAppIcon,  key: 'whatsapp'  },
  ];

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4 group">
              <img
                src="/logo.png"
                alt="RentalMeet Logo"
                className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Premium meeting spaces and event venues for every occasion. Experience luxury venues with world-class facilities for your corporate events, meetings, and celebrations.
            </p>

            {/* Social Media — always show heading, show icons if available */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-3">Follow Us</h5>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(({ name, Icon, key }) => {
                  const url = contactSettings.socialMedia?.[key];
                  if (!url) return null;
                  return (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 dark:bg-slate-800 hover:bg-[#F59F0A] text-gray-600 dark:text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md"
                      aria-label={name}
                      title={name}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 dark:text-slate-300 hover:text-[#F59F0A] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">For Business</h4>
            <ul className="space-y-2">
              {businessLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 dark:text-slate-300 hover:text-[#F59F0A] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F59F0A] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">
                  {contactSettings.address}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F59F0A] flex-shrink-0" />
                <a
                  href={`tel:${contactSettings.phone?.replace(/\s/g, '')}`}
                  className="text-sm text-gray-600 dark:text-slate-300 hover:text-[#F59F0A] transition-colors"
                >
                  {contactSettings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F59F0A] flex-shrink-0" />
                <a
                  href={`mailto:${contactSettings.email}`}
                  className="text-sm text-gray-600 dark:text-slate-300 hover:text-[#F59F0A] transition-colors"
                >
                  {contactSettings.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F59F0A] flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-slate-300">{contactSettings.availability}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              © {currentYear} RentalMeet. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
              Made with care for businesses across Madhya Pradesh &amp; Rajasthan
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 dark:text-slate-400 hover:text-[#F59F0A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 dark:text-slate-400 hover:text-[#F59F0A] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
