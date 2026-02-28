# Super Admin Panel - Setup & Usage Guide

## 🎯 Current Status

### ✅ Already Created:
1. **Admin Layout** (`frontend/components/admin/AdminLayout.js`)
   - Role-based sidebar with 8 navigation items
   - Responsive design (mobile + desktop)
   - Auto-redirect for non-admin users

2. **Admin Dashboard** (`frontend/app/admin/dashboard/page.js`)
   - 8 statistics cards
   - Quick action buttons
   - Real-time data from backend

3. **Backend Routes** (`backend/routes/admin.js`)
   - Dashboard stats
   - Venue management (approve/reject/suspend)
   - Commission settings
   - Earnings reports

### 📋 Pages That Need to Be Created:

1. **Venues Management** - `/admin/venues`
   - List all venues (approved, pending, rejected)
   - Approve/Reject/Suspend actions
   - View venue details
   - Search and filter

2. **Users Management** - `/admin/users`
   - List all users (owners, customers, admins)
   - View user details
   - Activate/Deactivate users
   - Search and filter by role

3. **Bookings Management** - `/admin/bookings`
   - List all bookings
   - View booking details
   - Filter by status, date, venue
   - Export bookings data

4. **Payments Management** - `/admin/payments`
   - List all payments
   - Payment status tracking
   - Razorpay transaction details
   - Revenue analytics

5. **Reports** - `/admin/reports`
   - Revenue reports
   - Booking analytics
   - Venue performance
   - User activity
   - Export to PDF/Excel

6. **Commission Settings** - `/admin/commission`
   - View current commission rate
   - Update commission rate
   - Commission history
   - Earnings breakdown

7. **Platform Settings** - `/admin/settings`
   - General settings
   - Email templates
   - Payment gateway settings
   - Platform configuration

---

## 🔐 How to Create Admin User

### Method 1: Direct Database Insert (MongoDB Compass/Shell)

```javascript
// Connect to MongoDB and run this in MongoDB shell or Compass
use rentalmeet

db.users.insertOne({
  name: "Super Admin",
  email: "admin@rentalmeet.com",
  phone: "9999999999",
  role: "admin",
  password: "$2a$10$YourHashedPasswordHere", // See below for hashing
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Method 2: Create Admin Registration Script

Create `backend/scripts/createAdmin.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@rentalmeet.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
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

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@rentalmeet.com');
    console.log('Password: Admin@123');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
```

**Run the script:**
```bash
cd backend
node scripts/createAdmin.js
```

### Method 3: Using Existing Register API (Temporary)

Temporarily modify `backend/routes/auth.js` to allow admin registration:

```javascript
// Add this route temporarily
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin'
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

**Use Postman/Thunder Client:**
```
POST http://localhost:5000/api/auth/register-admin
Content-Type: application/json

{
  "name": "Super Admin",
  "email": "admin@rentalmeet.com",
  "phone": "9999999999",
  "password": "Admin@123"
}
```

**⚠️ Remove this route after creating admin!**

---

## 🚀 How to Login as Admin

### Step 1: Go to Login Page
```
http://localhost:3000/login
```

### Step 2: Select Role
- Click on "LOGIN" dropdown in navbar
- Select "Admin" (if dropdown exists)
- OR directly use login form

### Step 3: Enter Credentials
```
Email: admin@rentalmeet.com
Password: Admin@123
```

### Step 4: Auto-Redirect
- After successful login, you'll be redirected to `/admin/dashboard`
- If not admin role, you'll be redirected back to login

---

## 📱 Admin Panel Features

### Dashboard (`/admin/dashboard`)
- Total Venues, Users, Bookings, Revenue
- Pending Venues & Bookings count
- Active Owners & Customers count
- Quick action buttons

### Sidebar Navigation
1. 📊 Dashboard - Overview statistics
2. 🏢 Venues - Manage all venues
3. 👥 Users - Manage all users
4. 📖 Bookings - View all bookings
5. 💰 Payments - Payment tracking
6. 📈 Reports - Analytics & reports
7. 📄 Commission - Commission settings
8. ⚙️ Settings - Platform settings

---

## 🔧 Backend API Endpoints

### Already Available:
```
GET    /api/admin/stats                    - Dashboard statistics
GET    /api/admin/venues/pending           - Pending venues
PUT    /api/admin/venues/:id/approve       - Approve venue
PUT    /api/admin/venues/:id/reject        - Reject venue
PUT    /api/admin/venues/:id/suspend       - Suspend venue
GET    /api/admin/commission               - Get commission settings
PUT    /api/admin/commission               - Update commission rate
GET    /api/admin/earnings                 - Earnings report
```

### Need to Create:
```
GET    /api/admin/users                    - Get all users
GET    /api/admin/users/:id                - Get user details
PUT    /api/admin/users/:id/status         - Update user status
GET    /api/admin/bookings                 - Get all bookings
GET    /api/admin/payments                 - Get all payments
GET    /api/admin/reports/revenue          - Revenue report
GET    /api/admin/reports/bookings         - Bookings report
```

---

## 🎨 Design System

### Colors:
- Primary: `#F59F0A` (Orange)
- Success: Green
- Warning: Yellow
- Danger: Red
- Info: Blue

### Layout:
- Sidebar: 256px width (w-64)
- Gradient: `from-primary-600 to-primary-800`
- Content: Full width minus sidebar
- Responsive: Mobile sidebar overlay

---

## ✅ Testing Checklist

- [ ] Create admin user using script
- [ ] Login with admin credentials
- [ ] Verify dashboard loads with stats
- [ ] Check sidebar navigation
- [ ] Test responsive design (mobile)
- [ ] Verify role-based access (non-admin redirect)
- [ ] Test logout functionality

---

## 📝 Next Steps

1. **Create Admin User** (use Method 2 - script)
2. **Test Login** with admin credentials
3. **Create Remaining Pages** (venues, users, bookings, etc.)
4. **Add Backend APIs** for missing endpoints
5. **Test All Features** thoroughly

---

## 🆘 Troubleshooting

### Issue: Can't login as admin
- Check if admin user exists in database
- Verify role is exactly "admin" (lowercase)
- Check password is hashed correctly

### Issue: Redirected to login after admin login
- Check token is being saved in localStorage
- Verify role check in AdminLayout component
- Check browser console for errors

### Issue: Dashboard shows 0 for all stats
- Verify backend API is running
- Check MongoDB connection
- Ensure data exists in database

---

**Created by: RentalMeet Development Team**
**Last Updated: February 2026**
