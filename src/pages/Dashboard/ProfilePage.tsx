import { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, RefreshCw, Shield, Camera } from 'lucide-react';

interface UserProfile {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  name?: string;
  profileImage?: string;
  avatar?: string;
  profilePicture?: string;
  photoURL?: string;
  image?: string;
  picture?: string;
  avatarUrl?: string;
  createdAt?: string;
}

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

const getUserDataFromStorage = (): UserProfile => {
  try {
    const userData = safeGetItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed && typeof parsed === 'object') {
          const hasValidData = 
            parsed.id || 
            parsed._id || 
            parsed.email || 
            parsed.username || 
            parsed.firstName ||
            parsed.name;
          
          if (hasValidData) {
            console.log(' User data found in localStorage');
            return parsed;
          }
        }
      } catch (parseError) {
        console.error('Error parsing user data from localStorage:', parseError);
      }
    }

    const sessionUserData = sessionStorage.getItem('user');
    if (sessionUserData) {
      try {
        const parsed = JSON.parse(sessionUserData);
        if (parsed && typeof parsed === 'object') {
          const hasValidData = 
            parsed.id || 
            parsed._id || 
            parsed.email || 
            parsed.username || 
            parsed.firstName ||
            parsed.name;
          
          if (hasValidData) {
            console.log(' User data found in sessionStorage');
            return parsed;
          }
        }
      } catch (parseError) {
        console.error('Error parsing user data from sessionStorage:', parseError);
      }
    }

    console.log(' No valid user data found in storage');
    return {};
  } catch (error) {
    console.error('Error getting user data from storage:', error);
    return {};
  }
};

const getProfileImage = (): string | null => {
  try {
    const userData = safeGetItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.profileImage && user.profileImage.startsWith('http')) {
          return user.profileImage;
        }
      } catch (error) {
        console.error('Error parsing user data for profile image:', error);
      }
    }
    
    const cookieImage = getCookie('userProfileImage');
    if (cookieImage && cookieImage.startsWith('data:image')) {
      return cookieImage;
    }
    
    const tempImage = safeGetItem('userProfileImage_temp');
    if (tempImage && tempImage.startsWith('data:image')) {
      return tempImage;
    }
    
    const sessionImage = sessionStorage.getItem('userProfileImage');
    if (sessionImage && sessionImage.startsWith('data:image')) {
      return sessionImage;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting profile image:', error);
    return null;
  }
};

