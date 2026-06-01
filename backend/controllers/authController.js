const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { sendEmail, sendOtpVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const OtpVerification = require('../models/OtpVerification');
const { sendSMS } = require('../utils/smsService');

// Helper function to generate user ID
// Format: RM-ROLE-YEAR-SEQUENCE
// Example: RM-CUST-2026-0001, RM-OWN-2026-0001, RM-EMP-2026-0001
const generateUserId = async (role) => {
  const year = new Date().getFullYear();
  const rolePrefix = role === 'owner' ? 'OWN' : 
                     role === 'admin' ? 'ADM' :
                     role === 'subadmin' ? 'SUB' :
                     role === 'employee' ? 'EMP' :
                     role === 'vendor' ? 'VND' : 'CUST';
  
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
    const { name, email, phone, password, role, referralCode, city, state, accountType, companyName, gstNumber, panNumber, vendorCategory } = req.body;
    
    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
    }
    // Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    // Password min length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    // Verify email is verified in OtpVerification
    const emailVerification = await OtpVerification.findOne({
      email: email.trim().toLowerCase(),
      isEmailVerified: true
    });
    if (!emailVerification) {
      return res.status(400).json({ success: false, message: 'Please verify your email address first' });
    }

    // Verify phone is verified in OtpVerification
    const phoneVerification = await OtpVerification.findOne({
      phone: phone.trim(),
      isPhoneVerified: true
    });
    if (!phoneVerification) {
      return res.status(400).json({ success: false, message: 'Please verify your phone number first' });
    }

    // Delete verification records
    await OtpVerification.deleteOne({ _id: emailVerification._id });
    if (phoneVerification._id.toString() !== emailVerification._id.toString()) {
      await OtpVerification.deleteOne({ _id: phoneVerification._id });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
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
      accountType: accountType || (role === 'vendor' ? 'company' : 'individual'),
      companyName: companyName || undefined,
      gstNumber: gstNumber || undefined,
      panNumber: panNumber || undefined,
      vendorCategory: vendorCategory || undefined,
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

// @desc    Send registration OTP to Email
// @route   POST /api/auth/send-email-otp
exports.sendEmailOtp = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email?.trim() || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Generate random 6-digit OTP
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/Update OTP in OtpVerification collection
    await OtpVerification.findOneAndUpdate(
      { email: email.toLowerCase() },
      { emailOtp, isEmailVerified: false, expiresAt },
      { upsert: true, new: true }
    );

    // Send Email OTP
    await sendOtpVerificationEmail(email.toLowerCase(), name, emailOtp);

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email address'
    });
  } catch (error) {
    console.error('Send Email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email verification code'
    });
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email-otp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const verification = await OtpVerification.findOne({
      email: email.trim().toLowerCase(),
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found. Please request a new OTP.'
      });
    }

    if (verification.emailOtp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email verification code'
      });
    }

    verification.isEmailVerified = true;
    await verification.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify Email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email code'
    });
  }
};

// @desc    Send registration OTP to Phone
// @route   POST /api/auth/send-phone-otp
exports.sendPhoneOtp = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!phone?.trim() || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
    }

    // Generate random 6-digit OTP
    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/Update OTP in OtpVerification collection
    await OtpVerification.findOneAndUpdate(
      { phone },
      { phoneOtp, isPhoneVerified: false, expiresAt },
      { upsert: true, new: true }
    );

    // Send SMS OTP
    await sendSMS(phone, name, phoneOtp);

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your phone number'
    });
  } catch (error) {
    console.error('Send Phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone verification code'
    });
  }
};

