import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { FileText, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const MyApplications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      // Get all ACTIVE & ACCEPTED contracts where user is freelancer (ready to work or waiting for funding)
      const res = await API.get('/contracts');
      const myActiveWork = res.data.filter(
        c => c.freelancerId?._id === user?._id && 
            (c.status === 'new' || c.status === 'active' || c.status === 'funded')
      );
      setApplications(myActiveWork);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load work');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'new') {
      return (
        <span className="px-4 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap">
          <Clock className="w-4 h-4" />
          Accepted
        </span>
      );
    }
    // active/funded
    return (
      <span className="px-4 py-1 bg-green-100 text-green-900 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap">
        <CheckCircle className="w-4 h-4" />
        Ready to Work
      </span>
    );
  };

  const getActionButton = (contract) => {
    if (contract.status === 'new') {
      return (
        <button
          disabled
          className="px-6 py-3 bg-blue-200 text-blue-900 rounded-lg cursor-not-allowed font-bold flex items-center justify-center gap-2 whitespace-nowrap"
        >
          ⏳ Awaiting Funding
        </button>
      );
    }
    // active or funded
    return (
      <button
        onClick={() => navigate(`/submit-work/${contract._id}`)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold flex items-center justify-center gap-2 whitespace-nowrap"
      >
        📤 Submit Work
      </button>
    );
  };

  const getInfoMessage = (status) => {
    if (status === 'new') {
      return "✅ Your application was accepted! Waiting for the client to fund the contract. Once funded, payment will be locked in escrow.";
    }
    // active/funded
    return "💰 Payment is locked in escrow! Complete your work and submit it for review.";
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
            <FileText className="w-10 h-10 text-green-600" />
            Active Work
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your work and submit for client approval
          </p>
        </div>

        {/* Active Work List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-bold mb-2">No active work</p>
            <p className="text-gray-500 mb-6">
              You don't have any jobs to work on. Find a job to apply for.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
            >
              🔍 Browse Jobs
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <div key={app._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {app.jobId?.title || 'Project'}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Client: <span className="font-bold">{app.clientId?.name}</span>
                        </p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Budget</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${app.amount?.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Applied</p>
                        <p className="text-lg font-bold text-gray-800">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Contract Status</p>
                        <p className="text-lg font-bold text-blue-600 uppercase">
                          {app.status}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Job Status</p>
                        <p className="text-lg font-bold text-purple-600 uppercase">
                          {app.jobId?.status || 'open'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Duration</p>
                        <p className="text-lg font-bold text-gray-800">
                          {app.jobId?.duration || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    {/* Job Description */}
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Project Description:</h4>
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                        {app.jobId?.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className={`p-4 rounded-lg border-l-4 ${
                      app.status === 'new'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-green-50 border-green-500'
                    }`}>
                      <p className={`text-sm ${
                        app.status === 'new'
                          ? 'text-blue-900'
                          : 'text-green-900'
                      }`}>
                        <strong>{getInfoMessage(app.status)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right - Action */}
                  <div className="flex flex-col gap-3 lg:min-w-max">
                    {getActionButton(app)}
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

export default MyApplications;