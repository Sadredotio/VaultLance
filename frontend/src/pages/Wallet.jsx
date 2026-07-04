import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthContext from "../context/AuthContext";
import API from "../api";
import { Wallet, Plus, TrendingUp, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch wallet info
  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const walletRes = await API.get("/wallet");
      setWallet(walletRes.data);

      const transRes = await API.get("/wallet/transactions");
      setTransactions(transRes.data.transactions || []);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (!window.Razorpay) {
      toast.error(
        "Payment gateway failed to load. Please refresh and try again.",
      );
      return;
    }

    try {
      // Step 1: create a Razorpay order on the backend (wallet is NOT credited yet)
      const { data } = await API.post("/wallet/create-order", {
        amount: parseFloat(amount),
      });

      // Step 2: open Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "VaultLance",
        description: "Add funds to wallet",
        order_id: data.orderId,
        handler: async function (response) {
          // Step 3: verify the payment on the backend before showing success
          try {
            await API.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Added ₹${amount} to wallet!`);
            setAmount("");
            setShowAddFundsModal(false);
            fetchWallet();
          } catch (err) {
            toast.error(
              "Payment succeeded but verification failed. Contact support.",
            );
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function () {
            toast("Payment cancelled", { icon: "ℹ️" });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start payment");
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (parseFloat(amount) > wallet?.balance) {
      toast.error("Insufficient funds");
      return;
    }

    if (!accountHolderName.trim()) {
      toast.error("Enter the account holder name");
      return;
    }

    if (
      withdrawMethod === "bank" &&
      (!accountNumber.trim() || !ifscCode.trim())
    ) {
      toast.error("Enter account number and IFSC code");
      return;
    }

    if (withdrawMethod === "upi" && !upiId.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }

    setWithdrawing(true);
    try {
      await API.post("/wallet/withdraw", {
        amount: parseFloat(amount),
        accountHolderName,
        ...(withdrawMethod === "bank"
          ? { accountNumber, ifscCode }
          : { upiId }),
      });
      toast.success(`Withdrawal of ₹${amount} submitted for admin approval.`);
      setAmount("");
      setAccountHolderName("");
      setAccountNumber("");
      setIfscCode("");
      setUpiId("");
      setShowWithdrawModal(false);
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 animate-pulse">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Wallet className="w-10 h-10 text-blue-600" />
            Your Wallet
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your funds and transactions
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm font-semibold">
                WALLET BALANCE
              </p>
              <div className="flex items-center gap-3 mt-2">
                <h2 className="text-5xl font-bold">
                  ${showBalance ? wallet?.balance?.toFixed(2) : "****"}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-blue-200 hover:text-white"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <Wallet className="w-16 h-16 text-blue-300 opacity-30" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowAddFundsModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Funds
            </button>
            {user?.role === "freelancer" && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-400 transition flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" /> Withdraw
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-semibold">
              Total Transactions
            </p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {transactions.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-semibold">Account Type</p>
            <p className="text-3xl font-bold text-gray-800 mt-2 capitalize">
              {user?.role}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-semibold">Last Activity</p>
            <p className="text-sm text-gray-800 mt-2">
              {transactions.length > 0
                ? new Date(transactions[0]?.createdAt).toLocaleDateString()
                : "No activity"}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Recent Transactions
          </h3>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">
                      {tx.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${tx.type === "withdrawal" || tx.type === "job_fund" ? "text-red-600" : "text-green-600"}`}
                    >
                      {tx.type === "withdrawal" || tx.type === "job_fund"
                        ? "-"
                        : "+"}
                      ${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {transactions.length > 5 && (
            <button
              onClick={() => navigate("/transactions")}
              className="w-full mt-4 text-center text-blue-600 font-semibold hover:text-blue-700 py-2 border-t border-gray-200"
            >
              View All Transactions →
            </button>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Add Funds to Wallet
            </h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddFundsModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add ${amount || "0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Withdraw money
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Requests are reviewed and approved by an admin before payout. A 2%
              platform fee applies.
            </p>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mb-4">
              Available: ₹{wallet?.balance?.toFixed(2)}
            </p>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setWithdrawMethod("bank")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${withdrawMethod === "bank" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              >
                Bank transfer
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMethod("upi")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${withdrawMethod === "upi" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              >
                UPI
              </button>
            </div>

            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Account holder name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {withdrawMethod === "bank" ? (
              <>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Bank account number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="IFSC code"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            ) : (
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {withdrawing ? "Submitting..." : "Request withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
