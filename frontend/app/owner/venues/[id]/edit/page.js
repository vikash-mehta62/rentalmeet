'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import OwnerVenueEditModal from '@/components/venue/OwnerVenueEditModal';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditVenue() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    if (!token) {
      alert('Please login first');
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'owner') {
      alert('Only venue owners can edit venues');
      router.push('/');
      return;
    }

    if (params.id) {
      fetchVenueData();
    }
  }, [token, user, params.id, router]);

  const fetchVenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/${params.id}/edit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch venue');

      const data = await response.json();
      const venueData = data.venue || data;
      setVenue(venueData);
    } catch (error) {
      console.error('Error fetching venue:', error);
      toast.error('Failed to load venue data');
      router.push('/owner/venues');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <Navbar />

      {modalOpen && venue && (
        <OwnerVenueEditModal
          isOpen={modalOpen}
          venue={venue}
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
