'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ArrowRight, ExternalLink } from 'lucide-react';

export default function HomePopupModal() {
  const pathname = usePathname();
  const [popup, setPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPopup = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/popup?t=${Date.now()}`);
        const json = await res.json();

        if (json.success && json.data && json.data.isActive) {
          const popupData = json.data;
          if (isMounted) {
            setPopup(popupData);
            setIsOpen(true); // Open instantly on load / route visit
          }
        } else if (isMounted) {
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Error fetching home popup:', err);
      }
    };

    if (pathname === '/') {
      fetchPopup();
    } else {
      setIsOpen(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !popup || pathname !== '/') return null;

  const targetLink = popup.link && popup.link.trim() ? popup.link.trim() : '/venues';
  const isExternalLink = targetLink.startsWith('http://') || targetLink.startsWith('https://');

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all transform animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={handleClose}
          aria-label="Close popup"
          className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1:1 Square Image Container */}
        {popup.imageUrl && (
          <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden group">
            {isExternalLink ? (
              <a
                href={targetLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="block w-full h-full cursor-pointer"
              >
                <img
                  src={popup.imageUrl}
                  alt={popup.title || 'Announcement'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                  <span className="text-xs font-bold text-white bg-primary-600/90 px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow">
                    Click to Open <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ) : (
              <Link
                href={targetLink}
                onClick={handleClose}
                className="block w-full h-full cursor-pointer"
              >
                <img
                  src={popup.imageUrl}
                  alt={popup.title || 'Announcement'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                  <span className="text-xs font-bold text-white bg-primary-600/90 px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow">
                    Click to Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Text Details & CTA Section */}
        {(popup.title || popup.description || popup.buttonText) && (
          <div className="p-5 sm:p-6 space-y-3 text-center">
            {popup.title && (
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {popup.title}
              </h3>
            )}

            {popup.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {popup.description}
              </p>
            )}

            <div className="pt-2">
              {isExternalLink ? (
                <a
                  href={targetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
                >
                  <span>{popup.buttonText || 'Explore Now'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  href={targetLink}
                  onClick={handleClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
                >
                  <span>{popup.buttonText || 'Explore Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
