import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api";
import toast from "react-hot-toast";
import { Users, UserCheck, UserX, Activity, Eye, Briefcase, Search, Clock, TrendingUp } from "lucide-react";

const ADMIN_EMAIL = "mdsadrealam@gmail.com";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

const formatTime = (date) => {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const Admin = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("registered");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/dashboard");
      return;
    }
    const fetchAnalytics = async () => {
      try {
        const { data: res } = await API.get("/admin/analytics");
        setData(res);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, registeredUsers, anonymousVisitors } = data;

  const filteredUsers = registeredUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">📊 Admin Analytics</h1>
          <p className="text-gray-500 mt-1">VaultLance visitor and user activity</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { icon: <Users className="w-5 h-5 text-blue-600" />, label: "Total Users", value: stats.totalRegistered, bg: "bg-blue-50" },
            { icon: <Briefcase className="w-5 h-5 text-emerald-600" />, label: "Clients", value: stats.clients, bg: "bg-emerald-50" },
            { icon: <Search className="w-5 h-5 text-purple-600" />, label: "Freelancers", value: stats.freelancers, bg: "bg-purple-50" },
            { icon: <Activity className="w-5 h-5 text-orange-600" />, label: "Active Today", value: stats.activeToday, bg: "bg-orange-50" },
            { icon: <Eye className="w-5 h-5 text-gray-600" />, label: "Anon Visitors", value: stats.totalAnonymous, bg: "bg-gray-100" },
            { icon: <TrendingUp className="w-5 h-5 text-pink-600" />, label: "Anon Today", value: stats.anonymousToday, bg: "bg-pink-50" },
          ].map(({ icon, label, value, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>{icon}</div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("registered")}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition ${tab === "registered" ? "bg-blue-600 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            <UserCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Registered Users ({stats.totalRegistered})
          </button>
          <button
            onClick={() => setTab("anonymous")}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition ${tab === "anonymous" ? "bg-gray-800 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            <UserX className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Anonymous Visitors ({stats.totalAnonymous})
          </button>
        </div>

        {/* Registered Users Table */}
        {tab === "registered" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["User", "Role", "Wallet", "Visits", "Last Seen", "Joined"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar?.startsWith("http") ? u.avatar : u.avatar ? `http://localhost:5000${u.avatar}` : DEFAULT_AVATAR}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {u.name}
                                {u.email === ADMIN_EMAIL && (
                                  <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">YOU</span>
                                )}
                              </p>
                              <p className="text-gray-400 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.role === "client" ? (
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">Client</span>
                          ) : (
                            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">Freelancer</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700">
                          ₹{(u.walletBalance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-800">{u.visitCount || 0}</td>
                        <td className="px-5 py-3.5">
                          <span className={`flex items-center gap-1 text-xs font-medium ${u.lastVisited && new Date() - new Date(u.lastVisited) < 3600000 ? "text-emerald-600" : "text-gray-400"}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(u.lastVisited)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Anonymous Visitors Table */}
        {tab === "anonymous" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["#", "Page Visited", "IP Address", "Referrer", "Time"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anonymousVisitors.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">No anonymous visitors yet</td></tr>
                  ) : (
                    anonymousVisitors.map((v, idx) => (
                      <tr key={v._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{v.page}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">{v.ip}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs truncate max-w-[160px]">{v.referrer || "—"}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{formatTime(v.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;