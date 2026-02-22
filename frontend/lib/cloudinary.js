// Cloudinary upload utility
// Uploads files via backend API for better security

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const uploadToCloudinary = async (file, folder = 'venues') => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Get token from localStorage
    const authData = localStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state.token : null;
    
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
        folder: folder
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
      height: data.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    // Get token from localStorage
    const authData = localStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state.token : null;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Replace / with -- for URL encoding
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
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Upload document (PDF, images, etc.)
export const uploadDocument = async (file, folder = 'documents') => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Get token from localStorage
    const authData = localStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData).state.token : null;
    
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
        folder: folder
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
      resourceType: data.resourceType
    };
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
