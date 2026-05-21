import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { Wallet, Plus, TrendingUp, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');

  // Fetch wallet info
  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const walletRes = await API.get('/wallet');
      setWallet(walletRes.data);
      
      const transRes = await API.get('/wallet/transactions');
      setTransactions(transRes.data.transactions || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    try {
      await API.post('/wallet/add-funds', {
        amount: parseFloat(amount),
        paymentMethod: 'credit_card',
        description: 'Deposit to wallet'
      });
      toast.success(`Added $${amount} to wallet!`);
      setAmount('');
      setShowAddFundsModal(false);
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add funds');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    if (parseFloat(amount) > wallet?.balance) {
      toast.error('Insufficient funds');
      return;
    }

    try {
      await API.post('/wallet/withdraw', {
        amount: parseFloat(amount),
        bankAccount: '****1234'
      });
      toast.success(`Withdrawal of $${amount} initiated! Arrives in 2-3 days.`);
      setAmount('');
      setShowWithdrawModal(false);
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
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
          <p className="text-gray-600 mt-2">Manage your funds and transactions</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm font-semibold">WALLET BALANCE</p>
              <div className="flex items-center gap-3 mt-2">
                <h2 className="text-5xl font-bold">${showBalance ? wallet?.balance?.toFixed(2) : '****'}</h2>
                <button onClick={() => setShowBalance(!showBalance)} className="text-blue-200 hover:text-white">
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
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
            {user?.role === 'freelancer' && (
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
            <p className="text-gray-600 text-sm font-semibold">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{transactions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-semibold">Account Type</p>
            <p className="text-3xl font-bold text-gray-800 mt-2 capitalize">{user?.role}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm font-semibold">Last Activity</p>
            <p className="text-sm text-gray-800 mt-2">{transactions.length > 0 ? new Date(transactions[0]?.createdAt).toLocaleDateString() : 'No activity'}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${tx.type === 'withdrawal' || tx.type === 'job_fund' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'job_fund' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {transactions.length > 5 && (
            <button
              onClick={() => navigate('/transactions')}
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
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Funds to Wallet</h3>
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
                Add ${amount || '0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Withdraw Money</h3>
            <p className="text-sm text-gray-600 mb-4">Amount will arrive in 2-3 business days</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mb-4">Available: ${wallet?.balance?.toFixed(2)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
