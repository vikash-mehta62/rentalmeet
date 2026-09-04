'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Image as ImageIcon,
  Upload,
  Save,
  AlertCircle,
  X,
  Sparkles,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function AuthImagesPage() {
  const { token } = useAuthStore();

  // ================= HOME POPUP BANNER STATE =================
  const [popupData, setPopupData] = useState({
    title: '',
    description: '',
    link: '',
    buttonText: 'Explore Now',
    imageUrl: '',
    isActive: true
  });
  const [popupFile, setPopupFile] = useState(null);
  const [popupPreview, setPopupPreview] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', text: '' });
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  // ================= AUTH IMAGES STATE =================
  const [images, setImages] = useState({
    customerLogin: null,
    customerRegister: null,
    venueLogin: null,
    venueRegister: null,
    vendorLogin: null,
    vendorRegister: null,
    employeeLogin: null,
    ambassadorLogin: null,
  });

  const [previews, setPreviews] = useState({
    customerLogin: '',
    customerRegister: '',
    venueLogin: '',
    venueRegister: '',
    vendorLogin: '',
    vendorRegister: '',
    employeeLogin: '',
    ambassadorLogin: '',
  });

  const [saving, setSaving] = useState(false);

  // ================= CROPPER MODAL STATE =================
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1); // Default 1:1
  const [isFixedSquare, setIsFixedSquare] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentCropKey, setCurrentCropKey] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPopupDetails();
      fetchAuthImages();
    }
  }, [token]);

  // Fetch Home Popup Banner
  const fetchPopupDetails = async () => {
    if (!token) return;
    setPopupLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/popup/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPopupData({
          title: data.data.title || '',
          description: data.data.description || '',
          link: data.data.link || '',
          buttonText: data.data.buttonText || 'Explore Now',
          imageUrl: data.data.imageUrl || '',
          isActive: data.data.isActive !== undefined ? data.data.isActive : true
        });
        setPopupPreview(data.data.imageUrl || '');
      }
    } catch (error) {
      console.error('Error fetching popup details:', error);
    } finally {
      setPopupLoading(false);
    }
  };

  // Fetch Auth Images
  const fetchAuthImages = async () => {
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

  // 1:1 Crop Handler for Popup Banner
  const handlePopupImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setCurrentCropKey('HOME_POPUP');
        setAspect(1); // Locked 1:1 for Popup
        setIsFixedSquare(true);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auth Image Select Handler
  const handleAuthImageChange = (role, type, e) => {
    const file = e.target.files[0];
    if (file) {
      const key = `${role}${type}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setCurrentCropKey(key);
        setAspect(4 / 3);
        setIsFixedSquare(false);
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
      const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedImageBlob], 'cropped.jpg', { type: 'image/jpeg' });

      if (currentCropKey === 'HOME_POPUP') {
        setPopupFile(file);
        setIsImageRemoved(false);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPopupPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImages(prev => ({ ...prev, [currentCropKey]: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({ ...prev, [currentCropKey]: reader.result }));
        };
        reader.readAsDataURL(file);
      }

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

  // Save Home Popup Banner
  const handleSavePopup = async (e) => {
    if (e) e.preventDefault();
    setPopupSaving(true);
    setPopupMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', popupData.title || '');
      formData.append('description', popupData.description || '');
      formData.append('link', popupData.link || '');
      formData.append('buttonText', popupData.buttonText || 'Explore Now');
      formData.append('isActive', popupData.isActive ? 'true' : 'false');

      if (popupFile) {
        formData.append('image', popupFile);
      } else if (isImageRemoved || (!popupPreview && !popupData.imageUrl)) {
        formData.append('removeImage', 'true');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/popup/admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setPopupMessage({ type: 'success', text: 'Home Popup Banner updated successfully! Changes are live on the home page.' });
        setPopupFile(null);
        setIsImageRemoved(false);
        if (data.data) {
          setPopupData({
            title: data.data.title || '',
            description: data.data.description || '',
            link: data.data.link || '',
            buttonText: data.data.buttonText || 'Explore Now',
            imageUrl: data.data.imageUrl || '',
            isActive: data.data.isActive
          });
          setPopupPreview(data.data.imageUrl || '');
        }
      } else {
        setPopupMessage({ type: 'error', text: data.message || 'Failed to save popup banner.' });
      }
    } catch (error) {
      console.error('Error saving popup:', error);
      setPopupMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setPopupSaving(false);
    }
  };

  // Remove Popup Image
  const handleRemovePopupImage = () => {
    setPopupFile(null);
    setPopupPreview('');
    setPopupData(prev => ({ ...prev, imageUrl: '' }));
    setIsImageRemoved(true);
  };

  // Save Auth Images
  const handleSaveAuthImage = async (role, type) => {
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(`Image for ${role} ${type} updated successfully!`);
        fetchAuthImages();
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
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">{title}</h3>
        <div className="space-y-4">
          <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden flex items-center justify-center relative">
            {previews[key] ? (
              <img src={previews[key]} alt={`${title} preview`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No image uploaded</p>
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-white text-gray-800 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-gray-100 shadow-md">
                <Upload className="w-3.5 h-3.5" />
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAuthImageChange(role, type, e)}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleSaveAuthImage(role, type)}
              disabled={!images[key] || saving}
              className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Auth Custom Images" subtitle="Manage background images for login, registration pages and home popup banner">
      <div className="space-y-10">
        
        {/* ================= SECTION 1: HOME PAGE POPUP BANNER (1:1 RATIO) ================= */}
        <div className="space-y-4">
          {/* Status Alert Banner */}
          {popupMessage.text && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                popupMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{popupMessage.text}</span>
              </div>
              <button onClick={() => setPopupMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-transparent p-5 rounded-3xl border border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  Home Page Promotional Popup (1:1 Ratio)
                  {popupData.isActive && popupPreview && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live on Home
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600">
                  Upload a 1:1 square banner, add title, description, and redirect link to display to visitors when they land on the home page.
                </p>
              </div>
            </div>

            {/* Active Toggle Switch */}
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-bold text-gray-700">
                {popupData.isActive ? 'Active (Live)' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setPopupData(p => ({ ...p, isActive: !p.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  popupData.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    popupData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: FORM SETTINGS */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <form onSubmit={handleSavePopup} className="space-y-4">
                {/* 1:1 Image Upload Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Popup Banner Image <span className="text-primary-600 font-extrabold">(1:1 Square Ratio)</span> *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Square Preview Container */}
                    <div className="aspect-square w-full max-w-[220px] mx-auto sm:mx-0 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 overflow-hidden relative flex flex-col items-center justify-center group shadow-xs">
                      {(popupPreview || popupData.imageUrl) ? (
                        <>
                          <img
                            src={popupPreview || popupData.imageUrl}
                            alt="Popup Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                            <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-100 shadow">
                              <Upload className="w-3.5 h-3.5 text-primary-600" /> Replace
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePopupImageSelect}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={handleRemovePopupImage}
                              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-600 shadow"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-center w-full h-full hover:bg-gray-100 transition-colors">
                          <ImageIcon className="w-10 h-10 text-primary-400 mb-2" />
                          <span className="text-xs font-bold text-primary-600">Click to Upload</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">1:1 Square Cropper Included</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePopupImageSelect}
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 1:1 Aspect Ratio
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          Selecting an image opens an interactive cropper locked to a 1:1 square ratio for high clarity on both desktop & mobile screens.
                        </p>
                      </div>
                      {popupPreview && (
                        <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                          ✓ Image ready for publish
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Popup Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={popupData.title}
                    onChange={(e) => setPopupData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Special Festive Discount! 🎉"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description / Offer Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={popupData.description}
                    onChange={(e) => setPopupData(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Book any wedding banquet hall or meeting venue this week and get flat ₹2,000 instant cashback."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {/* Redirect Link Field */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Redirect Link / URL (Optional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={popupData.link}
                        onChange={(e) => setPopupData(p => ({ ...p, link: e.target.value }))}
                        placeholder="e.g. /venues or https://..."
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={popupData.buttonText}
                      onChange={(e) => setPopupData(p => ({ ...p, buttonText: e.target.value }))}
                      placeholder="e.g. Explore Venues"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {popupData.isActive ? '• Status: Visible on Home Page' : '• Status: Currently hidden'}
                  </p>

                  <button
                    type="submit"
                    disabled={popupSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {popupSaving ? 'Saving & Publishing...' : 'Save & Publish Popup'}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: LIVE PREVIEW MOCKUP */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary-600" />
                  Live Customer Preview (Home Page)
                </span>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-primary-600 hover:underline inline-flex items-center gap-1"
                >
                  Open Home <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-6 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-center min-h-[420px]">
                {/* Popup Modal Mockup */}
                <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 relative animate-scale-up">
                  {/* Simulated Close Icon */}
                  <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-xs shadow">
                    <X className="w-4 h-4" />
                  </div>

                  {/* 1:1 Square Image */}
                  {(popupPreview || popupData.imageUrl) ? (
                    <div className="w-full aspect-square bg-gray-100 relative">
                      <img
                        src={popupPreview || popupData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-primary-50 to-amber-50 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-[11px] font-bold text-gray-500">1:1 Square Image Preview</span>
                      <span className="text-[9px] text-gray-400">Upload an image to see live preview</span>
                    </div>
                  )}

                  {/* Text Details & CTA */}
                  <div className="p-4 text-center space-y-2">
                    {popupData.title ? (
                      <h4 className="font-extrabold text-xs text-gray-900 leading-snug">
                        {popupData.title}
                      </h4>
                    ) : (
                      <h4 className="font-extrabold text-xs text-gray-400 italic">
                        (Add a title to appear here)
                      </h4>
                    )}

                    {popupData.description && (
                      <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-line">
                        {popupData.description}
                      </p>
                    )}

                    <div className="pt-1">
                      <div className="w-full py-2 px-3 bg-gradient-to-r from-primary-600 to-amber-600 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow">
                        <span>{popupData.buttonText || 'Explore Now'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* ================= SECTION 2: AUTH PAGES BACKGROUND IMAGES ================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-extrabold text-gray-900">
              Authentication Pages Background Images
            </h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs sm:text-sm">
              Upload custom background images for the Login and Registration pages of different portals. Recommended aspect ratio is 4:3 or 1:1.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Customer Portal Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderImageSection('Customer Login Image', 'customer', 'Login')}
              {renderImageSection('Customer Register Image', 'customer', 'Register')}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Venue Owner Portal Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderImageSection('Venue Owner Login Image', 'venue', 'Login')}
              {renderImageSection('Venue Owner Register Image', 'venue', 'Register')}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Vendor Portal Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderImageSection('Vendor Login Image', 'vendor', 'Login')}
              {renderImageSection('Vendor Register Image', 'vendor', 'Register')}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Employee / Admin &amp; Ambassador Portal Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderImageSection('Employee/Admin Login Image', 'employee', 'Login')}
              {renderImageSection('Ambassador Login Image', 'ambassador', 'Login')}
            </div>
          </div>
        </div>
      </div>

      {/* CROPPER MODAL */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {isFixedSquare ? 'Crop Image (Locked 1:1 Square Ratio)' : 'Crop Image'}
                </h2>
                <p className="text-xs text-gray-400">
                  Drag and zoom to adjust the perfect view.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isFixedSquare && (
                  <select
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold"
                    value={aspect}
                    onChange={(e) => setAspect(Number(e.target.value))}
                  >
                    <option value={1}>1:1 (Square)</option>
                    <option value={4 / 3}>4:3 (Standard)</option>
                    <option value={16 / 9}>16:9 (Wide)</option>
                    <option value={9 / 16}>9:16 (Vertical)</option>
                  </select>
                )}
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative w-full h-[55vh] bg-gray-950 rounded-2xl overflow-hidden">
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

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500 font-semibold">
                Aspect Ratio: <strong>{aspect === 1 ? '1:1 Square' : 'Custom'}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shadow-md"
                >
                  Apply &amp; Use Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
