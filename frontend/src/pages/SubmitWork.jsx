import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SubmitWork = () => {
  const { contractId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [job, setJob] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Please add submission notes');
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/contracts/${contractId}/submit-work`, {
        submissionNotes: notes
      });
      toast.success('Work submitted! Waiting for client approval...');
      setTimeout(() => navigate('/my-contracts'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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

  const canSubmit = contract?.status === 'active' && user?._id === contract?.freelancerId?._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-10 px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Send className="w-10 h-10 text-green-600" />
            Submit Your Completed Work
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Project Info */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Information</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Client:</span>
                  <span className="text-gray-900 font-bold">{contract?.clientId?.name}</span>
                </div>

                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Project Amount:</span>
                  <span className="text-2xl font-bold text-green-600">${contract?.amount?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-start p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-green-900 font-semibold">Status:</span>
                  <span className="text-green-900 font-bold uppercase">{contract?.status}</span>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Submission Details</h3>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">
                  Completion Notes (Required)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what you've completed, any deliverables, and links to your work (if applicable)..."
                  className="w-full border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:border-green-500 transition"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-2">{notes.length} characters</p>
              </div>

              {canSubmit ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition ${
                    submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {submitting && <Loader className="w-5 h-5 animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit Work for Review ✅'}
                </button>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-900">
                  <p className="font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Cannot Submit
                  </p>
                  <p className="text-sm mt-2">
                    This contract is not in active status or you're not the freelancer.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Important Info</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-900">
                    <strong>Submit with confidence:</strong> Once submitted, the client will review your work.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-green-900">
                    <strong>Payment Secured:</strong> Your payment of ${contract?.amount?.toFixed(2)} is already locked in escrow.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-yellow-900">
                    <strong>Next Step:</strong> Client reviews and approves your work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitWork;
