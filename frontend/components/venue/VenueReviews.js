'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, X, Upload, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function VenueReviews({ venueId }) {
  const { token, user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (token) {
      fetchMyReview();
    }
  }, [venueId, token]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setRatingDistribution(data.ratingDistribution || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/reviews/my-review`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success && data.review) {
        setMyReview(data.review);
      }
    } catch (error) {
      console.error('Error fetching my review:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!formData.title.trim() || !formData.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('comment', formData.comment);
      
      // Add images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/reviews`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewForm(false);
        setFormData({ rating: 5, title: '', comment: '' });
        setImages([]);
        fetchReviews();
        fetchMyReview();
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!token) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/reviews/${reviewId}/helpful`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update the review in the list
        setReviews(reviews.map(review => 
          review._id === reviewId 
            ? { ...review, helpfulCount: data.helpfulCount }
            : review
        ));
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-500" />
            Reviews & Ratings
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        {token && !myReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Average Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-yellow-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6 mb-6 border border-primary-100 dark:border-slate-700">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-gray-900 dark:text-slate-100 mb-2">
                {calculateAverageRating()}
              </div>
              {renderStars(Math.round(calculateAverageRating()))}
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            
            {/* Rating Distribution */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution.find(r => r._id === star)?.count || 0;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 w-8">
                      {star} ★
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-slate-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Write Your Review</h3>
            <button
              onClick={() => setShowReviewForm(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Your Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 cursor-pointer transition-all ${
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400 scale-110'
                          : 'text-gray-300 dark:text-slate-600 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                maxLength={100}
                required
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Your Review
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Share your experience with this venue..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {formData.comment.length}/1000 characters
              </p>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Add Photos (Optional)
              </label>
              <div className="flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                Maximum 5 images allowed
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* My Review */}
      {myReview && (
        <div className="bg-primary-50 dark:bg-slate-800 rounded-xl p-6 mb-6 border-2 border-primary-200 dark:border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">Your Review</p>
              {renderStars(myReview.rating, 'w-4 h-4')}
            </div>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-2">{myReview.title}</h4>
          <p className="text-gray-700 dark:text-slate-300 text-sm">{myReview.comment}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
            Posted on {new Date(myReview.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Reviews List - Horizontal Scroll */}
      <div className="relative">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <>
            {/* Scroll Container */}
            <div className="overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="flex-shrink-0 w-[350px] border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {review.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                            {review.user?.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating, 'w-4 h-4')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2">{review.title}</h4>
                    <p className="text-gray-700 dark:text-slate-300 text-sm mb-3 line-clamp-4">{review.comment}</p>

                    {/* Review Images */}
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                        {review.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image.url}
                            alt={`Review image ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      
                      {/* Helpful Button */}
                      <button
                        onClick={() => handleMarkHelpful(review._id)}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary-500 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpfulCount || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Indicator */}
            {reviews.length > 2 && (
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  ← Scroll to see more reviews →
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
