import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import { Briefcase, Loader, AlertCircle, CheckCircle, Clock, DollarSign, Star } from 'lucide-react';
import RatingModal from '../components/RatingModal';

const MyContracts = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contracts, setContracts]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [cancelling, setCancelling]     = useState(null);

  // Rating modal state
  const [ratingContract, setRatingContract] = useState(null); // contract being rated
  const [reviewedIds, setReviewedIds]       = useState(new Set()); // contractIds already reviewed

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async () => {
    try {
      const res = await API.get('/contracts');
      setContracts(res.data);

      // For each released contract, check if user already reviewed it
      const released = res.data.filter(c => c.status === 'released');
      const checks = await Promise.all(
        released.map(c =>
          API.get(`/reviews/check/${c._id}`)
            .then(r => r.data.hasReviewed ? c._id : null)
            .catch(() => null)
        )
      );
      setReviewedIds(new Set(checks.filter(Boolean)));
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
      await API.put(`/contracts/${contractId}/cancel`, { cancellationReason: 'Cancelled by user' });
      toast.success('Contract cancelled.');
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  };

  const isFreelancer = user?.role === 'freelancer';
  const isClient     = user?.role === 'client';

  const filteredContracts = contracts.filter(contract => {
    if (isFreelancer && contract.freelancerId?._id !== user?._id) return false;
    if (isClient     && contract.clientId?._id     !== user?._id) return false;
    if (filter === 'all')       return true;
    if (filter === 'pending')   return ['pending', 'new'].includes(contract.status);
    if (filter === 'active')    return ['active', 'funded'].includes(contract.status);
    if (filter === 'submitted') return contract.status === 'submission_pending';
    if (filter === 'completed') return contract.status === 'released';
    return true;
  });

  const tabCount = (tab) => contracts.filter(c => {
    if (isFreelancer && c.freelancerId?._id !== user?._id) return false;
    if (isClient     && c.clientId?._id     !== user?._id) return false;
    if (tab === 'pending')   return ['pending','new'].includes(c.status);
    if (tab === 'active')    return ['active','funded'].includes(c.status);
    if (tab === 'submitted') return c.status === 'submission_pending';
    if (tab === 'completed') return c.status === 'released';
    return true;
  }).length;

  const getStatusColor = (status) => {
    const map = {
      pending:            'bg-yellow-100 text-yellow-900 border-yellow-300',
      new:                'bg-yellow-100 text-yellow-900 border-yellow-300',
      funded:             'bg-blue-100   text-blue-900   border-blue-300',
      active:             'bg-blue-100   text-blue-900   border-blue-300',
      submission_pending: 'bg-purple-100 text-purple-900 border-purple-300',
      released:           'bg-green-100  text-green-900  border-green-300',
      disputed:           'bg-red-100    text-red-900    border-red-300',
      cancelled:          'bg-gray-100   text-gray-500   border-gray-300',
    };
    return map[status] || 'bg-gray-100 text-gray-900 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (['pending','new'].includes(status))        return <Clock className="w-4 h-4" />;
    if (['funded','active'].includes(status))      return <DollarSign className="w-4 h-4" />;
    if (status === 'submission_pending')           return <AlertCircle className="w-4 h-4" />;
    if (status === 'released')                     return <CheckCircle className="w-4 h-4" />;
    return <Briefcase className="w-4 h-4" />;
  };

  const getActionButtons = (contract) => {
    const myId = user?._id;
    const amFreelancer = isFreelancer && contract.freelancerId?._id === myId;
    const amClient     = isClient     && contract.clientId?._id     === myId;
    const alreadyReviewed = reviewedIds.has(contract._id);

    return (
      <div className="flex flex-col gap-2">

        {/* ── Status-based primary action ── */}
        {['funded','active'].includes(contract.status) && amFreelancer && (
          <button
            onClick={() => navigate(`/submit-work/${contract._id}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold"
          >
            📤 Submit Work
          </button>
        )}

        {contract.status === 'submission_pending' && amClient && (
          <button
            onClick={() => navigate(`/approve-work/${contract._id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold"
          >
            ✅ Review Work
          </button>
        )}

        {contract.status === 'submission_pending' && amFreelancer && (
          <span className="px-4 py-2 bg-purple-50 text-purple-900 rounded-lg text-sm font-bold border border-purple-300 text-center">
            ⏳ Awaiting Review
          </span>
        )}

        {['pending','new'].includes(contract.status) && amClient && (
          <button
            onClick={() => navigate(`/fund-contract/${contract._id}`)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-bold"
          >
            💵 Fund Contract
          </button>
        )}

        {contract.status === 'released' && amFreelancer && (
          <button
            onClick={() => navigate('/wallet')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold"
          >
            💰 View Earnings
          </button>
        )}

        {/* ── RATE button (shown to both parties on released contracts) ── */}
        {contract.status === 'released' && (amClient || amFreelancer) && (
          alreadyReviewed ? (
            <span className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-1.5">
              <Star size={14} className="fill-yellow-400 text-yellow-400" /> Rated
            </span>
          ) : (
            <button
              onClick={() => setRatingContract(contract)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Star size={14} /> Rate {amClient ? 'Freelancer' : 'Client'}
            </button>
          )
        )}

        {/* Cancel */}
        {['pending','new'].includes(contract.status) && (
          <button
            onClick={() => handleCancelContract(contract._id)}
            disabled={cancelling === contract._id}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-bold disabled:opacity-50"
          >
            {cancelling === contract._id ? '⏳' : '❌'} Cancel
          </button>
        )}

        {/* View Details */}
        <button
          onClick={() => navigate(`/contract-details/${contract._id}`)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-bold"
        >
          👁️ View Details
        </button>
      </div>
    );
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
          <p className="text-gray-600 mt-2">Manage all your active and completed contracts</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          {[
            { key: 'all',       label: 'All' },
            { key: 'pending',   label: 'Pending' },
            { key: 'active',    label: 'Active' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-5 py-2 rounded-lg font-semibold transition text-sm capitalize ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label} ({key === 'all' ? contracts.filter(c => {
                if (isFreelancer && c.freelancerId?._id !== user?._id) return false;
                if (isClient     && c.clientId?._id     !== user?._id) return false;
                return true;
              }).length : tabCount(key)})
            </button>
          ))}
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Briefcase className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No contracts found</p>
            <button
              onClick={() => navigate(isFreelancer ? '/dashboard' : '/my-postings')}
              className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm"
            >
              {isFreelancer ? '🔍 Browse Jobs' : '✏️ Post a New Job'}
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredContracts.map((contract) => (
              <div
                key={contract._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-800 truncate">
                            {contract.jobId?.title || 'Project'}
                          </h3>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {isFreelancer
                              ? `Client: ${contract.clientId?.name || '—'}`
                              : `Freelancer: ${contract.freelancerId?.name || '—'}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg border-2 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${getStatusColor(contract.status)}`}>
                          {getStatusIcon(contract.status)}
                          {contract.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Amount</p>
                          <p className="font-bold text-lg text-green-600">${contract.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Started</p>
                          <p className="font-semibold text-gray-700">{new Date(contract.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Your Role</p>
                          <p className="font-semibold text-gray-700 capitalize">{isFreelancer ? 'Freelancer' : 'Client'}</p>
                        </div>
                        {contract.status === 'released' && contract.clientApprovedAt && (
                          <div>
                            <p className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Completed</p>
                            <p className="font-semibold text-gray-700">{new Date(contract.clientApprovedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {/* Submission note */}
                      {contract.workSubmissionNotes && contract.status === 'submission_pending' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">
                            <strong>Freelancer notes:</strong>{' '}
                            {contract.workSubmissionNotes.substring(0, 120)}{contract.workSubmissionNotes.length > 120 ? '…' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex-shrink-0 w-full lg:w-44">
                      {getActionButtons(contract)}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingContract && (
        <RatingModal
          contract={ratingContract}
          currentUser={user}
          onClose={() => setRatingContract(null)}
          onSubmitted={() => {
            setReviewedIds(prev => new Set([...prev, ratingContract._id]));
            setRatingContract(null);
          }}
        />
      )}
    </div>
  );
};

export default MyContracts;