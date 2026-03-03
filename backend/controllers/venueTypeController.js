const VenueType = require('../models/VenueType');

// @desc    Get all venue types
// @route   GET /api/venue-types
exports.getVenueTypes = async (req, res) => {
  try {
    const venueTypes = await VenueType.find({ isActive: true }).sort('order name');
    
    res.json({
      success: true,
      count: venueTypes.length,
      venueTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all venue types (Admin - including inactive)
// @route   GET /api/admin/venue-types
exports.getAllVenueTypes = async (req, res) => {
  try {
    const venueTypes = await VenueType.find().sort('order name');
    
    res.json({
      success: true,
      count: venueTypes.length,
      venueTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create venue type
// @route   POST /api/admin/venue-types
exports.createVenueType = async (req, res) => {
  try {
    const { name, description, icon, order } = req.body;
    
    // Check if venue type already exists
    const existingType = await VenueType.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Venue type already exists'
      });
    }
    
    const venueType = await VenueType.create({
      name,
      description,
      icon: icon || '🏢',
      order: order || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Venue type created successfully',
      venueType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update venue type
// @route   PUT /api/admin/venue-types/:id
exports.updateVenueType = async (req, res) => {
  try {
    const { name, description, icon, order, isActive } = req.body;
    
    const venueType = await VenueType.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, order, isActive },
      { new: true, runValidators: true }
    );
    
    if (!venueType) {
      return res.status(404).json({
        success: false,
        message: 'Venue type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Venue type updated successfully',
      venueType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete venue type
// @route   DELETE /api/admin/venue-types/:id
exports.deleteVenueType = async (req, res) => {
  try {
    const venueType = await VenueType.findByIdAndDelete(req.params.id);
    
    if (!venueType) {
      return res.status(404).json({
        success: false,
        message: 'Venue type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Venue type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Seed default venue types
// @route   POST /api/admin/venue-types/seed
exports.seedVenueTypes = async (req, res) => {
  try {
    const defaultTypes = [
      { name: 'Meeting Hall', description: 'Professional meeting halls for corporate events', icon: '🏢', order: 1 },
      { name: 'Farm House', description: 'Spacious farmhouses for outdoor events', icon: '🏡', order: 2 },
      { name: 'Conference Hall', description: 'Large spaces for conferences and seminars', icon: '🏛️', order: 3 },
      { name: 'Govt. Auditorium Hall', description: 'Government auditoriums for official events', icon: '🏛️', order: 4 },
      { name: 'Hotel', description: 'Hotel venues with premium facilities', icon: '🏨', order: 5 },
      { name: 'Private Auditorium Hall', description: 'Private auditoriums for exclusive events', icon: '🎭', order: 6 },
      { name: 'Restaurant', description: 'Restaurant spaces for dining events', icon: '🍽️', order: 7 },
      { name: 'School Auditorium Hall', description: 'School auditoriums for educational events', icon: '🏫', order: 8 },
      { name: 'Function Hall', description: 'Multi-purpose function halls', icon: '🎪', order: 9 },
      { name: 'Collage Auditorium Hall', description: 'College auditoriums for academic events', icon: '🎓', order: 10 },
      { name: 'Open Lawn', description: 'Open lawn spaces for outdoor gatherings', icon: '🌳', order: 11 },
      { name: 'Co-Work Space', description: 'Flexible co-working spaces', icon: '💻', order: 12 },
      { name: 'Banquet Hall', description: 'Elegant banquet halls for celebrations', icon: '🎉', order: 13 },
      { name: 'Guest House', description: 'Guest houses with event facilities', icon: '🏠', order: 14 },
      { name: 'Training Center', description: 'Equipped training centers for workshops', icon: '📚', order: 15 },
      { name: 'Marriage Garden', description: 'Beautiful gardens for weddings', icon: '💒', order: 16 }
    ];
    
    const createdTypes = [];
    for (const type of defaultTypes) {
      const existing = await VenueType.findOne({ name: type.name });
      if (!existing) {
        const created = await VenueType.create(type);
        createdTypes.push(created);
      }
    }
    
    res.json({
      success: true,
      message: `${createdTypes.length} venue types seeded successfully`,
      venueTypes: createdTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
