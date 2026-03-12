// Check if user has permission to access a specific page
export const hasPermission = (user, permission) => {
  // Main admin has all permissions
  if (user?.role === 'admin') {
    return true;
  }
  
  // Check subadmin permissions
  if (user?.role === 'subadmin') {
    return user?.permissions?.[permission] === true;
  }
  
  return false;
};

// Get accessible navigation items based on user permissions
export const getAccessibleNavigation = (user, allNavigation) => {
  if (user?.role === 'admin') {
    return allNavigation;
  }
  
  if (user?.role === 'subadmin') {
    return allNavigation.filter(item => 
      user?.permissions?.[item.permission] === true
    );
  }
  
  return [];
};
