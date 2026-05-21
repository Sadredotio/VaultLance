import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import { AlertCircle, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
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
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateForm()) {
      toast.error('Please fill in all fields correctly', {
        icon: '⚠️',
        style: {
          background: '#f59e0b',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold'
        }
      });
      return;
    }

    setLoading(true);

    try {
      // Send Registration Data to Backend
      const { data } = await API.post('/users/register', { 
        name, 
        email, 
        password, 
        role 
      });

      // Auto-Login the user with the new token
      login(data);

      // Success toast with better styling
      toast.success(`Welcome, ${data.name}! 🎉`, {
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold'
        }
      });
      
      // Send them to their new dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      // Enhanced error handling with specific messages
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      
      let icon = '❌';
      let bgColor = '#ef4444';

      // Customize error message for specific cases
      if (errorMessage.includes('already exists')) {
        toast.error('📧 This email is already registered. Try logging in instead!', {
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold'
          }
        });
      } else {
        toast.error(errorMessage, {
          icon,
          style: {
            background: bgColor,
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 'bold'
          }
        });
      }
      
      console.error('Registration Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col justify-center items-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join the escrow platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.name 
                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                }`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({...errors, name: ''});
                }}
              />
            </div>
            {errors.name && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="email" 
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                }`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                }}
              />
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Role Selection (Client vs Freelancer) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">I want to...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-3 px-4 rounded-lg font-semibold border-2 transition flex items-center justify-center gap-2 ${
                  role === 'client' 
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                onClick={() => setRole('client')}
              >
                <Briefcase size={18} />
                Hire
              </button>
              <button
                type="button"
                className={`py-3 px-4 rounded-lg font-semibold border-2 transition flex items-center justify-center gap-2 ${
                  role === 'freelancer' 
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                onClick={() => setRole('freelancer')}
              >
                🚀
                Work
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Creating Account...
              </>
            ) : (
              <>
                Create Account
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
            <span className="px-2 bg-white text-gray-500">Already registered?</span>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;