// @desc    Verify Phone OTP
// @route   POST /api/auth/verify-phone-otp
exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const verification = await OtpVerification.findOne({
      phone: phone.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found. Please request a new OTP.'
      });
    }

    if (verification.phoneOtp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone verification code'
      });
    }

    verification.isPhoneVerified = true;
    await verification.save();

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify Phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone code'
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

    // Check if account is deleted
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deleted'
      });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.'
      });
    }
    
    const token = generateToken(user._id);

    // Fetch full user (with kyc) for the response — avoids stale store on client
    const fullUser = await User.findById(user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('referrals.user', 'name email role')
      .populate('referredBy', 'name referralCode');

    res.json({
      success: true,
      token,
      user: fullUser
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
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('referrals.user', 'name email role')
      .populate('referredBy', 'name referralCode');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    
    // Update basic fields
    if (name) currentUser.name = name;
    if (email) currentUser.email = email;
    if (phone) currentUser.phone = phone;
    if (address !== undefined) currentUser.address = address;
    if (city !== undefined) currentUser.city = city;
    if (state !== undefined) currentUser.state = state;
    if (pincode !== undefined) currentUser.pincode = pincode;
    if (profilePicture !== undefined) currentUser.profilePicture = profilePicture;

    // Employee-specific editable fields
    if (currentUser.role === 'employee') {
      const { alternatePhone, fatherOrHusbandName, dateOfBirth, bloodGroup, emergencyContact } = req.body;
      if (alternatePhone !== undefined) currentUser.alternatePhone = alternatePhone;
      if (!currentUser.employeeDetails) currentUser.employeeDetails = {};
      if (fatherOrHusbandName !== undefined) currentUser.employeeDetails.fatherOrHusbandName = fatherOrHusbandName;
      if (dateOfBirth !== undefined) currentUser.employeeDetails.dateOfBirth = dateOfBirth;
      if (bloodGroup !== undefined) currentUser.employeeDetails.bloodGroup = bloodGroup;
      if (emergencyContact !== undefined) currentUser.employeeDetails.emergencyContact = emergencyContact;
    }

    // Update GST & Business details (root level fields)
    if (gstNumber !== undefined) currentUser.gstNumber = gstNumber;
    if (companyName !== undefined) currentUser.companyName = companyName;
    if (panNumber !== undefined) currentUser.panNumber = panNumber;
    
    // Save the user
    const savedUser = await currentUser.save();
    await savedUser.populate([
      { path: 'referrals.user', select: 'name email role' },
      { path: 'referredBy', select: 'name referralCode' }
    ]);
    
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

// @desc    Delete account
// @route   DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const Booking = require('../models/Booking');

    // Check for active bookings (pending or confirmed)
    const activeBookings = await Booking.countDocuments({
      customer: userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `You have ${activeBookings} active booking(s). Please cancel or complete them before deleting your account.`
      });
    }

    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${req.user.email}`
    }, { runValidators: false });

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

// @desc    Temporarily deactivate account
// @route   PUT /api/auth/deactivate-account
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { isActive: false }, { runValidators: false });
    res.json({ success: true, message: 'Account deactivated. Login again to reactivate.' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate account' });
  }
};

// @desc    Upload KYC documents (ID proof front + back + selfie + address proof)
// @route   POST /api/auth/kyc-upload
exports.uploadKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uploadToCloudinary } = require('../config/cloudinary');
    const { idProofType } = req.body;

    if (!req.files || (!req.files.idProof && !req.files.selfie && !req.files.idProofBack && !req.files.addressProof)) {
      return res.status(400).json({ success: false, message: 'Please upload at least one document' });
    }

    const updates = { 'kyc.verifiedAt': null };

    if (req.files.idProof && req.files.idProof[0]) {
      const result = await uploadToCloudinary(req.files.idProof[0].buffer, 'kyc/id-proofs');
      updates['kyc.idProof'] = result.secure_url;
      if (idProofType) updates['kyc.idProofType'] = idProofType;
    }

    if (req.files.idProofBack && req.files.idProofBack[0]) {
      const result = await uploadToCloudinary(req.files.idProofBack[0].buffer, 'kyc/id-proofs');
      updates['kyc.idProofBack'] = result.secure_url;
    }

    if (req.files.selfie && req.files.selfie[0]) {
      const result = await uploadToCloudinary(req.files.selfie[0].buffer, 'kyc/selfies');
      updates['kyc.selfie'] = result.secure_url;
    }

    if (req.files.addressProof && req.files.addressProof[0]) {
      const result = await uploadToCloudinary(req.files.addressProof[0].buffer, 'kyc/address-proofs');
      updates['kyc.addressProof'] = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: false }
    ).select('-password');
    res.json({ success: true, message: 'KYC documents uploaded successfully', user });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload KYC documents' });
  }
};

// @desc    Employee self-update (documents, education, bank, personal — NOT salary/position)
// @route   PUT /api/auth/employee-self-update
exports.employeeSelfUpdate = async (req, res) => {
  try {
    const employee = await User.findById(req.user.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const {
      name, phone, alternatePhone, address, city, state, pincode,
      fatherOrHusbandName, dateOfBirth, bloodGroup, maritalStatus,
      emergencyContact,
      qualification,
      documents,
      bankDetails
    } = req.body;

    // Basic fields
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (alternatePhone !== undefined) employee.alternatePhone = alternatePhone;
    if (address !== undefined) employee.address = address;
    if (city !== undefined) employee.city = city;
    if (state !== undefined) employee.state = state;
    if (pincode !== undefined) employee.pincode = pincode;

    if (!employee.employeeDetails) employee.employeeDetails = {};

    // Personal details (NOT salary, position, department, employmentType, joiningDate)
    if (fatherOrHusbandName !== undefined) employee.employeeDetails.fatherOrHusbandName = fatherOrHusbandName;
    if (dateOfBirth !== undefined) employee.employeeDetails.dateOfBirth = dateOfBirth;
    if (bloodGroup !== undefined) employee.employeeDetails.bloodGroup = bloodGroup;
    if (maritalStatus !== undefined) employee.employeeDetails.maritalStatus = maritalStatus;
    if (emergencyContact !== undefined) employee.employeeDetails.emergencyContact = emergencyContact;

    // Documents (aadhaar, pan)
    if (documents !== undefined) {
      employee.employeeDetails.documents = {
        ...employee.employeeDetails.documents,
        ...documents
      };
    }

    // Qualification (education + certificates)
    if (qualification !== undefined) {
      employee.employeeDetails.qualification = {
        ...employee.employeeDetails.qualification,
        ...qualification
      };
    }

    // Bank details
    if (bankDetails !== undefined) {
      employee.employeeDetails.bankDetails = {
        ...employee.employeeDetails.bankDetails,
        ...bankDetails
      };
    }

    await employee.save({ validateBeforeSave: false });
    await employee.populate([
      { path: 'referrals.user', select: 'name email role' },
      { path: 'referredBy', select: 'name referralCode' }
    ]);

    const userData = employee.toObject();
    delete userData.password;

    res.json({ success: true, message: 'Profile updated successfully', user: userData });
  } catch (error) {
    console.error('Employee self-update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request forgot password OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+resetPasswordToken +resetPasswordExpire');

    // Always return success response to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email is registered, reset OTP has been sent.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpire = Date.now() + (10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, user.name, otp);

    return res.json({
      success: true,
      message: 'If this email is registered, reset OTP has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request'
    });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and new password are required'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const hashedOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully. Please login.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// @desc    Get referrer details by referral code
// @route   GET /api/auth/referrer/:code
exports.getReferrerByCode = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const referrer = await User.findOne({ referralCode: code }).select('name role referralCode');
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    return res.json({
      success: true,
      referrer: { name: referrer.name, role: referrer.role, referralCode: referrer.referralCode }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
