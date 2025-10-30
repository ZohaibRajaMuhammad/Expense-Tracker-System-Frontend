'use client'
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import jwt from "jsonwebtoken";
import Cookies from 'js-cookie';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize token from cookie on component mount
    const storedToken = Cookies.get('authToken');
    if (storedToken) {
      setToken(storedToken);
      const userDetails = jwt.decode(storedToken);
      setUser(userDetails);
    }
  }, []);

  useEffect(() => {
    if (token) {
      Cookies.set('authToken', token, { 
        expires: 30, // 7 days
        // eslint-disable-next-line no-undef
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      const userDetails = jwt.decode(token);
      setUser(userDetails);
    } else {
      Cookies.remove('authToken');
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    Cookies.remove('authToken');
    router.push("/login");
  };

  const getUserDetails = () => {
    if (!token) return null;
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  // Function to make authenticated API calls
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired or invalid
        logout();
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user,
      login, 
      logout, 
      getUserDetails,
      authFetch 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};