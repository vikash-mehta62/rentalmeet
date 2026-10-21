// Uploads files through the backend storage API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Compresses an image client-side to ensure fast uploads on any network.
 * Uses URL.createObjectURL to avoid memory exhaustion on high-resolution camera photos (e.g. 20-50MB).
 * Resizes ultra high-res images to max 2048px and compresses to high-quality JPEG (< 1.8MB).
 */
export const compressImage = async (file, maxSizeBytes = 2 * 1024 * 1024) => {
  if (!file || typeof window === 'undefined') return file;

  // Verify image type or image file extension
  const isImage = (file.type && file.type.startsWith('image/')) ||
                  /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name || '');
  if (!isImage) return file; // Skip PDFs or non-images

  return new Promise((resolve) => {
    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      // Fallback if createObjectURL is not available
      return resolve(file);
    }

    const img = new Image();

    const cleanup = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (_) {}
      }
    };

    img.onload = () => {
      try {
        let { width, height } = img;
        const maxDim = 2048; // Max 2K dimension - crystal clear for venue listings

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return resolve(file);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality JPEG
        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Iteratively reduce quality if still over maxSizeBytes
        while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.4) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Convert dataURL to File Blob
        const arr = dataUrl.split(',');
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: 'image/jpeg' });
        const originalBase = (file.name || 'photo').replace(/\.[^/.]+$/, '');
        const newName = `${originalBase}.jpg`;

        const compressedFile = new File([blob], newName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        cleanup();
        resolve(compressedFile);
      } catch (err) {
        console.warn('Image compression fallback to original:', err);
        cleanup();
        resolve(file);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export const uploadToStorage = async (file, folder = 'venues') => {
  try {
    const fileToUpload = await compressImage(file);
    const base64 = await fileToBase64(fileToUpload);

    let token = null;
    if (typeof window !== 'undefined') {
      const authData = sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage');
      token = authData ? JSON.parse(authData).state?.token : null;
    }

    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        file: base64,
        folder
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      url: data.url,
      publicId: data.publicId,
      format: data.format,
      size: data.size,
      width: data.width,
      height: data.height,
      storage: data.storage
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
};

export const deleteFromStorage = async (publicId) => {
  try {
    let token = null;
    if (typeof window !== 'undefined') {
      const authData = sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage');
      token = authData ? JSON.parse(authData).state?.token : null;
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const encodedPublicId = publicId.replace(/\//g, '--');

    const response = await fetch(`${API_URL}/upload/${encodedPublicId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Storage delete error:', error);
    throw error;
  }
};

export const uploadDocument = async (file, folder = 'documents') => {
  try {
    const fileToUpload = await compressImage(file);
    const base64 = await fileToBase64(fileToUpload);

    let token = null;
    if (typeof window !== 'undefined') {
      const authData = sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage');
      token = authData ? JSON.parse(authData).state?.token : null;
    }

    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload/document`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        file: base64,
        folder
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      url: data.url,
      publicId: data.publicId,
      format: data.format,
      size: data.size,
      resourceType: data.resourceType,
      storage: data.storage
    };
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
