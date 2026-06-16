'use client';

import { useState } from 'react';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { uploadToStorage, deleteFromStorage } from '@/lib/storage';

const photoCategories = [
  { value: 'Featured', label: 'Featured Photo', required: true },
  { value: 'Exterior', label: 'Exterior/Entrance', required: true },
  { value: 'Interior', label: 'Interior Space', required: true },
  { value: 'Amenities', label: 'Amenities', required: true },
  { value: 'Additional', label: 'Additional Areas', required: false },
];

export default function Step5Photos() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const [images, setImages] = useState(formData.images || []);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e, category) => {
    const files = Array.from(e.target.files);
    
    // Validation
    if (images.length + files.length > 20) {
      toast.error('Maximum 20 photos allowed');
      return;
    }

    setUploading(true);

    for (const file of files) {
      // Size validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }

      // Type validation
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image format`);
        continue;
      }

      try {
        toast.loading(`Uploading ${file.name}...`, { id: file.name });
        const uploadData = await uploadToStorage(file, 'venues');
        
        // Save URL and public_id (not base64!)
        const newImage = {
          id: Date.now() + Math.random(),
          url: uploadData.url,
          publicId: uploadData.publicId,
          category: category,
          isFeatured: category === 'Featured',
          name: file.name,
          size: file.size,
          format: uploadData.format
        };
        
        setImages(prev => [...prev, newImage]);
        toast.success(`${file.name} uploaded!`, { id: file.name });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`, { id: file.name });
      }
    }

    setUploading(false);
  };

  const removeImage = async (imageToRemove) => {
    try {
      if (imageToRemove.publicId) {
        await deleteFromStorage(imageToRemove.publicId);
      }
      setImages(prev => prev.filter(img => img.url !== imageToRemove.url));
      toast.success('Image removed');
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from UI even if storage delete fails
      setImages(prev => prev.filter(img => img.url !== imageToRemove.url));
      toast.success('Image removed');
    }
  };

  const handleNext = () => {
    // Save image URLs and metadata (not base64, so no quota issue!)
    const imageData = images.map(img => ({
      url: img.url,
      publicId: img.publicId,
      category: img.category,
      isFeatured: img.isFeatured
    }));
    
    setFormData({ images: imageData });
    setStep(6);
    
    if (images.length >= 5) {
      toast.success('Photos saved! Moving to next step.');
    } else {
      toast('You can upload more photos later from your dashboard', { icon: 'ℹ️' });
    }
  };

  const goBack = () => {
    setFormData({ images });
    setStep(4);
  };

  const getCategoryCount = (category) => {
    return images.filter(img => img.category === category).length;
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="bg-primary-50 border-l-4 border-primary-500 rounded-xl p-5">
        <div className="flex items-start">
          <ImageIcon className="w-6 h-6 text-primary-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-2">Photo Gallery</h3>
            <p className="text-sm text-gray-600 mb-2">
              Upload high-quality photos of your venue. Photos are uploaded directly to cloud storage.
            </p>
            {uploading && (
              <div className="flex items-center text-primary-600 text-sm mt-2">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading photos...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload by Category */}
      <div className="space-y-4">
        {photoCategories.map((category) => (
          <div key={category.value} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-dark-800">
                  {category.label}
                  {category.required && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {getCategoryCount(category.value)} photo(s) uploaded
                </p>
              </div>
              <label className={`btn-secondary cursor-pointer flex items-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleFileSelect(e, category.value)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Image Grid for this category */}
            {images.filter(img => img.category === category.value).length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {images
                  .filter(img => img.category === category.value)
                  .map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {(image.size / 1024).toFixed(0)} KB
                      </div>
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                        ✓
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-dark-800 mb-2">Photo Requirements:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Minimum 5 photos, Maximum 20 photos</li>
          <li>• Format: JPG, PNG only</li>
          <li>• Max file size: 5MB per photo</li>
          <li>• Recommended resolution: 1200x800 pixels or higher</li>
          <li>• Clear, well-lit photos showing venue features</li>
        </ul>
      </div>

      {/* All Uploaded Images Preview */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <h4 className="font-semibold text-dark-800 mb-3">All Uploaded Photos ({images.length})</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-xs p-0.5 text-center rounded-b-lg">
                  {image.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex items-center group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-300 bg-primary-500 text-white hover:bg-primary-600 hover:scale-105"
        >
          {images.length >= 5 ? 'Next Step' : 'Skip & Continue'}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

