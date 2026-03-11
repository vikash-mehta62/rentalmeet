# SubAdmin Implementation

## Overview
SubAdmin role has been successfully implemented with full admin access rights. SubAdmins can perform all administrative tasks that main admins can do.

## Backend Changes

### 1. User Model (`backend/models/User.js`)
- Added `'subadmin'` to role enum
- Updated referral code generation to include 'SUB' prefix for subadmins
- SubAdmin user IDs follow format: `RM-SUB-YEAR-SEQUENCE` (e.g., RM-SUB-2026-0001)

### 2. Auth Middleware (`backend/middleware/auth.js`)
- Updated `authorize` middleware to automatically grant subadmin access wherever admin access is granted
- When checking for 'admin' role, 'subadmin' is automatically included in allowed roles
- This ensures SubAdmins have identical permissions to main admins

### 3. Auth Controller (`backend/controllers/authController.js`)
- Updated `generateUserId` function to handle 'subadmin' role
- SubAdmins get 'SUB' prefix in their user IDs

### 4. Admin Controller (`backend/controllers/adminController.js`)
Added complete CRUD operations for SubAdmin management:
- `getAllSubAdmins` - Get all subadmins
- `createSubAdmin` - Create new subadmin
- `updateSubAdmin` - Update subadmin details
- `deleteSubAdmin` - Delete subadmin
- `toggleSubAdminStatus` - Activate/deactivate subadmin

### 5. Admin Routes (`backend/routes/admin.js`)
Added SubAdmin management endpoints:
- `GET /api/admin/subadmins` - List all subadmins
- `POST /api/admin/subadmins` - Create subadmin
- `PUT /api/admin/subadmins/:id` - Update subadmin
- `DELETE /api/admin/subadmins/:id` - Delete subadmin
- `PUT /api/admin/subadmins/:id/status` - Toggle status

**Note:** Only main admins can manage SubAdmins (create, edit, delete). SubAdmins cannot create other SubAdmins.

## Frontend Changes

### 1. SubAdmin Management Page (`frontend/app/admin/subadmins/page.js`)
Complete SubAdmin management interface with:
- List view with search functionality
- Statistics cards (Total, Active, Inactive)
- Create/Edit modal with form validation
- Status toggle (Active/Inactive)
- Delete functionality
- CSV export
- Access restricted to main admin only

### 2. Admin Layout (`frontend/components/admin/AdminLayout.js`)
- Added "SubAdmins" menu item with Shield icon
- Updated access control to allow both 'admin' and 'subadmin' roles
- SubAdmins can access all admin pages except SubAdmin management

### 3. Login Page (`frontend/app/login/page.js`)
- Updated role-based redirection to handle 'subadmin' role
- SubAdmins are redirected to `/admin/dashboard` after login

## Access Control Summary

### Main Admin Can:
- Access all admin features
- Create, edit, delete SubAdmins
- Manage all system settings
- View and manage all data

### SubAdmin Can:
- Access all admin features (same as main admin)
- Manage venues, users, employees, bookings, payments
- View reports and analytics
- Manage platform settings
- **Cannot** create, edit, or delete other SubAdmins

### Middleware Behavior:
```javascript
// When a route requires 'admin' role:
authorize('admin')

// Automatically allows both:
- role: 'admin'
- role: 'subadmin'
```

## User ID Format
- Main Admin: `RM-ADM-2026-0001`
- SubAdmin: `RM-SUB-2026-0001`
- Employee: `RM-EMP-2026-0001`
- Owner: `RM-OWN-2026-0001`
- Customer: `RM-CUST-2026-0001`

## Database Schema
SubAdmins are stored in the same `users` collection with:
```javascript
{
  userId: "RM-SUB-2026-0001",
  name: "SubAdmin Name",
  email: "subadmin@example.com",
  phone: "1234567890",
  role: "subadmin",
  isActive: true,
  // ... other user fields
}
```

## Testing Checklist
- [ ] Create SubAdmin from admin panel
- [ ] Login as SubAdmin
- [ ] Verify SubAdmin can access all admin pages
- [ ] Verify SubAdmin cannot access SubAdmin management page
- [ ] Edit SubAdmin details
- [ ] Toggle SubAdmin status (Active/Inactive)
- [ ] Delete SubAdmin
- [ ] Export SubAdmin list to CSV
- [ ] Verify middleware allows SubAdmin on all admin routes

## Security Notes
1. Only main admins (role: 'admin') can manage SubAdmins
2. SubAdmins have full admin access but cannot create other SubAdmins
3. Password hashing is handled automatically by User model pre-save hook
4. JWT tokens work identically for both admin and subadmin roles
5. All API endpoints that check for 'admin' role automatically allow 'subadmin'

## Future Enhancements (Optional)
- Add granular permissions system for SubAdmins
- Activity logging for SubAdmin actions
- Role-based feature restrictions
- SubAdmin dashboard with limited stats
