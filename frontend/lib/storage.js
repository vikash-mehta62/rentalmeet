// Uploads files through the backend storage API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const uploadToStorage = async (file, folder = 'venues') => {
  try {
    const base64 = await fileToBase64(file);

    const authData = sessionStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state?.token : null;

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
    const authData = sessionStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state?.token : null;

    if (!token) {
      throw new Error('Authentication required');
    }

    const encodedPublicId = publicId.replace(/\//g, '--');

    const response = await fetch(`${API_URL}/upload/${encodedPublicId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    const base64 = await fileToBase64(file);

    const authData = sessionStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state?.token : null;

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/upload/document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