const getTokenFromStorage = (): string | null => {
  try {
    return safeGetItem('token') || sessionStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token from storage:', error);
    return null;
  }
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);

  const loadDataFromStorage = () => {
    console.log(' Loading data from storage...');
    
    const userData = getUserDataFromStorage();
    const image = getProfileImage();
    
    if (userData && Object.keys(userData).length > 0) {
      setProfile(userData);
      setUsingLocalData(true);
      console.log(' Using locally stored user data:', userData);
    }
    
    if (image) {
      setProfileImage(image);
      console.log(' Using locally stored profile image');
    }
    
    return { userData, image };
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getTokenFromStorage();
      
      if (!token) {
        console.log(' No token found in storage');
        setUsingLocalData(true);
        setIsLoading(false);
        return;
      }

      console.log(' Fetching user profile with token');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://expense-tracker-backend-3lql.vercel.app/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📨 Profile API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          console.warn('🔄 Authentication failed, using local data');
          setUsingLocalData(true);
          return;
        } else if (response.status === 404) {
          console.warn('🔄 Profile endpoint not found, using local data');
          setUsingLocalData(true);
          return;
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log(' Full API response for ProfilePage:', result);

      if (result && typeof result === 'object') {
        let userData: UserProfile = {};
        
        if (result.success && result.data && typeof result.data === 'object') {
          userData = result.data;
        } else if (result.id || result._id || result.email) {
          userData = result;
        }

        const hasValidUserData = 
          userData.id || 
          userData._id || 
          userData.email || 
          userData.username || 
          userData.firstName ||
          userData.name;

        if (hasValidUserData) {
          setProfile(userData);
          setUsingLocalData(false);
          
          try {
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('💾 Updated user data in localStorage');
          } catch (storageError) {
            console.warn('Could not update localStorage, using sessionStorage');
            sessionStorage.setItem('user', JSON.stringify(userData));
          }

          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
            if (userData.profileImage.startsWith('http')) {
              document.cookie = `userProfileImage=${userData.profileImage}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }
          }
        } else {
          console.warn(' API response missing required fields, using local data');
          setUsingLocalData(true);
        }
      } else {
        console.warn(' Invalid API response format, using local data');
        setUsingLocalData(true);
      }
      
    } catch (error: any) {
      console.error(' Error fetching user profile:', error);
      
      if (error.name === 'AbortError') {
        setError('Request timeout - using locally stored data');
        setUsingLocalData(true);
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error - using locally stored data');
        setUsingLocalData(true);
      } else {
        setError(`${error.message} - using locally stored data`);
        setUsingLocalData(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfileImage = () => {
    const image = getProfileImage();
    if (image) {
      setProfileImage(image);
    }
  };

  const getDisplayName = () => {
    if (!profile || Object.keys(profile).length === 0) return 'Guest User';
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    } else if (profile.firstName) {
      return profile.firstName;
    } else if (profile.name) {
      return profile.name;
    } else if (profile.username) {
      return profile.username;
    } else if (profile.email) {
      return profile.email.split('@')[0];
    } else {
      return 'User';
    }
  };

  const getUserEmail = () => {
    return profile?.email || 'No email provided';
  };

  const getInitials = () => {
    if (!profile || Object.keys(profile).length === 0) return 'GU';
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    } else if (profile.firstName) {
      return profile.firstName[0].toUpperCase();
    } else if (profile.name) {
      const names = profile.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return profile.name[0].toUpperCase();
    } else if (profile.username) {
      return profile.username[0].toUpperCase();
    } else if (profile.email) {
      return profile.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Profile image failed to load, showing fallback');
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'none';
    }
  };

  const getUserId = () => {
    return profile?.id || profile?._id || 'Not available';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

 
  const handleRetry = () => {
    fetchUserProfile();
    loadProfileImage();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setProfileImage(base64Image);
        
        try {
          localStorage.setItem('userProfileImage_temp', base64Image);
        } catch (storageError) {
          console.warn('localStorage full, using sessionStorage');
          sessionStorage.setItem('userProfileImage_temp', base64Image);
        }
        
        if (base64Image.length < 4000) {
          document.cookie = `userProfileImage=${base64Image}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        window.dispatchEvent(new Event('profileImageUpdated'));
        
        console.log('✅ Profile image updated locally:', file.name);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const { userData } = loadDataFromStorage();
    
    if (userData && Object.keys(userData).length > 0) {
      setIsLoading(false);
      fetchUserProfile(); 
    } else {
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log(' Storage changed, reloading data...');
      loadDataFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const hasUserData = profile && Object.keys(profile).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-600 max-w-2xl">
              {usingLocalData ? 'Using locally stored data' : 'Live profile data from server'}
            </p>
          </div>
          <div className="flex justify-center sm:justify-end space-x-2">
            {usingLocalData && (
              <span className="px-3 py-2 text-xs bg-yellow-100 text-yellow-800 rounded-md flex items-center">
                🔄 Offline Mode
              </span>
            )}
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Using Local Data</h3>
                <p className="text-sm text-yellow-700 mt-1 break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Data Warning */}
        {!hasUserData && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">No Profile Data Available</h3>
                <p className="text-sm text-red-700 mt-1">
                  Please log in to view your profile data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        {hasUserData && (
          <div className="bg-white shadow-sm sm:shadow-lg rounded-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-6 sm:py-8">
              <div className="flex flex-col xs:flex-row items-center space-y-4 xs:space-y-0 xs:space-x-4 sm:space-x-6">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="relative">
                    {profileImage ? (
                      <>
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                        />
                        {/* Fallback avatar */}
                        <div 
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg text-white font-bold text-lg sm:text-xl hidden"
                        >
                          {getInitials()}
                        </div>
                      </>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white font-bold text-lg sm:text-xl">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <label htmlFor="profile-image-upload" className="cursor-pointer">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                {/* User Info */}
                <div className="text-white text-center xs:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2 break-words">
                    {getDisplayName()}
                  </h1>
                  <div className="flex items-center justify-center xs:justify-start space-x-2 text-purple-100 mb-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm break-all">{getUserEmail()}</span>
                  </div>
                  <div className="flex items-center justify-center xs:justify-start space-x-2 text-purple-100 text-xs">
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono">ID: {getUserId().substring(0, 8)}...</span>
                    {usingLocalData && (
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Local</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium break-words">
                      {getDisplayName()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500 flex items-center">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      Email Address
                    </label>
                    <p className="text-gray-900 font-medium break-all">{getUserEmail()}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Account Information
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500 flex items-center">
                      <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                      User ID
                    </label>
                    <p className="text-gray-900 font-medium font-mono text-xs sm:text-sm bg-gray-50 px-3 py-2 rounded border break-all">
                      {getUserId()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      Member Since
                    </label>
                    <p className="text-gray-900 font-medium">
                      {profile.createdAt ? formatDate(profile.createdAt) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Source Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Data Source
                </h2>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Current Data Source
                  </label>
                  <p className="text-gray-900 font-medium text-sm">
                    {usingLocalData ? '📱 Locally Stored Data' : '🌐 Live Server Data'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {usingLocalData 
                      ? 'Showing data from your local storage. Some information might be outdated.' 
                      : 'Connected to server with live data.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 space-y-2 sm:space-y-0">
                <div className="flex items-center justify-center sm:justify-start space-x-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="font-mono">
                    {usingLocalData ? '📱 Local' : '🌐 Live'} • ID: {getUserId().substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;