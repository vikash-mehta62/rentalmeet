'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const roomTypes = [
    { name: 'Meeting Room', href: '/venues?type=meeting' },
    { name: 'Function Hall', href: '/venues?type=function' },
    { name: 'Open Lawn', href: '/venues?type=lawn' },
    { name: 'Auditorium', href: '/venues?type=auditorium' },
    { name: 'Banquet Hall', href: '/venues?type=banquet' },
    { name: 'Farm House', href: '/venues?type=farmhouse' }
  ];

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Browse Spaces', href: '/venues' },
    { name: 'Other Services', href: '/services' },
    { name: 'About Us', href: '/about' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Terms & Conditions', href: '/terms' }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#F89D09] rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">RentalMeet</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Premium meeting spaces and event venues for every occasion. Experience luxury venues with world-class facilities for your corporate events, meetings, and celebrations.
            </p>
          </div>

          {/* Room Types */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Room Types</h4>
            <ul className="space-y-2">
              {roomTypes.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-[#F89D09] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-[#F89D09] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F89D09] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  G-137, Gautam Nagar, Near Chokak Bridge, Bhopal
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F89D09] flex-shrink-0" />
                <a href="tel:+918423796767" className="text-sm text-gray-600 hover:text-[#F89D09] transition-colors">
                  +91 8423796767
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F89D09] flex-shrink-0" />
                <a href="mailto:booking@rentalmeet.in" className="text-sm text-gray-600 hover:text-[#F89D09] transition-colors">
                  booking@rentalmeet.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F89D09] flex-shrink-0" />
                <span className="text-sm text-gray-600">24/7 Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} RentalMeet. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#F89D09] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-[#F89D09] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
