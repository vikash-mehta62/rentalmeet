'use client';

/**
 * Get or generate a persistent unique device ID for guest/user tracking
 */
export const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem('rm_device_id');
  if (!deviceId) {
    // Generate a simple UUID-like string
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('rm_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Register FCM device token with the backend (handles guest and authenticated user automatically)
 * @param {string} fcmToken 
 * @param {string} token - Optional Auth Bearer Token (if logged in)
 */
export const registerFCMToken = async (fcmToken, token = null) => {
  try {
    if (!fcmToken) return null;
    
    const deviceId = getOrCreateDeviceId();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/register-device`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deviceId,
        fcmToken,
        platform: 'web'
      })
    });
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[PUSH CLIENT] Failed to register device token:', err.message);
    return null;
  }
};

/**
 * Unlink user from device token on logout
 */
export const logoutFCMDevice = async () => {
  try {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/device/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceId })
    });
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[PUSH CLIENT] Failed to logout device token:', err.message);
    return null;
  }
};
