'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [contactSettings, setContactSettings] = useState({
    address: 'G-137, Gautam Nagar, Near Chokak Bridge, Bhopal',
    phone: '+91 8423796767',
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
      console.error('Error fetching contact settings:', error);
      // Keep default values if fetch fails
    }
  };

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Browse Venues', href: '/venues' },
    { name: 'Other Services', href: '/services' },
    { name: 'About Us', href: '/about' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Terms & Conditions', href: '/terms' }
  ];

  const socialLinks = [
    { 
      name: 'Facebook', 
      icon: Facebook, 
      url: contactSettings.socialMedia?.facebook,
      show: contactSettings.socialMedia?.facebook 
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      url: contactSettings.socialMedia?.twitter,
      show: contactSettings.socialMedia?.twitter 
    },
    { 
      name: 'Instagram', 
      icon: Instagram, 
      url: contactSettings.socialMedia?.instagram,
      show: contactSettings.socialMedia?.instagram 
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      url: contactSettings.socialMedia?.linkedin,
      show: contactSettings.socialMedia?.linkedin 
    }
  ];

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              Premium meeting venues and event spaces for every occasion. Experience luxury venues with world-class facilities for your corporate events, meetings, and celebrations.
            </p>
            
            {/* Social Media Links */}
            {socialLinks.some(link => link.show) && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-3">Follow Us</h5>
                <div className="flex gap-3">
                  {socialLinks.filter(link => link.show).map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 bg-gray-100 dark:bg-slate-800 hover:bg-[#F59F0A] text-gray-600 dark:text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md"
                        aria-label={link.name}
                        title={link.name}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
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
                  href={`tel:${contactSettings.phone.replace(/\s/g, '')}`} 
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
