import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import { AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate before submitting
    if (!validateForm()) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Call the Backend API
      const { data } = await API.post('/users/login', { email, password });
      
      console.log('✅ Login successful for:', email);
      
      // Save user to Context & LocalStorage
      login(data);
      
      // Success toast with better styling
      toast.success(`Welcome back, ${data.name}! 👋`, {
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '16px'
        }
      });
      
      // Redirect to Dashboard
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      // Enhanced error handling with specific messages
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      
      console.error('🔴 🔴 🔴 LOGIN ERROR DEBUG 🔴 🔴 🔴');
      console.error('Full Error Object:', error);
      console.error('Status:', error.response?.status);
      console.error('Raw Message:', error.response?.data?.message);
      console.error('Error Message Variable:', errorMessage);
      console.error('Checking conditions:');
      console.error('  - includes("Invalid email or password"):', errorMessage.includes('Invalid email or password'));
      console.error('  - includes("password mismatch"):', errorMessage.includes('password mismatch'));
      console.error('  - includes("not found"):', errorMessage.includes('not found'));
      console.error('🔴 🔴 🔴 END DEBUG 🔴 🔴 🔴');
      
      // For any password/email mismatch, show generic message
      if (errorMessage.includes('Invalid email or password')) {
        console.log('✅ SHOWING: Invalid username or password toast');
        toast.error('❌ Invalid username or password. Please check and try again.', {
          icon: '🔐',
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px'
          },
          duration: 4000
        });
      } else if (errorMessage.includes('password mismatch')) {
        console.log('✅ SHOWING: Password mismatch toast');
        toast.error('❌ Invalid username or password. Please check and try again.', {
          icon: '🔐',
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px'
          },
          duration: 4000
        });
      } else if (errorMessage.includes('not found')) {
        console.log('✅ SHOWING: Email not found toast');
        toast.error('❌ Email not found. Please create an account first.', {
          icon: '📧',
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px'
          },
          duration: 4000
        });
      } else if (error.response?.status === 500) {
        console.log('✅ SHOWING: Server error toast');
        toast.error('❌ Server error. Please try again later.', {
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px'
          },
          duration: 4000
        });
      } else {
        console.log('✅ SHOWING: Generic error toast', errorMessage);
        toast.error(errorMessage, {
          icon: '❌',
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px'
          },
          duration: 4000
        });
      }
      
      console.error('🔴 Login failed:', errorMessage);
    } finally {
      // ALWAYS reset loading state, even on error
      setLoading(false);
      console.log('✓ Loading state reset');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600 mt-2">Access your escrow account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: ''});
                }}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: ''});
                }}
              />
            </div>
            {errors.password && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">New here?</span>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;