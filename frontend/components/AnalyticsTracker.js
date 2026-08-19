'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

/**
 * Safely extracts auth token from localStorage or Zustand useAuthStore ('auth-storage' in sessionStorage)
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  const directToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (directToken) return directToken;

  try {
    const authStorage = sessionStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch (e) {}

  return null;
}

function AnalyticsTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token: storeToken } = useAuthStore();

  const currentVisitIdRef = useRef(null);
  const activeSecondsRef = useRef(0);
  const heartbeatTimerRef = useRef(null);
  const lastTickTimeRef = useRef(Date.now());

  // Initialize or get Visitor ID & UTM Attribution
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Persistent Visitor ID (Unique Device/Browser)
    let visitorId = localStorage.getItem('rm_visitor_id');
    if (!visitorId) {
      visitorId = `vtr_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem('rm_visitor_id', visitorId);
    }

    // 2. Parse UTM Parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    const utmTerm = urlParams.get('utm_term');

    if (utmSource || utmCampaign) {
      const utmObj = {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        term: utmTerm
      };

      if (!localStorage.getItem('rm_first_touch_utm')) {
        localStorage.setItem('rm_first_touch_utm', JSON.stringify(utmObj));
      }
      sessionStorage.setItem('rm_last_touch_utm', JSON.stringify(utmObj));
    }
  }, []);

  // Send duration update via Beacon or Fetch
  const sendDurationBeacon = (visitId, activeSec) => {
    if (!visitId || activeSec <= 0) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const payload = JSON.stringify({ visitId, activeSeconds: activeSec });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${apiUrl}/analytics/track-duration`, blob);
    } else {
      fetch(`${apiUrl}/analytics/track-duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  };

  // Main Tracking Effect on Route Change or Auth User Change
  useEffect(() => {
    if (typeof window === 'undefined' || pathname?.startsWith('/admin')) return;

    // Send final duration for previous visit if switching pages
    if (currentVisitIdRef.current) {
      sendDurationBeacon(currentVisitIdRef.current, activeSecondsRef.current);
    }

    // Reset active timer for new page load
    activeSecondsRef.current = 0;
    lastTickTimeRef.current = Date.now();

    const visitorId = localStorage.getItem('rm_visitor_id') || `vtr_${Date.now()}`;
    const sessionId = sessionStorage.getItem('rm_session_id') || null;
    const firstTouch = JSON.parse(localStorage.getItem('rm_first_touch_utm') || '{}');
    const lastTouch = JSON.parse(sessionStorage.getItem('rm_last_touch_utm') || '{}');

    // Extract Auth Token (from store or storage)
    const activeToken = storeToken || getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

    // Extract Logged-In User Information directly from store
    const userInfo = user ? {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role
    } : null;

    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // 1. Post Visit Telemetry
    fetch(`${apiUrl}/analytics/track-visit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visitorId,
        sessionId,
        path,
        pageTitle: document.title || 'RentalMeet',
        referrer: document.referrer || 'Direct',
        firstTouch,
        lastTouch,
        userInfo
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && !data.skipped) {
          currentVisitIdRef.current = data.visitId;
          sessionStorage.setItem('rm_current_visit_id', data.visitId);
          sessionStorage.setItem('rm_session_id', data.sessionId);
        }
      })
      .catch(err => console.warn('[AnalyticsTracker] Failed to record visit:', err.message));

    // 2. Tab-Visibility Aware Active Dwell-Time Timer (15-second Heartbeat)
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

    heartbeatTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTickTimeRef.current) / 1000);
        lastTickTimeRef.current = now;

        if (deltaSeconds > 0 && deltaSeconds < 60) {
          activeSecondsRef.current += deltaSeconds;

          if (currentVisitIdRef.current) {
            fetch(`${apiUrl}/analytics/track-duration`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                visitId: currentVisitIdRef.current,
                activeSeconds: activeSecondsRef.current
              })
            }).catch(() => {});
          }
        }
      } else {
        lastTickTimeRef.current = Date.now();
      }
    }, 15000);

    // 3. Tab Visibility & Page Exit Handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (currentVisitIdRef.current) {
          sendDurationBeacon(currentVisitIdRef.current, activeSecondsRef.current);
        }
      } else {
        lastTickTimeRef.current = Date.now();
      }
    };

    const handlePageHide = () => {
      if (currentVisitIdRef.current) {
        sendDurationBeacon(currentVisitIdRef.current, activeSecondsRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);

      if (currentVisitIdRef.current) {
        sendDurationBeacon(currentVisitIdRef.current, activeSecondsRef.current);
      }
    };
  }, [pathname, searchParams, user, storeToken]);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerContent />
    </Suspense>
  );
}
