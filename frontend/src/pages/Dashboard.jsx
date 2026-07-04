import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api";
import toast from "react-hot-toast";
import {
  Clock,
  Award,
  Wrench,
  Tag,
  Briefcase,
  Target,
  TrendingUp,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  Star,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Send,
  FileClock,
  PlayCircle,
  Eye,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]); // for freelancer
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 Dashboard Debug:", { user, authLoading, loading });
  }, [user, authLoading, loading]);

  // ACCEPT APPLICATION
  const handleAccept = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/accept`);
      toast.success("Application accepted!");
      setApplications((prev) => prev.filter((app) => app._id !== contractId));
    } catch (error) {
      toast.error("Failed to accept application");
    }
  };

  // REJECT APPLICATION
  const handleReject = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/reject`);
      toast.success("Application rejected!");
      setApplications((prev) => prev.filter((app) => app._id !== contractId));
    } catch (error) {
      toast.error("Failed to reject application");
    }
  };

  // DELETE JOB (CLIENT ONLY)
  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await API.delete(`/jobs/${jobId}`);
      toast.success("Job deleted successfully!");
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error("Delete Job Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  useEffect(() => {
    if (authLoading) {
      console.log("⏳ Auth still loading...");
      return;
    }

    if (!user) {
      console.warn("❌ No user found, redirecting to login");
      navigate("/login");
      return;
    }

    console.log("✅ User loaded, fetching dashboard data for:", user.email);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get stats based on user role
        if (user.role === "client") {
          const statsRes = await API.get("/jobs/stats");
          setStats(statsRes.data);
        } else if (user.role === "freelancer") {
          const statsRes = await API.get("/contracts/stats/freelancer");
          setStats(statsRes.data);
        }

        const endpoint = user.role === "client" ? "/jobs/myjobs" : "/jobs";
        const jobsRes = await API.get(endpoint);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

        // ── CLIENT: fetch pending applications ──────────────────────────
        if (user.role === "client") {
          const contractsRes = await API.get("/contracts");

          const pendingApps = contractsRes.data.filter((c) => {
            // clientId may be a populated object OR a plain string ID
            const clientIdStr =
              c.clientId && typeof c.clientId === "object"
                ? c.clientId._id?.toString()
                : c.clientId?.toString();
            return c.status === "pending" && clientIdStr === user._id?.toString();
          });

          const appsWithFreelancers = await Promise.all(
            pendingApps.map(async (app) => {
              // freelancerId is populated by the backend as an object
              if (app.freelancerId && typeof app.freelancerId === "object") {
                return { ...app, freelancer: app.freelancerId };
              }
              // fallback: fetch freelancer data manually
              const freelancerRes = await API.get(`/users/${app.freelancerId}`);
              return { ...app, freelancer: freelancerRes.data };
            })
          );

          setApplications(appsWithFreelancers);
        }

        // ── FREELANCER: fetch accepted/active contracts ──────────────────
        if (user.role === "freelancer") {
          const contractsRes = await API.get("/contracts");

          const myActiveContracts = contractsRes.data.filter((c) => {
            // freelancerId may be a populated object OR a plain string ID
            const freelancerIdStr =
              c.freelancerId && typeof c.freelancerId === "object"
                ? c.freelancerId._id?.toString()
                : c.freelancerId?.toString();
            return (
              freelancerIdStr === user._id?.toString() &&
              ["new", "active", "submission_pending"].includes(c.status)
            );
          });

          setActiveContracts(myActiveContracts);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-gray-700 font-semibold">Initializing authentication...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
        <div className="text-center bg-white border border-gray-100 shadow-xl rounded-2xl px-10 py-12 max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-gray-900 font-bold text-lg">User not authenticated</p>
          <p className="text-gray-400 text-sm mt-2">You will be redirected to login...</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 pb-10">
        <Navbar />
        <div className="max-w-6xl mx-auto mt-10 px-6">
          <div className="bg-white border border-red-100 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-red-800 font-black text-2xl">Error Loading Dashboard</h3>
            </div>
            <p className="text-red-700 mb-4 font-semibold text-lg">{error}</p>
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6">
              <p className="text-red-900 font-bold mb-2 text-sm uppercase tracking-wide">Diagnostic Info</p>
              <div className="text-red-800 text-sm space-y-1.5">
                <p>📧 User Email: {user?.email}</p>
                <p>👤 User Role: {user?.role}</p>
                <p>🔐 Token: {user?.token ? "✓ Present" : "✗ Missing"}</p>
                <p>⏰ Timestamp: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-bold"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-bold"
              >
                <ArrowRight className="w-4 h-4" /> Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 pb-10 relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute top-96 -left-32 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <Navbar />

      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-10 py-8 text-center shadow-2xl border border-gray-100">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="text-gray-700 font-semibold">Loading dashboard data...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-10 px-6 relative z-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200 flex items-center justify-center flex-shrink-0">
              {user.role === "client" ? (
                <Briefcase className="w-7 h-7 text-white" />
              ) : (
                <Target className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 mb-1.5">
                <Sparkles className="w-3 h-3" />
                {user.role === "client" ? "Client Dashboard" : "Freelancer Dashboard"}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{user.name}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-wide">Total Jobs</p>
              <Layers className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-5xl font-black">{stats.total}</p>
            <p className="text-gray-400 text-xs mt-2">All time</p>
          </div>
          <div className="group relative bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-green-100 text-xs font-bold uppercase tracking-wide">Open</p>
              <CheckCircle2 className="w-4 h-4 text-green-100" />
            </div>
            <p className="text-5xl font-black">{stats.open}</p>
            <p className="text-green-100 text-xs mt-2">accepting bids</p>
          </div>
          <div className="group relative bg-gradient-to-br from-blue-500 to-cyan-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">In Progress</p>
              <TrendingUp className="w-4 h-4 text-blue-100" />
            </div>
            <p className="text-5xl font-black">{stats.in_progress}</p>
            <p className="text-blue-100 text-xs mt-2">active work</p>
          </div>
          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wide">Completed</p>
              <Award className="w-4 h-4 text-purple-100" />
            </div>
            <p className="text-5xl font-black">{stats.completed}</p>
            <p className="text-purple-100 text-xs mt-2">finished</p>
          </div>
        </div>

        {/* ── FREELANCER: ACTIVE CONTRACTS SECTION ── */}
        {user.role === "freelancer" && activeContracts.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileClock className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                My Active Contracts
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activeContracts.map((contract) => (
                <div
                  key={contract._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 px-6 py-4">
                    <h3 className="font-bold text-lg text-gray-900">
                      {contract.jobId?.title || "Project"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Contract accepted
                    </p>
                  </div>
                  <div className="px-6 py-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">Status</span>
                      {contract.status === "new" && (
                        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                          <Clock className="w-3 h-3" /> Awaiting Funding
                        </span>
                      )}
                      {contract.status === "active" && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                          <PlayCircle className="w-3 h-3" /> Active — Work Now
                        </span>
                      )}
                      {contract.status === "submission_pending" && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                          <Eye className="w-3 h-3" /> Under Review
                        </span>
                      )}
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-3.5">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Your Earnings</p>
                      <p className="text-2xl font-black text-emerald-600">
                        ${contract.amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2">
                    {contract.status === "active" && (
                      <button
                        onClick={() => navigate(`/submit-work/${contract._id}`)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        <Send className="w-4 h-4" /> Submit Work
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/contract-details/${contract._id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      View Contract <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* JOB SECTION HEADER */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                {user.role === "client" ? (
                  <Layers className="w-4.5 h-4.5 text-indigo-600" />
                ) : (
                  <Target className="w-4.5 h-4.5 text-indigo-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                  {user.role === "client" ? "Manage Your Jobs" : "Browse Available Jobs"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {user.role === "client"
                    ? `You have ${stats.total} total jobs posted`
                    : "Find the perfect project for your skills"}
                </p>
              </div>
            </div>
            {user.role === "client" && (
              <button
                onClick={() => navigate("/create-job")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all shadow-md font-bold whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" /> Post New Job
              </button>
            )}
          </div>

          {/* FILTER BUTTONS - Client only */}
          {user.role === "client" && (
            <div className="flex gap-2 flex-wrap bg-white/70 backdrop-blur p-4 rounded-2xl border border-gray-100 shadow-sm">
              {[
                { key: "all", label: `All (${stats.total})`, icon: Layers, active: "bg-gray-900 text-white shadow-lg", inactive: "bg-white text-gray-700 border border-gray-200 hover:border-gray-300" },
                { key: "open", label: `Open (${stats.open})`, icon: CheckCircle2, active: "bg-emerald-600 text-white shadow-lg", inactive: "bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300" },
                { key: "in_progress", label: `In Progress (${stats.in_progress})`, icon: Clock, active: "bg-blue-600 text-white shadow-lg", inactive: "bg-white text-blue-700 border border-blue-200 hover:border-blue-300" },
                { key: "completed", label: `Completed (${stats.completed})`, icon: Award, active: "bg-purple-600 text-white shadow-lg", inactive: "bg-white text-purple-700 border border-purple-200 hover:border-purple-300" },
              ].map(({ key, label, icon: Icon, active, inactive }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all text-sm ${filterStatus === key ? active : inactive}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-medium">Loading jobs...</p>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const filteredJobs =
                filterStatus === "all"
                  ? jobs
                  : jobs.filter((job) => job.status === filterStatus);

              return filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <div
                      key={job._id}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {job.category && (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 mb-2">
                                <Tag size={10} /> {job.category}
                              </span>
                            )}
                            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{job.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {user.role === "client" && job.status === "open" && (
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="flex-shrink-0 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete this job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-4 flex-1 flex flex-col">
                        <div className="mb-4">
                          {job.status === "open" && (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 text-xs font-bold rounded-full border border-green-200">
                              <CheckCircle2 className="w-3 h-3" /> Open
                            </span>
                          )}
                          {job.status === "in_progress" && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold rounded-full border border-blue-200">
                              <Clock className="w-3 h-3" /> In Progress
                            </span>
                          )}
                          {job.status === "completed" && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 text-xs font-bold rounded-full border border-purple-200">
                              <Award className="w-3 h-3" /> Completed
                            </span>
                          )}
                          {job.status === "closed" && (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 text-xs font-bold rounded-full border border-red-200">
                              <XCircle className="w-3 h-3" /> Closed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        {/* Timeline & Experience quick info */}
                        {(job.timeline || job.experienceLevel) && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.timeline && (
                              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-100">
                                <Clock size={12} /> {job.timeline}
                              </span>
                            )}
                            {job.experienceLevel && (
                              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-100 capitalize">
                                <Award size={12} /> {job.experienceLevel}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Skills preview */}
                        {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                              <Wrench size={11} /> Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 3 && (
                                <span className="bg-gray-50 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                                  +{job.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-3.5 mb-4 mt-auto">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Budget</p>
                          <p className="text-2xl font-black text-emerald-600">${job.budget.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/job-details/${job._id}`)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          View Details <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-16 bg-white/70 backdrop-blur rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-lg font-bold">
                    No {filterStatus === "all" ? "" : filterStatus.replace("_", " ")} jobs found.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {filterStatus === "all" && user.role === "client"
                      ? "Create your first job to get started!"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              );
            })()}
          </>
        )}

        {/* ── CLIENT: PENDING APPLICATIONS SECTION ── */}
        {user.role === "client" && applications.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-16 mb-8 pb-3 border-b-2 border-blue-600">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                New Applications
              </h3>
              <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full">
                {applications.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-full"></div>
                      <h5 className="text-sm font-bold text-gray-700 tracking-wide uppercase">Application</h5>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      Pending Review
                    </span>
                  </div>

                  <div className="px-6 py-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={app.freelancer.avatar}
                        alt={app.freelancer.name}
                        className="w-14 h-14 rounded-xl border-2 border-gray-100 object-cover shadow-sm"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{app.freelancer.name}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {app.freelancer.headline || "Professional Freelancer"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-xl p-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Rating
                        </p>
                        <p className="text-2xl font-black text-blue-600">
                          {app.freelancer.rating ? app.freelancer.rating.toFixed(1) : "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">out of 5.0</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Experience</p>
                        <p className="text-2xl font-black text-gray-900">
                          {app.freelancer.experience || "—"}
                        </p>
                        <p className="text-xs text-gray-400">years</p>
                      </div>
                    </div>

                    {app.freelancer.skills && app.freelancer.skills.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Technical Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(app.freelancer.skills)
                            ? app.freelancer.skills
                            : app.freelancer.skills.split(",")
                          ).slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg border border-blue-100 font-medium"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {Array.isArray(app.freelancer.skills) && app.freelancer.skills.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg border border-gray-200 font-medium">
                              +{app.freelancer.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-100 my-2"></div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 mt-4 border border-blue-100">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-1">Proposed Budget</p>
                      <p className="text-3xl font-black text-blue-600">${app.amount}</p>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <button
                        onClick={() => navigate(`/freelancer-profile/${typeof app.freelancerId === 'string' ? app.freelancerId : app.freelancerId._id}`)}
                        className="w-full border-2 border-blue-600 bg-white text-blue-600 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200"
                      >
                        View Complete Profile
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(app._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:shadow-lg text-white py-2.5 rounded-xl font-semibold transition-all duration-200"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Hire
                        </button>
                        <button
                          onClick={() => handleReject(app._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-400 hover:bg-gray-500 text-white py-2.5 rounded-xl font-semibold transition-colors duration-200"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Dashboard;