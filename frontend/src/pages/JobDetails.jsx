import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import API from '../api';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';

const JobDetails = () => {
  const { jobId } = useParams(); 
  const { user, login } = useContext(AuthContext); 
  const [job, setJob] = useState(null);
  const [client, setClient] = useState(null); // Client information
  const [clientJobCount, setClientJobCount] = useState(0); // Total jobs posted by client
  const [applicants, setApplicants] = useState([]); // NEW: Tracks who applied
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 1. FETCH JOB & APPLICANTS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Job directly by ID (more efficient)
        const { data: jobData } = await API.get(`/jobs/${jobId}`); 
        setJob(jobData);

        // Fetch Client Information
        if (jobData.postedBy) {
          try {
            // Handle both string ID and object ID
            const clientId = typeof jobData.postedBy === 'string' ? jobData.postedBy : jobData.postedBy._id;
            const { data: clientData } = await API.get(`/users/${clientId}`);
            setClient(clientData);
          } catch (error) {
            console.error('Error fetching client:', error);
          }
        }

        // Fetch Applicants (Pending Contracts)
        const { data: contractData } = await API.get('/contracts');
        const jobApplicants = contractData.filter(c => {
          // Handle both string and object jobId comparisons
          const contractJobId = typeof c.jobId === 'string' ? c.jobId : c.jobId?._id;
          return contractJobId === jobId;
        });
        
        // Fetch freelancer info for each applicant
        const applicantsWithFreelancers = await Promise.all(
          jobApplicants.map(async (applicant) => {
            try {
              // Handle both string ID and object ID
              const freelancerId = typeof applicant.freelancerId === 'string' ? applicant.freelancerId : applicant.freelancerId._id;
              const { data: freelancerData } = await API.get(`/users/${freelancerId}`);
              return { ...applicant, freelancer: freelancerData };
            } catch (error) {
              console.error('Error fetching freelancer:', error);
              return applicant;
            }
          })
        );
        
        setApplicants(applicantsWithFreelancers);

        // Fetch total jobs posted by this client
        try {
          // Handle both string ID and object ID
          const clientId = typeof jobData.postedBy === 'string' ? jobData.postedBy : jobData.postedBy._id;
          const { data: clientJobsData } = await API.get(`/jobs/client/${clientId}`);
          const totalJobs = Array.isArray(clientJobsData) ? clientJobsData.length : 0;
          setClientJobCount(totalJobs > 0 ? totalJobs : 1); // At least this job
        } catch (error) {
          console.error('Error fetching client job count:', error);
          setClientJobCount(1); // Default to at least 1 (current job)
        }

      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId, user.role]);

  // --- 2. FREELANCER: Apply for Job ---
  const handleApply = async () => {
    try {
      await API.post('/contracts/apply', { jobId: job._id, budget: job.budget });
      toast.success("Application sent successfully!");
      navigate('/my-applications'); // Send them to track it
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply');
    }
  };

  // --- 3. CLIENT: Hire & Fund Escrow ---
  const handleHireAndFund = async (contractId, freelancerId) => {
    try {
      // We no longer need to create a contract, we just FUND the existing pending one!
      const res = await API.post(`/contracts/${contractId}/fund`);
      
      // Update user wallet balance with response data
      const updatedUser = { ...user, walletBalance: res.data.walletBalance };
      login(updatedUser); 

      toast.success(`Hired! $${job.budget} securely locked in Escrow!`);
      navigate('/dashboard'); 
    } catch (error) {
      console.error('Hire & Fund Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fund escrow');
    }
  };

  // --- 4. CLIENT: Release Funds ---
  const handleReleaseFunds = async (contractId) => {
    try {
      const res = await API.post(`/contracts/${contractId}/release`);
      toast.success('Funds successfully released to Freelancer! 🎉');
      navigate('/dashboard'); 
    } catch (error) {
      console.error('Release Funds Error:', error);
      toast.error(error.response?.data?.message || 'Failed to release funds');
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!job) return <div className="text-center mt-20 text-red-500">Job not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border">
        
        <div className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
          
          {/* Job Status Badge */}
          <div className="mt-2 inline-block">
            {job.status === 'open' && (
              <span className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full font-bold">
                ✅ OPEN - Accepting Applications
              </span>
            )}
            {job.status === 'in_progress' && (
              <span className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-bold">
                ⏳ IN PROGRESS - Work in Progress
              </span>
            )}
            {job.status === 'completed' && (
              <span className="bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full font-bold">
                ✔️ COMPLETED - Work Finished
              </span>
            )}
            {job.status === 'closed' && (
              <span className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded-full font-bold">
                ❌ CLOSED - No Longer Available
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-lg mb-8">{job.description}</p>
        <p className="text-3xl font-bold text-green-700 mb-8">Budget: ${job.budget}</p>

        {/* --- PROJECT DETAILS: Requirements, Timeline, Skills, Outcomes --- */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {job.requirements && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                📋 Requirements
              </h4>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
            </div>
          )}

          {job.timeline && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                ⏰ Timeline
              </h4>
              <p className="text-gray-600 text-sm">{job.timeline}</p>
            </div>
          )}

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                🛠️ Required Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.expectedOutcomes && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                🎯 Expected Outcomes
              </h4>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{job.expectedOutcomes}</p>
            </div>
          )}
        </div>

        {/* --- CLIENT PROFILE CARD --- */}
{client && (
  <div className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 sm:p-8 shadow-lg">
    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">About the Client</h3>
    
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left">
      {/* Left: Avatar & Basic Info */}
      <div className="flex-shrink-0">
        <img 
          src={client.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          alt={client.name}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-300 shadow-md"
        />
      </div>

      {/* Right: Client Details */}
      <div className="flex-1 w-full min-w-0">
        {/* Name & Headline */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{client.name}</h2>
          {client.headline && (
            <p className="text-blue-700 font-semibold text-base sm:text-lg mt-1">{client.headline}</p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {/* Jobs Posted */}
          <div className="bg-white p-2 sm:p-4 rounded-lg border border-blue-100 text-center shadow-sm">
            <p className="text-xl sm:text-4xl font-bold text-blue-600">{clientJobCount}</p>
            <p className="text-gray-600 font-semibold text-[11px] sm:text-sm leading-tight">Jobs Posted</p>
          </div>

          {/* Rating */}
          <div className="bg-white p-2 sm:p-4 rounded-lg border border-blue-100 text-center shadow-sm">
            <p className="text-xl sm:text-4xl font-bold text-yellow-500">
              {client.rating ? client.rating.toFixed(1) : '0'}
            </p>
            <p className="text-gray-600 font-semibold text-[11px] sm:text-sm leading-tight">⭐ Rating</p>
          </div>

          {/* Member Since */}
          <div className="bg-white p-2 sm:p-4 rounded-lg border border-blue-100 text-center shadow-sm">
            <p className="text-base sm:text-lg font-bold text-green-600">
              {client.createdAt ? new Date(client.createdAt).getFullYear() : 'N/A'}
            </p>
            <p className="text-gray-600 font-semibold text-[11px] sm:text-sm leading-tight">Member Since</p>
          </div>
        </div>

        {/* Bio */}
        {client.bio && (
          <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-2">About:</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{client.bio}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-gray-600 font-semibold">📧 Contact:</span>
            <a 
              href={`mailto:${client.email}`}
              className="text-blue-600 hover:text-blue-800 font-semibold break-all"
            >
              {client.email}
            </a>
          </div>
          {client.createdAt && (
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
              <span>🕐 Member for {Math.floor((new Date() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24 * 30))} months</span>
            </div>
          )}
        </div>

        {/* Message Client Button (Freelancer only) */}
        {user.role === 'freelancer' && (
          <button
            onClick={() => navigate(`/messages?with=${client._id}&job=${jobId}`)}
            className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition"
          >
            <MessageCircle size={18} /> Message Client
          </button>
        )}

        {/* Trustworthiness Indicator */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-left">
          <p className="text-green-800 font-semibold text-sm flex items-center gap-2">
            ✅ Verified Client with {clientJobCount} active jobs
          </p>
        </div>
      </div>
    </div>
  </div>
)}

        {/* --- FREELANCER VIEW: Apply Button --- */}
        {user.role === 'freelancer' && job.status === 'open' && (
          <button 
            onClick={handleApply}
            className="w-full bg-black text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:bg-gray-800 transition text-lg"
          >
            🚀 Apply for this Job
          </button>
        )}

        {/* --- FREELANCER VIEW: Status Message when not open --- */}
        {user.role === 'freelancer' && job.status !== 'open' && (
          <div className="w-full bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-8 py-4 rounded-lg font-semibold text-lg">
            {job.status === 'in_progress' && (
              <p>⏳ This job is currently in progress. A freelancer is already working on it.</p>
            )}
            {job.status === 'completed' && (
              <p>✔️ This job has been completed.</p>
            )}
            {job.status === 'closed' && (
              <p>❌ This job is no longer available for applications.</p>
            )}
          </div>
        )}

        {/* --- CLIENT VIEW: Applicant List --- */}
        {user.role === 'client' && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-xl font-bold mb-4">Applicants & Contracts</h3>
            
            {applicants.length === 0 ? (
              <p className="text-gray-500 italic">No one has applied to this job yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {applicants.map(app => (
                  <div key={app._id} className="bg-white p-4 border rounded-lg flex justify-between items-center hover:shadow-lg transition">
                    
                    {/* Left: Freelancer Avatar & Info */}
                    <div 
                      className="flex items-center gap-4 cursor-pointer flex-1 hover:opacity-80 transition"
                      onClick={() => navigate(`/freelancer-profile/${typeof app.freelancerId === 'string' ? app.freelancerId : app.freelancerId._id}`)}
                    >
                      {/* Avatar */}
                      <img 
                        src={app.freelancer?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={app.freelancer?.name || 'Freelancer'}
                        className="w-12 h-12 rounded-full border-2 border-gray-300"
                      />
                      
                      {/* Freelancer Details */}
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg">{app.freelancer?.name || 'Unknown Freelancer'}</p>
                        <p className="text-sm text-gray-600">{app.freelancer?.headline || 'Freelancer'}</p>
                        <p className="text-xs text-gray-500 mt-1">⭐ Rating: {app.freelancer?.rating || 'N/A'}</p>
                        
                        {/* Status Badge */}
                        <span className={`text-xs px-2 py-1 rounded font-bold mt-2 inline-block ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'new' ? 'bg-orange-100 text-orange-700' :
                          app.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                          app.status === 'submission_pending' ? 'bg-purple-100 text-purple-700' :
                          app.status === 'released' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status === 'pending' && '🕐 Pending Application'}
                          {app.status === 'new' && '📋 Accepted - Ready to Fund'}
                          {app.status === 'active' && '⚙️ Work in Progress'}
                          {app.status === 'submission_pending' && '✅ Work Submitted'}
                          {app.status === 'released' && '💰 Completed & Paid'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {/* Message this applicant */}
                      <button
                        onClick={() => navigate(`/messages?with=${typeof app.freelancerId === 'string' ? app.freelancerId : app.freelancerId._id}&job=${jobId}`)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-bold shadow hover:bg-gray-200 whitespace-nowrap flex items-center gap-1.5"
                        title="Message this applicant"
                      >
                        <MessageCircle size={16} /> Message
                      </button>

                      {/* Show "Hire & Fund" only if job is open and app is pending */}
                      {job.status === 'open' && app.status === 'pending' && (
                        <button 
                          onClick={() => handleHireAndFund(app._id, app.freelancerId)}
                          className="bg-green-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-green-700 whitespace-nowrap"
                        >
                          🔒 Hire & Fund
                        </button>
                      )}

                      {/* Show "Release" only if job is in progress and work is submitted */}
                      {job.status === 'in_progress' && app.status === 'submission_pending' && (
                        <button 
                          onClick={() => handleReleaseFunds(app._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-blue-700 whitespace-nowrap"
                        >
                          ✅ Approve Work
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;