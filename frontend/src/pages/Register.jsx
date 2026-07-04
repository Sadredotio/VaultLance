import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import {
  Mail, Lock, User, ArrowRight, Eye, EyeOff,
  CheckCircle2, Briefcase, Search, Zap, Shield
} from 'lucide-react';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

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

    if (!validateForm()) {
      toast.error('Please fill in all fields correctly', {
        icon: '⚠️',
        style: {
          background: '#f59e0b',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: 'bold',
          padding: '16px'
        }
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/users/register', {
        name,
        email,
        password,
        role
      });

      login(data);

      toast.success(`Welcome, ${data.name}! 🎉`, {
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: 'bold',
          padding: '16px'
        }
      });

      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';

      if (errorMessage.includes('already exists')) {
        toast.error('📧 This email is already registered. Try logging in instead!', {
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 'bold',
            padding: '16px'
          },
          duration: 4000
        });
      } else {
        toast.error(errorMessage, {
          icon: '❌',
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 'bold',
            padding: '16px'
          },
          duration: 4000
        });
      }

      console.error('Registration Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col relative">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>

      <AuthHeader />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 py-8">
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 lg:items-center">

        {/* Left Side - Premium Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start space-y-6 text-white">
          <div className="space-y-2">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 bg-clip-text text-transparent leading-tight">
              Join VaultLance
            </h1>
            <p className="text-base text-blue-300/80 font-light tracking-wide">Where talent meets opportunity</p>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Shield className="w-6 h-6" />, text: "Bank-level escrow protection", desc: "Your work is always protected" },
              { icon: <Zap className="w-6 h-6" />, text: "Instant payouts", desc: "Get paid within minutes" },
              { icon: <CheckCircle2 className="w-6 h-6" />, text: "Verified community", desc: "Work with trusted professionals" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 group cursor-pointer">
                <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl group-hover:from-blue-500/40 group-hover:to-purple-500/30 transition-all duration-300">
                  {item.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.text}</p>
                  <p className="text-blue-300/60 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-blue-500/20 w-full">
            <p className="text-blue-300/70 text-sm mb-2">Already part of our network?</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-300 hover:text-cyan-300 font-bold text-sm group transition-colors">
              Sign in instead <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Side - Modern Register Form */}
        <div className="w-full">
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl group hover:border-white/20 transition-all duration-500">

            {/* Premium Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-2 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                <span className="text-lg">✨</span>
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-1">Create Account</h2>
              <p className="text-blue-300/70 text-sm">Start your journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">

              {/* Role Selection - Modern Style */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider">I want to...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-2 px-4 rounded-xl font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                      role === 'client'
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Hire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`py-2 px-4 rounded-xl font-semibold border-2 transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                      role === 'freelancer'
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Work</span>
                  </button>
                </div>
              </div>

              {/* Name Field - Modern Style */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-white/80 uppercase tracking-wider">Full Name</label>
                <div className={`relative group transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === 'name' ? 'text-cyan-400 scale-110' : 'text-white/40'}`} />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-4 py-2 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                      errors.name
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/10'
                        : focusedField === 'name'
                        ? 'border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10'
                        : 'border-white/10 group-hover:border-white/20'
                    } text-white placeholder-white/30 font-medium`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-red-400 text-xs font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field - Modern Style */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-white/80 uppercase tracking-wider">Email Address</label>
                <div className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === 'email' ? 'text-cyan-400 scale-110' : 'text-white/40'}`} />
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-4 py-2 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/10'
                        : focusedField === 'email'
                        ? 'border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10'
                        : 'border-white/10 group-hover:border-white/20'
                    } text-white placeholder-white/30 font-medium`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-red-400 text-xs font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field - Modern Style */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-white/80 uppercase tracking-wider">Password</label>
                <div className={`relative group transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === 'password' ? 'text-cyan-400 scale-110' : 'text-white/40'}`} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-2 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                      errors.password
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/10'
                        : focusedField === 'password'
                        ? 'border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10'
                        : 'border-white/10 group-hover:border-white/20'
                    } text-white placeholder-white/30 font-medium`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-red-400 text-xs font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field - Modern Style */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-white/80 uppercase tracking-wider">Confirm Password</label>
                <div className={`relative group transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === 'confirmPassword' ? 'text-cyan-400 scale-110' : 'text-white/40'}`} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-2 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                      errors.confirmPassword
                        ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/10'
                        : focusedField === 'confirmPassword'
                        ? 'border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10'
                        : 'border-white/10 group-hover:border-white/20'
                    } text-white placeholder-white/30 font-medium`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-red-400 text-xs font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button - Premium Style */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 hover:shadow-2xl hover:scale-105 transform active:scale-95 text-sm font-semibold uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <p className="text-center text-white/50 text-xs mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile - Show brief info */}
          <div className="lg:hidden mt-6 text-center text-white/70 text-sm">
            <p>Secure escrow-backed freelancing platform</p>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;