const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@rentalmeet.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@rentalmeet.com',
      phone: '9999999999',
      role: 'admin',
      password: hashedPassword,
      isActive: true
    });

    console.log('\n🎉 Admin user created successfully!\n');
    console.log('📧 Email: admin@rentalmeet.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: admin');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!\n');
    console.log('🌐 Login at: http://localhost:3000/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Run the function
createAdmin();
