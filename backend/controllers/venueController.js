const Venue = require('../models/Venue');
const User = require('../models/User');
const { uploadToStorage } = require('../config/storage');
const { encrypt } = require('../utils/encryption');
const { sendVenueSubmissionEmail, sendVenueOwnerWelcomeCredentialsEmail } = require('../utils/emailService');
const { logAudit, logStatusChange, logSubmissionAttempt, extractClientIp } = require('../utils/auditLogger');

const normalizeFoodType = (value) => {
  const key = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (key === 'veg') return 'Veg';
  if (key === 'nonveg') return 'Non Veg';
  if (key === 'both') return 'Both';
  return '';
};

// @desc    Create new venue
// @route   POST /api/venues
exports.createVenue = async (req, res) => {
  const clientIp = extractClientIp(req);
  const venueData = req.body;
  const venueName = venueData?.businessName || 'Unnamed Venue';

  try {
    console.log('=== VENUE CREATION DEBUG ===');
    console.log('1. User:', req.user?.name, '(', req.user?.email, ') Role:', req.user?.role, 'IP:', clientIp);
    console.log('2. Requester ID:', req.user?.id);
    
    // Log submission attempt to safeguard all request payload data
    logSubmissionAttempt(req, {
      category: 'VENUE',
      action: 'VENUE_SUBMISSION_ATTEMPT',
      targetType: 'Venue',
      targetName: venueName,
      payload: venueData,
      status: 'ATTEMPT'
    });

    console.log('3. Received data keys:', Object.keys(venueData || {}));
    console.log('4. Business Name:', venueData?.businessName);
    console.log('5. City:', venueData?.location?.city);
    
    // Encrypt bank account number
    if (venueData.bankDetails && venueData.bankDetails.accountNumber) {
      venueData.bankDetails.accountNumber = encrypt(venueData.bankDetails.accountNumber);
    }
    
    let ownerUser = null;
    let autoPassword = null;
    let isNewAccount = false;

    // Check SubAdmin permission if request is from a subadmin
    if (req.user.role === 'subadmin') {
      const perms = req.user.permissions || {};
      const hasPerm = typeof perms.addVenue === 'boolean' ? perms.addVenue : perms.venues === true;
      if (!hasPerm) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add new venues"
        });
      }
    }

    // Check if this is an Admin onboarding a venue for an owner
    const isAdminOnboarding = (req.user.role === 'admin' || req.user.role === 'subadmin') && venueData.ownerInfo && (venueData.ownerInfo.mobile || venueData.ownerInfo.email);

    // Set Owner & Ambassador or Admin Onboarding
    if (req.user.role === 'ambassador' || isAdminOnboarding) {
      if (req.user.role === 'ambassador') {
      const AmbassadorProfile = require('../models/AmbassadorProfile');
      const ambProfile = await AmbassadorProfile.findOne({ user: req.user.id });
      if (ambProfile) {
        const approvedTime = ambProfile.verifiedAt ? new Date(ambProfile.verifiedAt).getTime() : new Date(ambProfile.createdAt).getTime();
        const daysSinceApproval = Math.floor((Date.now() - approvedTime) / (1000 * 60 * 60 * 24));
        const totalSubmitted = ambProfile.totalVenuesSubmitted || 0;
        
        if ((ambProfile.applicationStatus === 'approved' || ambProfile.status === 'approved') && totalSubmitted === 0 && daysSinceApproval > 30) {
          ambProfile.isActive = false;
          ambProfile.deactivationReason = `Auto-deactivated: No venue listed within 30 days of approval (${daysSinceApproval} days inactive)`;
          ambProfile.deactivatedAt = ambProfile.deactivatedAt || new Date();
          
          if (!ambProfile.statusHistory) ambProfile.statusHistory = [];
          ambProfile.statusHistory.push({
            action: 'AUTO_DEACTIVATE_30_DAYS',
            status: ambProfile.applicationStatus,
            isActive: false,
            reason: ambProfile.deactivationReason,
            changedBy: {
              userId: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role
            },
            ipAddress: clientIp,
            timestamp: new Date()
          });

          await ambProfile.save();

          // Log failure with complete request payload preserved
          logAudit(req, {
            category: 'AMBASSADOR',
            action: 'AMBASSADOR_AUTO_DEACTIVATED',
            status: 'FAILED',
            targetType: 'AmbassadorProfile',
            targetId: ambProfile._id,
            targetName: req.user.name,
            reason: ambProfile.deactivationReason,
            errorMessage: 'Ambassador auto-deactivated due to 30-day inactivity rule',
            details: {
              daysSinceApproval,
              totalSubmitted,
              submittedPayload: venueData
            }
          });

          return res.status(403).json({
            success: false,
            message: 'Your Ambassador account has been auto-deactivated because no venue was listed within 30 days of approval. Please contact support to reactivate.'
          });
        }
        
        if (ambProfile.isActive === false) {
          const blockReason = ambProfile.deactivationReason || 'Your Ambassador account is deactivated/blocked. Please contact support.';
          
          // Log submission failure with full payload
          logAudit(req, {
            category: 'AMBASSADOR',
            action: 'VENUE_SUBMISSION_BLOCKED_INACTIVE_AMBASSADOR',
            status: 'FAILED',
            targetType: 'AmbassadorProfile',
            targetId: ambProfile._id,
            targetName: req.user.name,
            reason: blockReason,
            errorMessage: blockReason,
            details: { submittedPayload: venueData }
          });

          return res.status(403).json({
            success: false,
            message: blockReason
          });
        }
      }
    }

      const ownerInfo = venueData.ownerInfo || {};
      const ownerMobile = (ownerInfo.mobile || '').trim();
      const ownerEmail = (ownerInfo.email || '').trim().toLowerCase();
      const ownerName = (ownerInfo.fullName || venueData.businessName + ' Owner').trim();

      if (!ownerMobile && !ownerEmail) {
        logAudit(req, {
          category: 'VENUE',
          action: 'VENUE_SUBMISSION_VALIDATION_FAILED',
          status: 'FAILED',
          targetType: 'Venue',
          targetName: venueName,
          errorMessage: 'Venue owner contact information (mobile or email) is required',
          details: { submittedPayload: venueData }
        });

        return res.status(400).json({
          success: false,
          message: 'Venue owner contact information (mobile or email) is required to onboard a venue.'
        });
      }

      // Look up existing owner user by mobile or email
      if (ownerMobile) {
        ownerUser = await User.findOne({ phone: ownerMobile });
      }
      if (!ownerUser && ownerEmail) {
        ownerUser = await User.findOne({ email: ownerEmail });
      }

      if (ownerUser) {
        // Upgrade customer to owner role if needed
        if (ownerUser.role === 'customer') {
          ownerUser.role = 'owner';
          if (!ownerUser.statusHistory) ownerUser.statusHistory = [];
          ownerUser.statusHistory.push({
            action: 'ROLE_UPGRADE_TO_OWNER',
            role: 'owner',
            isActive: ownerUser.isActive,
            reason: 'Upgraded during venue onboarding by ambassador',
            changedBy: {
              userId: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role
            },
            ipAddress: clientIp,
            timestamp: new Date()
          });
          await ownerUser.save();
        }
        console.log(`[AMBASSADOR ONBOARDING] Linked venue to existing Owner user: ${ownerUser._id} (${ownerUser.phone || ownerUser.email})`);
      } else {
        // Auto-create new Owner account
        isNewAccount = true;
        const fallbackEmail = ownerEmail || `owner.${ownerMobile || Date.now()}@rentalmeet.com`;
        autoPassword = `RM@${(ownerMobile || '1234567890').slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
        
        ownerUser = await User.create({
          name: ownerName,
          phone: ownerMobile || undefined,
          email: fallbackEmail,
          password: autoPassword,
          role: 'owner',
          isPhoneVerified: true,
          isEmailVerified: !!ownerEmail,
          statusHistory: [{
            action: 'ACCOUNT_AUTO_CREATED_ON_VENUE_ONBOARD',
            role: 'owner',
            isActive: true,
            reason: 'Auto-created by ambassador venue registration',
            changedBy: {
              userId: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role
            },
            ipAddress: clientIp,
            timestamp: new Date()
          }]
        });
        console.log(`[AMBASSADOR ONBOARDING] ✨ Auto-created new Owner Account: ID=${ownerUser._id}, Phone=${ownerUser.phone}, Email=${ownerUser.email}`);
      }

      venueData.owner = ownerUser._id;
      if (req.user.role === 'ambassador') {
        venueData.ambassador = req.user.id;
        venueData.listingSource = 'ambassador';
        venueData.onboardingPhase = 1;
        venueData.isProvisional = true;
      } else {
        venueData.listingSource = 'admin';
        venueData.addedByAdmin = req.user._id || req.user.id;
        venueData.onboardingPhase = 1;
        venueData.isProvisional = false;
        venueData.status = venueData.status || 'approved';
      }
      if (!venueData.ownerInfo.authorisedPerson) {
        venueData.ownerInfo.authorisedPerson = {
          name: ownerName,
          fullName: ownerName,
          phone: ownerMobile,
          mobile: ownerMobile,
          email: ownerEmail
        };
      }
    } else {
      venueData.owner = req.user.id;
    }
    console.log('11. Owner set:', venueData.owner);

    // Normalization & Defaults for Phase-1 and general submissions
    venueData.foodType = normalizeFoodType(venueData.foodType) || 'Veg';

    if (venueData.termsAccepted === undefined) {
      venueData.termsAccepted = true;
    }

    venueData.location = venueData.location || {};
    if (!venueData.location.area) venueData.location.area = venueData.location.city || '';
    if (!venueData.location.landmark) venueData.location.landmark = venueData.location.address || '';
    if (!venueData.location.pincode) venueData.location.pincode = '000000';
    if (!venueData.location.googleMapLink) venueData.location.googleMapLink = '';

    if (venueData.location.parkingDetails) {
      venueData.location.parkingAvailability = venueData.location.parkingDetails.type || venueData.location.parkingAvailability || 'None';
      if (!venueData.parkingDetails) {
        const pd = venueData.location.parkingDetails;
        venueData.parkingDetails = {
          type: pd.type || venueData.location.parkingAvailability || 'None',
          cars: {
            capacity: Number(pd.carsCapacity || pd.cars?.capacity || 0),
            isChargeable: (pd.type === 'Paid' || Number(pd.carCharges || pd.cars?.chargePerVehicle || 0) > 0),
            chargePerVehicle: Number(pd.carCharges || pd.cars?.chargePerVehicle || 0)
          },
          twoWheelers: {
            capacity: Number(pd.twoWheelerCapacity || pd.twoWheelers?.capacity || 0),
            isChargeable: (pd.type === 'Paid' || Number(pd.twoWheelerCharges || pd.twoWheelers?.chargePerVehicle || 0) > 0),
            chargePerVehicle: Number(pd.twoWheelerCharges || pd.twoWheelers?.chargePerVehicle || 0)
          }
        };
      }
    } else if (venueData.parkingDetails) {
      venueData.location.parkingDetails = venueData.parkingDetails;
      venueData.location.parkingAvailability = venueData.parkingDetails.type || 'None';
    }

    if (!venueData.description || !venueData.description.trim()) {
      const city = venueData.location?.city || '';
      const state = venueData.location?.state || '';
      const locStr = [city, state].filter(Boolean).join(', ');
      const vType = Array.isArray(venueData.venueType) && venueData.venueType.length > 0
        ? venueData.venueType.join(' / ')
        : 'Venue';
      venueData.description = `${venueData.businessName} is a premier ${vType.toLowerCase()}${locStr ? ` located in ${locStr}` : ''}. Featuring spacious event areas, modern amenities, and dedicated hospitality, it is ideal for weddings, conferences, banquets, and celebrations.`;
    }

    // Auto-map pricing breakdown to legacy rates
    venueData.pricing = venueData.pricing || {};
    const baseRateModel = venueData.pricing.onlyRent || venueData.pricing.rentWithAmenities;
    if (baseRateModel) {
      if (!venueData.pricing.perHour || (!venueData.pricing.perHour.weekday && !venueData.pricing.perHour.weekend)) {
        venueData.pricing.perHour = {
          weekday: Number(baseRateModel.hourly?.rate || 0),
          weekend: Number(baseRateModel.hourly?.rate || 0)
        };
      }
      if (!venueData.pricing.extraHourRate || (!venueData.pricing.extraHourRate.weekday && !venueData.pricing.extraHourRate.weekend)) {
        venueData.pricing.extraHourRate = {
          weekday: Number(baseRateModel.hourly?.extraPerHour || 0),
          weekend: Number(baseRateModel.hourly?.extraPerHour || 0)
        };
      }
      if (baseRateModel.halfDay?.rate && (!venueData.pricing.halfDay || !venueData.pricing.halfDay.weekday)) {
        venueData.pricing.halfDay = {
          weekday: Number(baseRateModel.halfDay.rate || 0),
          weekend: Number(baseRateModel.halfDay.rate || 0)
        };
      }
      if (baseRateModel.fullDay?.rate && (!venueData.pricing.fullDay || !venueData.pricing.fullDay.weekday)) {
        venueData.pricing.fullDay = {
          weekday: Number(baseRateModel.fullDay.rate || 0),
          weekend: Number(baseRateModel.fullDay.rate || 0)
        };
      }
      venueData.pricing.enabledOptions = {
        perHour: !!(baseRateModel.hourly?.rate),
        halfDay: !!(baseRateModel.halfDay?.rate),
        fullDay: !!(baseRateModel.fullDay?.rate)
      };
    }
    
    // Attach initial status history
    venueData.statusHistory = [{
      action: isAdminOnboarding ? 'ADMIN_VENUE_CREATED' : 'VENUE_SUBMITTED',
      status: venueData.status || (isAdminOnboarding ? 'approved' : 'pending'),
      isActive: true,
      reason: isAdminOnboarding
        ? `Onboarded directly by Admin: ${req.user.name} (${req.user.email})`
        : (req.user.role === 'ambassador' ? 'Submitted by Ambassador' : 'Submitted by Owner'),
      changedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      ipAddress: clientIp,
      timestamp: new Date()
    }];

    // Create venue
    console.log('12. Creating venue in database...');
    const venue = await Venue.create(venueData);

    if (req.user.role === 'ambassador') {
      try {
        const AmbassadorProfile = require('../models/AmbassadorProfile');
        await AmbassadorProfile.findOneAndUpdate(
          { user: req.user.id },
          { $inc: { totalVenuesSubmitted: 1 } }
        );
      } catch (err) {
        console.error('Error updating ambassador profile count:', err);
      }

      // Send Welcome & Login Credentials Email to Venue Owner
      if (ownerUser && ownerUser.email) {
        try {
          await sendVenueOwnerWelcomeCredentialsEmail({
            ownerEmail: ownerUser.email,
            ownerName: ownerUser.name,
            venueName: venue.businessName,
            ambassadorName: req.user.name,
            ambassadorPhone: req.user.phone,
            loginEmail: ownerUser.email,
            temporaryPassword: autoPassword,
            isNewAccount
          });
        } catch (emailErr) {
          console.error('[EMAIL] Failed to send owner credentials email:', emailErr.message);
        }
      }
    } else if (isAdminOnboarding && ownerUser && ownerUser.email) {
      try {
        await sendVenueOwnerWelcomeCredentialsEmail({
          ownerEmail: ownerUser.email,
          ownerName: ownerUser.name,
          venueName: venue.businessName,
          ambassadorName: `RentalMeet Admin (${req.user.name})`,
          ambassadorPhone: req.user.phone || '',
          loginEmail: ownerUser.email,
          temporaryPassword: autoPassword,
          isNewAccount
        });
      } catch (emailErr) {
        console.error('[EMAIL] Failed to send owner credentials email on admin onboarding:', emailErr.message);
      }
    }

    // Global audit log on successful creation
    logAudit(req, {
      category: 'VENUE',
      action: isAdminOnboarding ? 'ADMIN_VENUE_CREATED' : 'VENUE_CREATED',
      status: 'SUCCESS',
      targetType: 'Venue',
      targetId: venue._id,
      targetName: venue.businessName,
      performedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      newState: { status: venue.status, isActive: venue.isActive, sku: venue.sku },
      details: {
        sku: venue.sku,
        ownerId: venue.owner,
        ownerEmail: ownerUser?.email,
        ownerPhone: ownerUser?.phone,
        ambassadorId: venue.ambassador || null,
        city: venue.location?.city,
        area: venue.location?.area,
        listingSource: venue.listingSource,
        adminDetails: isAdminOnboarding ? {
          adminId: req.user._id,
          adminName: req.user.name,
          adminEmail: req.user.email,
          adminRole: req.user.role
        } : null
      }
    });

    console.log('13. Venue created successfully! ID:', venue._id, 'SKU:', venue.sku);
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
    
    // Send confirmation email to submitter
    try {
      if (req.user.email) {
        await sendVenueSubmissionEmail(req.user.email, venueData.businessName);
        console.log('14. Confirmation email sent to submitter');
      }
    } catch (emailError) {
      console.log('14. Submitter email send failed (non-critical):', emailError.message);
    }
    
    res.status(201).json({
      success: true,
      message: isAdminOnboarding
        ? 'Venue successfully created by Admin! Owner login credentials generated.'
        : (req.user.role === 'ambassador'
            ? 'Venue provisionally submitted! Owner credentials generated.'
            : 'Venue submitted successfully. You will receive confirmation within 24-48 hours.'),
      venue,
      ownerCredentials: (req.user.role === 'ambassador' || isAdminOnboarding) && ownerUser ? {
        isNewAccount,
        loginId: ownerUser.email,
        email: ownerUser.email,
        phone: ownerUser.phone,
        name: ownerUser.name,
        password: autoPassword || '(Existing account password)',
        loginUrl: `${process.env.FRONTEND_URL || 'https://rentalmeet.com'}/login?role=owner`
      } : undefined
    });
  } catch (error) {
    console.error('=== VENUE CREATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Record complete failure audit log with full submitted payload
    logAudit(req, {
      category: 'VENUE',
      action: 'VENUE_CREATION_FAILED_EXCEPTION',
      status: 'FAILED',
      targetType: 'Venue',
      targetName: venueName,
      errorMessage: error.message,
      details: {
        errorStack: error.stack,
        submittedPayload: venueData
      }
    });

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
    
    // Upload to configured storage
    const uploadPromises = files.map(file =>
      uploadToStorage(file.buffer, `venues/${venue._id}`, {
        contentType: file.mimetype,
        originalName: file.originalname
      })
    );
    
    const uploadedImages = await Promise.all(uploadPromises);
    
    // Add to venue
    const newImages = uploadedImages.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
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

// Fields to NEVER expose on public routes
const PUBLIC_VENUE_EXCLUDE = '-documents -bankDetails -ownerInfo.gstNumber -ownerInfo.panNumber -ownerInfo.fullName';

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
      foodType,
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
    
    // City filter (case-insensitive regex)
    if (city) {
      const cleanCity = String(city).trim().split(',')[0].trim();
      query['location.city'] = { $regex: cleanCity, $options: 'i' };
    }
    
    // Location filter (matches city or area or address if city not explicitly provided)
    if (location && !city) {
      const cleanLoc = String(location).trim().split(',')[0].trim();
      const locRegex = { $regex: cleanLoc, $options: 'i' };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ 'location.city': locRegex }, { 'location.area': locRegex }, { 'location.address': locRegex }] }
        ];
        delete query.$or;
      } else {
        query.$or = [
          { 'location.city': locRegex },
          { 'location.area': locRegex },
          { 'location.address': locRegex }
        ];
      }
    } else if (location && city) {
      const cleanLoc = String(location).trim().split(',')[0].trim();
      query['location.area'] = { $regex: cleanLoc, $options: 'i' };
    }
    
    // Venue type filter (case-insensitive)
    if (venueType) {
      query.venueType = { $regex: `^${String(venueType).trim()}$`, $options: 'i' };
    }
    
    // Capacity filter
    if (capacity) query.capacity = capacity;

    const normalizedFoodType = normalizeFoodType(foodType);
    if (normalizedFoodType) {
      if (normalizedFoodType === 'Veg') {
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { foodType: 'Veg' },
              { foodType: 'Both' },
              { foodType: { $exists: false } },
              { foodType: null },
              { foodType: '' }
            ]
          }
        ];
      } else if (normalizedFoodType === 'Non Veg') {
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { foodType: 'Non Veg' },
              { foodType: 'Both' }
            ]
          }
        ];
      } else {
        query.foodType = normalizedFoodType;
      }
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.perHour.weekday'] = {};
      if (minPrice) query['pricing.perHour.weekday'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.perHour.weekday'].$lte = Number(maxPrice);
    }
    
    // Status filter — public API always shows only approved venues
    // Admin can pass status=all to see all venues (handled in admin routes)
    query.status = 'approved';

    // Always hide inactive venues from public (regardless of status param)
    query.isActive = { $ne: false };
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const totalVenues = await Venue.countDocuments(query);
    
    // Sorting: Verified venues first by default
    let sortOption = { isVerified: -1, 'documents.verified': -1, profileCompletion: -1, createdAt: -1 };
    if (req.query.sort === 'newest') sortOption = { createdAt: -1 };
    else if (req.query.sort === 'rating') sortOption = { averageRating: -1, createdAt: -1 };

    // Get venues with pagination
    const venues = await Venue.find(query)
      .select(PUBLIC_VENUE_EXCLUDE)
      .populate('owner', 'name email phone')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Attach booking stats per venue
    const Booking = require('../models/Booking');
    const venueIds = venues.map(v => v._id);
    const bookingStats = await Booking.aggregate([
      { $match: { venue: { $in: venueIds } } },
      { $group: {
        _id: '$venue',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$amount' }
      }}
    ]);
    const statsMap = {};
    bookingStats.forEach(s => { statsMap[s._id.toString()] = s; });

    const venuesWithStats = venues.map(v => {
      const obj = v.toObject();
      const s = statsMap[v._id.toString()];
      obj.totalBookings = s ? s.totalBookings : 0;
      obj.totalRevenue = s ? s.totalRevenue : 0;
      return obj;
    });

    // Attach active coupon count + codes per venue
    const Coupon = require('../models/Coupon');
    const now = new Date();
    const venueCoupons = await Coupon.find({
      venue: { $in: venueIds },
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
    }).select('venue code discountType discountValue maxDiscount maxUses usedCount');

    const couponMap = {};
    venueCoupons.forEach(c => {
      if (c.maxUses !== null && c.usedCount >= c.maxUses) return; // skip limit-reached
      const key = c.venue.toString();
      if (!couponMap[key]) couponMap[key] = [];
      couponMap[key].push({
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxDiscount: c.maxDiscount
      });
    });
    venuesWithStats.forEach(v => {
      v.activeCoupons = couponMap[v._id.toString()] || [];
      v.activeCouponCount = v.activeCoupons.length;
      if (typeof v.profileCompletion !== 'number' || v.isVerified === undefined) {
        const comp = Venue.calculateProfileCompletion ? Venue.calculateProfileCompletion(v) : null;
        if (comp) {
          v.profileCompletion = typeof v.profileCompletion === 'number' ? v.profileCompletion : comp.profileCompletion;
          v.isVerified = typeof v.isVerified === 'boolean' ? v.isVerified : comp.isVerified;
        }
      }
    });
    
    console.log(`Found ${venues.length} venues (page ${pageNum}) with query:`, query);
    
    res.json({
      success: true,
      count: venuesWithStats.length,
      total: totalVenues,
      page: pageNum,
      pages: Math.ceil(totalVenues / limitNum),
      venues: venuesWithStats
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
      .select(PUBLIC_VENUE_EXCLUDE)
      .populate('owner', 'name email phone');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const venueObj = venue.toObject ? venue.toObject() : venue;
    if (typeof venueObj.profileCompletion !== 'number' || venueObj.isVerified === undefined) {
      const comp = Venue.calculateProfileCompletion ? Venue.calculateProfileCompletion(venueObj) : null;
      if (comp) {
        venueObj.profileCompletion = typeof venueObj.profileCompletion === 'number' ? venueObj.profileCompletion : comp.profileCompletion;
        venueObj.isVerified = typeof venueObj.isVerified === 'boolean' ? venueObj.isVerified : comp.isVerified;
      }
    }
    
    res.json({
      success: true,
      venue: venueObj
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
      .select(PUBLIC_VENUE_EXCLUDE)
      .populate('owner', 'name email phone');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const venueObj = venue.toObject ? venue.toObject() : venue;
    if (typeof venueObj.profileCompletion !== 'number' || venueObj.isVerified === undefined) {
      const comp = Venue.calculateProfileCompletion ? Venue.calculateProfileCompletion(venueObj) : null;
      if (comp) {
        venueObj.profileCompletion = typeof venueObj.profileCompletion === 'number' ? venueObj.profileCompletion : comp.profileCompletion;
        venueObj.isVerified = typeof venueObj.isVerified === 'boolean' ? venueObj.isVerified : comp.isVerified;
      }
    }
    
    res.json({
      success: true,
      venue: venueObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single venue by ID — full data for edit (owner/admin only)
// @route   GET /api/venues/:id/edit
exports.getVenueForEdit = async (req, res) => {
  try {
    if (req.user.role === 'ambassador') {
      return res.status(403).json({
        success: false,
        message: 'Ambassadors have view-only access. Only the Venue Owner or Administrator can edit venue listings.'
      });
    }

    const venue = await Venue.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Only owner or admin can access full data
    if (venue.owner?._id?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const venueObj = venue.toObject();

    // Decrypt bank account number if encrypted
    if (venueObj.bankDetails?.accountNumber) {
      try {
        const { decrypt } = require('../utils/encryption');
        const decrypted = decrypt(venueObj.bankDetails.accountNumber);
        if (decrypted) venueObj.bankDetails.accountNumber = decrypted;
      } catch {
        // If decryption fails, leave as-is (may already be plain)
      }
    }

    res.json({ success: true, venue: venueObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    if (req.user.role === 'ambassador') {
      return res.status(403).json({
        success: false,
        message: 'Ambassadors have view-only access. Only the Venue Owner or Administrator can edit venue listings.'
      });
    }

    let venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check ownership
    if (venue.owner?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Prevent status tampering by non-admin users
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      delete req.body.status;
      delete req.body.owner;
      // If venue was rejected, updating it sets its status to resubmitted
      if (venue.status === 'rejected') {
        req.body.status = 'resubmitted';
      }
    }
    
    // Encrypt bank details if updated (only if not already encrypted)
    if (req.body.bankDetails && req.body.bankDetails.accountNumber &&
        !req.body.bankDetails.accountNumber.startsWith('U2FsdGVk')) {
      req.body.bankDetails.accountNumber = encrypt(req.body.bankDetails.accountNumber);
    }

    if (req.body.foodType) {
      req.body.foodType = normalizeFoodType(req.body.foodType) || req.body.foodType;
    }

    if (req.body.location?.parkingDetails && !req.body.parkingDetails) {
      const pd = req.body.location.parkingDetails;
      req.body.parkingDetails = {
        type: pd.type || req.body.location.parkingAvailability || 'None',
        cars: {
          capacity: Number(pd.carsCapacity || pd.cars?.capacity || 0),
          isChargeable: (pd.type === 'Paid' || Number(pd.carCharges || pd.cars?.chargePerVehicle || 0) > 0),
          chargePerVehicle: Number(pd.carCharges || pd.cars?.chargePerVehicle || 0)
        },
        twoWheelers: {
          capacity: Number(pd.twoWheelerCapacity || pd.twoWheelers?.capacity || 0),
          isChargeable: (pd.type === 'Paid' || Number(pd.twoWheelerCharges || pd.twoWheelers?.chargePerVehicle || 0) > 0),
          chargePerVehicle: Number(pd.twoWheelersCharges || pd.twoWheelers?.chargePerVehicle || 0)
        }
      };
    }
    
    venue.set(req.body);
    await venue.save();
    
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
    if (req.user.role === 'ambassador') {
      return res.status(403).json({
        success: false,
        message: 'Ambassadors cannot delete venue listings.'
      });
    }

    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check ownership
    if (venue.owner?.toString() !== req.user.id && req.user.role !== 'admin') {
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

// @desc    Get owner's or ambassador's venues
// @route   GET /api/venues/my-venues
exports.getMyVenues = async (req, res) => {
  try {
    const query = req.user.role === 'ambassador'
      ? { ambassador: req.user.id }
      : { owner: req.user.id };
    const venues = await Venue.find(query)
      .populate('owner', 'name email phone')
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

// @desc    Get public platform settings (for booking calculations)
// @route   GET /api/venues/platform-settings/public
exports.getPublicPlatformSettings = async (req, res) => {
  try {
    const PlatformSettings = require('../models/PlatformSettings');
    const settings = await PlatformSettings.getSettings();
    const platformFeeType = settings.platformFeeType || 'percentage';
    const platformFeeValue = settings.platformFeeValue ?? settings.platformFeePercentage ?? 5;
    
    // Return only the necessary fields for booking calculations
    res.json({
      success: true,
      settings: {
        gstRate: settings.gstRate || 18,
        platformFee: {
          feeType: platformFeeType,
          feeValue: platformFeeValue
        },
        venueCGST: settings.venueCGST || 9,
        venueSGST: settings.venueSGST || 9,
        venueHSN: settings.venueHSN || '',
        platformCGST: settings.platformCGST || 9,
        platformSGST: settings.platformSGST || 9,
        // Also expose flat fields for BookingForm compatibility
        platformFeeType,
        platformFeeValue,
        platformFeePercentage: platformFeeType === 'percentage' ? platformFeeValue : 0,
        gstInvoiceSignature: settings.gstInvoiceSignature || null,
        platformInvoiceSignature: settings.platformInvoiceSignature || null
      }
    });
  } catch (error) {
    console.error('Error fetching public platform settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform settings'
    });
  }
};
