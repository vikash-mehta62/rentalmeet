const VenueReview = require('../models/VenueReview');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { uploadToStorage } = require('../config/storage');

// @desc    Get reviews for a venue
// @route   GET /api/venues/:venueId/reviews
exports.getVenueReviews = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await VenueReview.find({ 
      venue: venueId, 
      status: 'approved' 
    })
      .populate('user', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VenueReview.countDocuments({ 
      venue: venueId, 
      status: 'approved' 
    });

    // Calculate rating distribution
    const ratingDistribution = await VenueReview.aggregate([
      { $match: { venue: new mongoose.Types.ObjectId(venueId), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a review for a venue
// @route   POST /api/venues/:venueId/reviews
// @access  Private (Customer only)
exports.createVenueReview = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { rating, title, comment, bookingId } = req.body;
    const userId = req.user._id;

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Check if user has already reviewed this venue
    const existingReview = await VenueReview.findOne({
      venue: venueId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this venue'
      });
    }

    // If bookingId provided, verify the booking
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
        venue: venueId,
        status: 'completed'
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking or booking not completed'
        });
      }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToStorage(file.buffer, 'venue-reviews');
        images.push({
          url: result.secure_url,
          caption: ''
        });
      }
    }

    // Create review
    const review = await VenueReview.create({
      venue: venueId,
      user: userId,
      booking: bookingId || null,
      rating,
      title,
      comment,
      images
    });

    // Update venue rating and review count
    await updateVenueRating(venueId);

    // Populate user data
    await review.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a review
// @route   PUT /api/venues/:venueId/reviews/:reviewId
// @access  Private (Review owner only)
exports.updateVenueReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user._id;

    const review = await VenueReview.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update fields
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const result = await uploadToStorage(file.buffer, 'venue-reviews');
        newImages.push({
          url: result.secure_url,
          caption: ''
        });
      }
      review.images = [...review.images, ...newImages];
    }

    await review.save();

    // Update venue rating
    await updateVenueRating(review.venue);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/venues/:venueId/reviews/:reviewId
// @access  Private (Review owner or Admin)
exports.deleteVenueReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const review = await VenueReview.findOne({
      _id: reviewId,
      ...(isAdmin ? {} : { user: userId })
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    const venueId = review.venue;
    await review.deleteOne();

    // Update venue rating
    await updateVenueRating(venueId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/venues/:venueId/reviews/:reviewId/helpful
// @access  Private
exports.markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await VenueReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if already marked helpful
    const alreadyMarked = review.helpful.includes(userId);

    if (alreadyMarked) {
      // Remove from helpful
      review.helpful = review.helpful.filter(id => id.toString() !== userId.toString());
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add to helpful
      review.helpful.push(userId);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyMarked ? 'Removed from helpful' : 'Marked as helpful',
      helpfulCount: review.helpfulCount,
      isHelpful: !alreadyMarked
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's review for a venue
// @route   GET /api/venues/:venueId/reviews/my-review
// @access  Private
exports.getMyReview = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user._id;

    const review = await VenueReview.findOne({
      venue: venueId,
      user: userId
    }).populate('user', 'name email');

    res.json({
      success: true,
      review: review || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to update venue rating
async function updateVenueRating(venueId) {
  const reviews = await VenueReview.find({ 
    venue: venueId, 
    status: 'approved' 
  });

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  await Venue.findByIdAndUpdate(venueId, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount
  });
}

// No need for separate module.exports since we're using exports.functionName above
