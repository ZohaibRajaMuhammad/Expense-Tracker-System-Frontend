import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaBars } from 'react-icons/fa';

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

const Header = ({ onMenuToggle }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [profileImage, setProfileImage] = useState(null);
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }


      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);


      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userProfileImage_temp');
          document.cookie = 'userProfileImage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
          throw new Error('Authentication failed - please log in again');
        } else if (response.status === 404) {
          throw new Error('Profile endpoint not found');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
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
            throw new Error('User data missing required identification fields');
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
            throw new Error('API response does not contain valid user data');
          }
        }
      } else {
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      
      if (error.name === 'AbortError') {
        setError('Request timeout - please check your connection');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error - unable to connect to server');
      } else if (error.message.includes('Authentication failed')) {
        setError(error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfileImage_temp');
        document.cookie = 'userProfileImage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      } else {
        setError(error.message);
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
      if (parsed && typeof parsed === 'object') {
        const hasValidData = 
          parsed.id || 
          parsed._id || 
          parsed.email || 
          parsed.username || 
          parsed.firstName ||
          parsed.name;
        
        return hasValidData ? parsed : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing fallback user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUserProfile();
    loadProfileImage();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      loadProfileImage();
      const currentUser = getFallbackUserData();
      if (currentUser && !user) {
        setUser(currentUser);
      }
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
  }, [user]);

  // const getDisplayName = () => {
  //   const currentUser = user || getFallbackUserData();
    
  //   if (!currentUser) return 'Welcome Guest';
    
  //   if (currentUser.firstName && currentUser.lastName) {
  //     return isMobile ? `${currentUser.firstName} ${currentUser.lastName.charAt(0)}.` : `${currentUser.firstName} ${currentUser.lastName}`;
  //   } else if (currentUser.firstName) {
  //     return currentUser.firstName;
  //   } else if (currentUser.name) {
  //     return isMobile && currentUser.name.length > 12 ? `${currentUser.name.substring(0, 10)}...` : currentUser.name;
  //   } else if (currentUser.username) {
  //     return isMobile && currentUser.username.length > 12 ? `${currentUser.username.substring(0, 10)}...` : currentUser.username;
  //   } else if (currentUser.email) {
  //     const username = currentUser.email.split('@')[0];
  //     return isMobile && username.length > 12 ? `${username.substring(0, 10)}...` : username;
  //   } else {
  //     return 'User';
  //   }
  // };

  // const getUserStatus = () => {
  //   const currentUser = user || getFallbackUserData();
    
  //   if (!currentUser) return 'Not logged in';
    
  //   return 'Active';
  // };

  // const handleImageError = (e) => {
  //   e.target.style.display = 'none';
  //   const fallback = e.target.nextElementSibling;
  //   if (fallback) {
  //     fallback.style.display = 'flex';
  //   }
  // };

  // const handleImageLoad = (e) => {
  //   const fallback = e.target.nextElementSibling;
  //   if (fallback) {
  //     fallback.style.display = 'none';
  //   }
  // };

  const handleRetry = () => {
    fetchUserProfile();
    loadProfileImage();
  };

  const getInitials = () => {
    const currentUser = user || getFallbackUserData();
    if (!currentUser) return 'G';
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
    } else if (currentUser.firstName) {
      return currentUser.firstName[0].toUpperCase();
    } else if (currentUser.name) {
      const names = currentUser.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return currentUser.name[0].toUpperCase();
    } else if (currentUser.username) {
      return currentUser.username[0].toUpperCase();
    } else if (currentUser.email) {
      return currentUser.email[0].toUpperCase();
    }
    
    return 'U';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 lg:ml-64 transition-all duration-300">
      <div className="flex items-center justify-between">
        {/* Left Section - Menu Button and Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[#A537FF] hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#A537FF] focus:ring-opacity-50"
            aria-label="Toggle menu"
          >
            <FaBars className="w-5 h-5" />
          </button>
          
          {/* Page Title */}
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-[#A537FF] leading-tight">
              Expense Tracker
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden xs:block">
              Manage your expenses efficiently
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          {loading && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Loading...</p>
              <p className="text-xs text-gray-500 hidden md:block">Fetching user data</p>
            </div>
          )}
          
          {error && (
            <div className="text-right max-w-[120px] sm:max-w-xs">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Profile Error</p>
              <p className="text-xs text-red-500 truncate hidden sm:block">{error}</p>
              <button 
                onClick={handleRetry}
                className="text-xs text-blue-500 hover:text-blue-700 underline mt-0.5"
              >
                Retry
              </button>
            </div>
          )}
          
          
          
        </div>
      </div>
    </header>
  );
};

export default Header;