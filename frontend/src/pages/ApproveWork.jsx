import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { CheckCircle, XCircle, Loader, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ApproveWork = () => {
  const { contractId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const res = await API.get(`/contracts/${contractId}`);
      setContract(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load contract');
      navigate('/my-contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await API.post(`/contracts/${contractId}/approve`, {
        approvalNotes: approvalNotes || 'Work approved by client'
      });
      toast.success('✅ Work approved! Payment released to freelancer wallet.');
      console.log('Approval Response:', res.data);
      setTimeout(() => navigate('/my-contracts'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    setRejecting(true);
    try {
      await API.post(`/contracts/${contractId}/disputes`, {
        type: 'work_quality_issue',
        description: rejectReason
      });
      toast.success('Dispute filed. This will be reviewed by an admin.');
      setShowRejectModal(false);
      setTimeout(() => navigate('/my-contracts'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to file dispute');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const canApprove = contract?.status === 'submission_pending' && 
                    user?._id === contract?.clientId?._id;
  const canReject = canApprove;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-blue-600" />
            Review Submitted Work
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            The freelancer has submitted their work. Please review and approve or request revisions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {contract?.jobId?.title || 'Project'}
                  </h2>
                  <p className="text-gray-600">
                    Freelancer: <span className="font-bold">{contract?.freelancerId?.name}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Amount</p>
                  <p className="text-4xl font-bold text-green-600">
                    ${contract?.amount?.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-yellow-900">
                    <strong>Status:</strong> Awaiting Approval
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-green-900">
                    <strong>Payment:</strong> Locked in Escrow
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Freelancer's Submission
              </h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded mb-6">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {contract?.workSubmissionNotes || 'No notes provided.'}
                </p>
              </div>

              <div className="flex items-center text-sm text-gray-500 gap-2">
                <span>Submitted on:</span>
                <span className="font-bold">
                  {contract?.workSubmittedAt ? new Date(contract.workSubmittedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Approval Form */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Your Review (Optional)
              </h3>
              
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add feedback or approval notes..."
                className="w-full border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition"
                rows={5}
              />
              <p className="text-sm text-gray-500 mt-2">{approvalNotes.length} characters</p>
            </div>

            {/* Action Buttons */}
            {canApprove ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className={`px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition ${
                    approving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {approving && <Loader className="w-5 h-5 animate-spin" />}
                  {approving ? 'Approving...' : '✅ Approve & Release Payment'}
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejecting}
                  className="px-6 py-4 rounded-lg font-bold text-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Needs Revision
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-900">
                <p className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cannot Approve
                </p>
                <p className="text-sm mt-2">
                  {contract?.status !== 'submission_pending' 
                    ? 'Contract is not awaiting approval.'
                    : 'You are not the client on this contract.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Review Checklist</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4" />
                  <label className="text-sm text-gray-700">Work meets requirements</label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4" />
                  <label className="text-sm text-gray-700">Deliverables received</label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4" />
                  <label className="text-sm text-gray-700">Quality acceptable</label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4" />
                  <label className="text-sm text-gray-700">Timeline met</label>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-900">
                  <strong>Approval Triggers Payment:</strong> Once approved, ${contract?.amount?.toFixed(2)} is transferred to freelancer's wallet immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Request Revision
            </h2>
            
            <p className="text-gray-600 mb-6">
              This will file a dispute. An admin will review and help mediate between you and the freelancer.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe what needs to be fixed..."
              className="w-full border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:border-red-500 transition mb-4"
              rows={5}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className={`flex-1 px-4 py-2 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
                  rejecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {rejecting && <Loader className="w-4 h-4 animate-spin" />}
                {rejecting ? 'Filing...' : 'File Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveWork;
