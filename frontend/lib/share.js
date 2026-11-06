'use client';

import toast from 'react-hot-toast';

/**
 * Universal Share Helper
 * Supports native Web Share API with clipboard fallback
 * @param {Object} options
 * @param {string} options.title - Title of the shared content
 * @param {string} options.text - Description or caption
 * @param {string} options.url - Full URL to share
 */
export async function shareItem({ title, text, url }) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareData = {
    title: title || 'RentalMeet',
    text: text || 'Check out this listing on RentalMeet',
    url: shareUrl
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (err) {
      if (err?.name === 'AbortError') {
        // User cancelled share dialog — do nothing
        return { success: false, cancelled: true };
      }
      // If share fails, fall through to clipboard copy
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard! 📋');
      return { success: true, method: 'clipboard' };
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }

  // Last resort fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success('Link copied to clipboard! 📋');
    return { success: true, method: 'execCommand' };
  } catch {
    toast.error('Unable to copy link');
    return { success: false };
  }
}
