import React, { useState, useRef, useEffect } from 'react';
import { User, Upload, Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const REGISTER_API_URL = 'http://localhost:5000/api/auth/register';
  

const setCookie = (name, value, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
};

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

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
const safeSetItem = (key, value) => {
  try {
    const valueSize = new Blob([value]).size;
    if (valueSize > 4 * 1024 * 1024) {
      return false;
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      clearTemporaryStorage();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error('Failed to store after cleanup:', retryError);
        return false;
      }
    }
    return false;
  }
};

const clearTemporaryStorage = () => {
  const tempKeys = ['userProfileImage_temp', 'temp_'];
  tempKeys.forEach(key => {
    localStorage.removeItem(key);
  });
};

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        e.target.value = ''; 
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        e.target.value = ''; 
        return;
      }
      
      try {
        const base64Image = await fileToBase64(file);
        
        
        if (base64Image.length < 4000) { 
          setCookie('userProfileImage', base64Image, 7); 
        }
        
        setForm(prev => ({ ...prev, profileImage: file }));
        setError(null);
      } catch (err) {
        setError('Failed to process image. Please try again.');
        console.error('Image processing error:', err);
      }
    }
  };

  const validateForm = () => {
    if (!form.firstName.trim()) {
      setError('First name is required');
      return false;
    }

    if (!form.lastName.trim()) {
      setError('Last name is required');
      return false;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const fetchWithTimeout = async (url, options, timeout = 30000) => {
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const storeUserDataSafely = (userData) => {
    try {
      const essentialUserData = {
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profileImage: userData.profileImage && userData.profileImage.startsWith('http') 
          ? userData.profileImage 
          : null
      };

      if (userData.token) {
        safeSetItem('token', userData.token);
      }

      const stored = safeSetItem('user', JSON.stringify(essentialUserData));
      if (!stored) {
        sessionStorage.setItem('user', JSON.stringify(essentialUserData));
      }

      localStorage.removeItem('userProfileImage_temp');
      
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      formData.append('firstName', form.firstName.trim());
      formData.append('lastName', form.lastName.trim());
      formData.append('email', form.email.trim().toLowerCase());
      formData.append('password', form.password);
      formData.append('confirmPassword', form.confirmPassword);
      if (form.profileImage) {
        formData.append('profileImage', form.profileImage);
      }


      const response = await fetchWithTimeout(REGISTER_API_URL, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(' Failed to parse JSON response:', responseText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || data.msg || `Registration failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const userData = {
        token: data.token,
        _id: data._id || data.user?._id,
        firstName: data.firstName || data.user?.firstName,
        lastName: data.lastName || data.user?.lastName,
        email: data.email || data.user?.email,
        profileImage: data.profileImage || data.user?.profileImage,
      };

      const storageSuccess = storeUserDataSafely(userData);
      
      if (!storageSuccess) {
        // console.warn('User data storage had issues, but registration was successful');
      }

      
      if (userData.profileImage && userData.profileImage.startsWith('http')) {
        setCookie('userProfileImage', userData.profileImage, 7);
      }

      setSuccess('Registration successful! Redirecting to Login');
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      console.error(' Registration error:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.message.includes('Unexpected end of form')) {
        setError('File upload failed. Please try with a smaller image or different format.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running on https://expense-tracker-backend-3lql.vercel.app/');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const renderProfileVisual = () => {
    if (form.profileImage) {
      return (
        <img
          src={URL.createObjectURL(form.profileImage)}
          alt="Profile Preview"
          className="w-full h-full object-cover rounded-full"
          onLoad={(e) => {
            URL.revokeObjectURL(e.target.src);
          }}
        />
      );
    }
    
    const storedImage = localStorage.getItem('userProfileImage_temp') || getCookie('userProfileImage');
    if (storedImage && storedImage.startsWith('data:image')) {
      return (
        <img
          src={storedImage}
          alt="Profile Preview"
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <User className="h-10 w-10 text-purple-600 opacity-80" />
        <div className="absolute bottom-0 right-0 p-1 bg-white rounded-full border border-purple-300 shadow-sm">
          <Upload className="h-4 w-4 text-purple-600" />
        </div>
      </div>
    );
  };

  const clearFile = () => {
    setForm(prev => ({ ...prev, profileImage: null }));
    localStorage.removeItem('userProfileImage_temp');
    setCookie('userProfileImage', '', -1); 
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          </div>
          <p className="text-gray-600">Smart expense tracking for everyone</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500">Join thousands managing their finances smarter</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center cursor-pointer relative transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-dashed border-purple-200"
                onClick={() => fileInputRef.current?.click()}
              >
                {renderProfileVisual()}
              </div>
              {form.profileImage && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={loading}
              />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mb-6">Profile image </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
              <p className="text-green-700 text-sm font-medium flex-1">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    minLength="6"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    minLength="6"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors disabled:opacity-50"
                onClick={(e) => loading && e.preventDefault()}
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
               Your data is securely encrypted and protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;