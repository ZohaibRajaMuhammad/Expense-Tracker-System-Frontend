
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaChartLine, 
  FaMoneyBillTrendUp, 
  FaMoneyBillTransfer,
  FaRightFromBracket
} from 'react-icons/fa6';
import { FaUserCircle } from 'react-icons/fa';

const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};
const getProfileImage = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.profileImage) {
        return user.profileImage;
      }
    }
    
    const cookieImage = getCookie('userProfileImage');
    if (cookieImage) {
      return cookieImage;
    }
    
    const tempImage = localStorage.getItem('userProfileImage_temp');
    if (tempImage) {
      return tempImage;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting profile image:', error);
    return null;
  }
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('https://expense-tracker-system-backend.vercel.app/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && typeof result === 'object') {
        if (result.success && result.data && typeof result.data === 'object') {
          const userData = result.data;
          
          const hasValidUserData = 
            userData.id || 
            userData._id || 
            userData.email || 
            userData.username || 
            userData.firstName ||
            userData.name;
          
          if (hasValidUserData) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.profileImage) {
              setProfileImage(userData.profileImage);
              document.cookie = `userProfileImage=${userData.profileImage}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }
          } else {
            console.warn('User data missing required fields:', userData);
            setUser(getFallbackUserData());
          }
        } else {
          const hasValidData = 
            result.id || 
            result._id || 
            result.email || 
            result.username || 
            result.firstName ||
            result.name;
          
          if (hasValidData) {
            setUser(result);
            localStorage.setItem('user', JSON.stringify(result));
            
            if (result.profileImage) {
              setProfileImage(result.profileImage);
              document.cookie = `userProfileImage=${result.profileImage}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }
          } else {
            setUser(getFallbackUserData());
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(getFallbackUserData());
      
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfileImage_temp');
        document.cookie = 'userProfileImage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      }
    } finally {
      setLoading(false);
    }
  };
  const loadProfileImage = () => {
    const image = getProfileImage();
    if (image) {
      setProfileImage(image);
    }
  };

  const getFallbackUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!token) return null;
      
      if (!userData) return null;
      
      const trimmedData = userData.trim();
      if (trimmedData === 'undefined' || 
          trimmedData === 'null' || 
          trimmedData === '""' || 
          trimmedData === '' || 
          trimmedData === '{}') {
        return null;
      }
      
      const parsed = JSON.parse(userData);
      
      if (parsed && typeof parsed === 'object' && (parsed.firstName || parsed.email || parsed.id)) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing fallback user data:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchUserProfile();
    loadProfileImage();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      loadProfileImage();
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleProfileImageUpdate = () => {
      loadProfileImage();
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  const getDisplayName = () => {
    if (!user) return 'Welcome!';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.name) {
      return user.name;
    } else if (user.username) {
      return user.username;
    } else if (user.email) {
      return user.email.split('@')[0];
    } else {
      return 'User';
    }
  };

  const getUserEmail = () => {
    return user?.email || 'User';
  };

  const handleImageError = (e) => {
    console.warn('Profile image failed to load, showing fallback');
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  const handleImageLoad = (e) => {
    const fallback = e.target.nextElementSibling;
    if (fallback) {
      fallback.style.display = 'none';
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/dashboard/profile');
    setTimeout(() => {
      fetchUserProfile();
      loadProfileImage();
    }, 100);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { path: '/dashboard/income', label: 'Income', icon: <FaMoneyBillTrendUp /> },
    { path: '/dashboard/expense', label: 'Expense', icon: <FaMoneyBillTransfer /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfileImage_temp');
    document.cookie = 'userProfileImage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    window.location.href = '/login';
  };

  const getInitials = () => {
    if (!user) return 'U';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.firstName) {
      return user.firstName[0].toUpperCase();
    } else if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-50">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 relative">
            {profileImage ? (
              <div className="relative">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shadow-sm"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
                {/* Fallback avatar - hidden by default, shown on image error */}
                <div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-2 border-purple-300 text-white font-semibold text-sm hidden"
                >
                  {getInitials()}
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-2 border-purple-300 text-white font-semibold text-sm">
                {getInitials()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-800 truncate">
                  {getDisplayName()}
                </h2>
                <p className="text-sm text-gray-600 truncate">
                  {getUserEmail()}
                </p>
              </>
            )}
          </div>
        </div>
        
        {/* Optional: User stats or quick info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <span className="font-medium">Active Account</span>
            <span className="text-green-600 font-medium flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online
            </span>
          </div>
        </div>

        {/* Profile Link */}
        <div className="mt-3">
          <Link
            to="/dashboard/profile"
            onClick={handleProfileClick}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              location.pathname === '/dashboard/profile'
                ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600 border border-transparent hover:border-purple-200'
            }`}
          >
            <div className="w-5 h-5 mr-2 flex items-center justify-center">
              <FaUserCircle className="text-purple-500 text-base" />
            </div>
            <span className="font-medium">View Profile</span>
          </Link>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  location.pathname === item.path
                    ? 'bg-purple-100 text-purple-600 border-r-2 border-purple-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600 hover:border-r-2 hover:border-purple-200'
                }`}
              >
                <span className={`mr-3 text-lg transition-colors duration-200 ${
                  location.pathname === item.path 
                    ? 'text-purple-600' 
                    : 'text-gray-400 group-hover:text-purple-500'
                }`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0 bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-transparent hover:border-red-200"
        >
          <FaRightFromBracket className="mr-3 text-lg text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;