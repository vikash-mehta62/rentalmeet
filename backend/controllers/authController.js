const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Counter = require('../models/Counter');

// Helper function to generate user ID
// Format: RM-ROLE-YEAR-SEQUENCE
// Example: RM-CUST-2026-0001, RM-OWN-2026-0001, RM-EMP-2026-0001
const generateUserId = async (role) => {
  const year = new Date().getFullYear();
  const rolePrefix = role === 'owner' ? 'OWN' : 
                     role === 'admin' ? 'ADM' :
                     role === 'subadmin' ? 'SUB' :
                     role === 'employee' ? 'EMP' : 'CUST';
  
  // Create counter ID: user_ROLE_YEAR
  const counterId = `user_${rolePrefix}_${year}`;
  
  // Get next sequence number
  const sequence = await Counter.getNextSequence(counterId);
  
  // Format sequence with leading zeros (4 digits)
  const sequenceStr = sequence.toString().padStart(4, '0');
  
  // Generate user ID
  const userId = `RM-${rolePrefix}-${year}-${sequenceStr}`;
  
  return userId;
};

// Export for use in other controllers
module.exports.generateUserId = generateUserId;

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, referralCode, city, state } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }
    
    // Check if referral code is provided and valid
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }
    }
    
    // Create user
    const userRole = role || 'customer';
    const userId = await generateUserId(userRole);
    
    const user = await User.create({
      userId,
      name,
      email,
      phone,
      password,
      role: userRole,
      city: city || undefined,
      state: state || undefined,
      referredBy: referrer ? referrer._id : null,
      referredByCode: referralCode ? referralCode.toUpperCase() : null
    });
    
    console.log('New user created with ID:', userId);
    
    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = user.generateReferralCode();
      const existingCode = await User.findOne({ referralCode: newReferralCode });
      if (!existingCode) {
        isUnique = true;
      }
    }
    user.referralCode = newReferralCode;
    await user.save();
    
    // Update referrer's referral count and list
    if (referrer) {
      referrer.referralCount += 1;
      referrer.referrals.push({
        user: user._id,
        joinedAt: new Date()
      });
      await referrer.save();
    }
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions // Include permissions for subadmins
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('referrals.user', 'name email role')
      .populate('referredBy', 'name email referralCode');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      pincode, 
      profilePicture,
      gstNumber,
      companyName,
      panNumber
    } = req.body;
    
    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('GST Number:', gstNumber);
    console.log('Company Name:', companyName);
    console.log('PAN Number:', panNumber);
    
    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Check if phone is being changed and if it's already taken
    if (phone && phone !== req.user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
    }
    
    // Get current user first
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Before update - GST:', currentUser.gstNumber, 'Company:', currentUser.companyName, 'PAN:', currentUser.panNumber);
    
    // Update basic fields
    currentUser.name = name || currentUser.name;
    currentUser.email = email || currentUser.email;
    currentUser.phone = phone || currentUser.phone;
    currentUser.address = address || currentUser.address;
    currentUser.city = city || currentUser.city;
    currentUser.state = state || currentUser.state;
    currentUser.pincode = pincode || currentUser.pincode;
    currentUser.profilePicture = profilePicture || currentUser.profilePicture;
    
    // Update GST & Business details (root level fields)
    if (gstNumber !== undefined) {
      currentUser.gstNumber = gstNumber;
      console.log('Setting GST Number to:', gstNumber);
    }
    if (companyName !== undefined) {
      currentUser.companyName = companyName;
      console.log('Setting Company Name to:', companyName);
    }
    if (panNumber !== undefined) {
      currentUser.panNumber = panNumber;
      console.log('Setting PAN Number to:', panNumber);
    }
    
    console.log('After update - GST:', currentUser.gstNumber, 'Company:', currentUser.companyName, 'PAN:', currentUser.panNumber);
    
    // Save the user
    const savedUser = await currentUser.save();
    
    console.log('After save - GST:', savedUser.gstNumber, 'Company:', savedUser.companyName, 'PAN:', savedUser.panNumber);
    
    // Remove password from response
    const user = savedUser.toObject();
    delete user.password;
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        profilePicture: user.profilePicture,
        gstNumber: user.gstNumber,
        companyName: user.companyName,
        panNumber: user.panNumber,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        referredByCode: user.referredByCode,
        referralCount: user.referralCount,
        referrals: user.referrals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
