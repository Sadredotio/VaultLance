import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthContext from "../context/AuthContext";
import API from "../api";
import {
  Shield,
  Loader,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  Banknote,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDisputes: 0,
    openDisputes: 0,
    totalTransactions: 0,
    totalUsers: 0,
  });
  const [resolving, setResolving] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState({});

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== "admin") {
      toast.error("⛔ Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      cconst[(disputesRes, transactionsRes, withdrawalsRes)] =
        await Promise.all([
          API.get("/disputes"),
          API.get("/transactions/stats"),
          API.get("/admin/withdrawals"),
        ]);

      setDisputes(disputesRes.data);
      setWithdrawals(withdrawalsRes.data);

      const openCount = disputesRes.data.filter(
        (d) => d.status === "open" || d.status === "in_review",
      ).length;

      setStats({
        totalDisputes: disputesRes.data.length,
        openDisputes: openCount,
        totalTransactions: transactionsRes.data.totalCount || 0,
        totalUsers: transactionsRes.data.uniqueUsers || 0,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId, resolution) => {
    setResolving(disputeId);
    try {
      await API.post(`/disputes/${disputeId}/resolve`, {
        resolution: resolution,
      });
      toast.success(`✅ Dispute resolved as ${resolution.replace(/_/g, " ")}`);
      fetchAdminData();
      setSelectedResolution({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setResolving(null);
    }
  };

  const handleApproveWithdrawal = async (id) => {
    setProcessingWithdrawal(id);
    try {
      await API.put(`/admin/withdrawals/${id}/approve`);
      toast.success("✅ Withdrawal approved");
      fetchAdminData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve withdrawal",
      );
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const handleRejectWithdrawal = async (id) => {
    const reason = window.prompt(
      "Reason for rejecting this withdrawal (funds will be refunded to the user's wallet):",
    );
    if (reason === null) return;

    setProcessingWithdrawal(id);
    try {
      await API.put(`/admin/withdrawals/${id}/reject`, { reason });
      toast.success("Withdrawal rejected, funds refunded to wallet");
      fetchAdminData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reject withdrawal",
      );
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="w-10 h-10 text-red-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Platform management and dispute resolution
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm uppercase tracking-wide">
                Total Disputes
              </p>
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {stats.totalDisputes}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm uppercase tracking-wide">
                Open Disputes
              </p>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {stats.openDisputes}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm uppercase tracking-wide">
                Transactions
              </p>
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.totalTransactions}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm uppercase tracking-wide">
                Active Users
              </p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalUsers}
            </p>
          </div>
        </div>

        {/* Pending Withdrawals Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-green-600" />
              Pending Withdrawals
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Send the payout manually via bank transfer or UPI, then approve.
              Rejecting refunds the freelancer's wallet.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Freelancer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Payout details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No pending withdrawal requests
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr
                      key={w._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">
                        {w.userId?.name || "User"}
                        <p className="text-xs font-normal text-gray-500">
                          {w.userId?.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        ₹{w.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p>{w.payoutDetails?.accountHolderName}</p>
                        {w.payoutDetails?.upiId ? (
                          <p className="text-xs text-gray-500">
                            UPI: {w.payoutDetails.upiId}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            A/C: ****{w.payoutDetails?.accountNumber?.slice(-4)}{" "}
                            · IFSC: {w.payoutDetails?.ifscCode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(w._id)}
                            disabled={processingWithdrawal === w._id}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded font-bold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w._id)}
                            disabled={processingWithdrawal === w._id}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded font-bold hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disputes Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Disputes Management
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Review and resolve open disputes
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Contract
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Filed By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No disputes found
                    </td>
                  </tr>
                ) : (
                  disputes.map((dispute) => (
                    <tr
                      key={dispute._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">
                        {dispute.contractId?.jobId?.title || "Contract"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dispute.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            dispute.status === "open"
                              ? "bg-red-100 text-red-900"
                              : dispute.status === "in_review"
                                ? "bg-yellow-100 text-yellow-900"
                                : "bg-green-100 text-green-900"
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dispute.filedBy?.name || "User"}
                      </td>
                      <td className="px-6 py-4">
                        {dispute.status === "resolved" ? (
                          <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Resolved
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <select
                              value={selectedResolution[dispute._id] || ""}
                              onChange={(e) =>
                                setSelectedResolution({
                                  ...selectedResolution,
                                  [dispute._id]: e.target.value,
                                })
                              }
                              className="px-2 py-1 text-xs border-2 border-gray-300 rounded font-bold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Select...</option>
                              <option value="refund_client">
                                Refund Client
                              </option>
                              <option value="pay_freelancer">
                                Pay Freelancer
                              </option>
                              <option value="split_payment">
                                Split Payment
                              </option>
                            </select>
                            <button
                              onClick={() =>
                                handleResolveDispute(
                                  dispute._id,
                                  selectedResolution[dispute._id],
                                )
                              }
                              disabled={
                                !selectedResolution[dispute._id] ||
                                resolving === dispute._id
                              }
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded font-bold hover:bg-green-700 transition disabled:bg-gray-400"
                            >
                              {resolving === dispute._id
                                ? "Resolving..."
                                : "Resolve"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-red-50 rounded-xl border-l-4 border-red-600">
          <h3 className="font-bold text-red-900 mb-2">
            🔐 Admin Responsibilities
          </h3>
          <ul className="text-sm text-red-900 space-y-1 list-disc list-inside">
            <li>Review all dispute claims from users</li>
            <li>Verify evidence and comments from both parties</li>
            <li>Make fair resolution decisions (refund/pay/split)</li>
            <li>Ensure platform integrity and user protection</li>
            <li>Once resolved, funds are automatically transferred</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
