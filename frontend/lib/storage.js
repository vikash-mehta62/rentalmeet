// Uploads files through the backend storage API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Compresses an image client-side to ensure it stays well under maxSizeBytes (default 4.5MB).
 * Also scales down ultra high-res photos (e.g. 48MP/108MP mobile camera) to max 2560px.
 */
export const compressImage = async (file, maxSizeBytes = 4.5 * 1024 * 1024) => {
  if (!file || typeof window === 'undefined') return file;
  if (!file.type || !file.type.startsWith('image/')) return file; // Skip PDFs or non-images

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxDim = 2560; // Max dimension in pixels

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
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format
          const isPng = file.type === 'image/png';
          // If PNG is large (>2MB), convert to JPEG for drastic size reduction
          const outputFormat = isPng && file.size > 2 * 1024 * 1024 ? 'image/jpeg' : (file.type || 'image/jpeg');

          let quality = 0.85;
          let dataUrl = canvas.toDataURL(outputFormat, quality);

          // Iteratively reduce quality if still over maxSizeBytes
          while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.3) {
            quality -= 0.15;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Convert dataURL back to File/Blob
          const arr = dataUrl.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : outputFormat;
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const newName = outputFormat === 'image/jpeg' && !file.name.match(/\.(jpe?g)$/i)
            ? file.name.replace(/\.[^/.]+$/, "") + ".jpg"
            : file.name;

          const compressedFile = new File([blob], newName, {
            type: mime,
            lastModified: Date.now()
          });

          resolve(compressedFile);
        } catch (err) {
          console.warn('Image compression fallback to original:', err);
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
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
