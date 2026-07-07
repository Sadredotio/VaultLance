import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import OAuthSuccess from "./pages/OAuthSuccess";

import FAQ from "./pages/FAQ";

// Landing Page
import Home from "./pages/Home";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Freelancer Pages
import Dashboard from "./pages/Dashboard";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";

// Shared Pages
import MyContracts from "./pages/MyContracts";
import ContractDetails from "./pages/ContractDetails";
import SubmitWork from "./pages/SubmitWork";
import ApproveWork from "./pages/ApproveWork";
import Wallet from "./pages/Wallet";
import FundContract from "./pages/FundContract";
import Disputes from "./pages/Disputes";
import TransactionHistory from "./pages/TransactionHistory";
import Messages from "./pages/Messages";

// Client Pages
import MyPostings from "./pages/MyPostings";
import CreateJob from "./pages/CreateJob";
import ViewApplicants from "./pages/client/ViewApplicants";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import Admin from './pages/Admin';
import useTrackVisit from './hooks/useTrackVisit';

// User Profile
import Profile from "./pages/Profile";
import FreelancerProfile from "./pages/FreelancerProfile";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};


function AppInner() {
  useTrackVisit();
  return null;
}

function App() {

  return (
    <AuthProvider>
      <Router>
        <AppInner />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/faq" element={<FAQ />} />

          {/* ===== AUTH ROUTES ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/admin" element={<Admin />} />

          {/* ===== SHARED DASHBOARD ===== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ===== SHARED JOB VIEWING ===== */}
          <Route
            path="/job-details/:jobId"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-applications"
            element={
              <ProtectedRoute requiredRole="freelancer">
                <MyApplications />
              </ProtectedRoute>
            }
          />

          {/* ===== SHARED WORK PAGES ===== */}
          <Route
            path="/my-contracts"
            element={
              <ProtectedRoute>
                <MyContracts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contract-details/:contractId"
            element={
              <ProtectedRoute>
                <ContractDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/submit-work/:contractId"
            element={
              <ProtectedRoute requiredRole="freelancer">
                <SubmitWork />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approve-work/:contractId"
            element={
              <ProtectedRoute requiredRole="client">
                <ApproveWork />
              </ProtectedRoute>
            }
          />

          {/* ===== MESSAGING ===== */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* ===== WALLET & PAYMENT ===== */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/fund-contract/:contractId"
            element={
              <ProtectedRoute requiredRole="client">
                <FundContract />
              </ProtectedRoute>
            }
          />

          {/* ===== CLIENT ROUTES ===== */}
          <Route
            path="/my-postings"
            element={
              <ProtectedRoute requiredRole="client">
                <MyPostings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-job"
            element={
              <ProtectedRoute requiredRole="client">
                <CreateJob />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-job/:jobId"
            element={
              <ProtectedRoute requiredRole="client">
                <CreateJob />
              </ProtectedRoute>
            }
          />

          <Route
            path="/view-applicants/:jobId"
            element={
              <ProtectedRoute requiredRole="client">
                <ViewApplicants />
              </ProtectedRoute>
            }
          />

          {/* ===== DISPUTES & HISTORY ===== */}
          <Route
            path="/disputes"
            element={
              <ProtectedRoute>
                <Disputes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transaction-history"
            element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />

          {/* ===== ADMIN ROUTES ===== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ===== USER PROFILE ===== */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/freelancer-profile/:freelancerId"
            element={
              <ProtectedRoute>
                <FreelancerProfile />
              </ProtectedRoute>
            }
          />

          {/* ===== CATCH ALL ===== */}
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
    
  );
}

export default App;
