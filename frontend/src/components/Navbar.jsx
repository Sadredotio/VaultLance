import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Wallet, User, Home, Settings, X, 
  Briefcase, History, HelpCircle, PlusCircle, ArrowDownToLine, UserCircle,
  FileText, AlertCircle, BarChart3, Shield
} from 'lucide-react'; 

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // STATE: Controls whether the sidebar is open
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync user changes to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("userInfo", JSON.stringify(user));
    }
  }, [user]);

  const handleLogout = () => {
    setIsSidebarOpen(false); // Close sidebar first
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* --- MAIN NAVBAR --- */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center relative z-30">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Escrow<span className="text-gray-800">Platform</span>
        </Link>

        {/* User Info Section */}
        <div className="flex items-center gap-6">
          
          {/* Main Navbar Wallet */}
          <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <Wallet className="text-green-600 w-5 h-5" />
            <span className="font-bold text-green-700">${user?.walletBalance || 0}</span>
          </div>

          {/* User Profile Trigger (Opens Sidebar) */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1 rounded-lg transition"
          >
            <User className="text-gray-500 w-5 h-5" />
            <div className="text-sm text-left hidden sm:block">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-full text-red-500 transition"
            title="Logout"
          >
            <LogOut className='w-5 h-5'/>
          </button>
        </div>
      </nav>

      {/* --- SIDEBAR OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- SLIDING SIDEBAR PANEL --- */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* 1. Sidebar Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">My Account</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-red-500 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. Profile Info */}
        <div className="p-6 text-center border-b">
          <img 
            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
            alt="Avatar"
            className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-gray-100"
          />
          <h3 className="text-xl font-bold text-gray-800">{user?.name}</h3>
          <p className="text-sm font-medium text-gray-500 uppercase">{user?.role}</p>
        </div>

        {/* 3. WALLET CARD */}
        <div className="px-6 py-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-1">Available Balance</p>
            <h4 className="text-3xl font-black">${user?.walletBalance || 0}</h4>
            
            <div className="mt-4 pt-4 border-t border-blue-500/50 flex gap-2">
              <Link 
                to="/wallet"
                onClick={() => setIsSidebarOpen(false)}
                className="flex-1 bg-white text-blue-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-blue-50 transition"
              >
                <PlusCircle className="w-4 h-4" /> Add Funds
              </Link>
              <Link 
                to="/wallet"
                onClick={() => setIsSidebarOpen(false)}
                className="flex-1 bg-white text-blue-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-blue-50 transition"
              >
                <ArrowDownToLine className="w-4 h-4" /> Withdraw
              </Link>
            </div>
          </div>
        </div>

        {/* 4. SMOOTH NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-1">
          
          {/* PROFILE & ACCOUNT SECTION */}
          <Link 
            to="/profile" 
            onClick={() => setIsSidebarOpen(false)} 
            className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold transition-all duration-200 border border-blue-100"
          >
            <UserCircle className="w-5 h-5" /> My Profile
          </Link>

          <div className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-2">Wallet & Finance</div>

          {/* WALLET & FUNDS */}
          <Link 
            to="/wallet" 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
          >
            <Wallet className="w-5 h-5 text-green-600" /> Wallet
          </Link>

          <Link 
            to="/transaction-history" 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
          >
            <BarChart3 className="w-5 h-5 text-blue-600" /> Transaction History
          </Link>

          {/* CONTRACTS & WORK */}
          <div className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-2">Work & Contracts</div>

          <Link 
            to="/my-contracts" 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
          >
            <FileText className="w-5 h-5 text-purple-600" /> My Contracts
          </Link>

          {/* FREELANCER ONLY */}
          {user?.role === 'freelancer' && (
            <>
              <Link 
                to="/dashboard" 
                onClick={() => setIsSidebarOpen(false)} 
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
              >
                <Home className="w-5 h-5 text-gray-500" /> Find Jobs
              </Link>

              <Link 
                to="/my-applications" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
              >
                <Briefcase className="w-5 h-5 text-gray-500" /> My Applications
              </Link>
            </>
          )}

          {/* CLIENT ONLY */}
          {user?.role === 'client' && (
            <>
              <Link 
                to="/my-postings" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
              >
                <Briefcase className="w-5 h-5 text-gray-500" /> My Job Postings
              </Link>

              <Link 
                to="/create-job" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
              >
                <PlusCircle className="w-5 h-5 text-gray-500" /> Create New Job
              </Link>
            </>
          )}

          {/* DISPUTES & ISSUES */}
          <div className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-2">Support</div>

          <Link 
            to="/disputes" 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition-all duration-200"
          >
            <AlertCircle className="w-5 h-5 text-red-600" /> Disputes
          </Link>

          {/* ADMIN ONLY */}
          {user?.role === 'admin' && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-2">Administration</div>

              <Link 
                to="/admin" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg font-medium text-red-700 transition-all duration-200"
              >
                <Shield className="w-5 h-5" /> Admin Dashboard
              </Link>
            </>
          )}
        </div>

        {/* 5. Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex flex-col gap-2">
          <Link 
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg font-medium text-gray-700 transition"
          >
            <Settings className="w-5 h-5 text-gray-500" /> Account Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 bg-red-100 text-red-600 font-bold rounded-lg transition hover:bg-red-200"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>

      </div>
    </>
  );
};

export default Navbar;