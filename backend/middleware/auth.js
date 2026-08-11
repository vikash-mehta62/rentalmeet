const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user.id for consistency
    req.user.id = req.user._id.toString();
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message
    });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (req.user) {
        req.user.id = req.user._id.toString();
      }
    }
    next();
  } catch (error) {
    next();
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // If admin is in allowed roles, also allow subadmin
    const allowedRoles = [...roles];
    if (roles.includes('admin') && !roles.includes('subadmin')) {
      allowedRoles.push('subadmin');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if subadmin has specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    // Main admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if subadmin has the required permission
    if (req.user.role === 'subadmin') {
      if (!req.user.permissions || !req.user.permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to access this resource`
        });
      }
      return next();
    }
    
    // Other roles are not allowed
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  };
};
