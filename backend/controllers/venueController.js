const Venue = require('../models/Venue');
const { uploadToCloudinary } = require('../config/cloudinary');
const { encrypt } = require('../utils/encryption');
const { sendVenueSubmissionEmail } = require('../utils/emailService');

// @desc    Create new venue
// @route   POST /api/venues
exports.createVenue = async (req, res) => {
  try {
    console.log('=== VENUE CREATION DEBUG ===');
    console.log('1. User:', req.user?.name, '(', req.user?.email, ')');
    console.log('2. Owner ID:', req.user?.id);
    
    const venueData = req.body;
    console.log('3. Received data keys:', Object.keys(venueData));
    console.log('4. Business Name:', venueData.businessName);
    console.log('5. City:', venueData.location?.city);
    console.log('6. Amenities received:', {
      basic: venueData.amenities?.basic?.length || 0,
      beverages: venueData.amenities?.beverages?.length || 0,
      food: venueData.amenities?.refreshmentFood?.length || 0,
      thalis: venueData.amenities?.lunchThalis?.length || 0,
      kitchenAccess: venueData.amenities?.kitchenAccess?.available,
      diningArea: venueData.amenities?.diningArea?.available,
      additional: venueData.amenities?.additional?.length || 0
    });
    console.log('7. Images received:', venueData.images?.length || 0);
    console.log('8. Documents received:', {
      idProofFront: !!venueData.documents?.idProof?.frontUrl,
      idProofBack: !!venueData.documents?.idProof?.backUrl,
      selfie: !!venueData.documents?.selfieUrl,
      businessProof: !!venueData.documents?.businessProof?.documentUrl
    });
    console.log('9. Bank details received:', {
      accountHolder: !!venueData.bankDetails?.accountHolderName,
      accountNumber: !!venueData.bankDetails?.accountNumber,
      ifsc: !!venueData.bankDetails?.ifscCode
    });
    
    // Encrypt bank account number
    if (venueData.bankDetails && venueData.bankDetails.accountNumber) {
      console.log('10. Encrypting bank details...');
      venueData.bankDetails.accountNumber = encrypt(venueData.bankDetails.accountNumber);
    }
    
    // Set owner
    venueData.owner = req.user.id;
    console.log('11. Owner set:', venueData.owner);
    
    // Create venue
    console.log('12. Creating venue in database...');
    const venue = await Venue.create(venueData);
    console.log('13. Venue created successfully!');
    console.log('   - ID:', venue._id);
    console.log('   - SKU:', venue.sku);
    console.log('   - Status:', venue.status);
    console.log('   - Amenities saved:', {
      basic: venue.amenities?.basic?.length || 0,
      beverages: venue.amenities?.beverages?.length || 0,
      food: venue.amenities?.refreshmentFood?.length || 0,
      thalis: venue.amenities?.lunchThalis?.length || 0
    });
    console.log('   - Images saved:', venue.images?.length || 0);
    console.log('   - Bank details encrypted:', !!venue.bankDetails?.accountNumber);
    
    // Send confirmation email
    try {
      await sendVenueSubmissionEmail(req.user.email, venueData.businessName);
      console.log('14. Confirmation email sent');
    } catch (emailError) {
      console.log('14. Email send failed (non-critical):', emailError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Venue submitted successfully. You will receive confirmation within 24-48 hours.',
      venue
    });
  } catch (error) {
    console.error('=== VENUE CREATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload venue images
// @route   POST /api/venues/:id/images
exports.uploadImages = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check ownership
    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const files = req.files;
    const { category, isFeatured } = req.body;
    
    // Validate image count
    const currentImageCount = venue.images.length;
    if (currentImageCount + files.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 20 images allowed'
      });
    }
    
    // Upload to Cloudinary
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file, `venues/${venue._id}`)
    );
    
    const imageUrls = await Promise.all(uploadPromises);
    
    // Add to venue
    const newImages = imageUrls.map(url => ({
      url,
      category: category || 'Interior',
      isFeatured: isFeatured || false
    }));
    
    venue.images.push(...newImages);
    await venue.save();
    
    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: newImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all venues (with filters and pagination)
// @route   GET /api/venues
exports.getVenues = async (req, res) => {
  try {
    const { 
      city, 
      location, 
      venueType, 
      capacity, 
      status, 
      minPrice, 
      maxPrice,
      search,
      page = 1,
      limit = 12
    } = req.query;
    
    let query = {};
    
    // Search filter (business name, city, area)
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } }
      ];
    }
    
    // City filter
    if (city) query['location.city'] = city;
    
    // Location filter (area)
    if (location) query['location.area'] = location;
    
    // Venue type filter
    if (venueType) query.venueType = venueType;
    
    // Capacity filter
    if (capacity) query.capacity = capacity;
    
    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.perHour.weekday'] = {};
      if (minPrice) query['pricing.perHour.weekday'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.perHour.weekday'].$lte = Number(maxPrice);
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'approved';
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalVenues = await Venue.countDocuments(query);
    
    // Get venues with pagination
    const venues = await Venue.find(query)
      .populate('owner', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);
    
    console.log(`Found ${venues.length} venues (page ${pageNum}) with query:`, query);
    
    res.json({
      success: true,
      count: venues.length,
      total: totalVenues,
      page: pageNum,
      pages: Math.ceil(totalVenues / limitNum),
      venues
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unique locations (cities and areas)
// @route   GET /api/venues/locations
exports.getLocations = async (req, res) => {
  try {
    // Get unique cities
    const cities = await Venue.distinct('location.city', { status: 'approved' });
    
    // Get unique areas grouped by city
    const venues = await Venue.find({ status: 'approved' }, 'location.city location.area');
    
    const locationsByCity = {};
    venues.forEach(venue => {
      const city = venue.location?.city;
      const area = venue.location?.area;
      
      if (city && area) {
        if (!locationsByCity[city]) {
          locationsByCity[city] = new Set();
        }
        locationsByCity[city].add(area);
      }
    });
    
    // Convert Sets to Arrays
    const locationsArray = Object.keys(locationsByCity).map(city => ({
      city,
      areas: Array.from(locationsByCity[city]).sort()
    }));
    
    res.json({
      success: true,
      cities: cities.sort(),
      locations: locationsArray
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single venue by SKU
// @route   GET /api/venues/sku/:sku
exports.getVenueBySKU = async (req, res) => {
  try {
    const venue = await Venue.findOne({ sku: req.params.sku })
      .populate('owner', 'name email phone');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    res.json({
      success: true,
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single venue by ID
// @route   GET /api/venues/:id
exports.getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('owner', 'name email phone');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    res.json({
      success: true,
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update venue
// @route   PUT /api/venues/:id
exports.updateVenue = async (req, res) => {
  try {
    let venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check ownership
    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Encrypt bank details if updated
    if (req.body.bankDetails && req.body.bankDetails.accountNumber) {
      req.body.bankDetails.accountNumber = encrypt(req.body.bankDetails.accountNumber);
    }
    
    venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete venue
// @route   DELETE /api/venues/:id
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check ownership
    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await venue.deleteOne();
    
    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get owner's venues
// @route   GET /api/venues/my-venues
exports.getMyVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user.id })
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
