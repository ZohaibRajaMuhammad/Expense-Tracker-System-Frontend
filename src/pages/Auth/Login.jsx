import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const from = location.state?.from?.pathname || '/dashboard';

    const LOGIN_API_URL = 'https://expense-tracker-system-backend.vercel.app/api/auth/login';

    useEffect(() => {
        return () => {
            setError(null);
            setSuccess(null);
        };
    }, []);

    const validateForm = () => {
        const errors = {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
        
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include', 
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                }),
            });

            
            if (!response.ok) {
                
                let errorMessage = `Login failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            const token = data.token || data.data?.token || data.access_token;
            const userData = data.user || data.data?.user || data.userData;

            if (!token) {
                throw new Error('No authentication token received');
            }

            localStorage.setItem('token', token);
            
            if (userData) {
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('user_id', userData.id || userData._id || '');
            }

            localStorage.setItem('login_time', new Date().toISOString());

            setSuccess('Login successful! Redirecting...');

            setTimeout(() => {
                navigate(from, { replace: true });
            }, 1000);

        } catch (err) {
            console.error('Login error:', err);
            
            let errorMessage = err.message || 'Login failed. Please try again.';
            
            if (err.message.includes('Network') || err.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your connection and ensure the backend is running.';
            } else if (err.message.includes('401') || err.message.toLowerCase().includes('invalid credential')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (err.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (err.message.includes('CORS')) {
                errorMessage = 'Connection issue. Please ensure the server is running and CORS is configured.';
            }

            setError(errorMessage);
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_id');
            localStorage.removeItem('login_time');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate(from, { replace: true });
        }
    }, [navigate, from]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Expense Tracker
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">Smart expense tracking for everyone</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500">Sign in to continue managing your finances</p>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-fade-in">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                                {error.includes('CORS') && (
                                    <p className="text-red-600 text-xs mt-1">
                                        Make sure your backend server is running on port 5000
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3 animate-fade-in">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-green-700 text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>
                            {formErrors.email && (
                                <p className="text-red-600 text-xs font-medium flex items-center space-x-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>{formErrors.email}</span>
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                                        formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={loading}
                                    autoComplete="current-password"
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
                            {formErrors.password && (
                                <p className="text-red-600 text-xs font-medium flex items-center space-x-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>{formErrors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link 
                                to="/forgot-password" 
                                className="text-sm text-purple-600 hover:text-purple-500 font-medium transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link 
                                to="/signup" 
                                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                            >
                                Create account
                            </Link>
                        </p>
                    </div>

                    

                    {/* Security Note */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
                            <span>🔒</span>
                            <span>Your data is securely encrypted and protected</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Add custom animations */}
            <style jsx="true">{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Login;