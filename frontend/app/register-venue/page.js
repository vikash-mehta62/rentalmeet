'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import OwnerVenueEditModal from '@/components/venue/OwnerVenueEditModal';
import { Building2, Plus, Sparkles, ShieldCheck } from 'lucide-react';

export default function RegisterVenue() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(true);

  // Protect route - only logged-in owners can access
  useEffect(() => {
    if (!token) {
      alert('Please login first to register your venue');
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'owner') {
      alert('Only venue owners can register venues');
      router.push('/');
      return;
    }
  }, [token, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-[120px]">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-bold font-heading text-dark-800 mb-2">
            Register Your <span className="text-primary-600">Venue</span>
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            List your venue on RentalMeet with our quick 10-section single-tab save process.
          </p>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Open Venue Registration Form
          </button>
        </div>
      </div>

      {/* 10-Tab Registration Modal */}
      {modalOpen && (
        <OwnerVenueEditModal
          isOpen={modalOpen}
          venue={null}
          onClose={() => {
            setModalOpen(false);
            router.push('/owner/venues');
          }}
          onSaveSuccess={() => {
            router.push('/owner/venues');
          }}
        />
      )}
    </div>
  );
}
