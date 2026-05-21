import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { Briefcase, Loader, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ContractDetails = () => {
  const { contractId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const isClient = user?._id === contract?.clientId?._id;
  const isFreelancer = user?._id === contract?.freelancerId?._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <button
          onClick={() => navigate('/my-contracts')}
          className="flex items-center gap-2 text-blue-600 font-bold hover:underline mb-6"
        >
          ← Back to Contracts
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Briefcase className="w-10 h-10 text-blue-600" />
            {contract?.jobId?.title || 'Contract'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Status */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contract Status</h2>
              
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-700 uppercase tracking-wide">Current Status</p>
                <p className="text-3xl font-bold text-blue-900 mt-2 uppercase">
                  {contract?.status}
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 mt-2 rounded-full bg-green-600"></div>
                  <div>
                    <p className="font-bold text-gray-800">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(contract?.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {contract?.updatedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 mt-2 rounded-full bg-blue-600"></div>
                    <div>
                      <p className="font-bold text-gray-800">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {new Date(contract?.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {contract?.workSubmittedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 mt-2 rounded-full bg-purple-600"></div>
                    <div>
                      <p className="font-bold text-gray-800">Work Submitted</p>
                      <p className="text-sm text-gray-600">
                        {new Date(contract?.workSubmittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {contract?.clientApprovedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 mt-2 rounded-full bg-green-600"></div>
                    <div>
                      <p className="font-bold text-gray-800">Completed</p>
                      <p className="text-sm text-gray-600">
                        {new Date(contract?.clientApprovedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">Title</p>
                  <p className="text-lg font-bold text-gray-800">{contract?.jobId?.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">Description</p>
                  <p className="text-gray-800 mt-2 leading-relaxed">
                    {contract?.jobId?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Budget</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ${contract?.amount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Duration</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {contract?.jobId?.duration || 'Flexible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Submission */}
            {contract?.workSubmissionNotes && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Work Submitted</h2>
                <div className="p-6 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-purple-900 whitespace-pre-wrap">
                    {contract?.workSubmissionNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Approval Notes */}
            {contract?.clientApprovalNotes && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Client Approval Notes</h2>
                <div className="p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-green-900 whitespace-pre-wrap">
                    {contract?.clientApprovalNotes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Parties */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Parties</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 uppercase tracking-wide">Client</p>
                  <p className="font-bold text-blue-900 mt-1">{contract?.clientId?.name}</p>
                  <p className="text-xs text-blue-700 mt-1">{contract?.clientId?.email}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 uppercase tracking-wide">Freelancer</p>
                  <p className="font-bold text-purple-900 mt-1">{contract?.freelancerId?.name}</p>
                  <p className="text-xs text-purple-700 mt-1">{contract?.freelancerId?.email}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-green-600">${contract?.amount?.toFixed(2)}</span>
                </div>

                {contract?.status === 'released' && (
                  <>
                    <div className="flex justify-between pb-3 border-b">
                      <span className="text-gray-600">Platform Fee (2%)</span>
                      <span className="font-bold text-red-600">
                        -${(contract?.amount * 0.02).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Freelancer Receives</span>
                      <span className="font-bold text-green-600">
                        ${(contract?.amount * 0.98).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {contract?.status === 'funded' && isFreelancer && (
                <button
                  onClick={() => navigate(`/submit-work/${contract._id}`)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold flex items-center justify-center gap-2"
                >
                  📤 Submit Work
                </button>
              )}

              {contract?.status === 'submission_pending' && isClient && (
                <button
                  onClick={() => navigate(`/approve-work/${contract._id}`)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2"
                >
                  ✅ Review Work
                </button>
              )}

              {contract?.status === 'pending' && isClient && (
                <button
                  onClick={() => navigate(`/fund-contract/${contract._id}`)}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-bold flex items-center justify-center gap-2"
                >
                  💵 Fund Contract
                </button>
              )}

              <button
                onClick={() => navigate('/my-contracts')}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
