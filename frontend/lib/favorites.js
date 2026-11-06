'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const VENUES_STORAGE_KEY = 'favoriteVenues';
const SERVICES_STORAGE_KEY = 'favoriteServices';
const CHANGE_EVENT = 'rentalmeet_favorites_changed';

/**
 * Safe local storage read
 */
function readStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Safe local storage write and dispatch sync event
 */
function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key, value } }));
  } catch (e) {
    console.error('Failed to save favorites to localStorage:', e);
  }
}

/**
 * Get all favorited venue identifiers (IDs or SKUs)
 */
export function getFavoriteVenues() {
  return readStorage(VENUES_STORAGE_KEY);
}

/**
 * Get all favorited service identifiers (IDs or Slugs)
 */
export function getFavoriteServices() {
  return readStorage(SERVICES_STORAGE_KEY);
}

/**
 * Check if a venue is favorited
 */
export function isVenueFavorite(idOrSku) {
  if (!idOrSku) return false;
  const list = getFavoriteVenues();
  return list.includes(String(idOrSku));
}

/**
 * Check if a service is favorited
 */
export function isServiceFavorite(idOrSlug) {
  if (!idOrSlug) return false;
  const list = getFavoriteServices();
  return list.includes(String(idOrSlug));
}

/**
 * Toggle venue favorite state
 * @param {string|Object} venue - Venue ID/SKU or Venue object
 * @param {boolean} [silent=false] - Suppress toast
 * @returns {boolean} New favorite state
 */
export function toggleVenueFavorite(venue, silent = false) {
  const identifier = typeof venue === 'string' ? venue : (venue?.sku || venue?._id);
  if (!identifier) return false;

  const stringId = String(identifier);
  const current = getFavoriteVenues();
  const exists = current.includes(stringId);

  let updated;
  if (exists) {
    updated = current.filter(x => x !== stringId);
    if (!silent) toast('Removed from favorites', { icon: '🤍' });
  } else {
    updated = [stringId, ...current.filter(x => x !== stringId)];
    const venueName = typeof venue === 'object' ? venue?.businessName : '';
    if (!silent) {
      toast.success(venueName ? `Added ${venueName} to favorites!` : 'Added to favorites ❤️');
    }
  }

  writeStorage(VENUES_STORAGE_KEY, updated);
  return !exists;
}

/**
 * Toggle service favorite state
 * @param {string|Object} service - Service ID/Slug or Service object
 * @param {boolean} [silent=false] - Suppress toast
 * @returns {boolean} New favorite state
 */
export function toggleServiceFavorite(service, silent = false) {
  const identifier = typeof service === 'string' ? service : (service?.slug || service?._id);
  if (!identifier) return false;

  const stringId = String(identifier);
  const current = getFavoriteServices();
  const exists = current.includes(stringId);

  let updated;
  if (exists) {
    updated = current.filter(x => x !== stringId);
    if (!silent) toast('Removed from favorites', { icon: '🤍' });
  } else {
    updated = [stringId, ...current.filter(x => x !== stringId)];
    const serviceTitle = typeof service === 'object' ? service?.title : '';
    if (!silent) {
      toast.success(serviceTitle ? `Added ${serviceTitle} to favorites!` : 'Added to favorites ❤️');
    }
  }

  writeStorage(SERVICES_STORAGE_KEY, updated);
  return !exists;
}

/**
 * React Hook for consuming and managing favorites in real-time
 */
export function useFavorites() {
  const [favoriteVenues, setFavoriteVenues] = useState([]);
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const sync = useCallback(() => {
    setFavoriteVenues(getFavoriteVenues());
    setFavoriteServices(getFavoriteServices());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    sync();

    const handleCustomChange = () => sync();
    const handleStorageChange = (e) => {
      if (e.key === VENUES_STORAGE_KEY || e.key === SERVICES_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener(CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sync]);

  const isVenueFav = useCallback(
    (idOrSku) => Boolean(idOrSku && favoriteVenues.includes(String(idOrSku))),
    [favoriteVenues]
  );

  const isServiceFav = useCallback(
    (idOrSlug) => Boolean(idOrSlug && favoriteServices.includes(String(idOrSlug))),
    [favoriteServices]
  );

  return {
    favoriteVenues,
    favoriteServices,
    venuesCount: favoriteVenues.length,
    servicesCount: favoriteServices.length,
    totalFavoritesCount: favoriteVenues.length + favoriteServices.length,
    isLoaded,
    isVenueFav,
    isServiceFav,
    toggleVenue: toggleVenueFavorite,
    toggleService: toggleServiceFavorite
  };
}
