'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Image as ImageIcon, Upload, Save, AlertCircle, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function AuthImagesPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for different roles' auth images
  const [images, setImages] = useState({
    customerLogin: null,
    customerRegister: null,
    venueLogin: null,
    venueRegister: null,
    vendorLogin: null,
    vendorRegister: null,
    employeeLogin: null,
  });

  const [previews, setPreviews] = useState({
    customerLogin: '',
    customerRegister: '',
    venueLogin: '',
    venueRegister: '',
    vendorLogin: '',
    vendorRegister: '',
    vendorRegister: '',
    employeeLogin: '',
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentCropKey, setCurrentCropKey] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth-images`);
      const data = await res.json();
      if (data.success && data.data) {
        setPreviews(prev => ({
          ...prev,
          ...data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching auth images:', error);
    }
  };


  const handleImageChange = (role, type, e) => {
    const file = e.target.files[0];
    if (file) {
      const key = `${role}${type}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setCurrentCropKey(key);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        cropImageSrc,
        croppedAreaPixels
      );
      
      const file = new File([croppedImageBlob], 'cropped.jpg', { type: 'image/jpeg' });
      
      setImages(prev => ({ ...prev, [currentCropKey]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [currentCropKey]: reader.result }));
      };
      reader.readAsDataURL(file);
      
      setCropModalOpen(false);
      setCropImageSrc(null);
      setCurrentCropKey(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    }
  };


  const handleSave = async (role, type) => {
    const key = `${role}${type}`;
    const file = images[key];
    
    if (!file) {
      alert('Please select an image first.');
      return;
    }
    
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('role', role);
      formData.append('type', type);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth-images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Image for ${role} ${type} updated successfully!`);
        fetchImages();
      } else {
        alert(data.message || 'Failed to save image.');
      }
      
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image.');
    } finally {
      setSaving(false);
    }
  };

  const renderImageSection = (title, role, type) => {
    const key = `${role}${type}`;
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative">
            {previews[key] ? (
              <img src={previews[key]} alt={`${title} preview`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No image uploaded</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-gray-100">
                <Upload className="w-4 h-4" />
                Change Image
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageChange(role, type, e)} 
                />
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => handleSave(role, type)}
              disabled={!images[key] || saving}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Auth Custom Images" subtitle="Manage background images for login and registration pages">
      <div className="space-y-8">
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Upload custom images for the Login and Registration pages. These images will be displayed on the left/right side of the forms depending on the role. Recommended aspect ratio is 1:1 or 4:3.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Customer Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderImageSection('Customer Login Image', 'customer', 'Login')}
            {renderImageSection('Customer Register Image', 'customer', 'Register')}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Venue Owner Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderImageSection('Venue Owner Login Image', 'venue', 'Login')}
            {renderImageSection('Venue Owner Register Image', 'venue', 'Register')}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Vendor Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderImageSection('Vendor Login Image', 'vendor', 'Login')}
            {renderImageSection('Vendor Register Image', 'vendor', 'Register')}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Employee / Admin Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderImageSection('Employee/Admin Login Image', 'employee', 'Login')}
          </div>
        </div>

      </div>
      {cropModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crop Image</h2>
              <div className="flex items-center gap-4">
                <select 
                  className="px-2 py-1 border rounded text-sm"
                  value={aspect}
                  onChange={(e) => setAspect(Number(e.target.value))}
                >
                  <option value={1}>1:1 (Square)</option>
                  <option value={4/3}>4:3 (Standard)</option>
                  <option value={16/9}>16:9 (Wide)</option>
                  <option value={9/16}>9:16 (Vertical)</option>
                </select>
                <button onClick={() => setCropModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="relative w-full h-[60vh] bg-gray-100">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCropSave}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
