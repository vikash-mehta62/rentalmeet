import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Auth Store — sessionStorage (cleared on tab close, safer than localStorage)
// Token is never stored in a cookie to avoid CSRF, sessionStorage is XSS-mitigated by CSP
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        // Set a non-sensitive cookie as auth signal for middleware
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-present=1; path=/; SameSite=Strict';
        }
      },
      updateUser: (user) => set((state) => ({
        user: {
          ...state.user,
          ...user,
          // Deep merge nested objects so kyc/permissions aren't wiped by shallow spread
          kyc: user.kyc !== undefined ? user.kyc : state.user?.kyc,
          permissions: user.permissions !== undefined ? user.permissions : state.user?.permissions,
        }
      })),
      logout: () => {
        set({ user: null, token: null });
        // Clear auth signal cookie and sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-storage');
          document.cookie = 'auth-present=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        }
      },
      // Check if token is expired (JWT exp claim)
      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
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

// Venue Form Store — persisted but sensitive fields (bankDetails, documents) excluded
export const useVenueFormStore = create(
  persist(
    (set) => ({
      formData: {
        step: 1,
        basicInfo: { foodType: 'Veg' },
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
          basicInfo: { foodType: 'Veg' },
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
      // Never persist sensitive fields to localStorage
      partialize: (state) => ({
        formData: {
          ...state.formData,
          bankDetails: {},    // never store bank details
          documents: {},      // never store document URLs
        }
      }),
    }
  )
);
