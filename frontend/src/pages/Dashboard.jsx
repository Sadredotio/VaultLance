import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import API from '../api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // Filter state: 'all', 'open', 'in_progress', 'completed'
  const navigate = useNavigate();

  // DEBUG: Log auth state
  useEffect(() => {
    console.log('🔍 Dashboard Debug:', { user, authLoading, loading });
  }, [user, authLoading, loading]);

  // ACCEPT APPLICATION
  const handleAccept = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/accept`);
      toast.success('Application accepted!');
      setApplications(prev => prev.filter(app => app._id !== contractId));
    } catch (error) {
      toast.error('Failed to accept application');
    }
  };

  // REJECT APPLICATION
  const handleReject = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/reject`);
      toast.success('Application rejected!');
      setApplications(prev => prev.filter(app => app._id !== contractId));
    } catch (error) {
      toast.error('Failed to reject application');
    }
  };

  // DELETE JOB (CLIENT ONLY)
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await API.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully!');
      setJobs(prev => prev.filter(job => job._id !== jobId));
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (error) {
      console.error('Delete Job Error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    if (!user) {
      console.warn('❌ No user found, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('✅ User loaded, fetching dashboard data for:', user.email);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📡 Fetching stats...');
        const statsRes = await API.get('/jobs/stats');
        console.log('✅ Stats received:', statsRes.data);
        setStats(statsRes.data);

        console.log('📡 Fetching jobs...');
        const endpoint = user.role === 'client' ? '/jobs/myjobs' : '/jobs';
        const jobsRes = await API.get(endpoint);
        console.log('✅ Jobs received:', jobsRes.data);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

        // FETCH APPLICATIONS (CLIENT ONLY)
        if (user.role === 'client') {
          console.log('📡 Fetching contracts...');
          const contractsRes = await API.get('/contracts');
          console.log('✅ Contracts received:', contractsRes.data);

          const pendingApps = contractsRes.data.filter(
            c => c.status === 'pending' && c.clientId === user._id
          );

          console.log('📡 Found pending apps:', pendingApps.length);

          const appsWithFreelancers = await Promise.all(
            pendingApps.map(async (app) => {
              const freelancerRes = await API.get(`/users/${app.freelancerId}`);
              return { ...app, freelancer: freelancerRes.data };
            })
          );

          setApplications(appsWithFreelancers);
        }

      } catch (error) {
        console.error('❌ Error fetching data:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: errorMsg,
          fullError: error
        });
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Initializing authentication...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 font-medium">User not authenticated</p>
          <p className="text-gray-400 text-sm mt-2">You will be redirected to login...</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error message if data fetch failed
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <Navbar />
        <div className="max-w-6xl mx-auto mt-10 px-6">
          <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8">
            <h3 className="text-red-800 font-bold text-2xl mb-4">⚠️ Error Loading Dashboard</h3>
            <p className="text-red-700 mb-4 font-semibold text-lg">{error}</p>
            
            <div className="bg-red-100 p-4 rounded mb-4">
              <p className="text-red-900 font-bold mb-2">Diagnostic Info:</p>
              <div className="text-red-800 text-sm space-y-1">
                <p>📧 User Email: {user?.email}</p>
                <p>👤 User Role: {user?.role}</p>
                <p>🔐 Token: {user?.token ? '✓ Present' : '✗ Missing'}</p>
                <p>⏰ Timestamp: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold"
              >
                🔄 Retry
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold"
              >
                ↻ Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD UI
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />

      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-700 font-medium mb-2">Loading dashboard data...</p>
            <div className="flex justify-center gap-2">
              <span className="inline-block animate-spin">⟳</span>
              <span>Please wait</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-10 px-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900">
              {user.role === 'client' ? '💼 Client Dashboard' : '🎯 Freelancer Dashboard'}
            </h1>
            <p className="text-gray-600 text-lg mt-2">Welcome back, <span className="font-bold text-gray-900">{user.name}</span></p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg">
            <p className="text-gray-300 text-sm font-medium mb-2">Total Jobs</p>
            <p className="text-5xl font-black">{stats.total}</p>
            <p className="text-gray-400 text-xs mt-2">All time</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-green-100 text-sm font-medium mb-2">Open</p>
            <p className="text-5xl font-black">{stats.open}</p>
            <p className="text-green-100 text-xs mt-2">accepting bids</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-2">In Progress</p>
            <p className="text-5xl font-black">{stats.in_progress}</p>
            <p className="text-blue-100 text-xs mt-2">active work</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-purple-100 text-sm font-medium mb-2">Completed</p>
            <p className="text-5xl font-black">{stats.completed}</p>
            <p className="text-purple-100 text-xs mt-2">finished</p>
          </div>

        </div>

        {/* JOB SECTION HEADER */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900">
                {user.role === 'client' ? '📋 Manage Your Jobs' : '🔍 Browse Available Jobs'}
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                {user.role === 'client' 
                  ? `You have ${stats.total} total jobs posted` 
                  : 'Find the perfect project for your skills'}
              </p>
            </div>
            {user.role === 'client' && (
              <button
                onClick={() => navigate('/create-job')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:shadow-lg transition shadow-md font-bold flex items-center gap-2 whitespace-nowrap"
              >
                ✨ Post New Job
              </button>
            )}
          </div>

          {/* FILTER BUTTONS - Only show for client */}
          {user.role === 'client' && (
            <div className="flex gap-2 flex-wrap bg-gray-50 p-4 rounded-xl border border-gray-200">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  filterStatus === 'all'
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                📊 All ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  filterStatus === 'open'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-green-700 border border-green-300 hover:border-green-400'
                }`}
              >
                ✅ Open ({stats.open})
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  filterStatus === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-blue-700 border border-blue-300 hover:border-blue-400'
                }`}
              >
                ⏳ In Progress ({stats.in_progress})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  filterStatus === 'completed'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-purple-700 border border-purple-300 hover:border-purple-400'
                }`}
              >
                ✔️ Completed ({stats.completed})
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-600 font-medium">Loading jobs...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filter jobs based on selected status */}
            {(() => {
              const filteredJobs = filterStatus === 'all' 
                ? jobs 
                : jobs.filter(job => job.status === filterStatus);
              
              return (
                <>
                  {filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredJobs.map((job) => (
                        <div key={job._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                          
                          {/* Card Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{job.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                              </div>
                              
                              {/* Delete Button */}
                              {user.role === 'client' && job.status === 'open' && (
                                <button
                                  onClick={() => handleDeleteJob(job._id)}
                                  className="flex-shrink-0 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-lg"
                                  title="Delete this job"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="px-6 py-4 flex-1 flex flex-col">
                            
                            {/* Status Badge */}
                            <div className="mb-4">
                              {job.status === 'open' && (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 text-xs font-bold rounded-full border border-green-200">
                                  <span>✅</span> Open
                                </span>
                              )}
                              {job.status === 'in_progress' && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold rounded-full border border-blue-200">
                                  <span>⏳</span> In Progress
                                </span>
                              )}
                              {job.status === 'completed' && (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 text-xs font-bold rounded-full border border-purple-200">
                                  <span>✔️</span> Completed
                                </span>
                              )}
                              {job.status === 'closed' && (
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 text-xs font-bold rounded-full border border-red-200">
                                  <span>❌</span> Closed
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                              {job.description}
                            </p>

                            {/* Budget */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-600 font-medium mb-1">Budget</p>
                              <p className="text-2xl font-black text-green-600">${job.budget.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <button
                              onClick={() => navigate(`/job-details/${job._id}`)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
                            >
                              View Details →
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <p className="text-6xl mb-4">📭</p>
                      <p className="text-gray-600 text-lg font-medium">No {filterStatus === 'all' ? '' : filterStatus.replace('_', ' ')} jobs found.</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {filterStatus === 'all' && user.role === 'client' ? 'Create your first job to get started!' : 'Try adjusting your filters'}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* APPLICATION SECTION */}
        {user.role === 'client' && applications.length > 0 && (
          <>
            <h3 className="text-3xl font-bold text-gray-900 mt-16 mb-8 border-b-2 border-blue-600 pb-3">
              New Applications
              <span className="ml-4 text-lg font-semibold text-blue-600">({applications.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {applications.map((app) => (
                <div key={app._id} className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">
                  
                  {/* Header Bar */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-blue-600 rounded"></div>
                      <h5 className="text-sm font-bold text-gray-700 tracking-wide">APPLICATION</h5>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded">
                      Pending Review
                    </span>
                  </div>

                  <div className="px-6 py-6 flex-1 flex flex-col">
                    
                    {/* Freelancer Profile */}
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={app.freelancer.avatar}
                        alt={app.freelancer.name}
                        className="w-14 h-14 rounded-lg border-2 border-gray-200 object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{app.freelancer.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {app.freelancer.headline || 'Professional Freelancer'}
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Rating</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {app.freelancer.rating ? app.freelancer.rating.toFixed(1) : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">out of 5.0</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Experience</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {app.freelancer.experience || '—'}
                        </p>
                        <p className="text-xs text-gray-500">years</p>
                      </div>
                    </div>

                    {/* Skills Section */}
                    {app.freelancer.skills && app.freelancer.skills.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Technical Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(app.freelancer.skills) ? app.freelancer.skills : app.freelancer.skills.split(',')).slice(0, 3).map((skill, idx) => (
                            <span 
                              key={idx}
                              className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded border border-blue-200 font-medium"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {Array.isArray(app.freelancer.skills) && app.freelancer.skills.length > 3 && (
                            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded border border-gray-300 font-medium">
                              +{app.freelancer.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Separator */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Budget Box */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Proposed Budget</p>
                      <p className="text-3xl font-bold text-blue-600">${app.amount}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto">
                      <button
                        onClick={() => navigate(`/freelancer-profile/${app.freelancerId}`)}
                        className="w-full border-2 border-blue-600 bg-transparent text-blue-600 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition duration-200"
                      >
                        View Complete Profile
                      </button>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(app._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition duration-200 shadow-sm hover:shadow-md"
                        >
                          Hire
                        </button>

                        <button
                          onClick={() => handleReject(app._id)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 rounded-lg font-semibold transition duration-200 shadow-sm hover:shadow-md"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ))}

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Dashboard;

