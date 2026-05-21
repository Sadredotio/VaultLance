import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import { Briefcase, Loader, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

const MyContracts = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, active, submitted, completed
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await API.get('/contracts');
      setContracts(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContract = async (contractId) => {
    if (!window.confirm('Are you sure? You cannot undo this action.')) return;
    
    setCancelling(contractId);
    try {
      await API.post(`/contracts/${contractId}/cancel`, {
        cancellationReason: 'Cancelled by user'
      });
      toast.success('Contract cancelled. Funds refunded if applicable.');
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  };

  const isFreelancer = user?.role === 'freelancer';
  const isClient = user?.role === 'client';

  const filteredContracts = contracts.filter(contract => {
    if (isFreelancer && contract.freelancerId?._id !== user?._id) return false;
    if (isClient && contract.clientId?._id !== user?._id) return false;

    if (filter === 'all') return true;
    if (filter === 'pending') return contract.status === 'pending' || contract.status === 'new';
    if (filter === 'active') return contract.status === 'active' || contract.status === 'funded';
    if (filter === 'submitted') return contract.status === 'submission_pending';
    if (filter === 'completed') return contract.status === 'released';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'new':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'funded':
      case 'active':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'submission_pending':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'released':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'disputed':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-900 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'funded':
      case 'active':
        return <DollarSign className="w-4 h-4" />;
      case 'submission_pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'released':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getActionButton = (contract) => {
    const currentUserIsFreelancer = isFreelancer && contract.freelancerId?._id === user?._id;
    const currentUserIsClient = isClient && contract.clientId?._id === user?._id;

    switch (contract.status) {
      case 'funded':
      case 'active':
        if (currentUserIsFreelancer) {
          return (
            <button
              onClick={() => navigate(`/submit-work/${contract._id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold"
            >
              📤 Submit Work
            </button>
          );
        }
        return null;

      case 'submission_pending':
        if (currentUserIsClient) {
          return (
            <button
              onClick={() => navigate(`/approve-work/${contract._id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold"
            >
              ✅ Review Work
            </button>
          );
        }
        if (currentUserIsFreelancer) {
          return (
            <span className="px-4 py-2 bg-purple-50 text-purple-900 rounded-lg text-sm font-bold border border-purple-300">
              ⏳ Awaiting Client Review
            </span>
          );
        }
        return null;

      case 'released':
        if (currentUserIsFreelancer) {
          return (
            <button
              onClick={() => navigate('/wallet')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold"
            >
              💰 View Earnings
            </button>
          );
        }
        return null;

      case 'pending':
      case 'new':
        if (currentUserIsClient) {
          return (
            <button
              onClick={() => navigate(`/fund-contract/${contract._id}`)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-bold"
            >
              💵 Fund Contract
            </button>
          );
        }
        return null;

      default:
        return null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Briefcase className="w-10 h-10 text-blue-600" />
            My Contracts
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all your active and completed contracts
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 bg-white rounded-lg p-4 shadow-md">
          {['all', 'pending', 'active', 'submitted', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg font-bold transition capitalize ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'all' ? `All (${contracts.length})` : `${tab} (${filteredContracts.filter(c => {
                if (tab === 'pending') return c.status === 'pending' || c.status === 'new';
                if (tab === 'active') return c.status === 'active' || c.status === 'funded';
                if (tab === 'submitted') return c.status === 'submission_pending';
                if (tab === 'completed') return c.status === 'released';
              }).length})`}
            </button>
          ))}
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No contracts found</p>
            <button
              onClick={() => navigate(isFreelancer ? '/dashboard' : '/my-postings')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
            >
              {isFreelancer ? '🔍 Browse Jobs' : '✏️ Post a New Job'}
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredContracts.map((contract) => (
              <div key={contract._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800">
                            {contract.jobId?.title || 'Project'}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {isFreelancer
                              ? `Client: ${contract.clientId?.name}`
                              : `Freelancer: ${contract.freelancerId?.name}`}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-lg border-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap ${getStatusColor(contract.status)}`}>
                          {getStatusIcon(contract.status)}
                          {contract.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-bold text-lg text-green-600">
                            ${contract.amount?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-bold">
                            {new Date(contract.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Position</p>
                          <p className="font-bold capitalize">
                            {isFreelancer ? 'Freelancer' : 'Client'}
                          </p>
                        </div>
                        {contract.status === 'released' && (
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-bold">
                              {new Date(contract.clientApprovedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {contract.workSubmissionNotes && contract.status === 'submission_pending' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-blue-900">
                            <strong>Freelancer Notes:</strong> {contract.workSubmissionNotes.substring(0, 100)}...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col gap-3">
                      {getActionButton(contract)}
                      {(contract.status === 'pending' || contract.status === 'new') && (
                        <button
                          onClick={() => handleCancelContract(contract._id)}
                          disabled={cancelling === contract._id}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-bold disabled:bg-gray-300 disabled:text-gray-600"
                        >
                          {cancelling === contract._id ? '⏳' : '❌'} Cancel
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/contract-details/${contract._id}`)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-bold"
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyContracts;