/**
 * Client-Side Custom Event Tracker Utility
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

export async function trackCustomEvent(eventName, eventData = {}, eventCategory = 'engagement') {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = localStorage.getItem('rm_visitor_id');
    const sessionId = sessionStorage.getItem('rm_session_id');
    const visitId = sessionStorage.getItem('rm_current_visit_id');

    if (!visitorId || !sessionId) return;

    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      sessionId,
      visitorId,
      visitId,
      eventName,
      eventCategory,
      eventData,
      path: window.location.pathname
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/analytics/track-event`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }).catch(err => console.warn('[Analytics] Failed to send event:', err.message));
  } catch (e) {
    console.warn('[Analytics] Error tracking event:', e.message);
  }
}
