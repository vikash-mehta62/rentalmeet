const Review = require('../models/Review');

// @desc    Get all active reviews (Public)
// @route   GET /api/reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isActive: true }).sort('order name');
    
    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all reviews (Admin - including inactive)
// @route   GET /api/admin/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort('-createdAt');
    
    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create review
// @route   POST /api/admin/reviews
exports.createReview = async (req, res) => {
  try {
    const { name, role, rating, description, order } = req.body;
    
    const review = await Review.create({
      name,
      role,
      rating: rating || 5,
      description,
      order: order || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/admin/reviews/:id
exports.updateReview = async (req, res) => {
  try {
    const { name, role, rating, description, order, isActive } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { name, role, rating, description, order, isActive },
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
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

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
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

// @desc    Seed default reviews
// @route   POST /api/admin/reviews/seed
exports.seedReviews = async (req, res) => {
  try {
    const defaultReviews = [
      {
        name: 'Rajesh Kumar',
        role: 'CEO, TechSolutions',
        rating: 5,
        description: 'RentalMeet has transformed how we organize our monthly board meetings. The spaces are top-notch and the booking process is seamless.',
        order: 1
      },
      {
        name: 'Sneha Sharma',
        role: 'Event Director, Global Connect',
        rating: 5,
        description: 'The attention to detail and premium facilities at their venues are unmatched. Highly recommend for any corporate event.',
        order: 2
      },
      {
        name: 'Amit Patel',
        role: 'Founder, Startup Hub',
        rating: 5,
        description: 'Finding high-quality meeting spaces was always a challenge until we found RentalMeet. Their service is truly professional.',
        order: 3
      },
      {
        name: 'Priya Desai',
        role: 'HR Manager, InfoTech Solutions',
        rating: 5,
        description: 'Excellent service and beautiful venues. Our team events have never been better organized. The staff is incredibly helpful and professional.',
        order: 4
      },
      {
        name: 'Vikram Singh',
        role: 'Marketing Head, Digital Dynamics',
        rating: 5,
        description: 'We have been using RentalMeet for all our client meetings and presentations. The ambiance and facilities are world-class.',
        order: 5
      }
    ];
    
    const createdReviews = [];
    for (const review of defaultReviews) {
      const existing = await Review.findOne({ name: review.name });
      if (!existing) {
        const created = await Review.create(review);
        createdReviews.push(created);
      }
    }
    
    res.json({
      success: true,
      message: `${createdReviews.length} reviews seeded successfully`,
      reviews: createdReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
