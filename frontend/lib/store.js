import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Auth Store with localStorage persistence
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Theme Store (light/dark) persisted in localStorage
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
      }
    }),
    {
      name: 'theme-storage',
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
