import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Auth Store with localStorage persistence
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Venue Form Store with localStorage persistence
export const useVenueFormStore = create(
  persist(
    (set) => ({
      formData: {
        step: 1,
        basicInfo: {},
        location: {},
        amenities: {},
        pricing: {},
        availability: {},
        images: [],
        ownerInfo: {},
        documents: {},
        bankDetails: {},
        termsAccepted: false,
      },
      setFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),
      setStep: (step) => set((state) => ({
        formData: { ...state.formData, step }
      })),
      resetForm: () => set({
        formData: {
          step: 1,
          basicInfo: {},
          location: {},
          amenities: {},
          pricing: {},
          availability: {},
          images: [],
          ownerInfo: {},
          documents: {},
          bankDetails: {},
          termsAccepted: false,
        }
      }),
    }),
    {
      name: 'venue-form-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
