import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Github,
  Chrome,
  Zap,
  Shield,
} from "lucide-react";
import AuthHeader from "../components/AuthHeader";
import Footer from "../components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/users/login", { email, password });

      login(data);

      if (rememberMe) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.success(`Welcome back, ${data.name}! 👋`, {
        icon: "✅",
        style: {
          background: "#10b981",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
          padding: "16px",
        },
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";

      if (errorMessage.includes("Invalid email or password")) {
        toast.error(
          "❌ Invalid username or password. Please check and try again.",
          {
            icon: "🔐",
            style: {
              background: "#ef4444",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "bold",
              padding: "16px",
            },
            duration: 4000,
          },
        );
      } else {
        toast.error(errorMessage, {
          icon: "❌",
          style: {
            background: "#ef4444",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "bold",
            padding: "16px",
          },
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/auth/google`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col relative">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div
          className="absolute top-1/2 -left-32 w-80 h-80 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-32 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>
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
                Welcome Back
              </h1>
              <p className="text-base text-blue-300/80 font-light tracking-wide">
                Continue your journey with VaultLance
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: <Shield className="w-6 h-6" />,
                  text: "Bank-level escrow protection",
                  desc: "Your payments are secured",
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  text: "Lightning-fast payouts",
                  desc: "Instant wallet transfers",
                },
                {
                  icon: <CheckCircle2 className="w-6 h-6" />,
                  text: "24/7 dedicated support",
                  desc: "Always here for you",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 group cursor-pointer"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl group-hover:from-blue-500/40 group-hover:to-purple-500/30 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {item.text}
                    </p>
                    <p className="text-blue-300/60 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-blue-500/20 w-full">
              <p className="text-blue-300/70 text-sm mb-2">
                New to VaultLance?
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-blue-300 hover:text-cyan-300 font-bold text-sm group transition-colors"
              >
                Create your account{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Side - Modern Login Form */}
          <div className="w-full">
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl group hover:border-white/20 transition-all duration-500">
              {/* Premium Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-3 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                  <span className="text-2xl">🔐</span>
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-1">
                  Sign In
                </h2>
                <p className="text-blue-300/70 text-sm">
                  Access your secure account
                </p>
              </div>

              {/* Social Login - Modern Style */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group backdrop-blur-sm"
                >
                  <Chrome className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-sm">
                    Continue with Google
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href =
                      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/auth/github`)
                  }
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group backdrop-blur-sm"
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-sm">
                    Continue with GitHub
                  </span>
                </button>
              </div>

              {/* Modern Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white/50 text-xs font-medium">
                    OR
                  </span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field - Modern Style */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-white/80 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <div
                    className={`relative group transition-all duration-300 ${focusedField === "email" ? "scale-[1.02]" : ""}`}
                  >
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === "email" ? "text-cyan-400 scale-110" : "text-white/40"}`}
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-12 pr-4 py-3 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                        errors.email
                          ? "border-red-500/50 focus:border-red-500 focus:bg-red-500/10"
                          : focusedField === "email"
                            ? "border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10"
                            : "border-white/10 group-hover:border-white/20"
                      } text-white placeholder-white/30 font-medium`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-white/80 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div
                    className={`relative group transition-all duration-300 ${focusedField === "password" ? "scale-[1.02]" : ""}`}
                  >
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${focusedField === "password" ? "text-cyan-400 scale-110" : "text-white/40"}`}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-12 pr-12 py-3 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
                        errors.password
                          ? "border-red-500/50 focus:border-red-500 focus:bg-red-500/10"
                          : focusedField === "password"
                            ? "border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10"
                            : "border-white/10 group-hover:border-white/20"
                      } text-white placeholder-white/30 font-medium`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors({ ...errors, password: "" });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-red-400 text-xs font-medium flex items-center gap-1">
                      <span>⚠</span> {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me - Modern Style */}
                <label className="flex items-center gap-3 cursor-pointer group py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
                  />
                  <span className="text-xs text-white/70 group-hover:text-white/80 font-medium transition-colors">
                    Remember me for 30 days
                  </span>
                </label>

                {/* Sign In Button - Premium Style */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 hover:shadow-2xl hover:scale-105 transform active:scale-95 text-sm font-semibold uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer Link */}
              <p className="text-center text-white/50 text-xs mt-4">
                New to VaultLance?{" "}
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Mobile - Show left side info */}
            <div className="lg:hidden mt-6 text-center text-white/70 text-sm">
              <p>Secure vault-backed freelancing platform</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;