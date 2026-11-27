'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Image as ImageIcon, Video, Plus, Edit2, Trash2, Eye, EyeOff, Sliders, PlayCircle } from 'lucide-react';

export default function HeroSlidesPage() {
  const { token } = useAuthStore();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Browse Venues',
    buttonLink: '/venues',
    order: 0,
    isActive: true,
    mediaType: 'image', // 'image' | 'video'
    videoUrl: '',
    imageOpacity: 100, // 0 - 100%
    overlayOpacity: 50 // 0 - 100%
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (token) {
      fetchSlides();
    }
  }, [token]);

  const fetchSlides = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/hero-slides`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      alert('You are not logged in. Please login again.');
      window.location.href = '/login';
      return;
    }

    if (formData.mediaType === 'image' && !mediaFile && !previewUrl) {
      alert('Please upload an image for the slide');
      return;
    }

    if (formData.mediaType === 'video' && !mediaFile && !formData.videoUrl && !previewUrl) {
      alert('Please provide a video file or video URL for the slide');
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title || '');
    formDataToSend.append('subtitle', formData.subtitle || '');
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('buttonText', formData.buttonText || 'Browse Venues');
    formDataToSend.append('buttonLink', formData.buttonLink || '/venues');
    formDataToSend.append('order', formData.order ?? 0);
    formDataToSend.append('isActive', formData.isActive);
    formDataToSend.append('mediaType', formData.mediaType);
    formDataToSend.append('videoUrl', formData.videoUrl || '');
    formDataToSend.append('video', formData.videoUrl || '');
    formDataToSend.append('imageOpacity', formData.imageOpacity ?? 100);
    formDataToSend.append('overlayOpacity', formData.overlayOpacity ?? 50);
    
    if (mediaFile) {
      // Append under image or video according to mediaType
      if (formData.mediaType === 'video') {
        formDataToSend.append('video', mediaFile);
      } else {
        formDataToSend.append('image', mediaFile);
      }
    }

    try {
      const url = editingSlide
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/hero-slides/${editingSlide._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/hero-slides`;
      
      const response = await fetch(url, {
        method: editingSlide ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      
      if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (data.success) {
        alert(editingSlide ? 'Slide updated successfully!' : 'Slide created successfully!');
        setShowModal(false);
        resetForm();
        fetchSlides();
      } else {
        alert(data.message || 'Error saving slide');
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Error saving slide');
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      buttonText: slide.buttonText || 'Browse Venues',
      buttonLink: slide.buttonLink || '/venues',
      order: slide.order ?? 0,
      isActive: slide.isActive ?? true,
      mediaType: slide.mediaType || (slide.video ? 'video' : 'image'),
      videoUrl: slide.video || '',
      imageOpacity: slide.imageOpacity !== undefined ? slide.imageOpacity : 100,
      overlayOpacity: slide.overlayOpacity !== undefined ? slide.overlayOpacity : 50
    });
    setPreviewUrl(slide.mediaType === 'video' ? slide.video : (slide.image || slide.video || ''));
    setMediaFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/hero-slides/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Slide deleted successfully!');
        fetchSlides();
      } else {
        alert(data.message || 'Error deleting slide');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Error deleting slide');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      buttonText: 'Browse Venues',
      buttonLink: '/venues',
      order: 0,
      isActive: true,
      mediaType: 'image',
      videoUrl: '',
      imageOpacity: 100,
      overlayOpacity: 50
    });
    setMediaFile(null);
    setPreviewUrl('');
    setEditingSlide(null);
  };

  if (loading) {
    return (
      <AdminLayout title="Hero Slides" subtitle="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Hero Slides" subtitle="Manage homepage hero section slides">
      <PermissionGuard permission="heroSlides">
        <div className="space-y-6">
        {/* Header Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Slide
          </button>
        </div>

        {/* Slides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => {
            const isVideo = slide.mediaType === 'video' || (slide.video && !slide.image);
            const opacityVal = slide.imageOpacity !== undefined ? slide.imageOpacity : 100;
            return (
              <div key={slide._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
                {/* Media Preview */}
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  {isVideo && slide.video ? (
                    <video
                      src={slide.video}
                      className="w-full h-full object-cover"
                      style={{ opacity: opacityVal / 100 }}
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={slide.image || '/her-img2.jpg'}
                      alt={slide.title || 'Slide'}
                      className="w-full h-full object-cover"
                      style={{ opacity: opacityVal / 100 }}
                    />
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                      {isVideo ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
                      {isVideo ? 'Video' : 'Image'}
                    </span>
                    <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-medium">
                      {opacityVal}% Opacity
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-2">
                    {slide.isActive ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow">
                        <Eye className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {slide.title ? slide.title : <span className="text-gray-400 italic text-sm">(No Title)</span>}
                    </h3>
                    {slide.subtitle && (
                      <p className="text-sm text-primary-600 font-medium mb-1">{slide.subtitle}</p>
                    )}
                    {slide.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{slide.description}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-2 border-t border-gray-100">
                      <span>Order: <strong className="text-gray-800">{slide.order}</strong></span>
                      <span className="truncate max-w-[150px]">{slide.buttonText}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(slide)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slide._id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {slides.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No slides yet</h3>
            <p className="text-gray-600 mb-4">Create your first hero slide to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Slide
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Media Type Tabs (Image vs Video) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Media Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, mediaType: 'image' });
                        if (editingSlide && editingSlide.image) {
                          setPreviewUrl(editingSlide.image);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                        formData.mediaType === 'image'
                          ? 'bg-white text-primary-600 shadow-sm font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image Slide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, mediaType: 'video' });
                        if (editingSlide && editingSlide.video) {
                          setPreviewUrl(editingSlide.video);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                        formData.mediaType === 'video'
                          ? 'bg-white text-primary-600 shadow-sm font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Video Slide
                    </button>
                  </div>
                </div>

                {/* Media File Upload & Input */}
                {formData.mediaType === 'image' ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image {!editingSlide && !previewUrl && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMediaChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Upload Video File (MP4, WebM, MOV)
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleMediaChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-50 px-2 text-gray-400 font-semibold">Or enter Video URL</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Video Direct URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/banner-video.mp4"
                        value={formData.videoUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, videoUrl: e.target.value });
                          if (e.target.value) setPreviewUrl(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Transparency / Opacity Controls */}
                <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>Media Transparency & Tint Adjuster</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
                      <span>Media Opacity (Transparency):</span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded font-bold text-gray-900">
                        {formData.imageOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={formData.imageOpacity}
                      onChange={(e) => setFormData({ ...formData, imageOpacity: parseInt(e.target.value) })}
                      className="w-full accent-primary-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                      <span>10% (Transparent)</span>
                      <span>50%</span>
                      <span>100% (Solid / Full)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
                      <span>Dark Tint Overlay Darkness:</span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded font-bold text-gray-900">
                        {formData.overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.overlayOpacity}
                      onChange={(e) => setFormData({ ...formData, overlayOpacity: parseInt(e.target.value) })}
                      className="w-full accent-gray-800 cursor-pointer h-2 bg-gray-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                      <span>0% (No Dark Tint)</span>
                      <span>50% (Recommended)</span>
                      <span>100% (Darkest)</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview with Transparency Applied */}
                {previewUrl && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Live Preview (With Opacity Applied)
                    </label>
                    <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                      {formData.mediaType === 'video' ? (
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          style={{ opacity: formData.imageOpacity / 100 }}
                          controls
                          muted
                          autoPlay
                          loop
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Slide preview"
                          className="w-full h-full object-cover"
                          style={{ opacity: formData.imageOpacity / 100 }}
                        />
                      )}
                      {/* Dark overlay preview */}
                      <div
                        className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                        style={{ opacity: formData.overlayOpacity / 100 }}
                      ></div>
                      {/* Text mock preview */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none z-10">
                        <span className="text-white font-serif text-lg font-bold drop-shadow">
                          {formData.title || '(Slide Title)'}
                        </span>
                        {formData.subtitle && (
                          <span className="text-amber-400 text-xs font-semibold drop-shadow">
                            {formData.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Title (OPTIONAL - Mandatory Removed!) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. India's Smart Venue Booking"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subtitle <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Platform RentalMeet"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Enter slide description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Button Text & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Order (for sorting)
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Active (visible on homepage)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm shadow-sm"
                  >
                    {editingSlide ? 'Update Slide' : 'Create Slide'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
