import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { TrendingUp, Loader, DollarSign, ArrowDown, ArrowUp, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, deposit, job_fund, work_release, refund, withdrawal
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalSpent: 0,
    totalEarnings: 0,
    transactionCount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/transactions/user');
      setTransactions(res.data);
      
      // Calculate stats
      let totalIncome = 0;
      let totalSpent = 0;
      let totalEarnings = 0;

      res.data.forEach(t => {
        if (t.type === 'deposit' || t.type === 'work_release') {
          totalIncome += t.amount;
        }
        if (t.type === 'job_fund' || t.type === 'withdrawal') {
          totalSpent += t.amount;
        }
        if (t.type === 'work_release') {
          totalEarnings += t.amount;
        }
      });

      setStats({
        totalIncome,
        totalSpent,
        totalEarnings,
        transactionCount: res.data.length
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-50';
      case 'job_fund':
        return 'text-purple-600 bg-purple-50';
      case 'work_release':
        return 'text-blue-600 bg-blue-50';
      case 'refund':
        return 'text-orange-600 bg-orange-50';
      case 'withdrawal':
        return 'text-red-600 bg-red-50';
      case 'platform_fee':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'work_release':
        return <ArrowDown className="w-4 h-4" />;
      case 'job_fund':
      case 'withdrawal':
      case 'platform_fee':
        return <ArrowUp className="w-4 h-4" />;
      case 'refund':
        return <ArrowDown className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Deposit',
      job_fund: 'Job Funded',
      work_release: 'Work Released',
      refund: 'Refund',
      withdrawal: 'Withdrawal',
      platform_fee: 'Platform Fee'
    };
    return labels[type] || type;
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            Transaction History
          </h1>
          <p className="text-gray-600 mt-2">
            Complete record of all your financial transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Total Income</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${stats.totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Total Spent</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              ${stats.totalSpent.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Earnings</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${stats.totalEarnings.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Transactions</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.transactionCount}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Filter className="w-5 h-5 text-gray-600 self-center mr-2" />
            {['all', 'deposit', 'job_fund', 'work_release', 'refund', 'withdrawal'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type === 'all' ? 'All' : getTypeLabel(type)} ({filteredTransactions.length})
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Balance</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getTypeColor(transaction.type)}`}>
                          {getTypeIcon(transaction.type)}
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={transaction.type === 'withdrawal' || transaction.type === 'job_fund' || transaction.type === 'platform_fee' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.type === 'withdrawal' || transaction.type === 'job_fund' || transaction.type === 'platform_fee' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        ${transaction.balanceAfter?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-900' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-900' :
                          'bg-red-100 text-red-900'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.contractId ? '📋 Contract' : transaction.jobId ? '💼 Job' : '💳 Account'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-bold text-blue-900 mb-3">Transaction Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-900">
            <div><strong>Deposit:</strong> Money added to your wallet</div>
            <div><strong>Job Funded:</strong> Money locked for a contract</div>
            <div><strong>Work Released:</strong> Payment for completed work</div>
            <div><strong>Refund:</strong> Money returned from dispute/cancellation</div>
            <div><strong>Withdrawal:</strong> Money withdrawn to bank account</div>
            <div><strong>Platform Fee:</strong> 2% fee on withdrawals</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
