import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api';
import toast from 'react-hot-toast';
import { Star, Briefcase, Mail, Globe } from 'lucide-react';

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

const FreelancerProfile = () => {
  const { freelancerId } = useParams();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch freelancer details
        const { data: freelancerData } = await API.get(`/users/${freelancerId}`);
        setFreelancer(freelancerData);

        // Fetch their completed/active jobs
        const { data: allContracts } = await API.get('/contracts');
        const freelancerContracts = allContracts.filter(c => c.freelancerId === freelancerId);
        
        // Get job details for each contract
        const jobDetails = await Promise.all(
          freelancerContracts.map(async (contract) => {
            try {
              const { data: jobData } = await API.get(`/jobs/${contract.jobId}`);
              return { ...jobData, contractStatus: contract.status };
            } catch (error) {
              return null;
            }
          })
        );
        
        setJobs(jobDetails.filter(j => j !== null));

      } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        setError('Failed to load freelancer profile');
        toast.error('Failed to load freelancer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [freelancerId]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return DEFAULT_AVATAR;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5000${avatarPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto mt-10 px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 font-semibold mb-4">{error || 'Freelancer not found'}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      
      <div className="max-w-4xl mx-auto mt-10 px-6">
        
        {/* PROFILE HEADER */}
        <div className="bg-white rounded-xl shadow-md p-8 border">
          
          <div className="flex gap-6 mb-6">
            {/* Avatar */}
            <img 
              src={getAvatarUrl(freelancer.avatar)}
              alt={freelancer.name}
              className="w-32 h-32 rounded-full border-4 border-blue-200 object-cover"
            />
            
            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{freelancer.name}</h1>
              {freelancer.headline && (
                <p className="text-lg text-gray-600 mb-3">{freelancer.headline}</p>
              )}
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      size={20}
                      className={i < Math.floor(freelancer.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-700">
                  {freelancer.rating ? freelancer.rating.toFixed(1) : 'N/A'} stars
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-600" />
                  <span>{freelancer.email}</span>
                </div>
                {freelancer.phone && (
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    <span>{freelancer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio & Experience */}
          {(freelancer.bio || freelancer.experience) && (
            <div className="border-t pt-6 mt-6">
              {freelancer.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
                </div>
              )}
              
              {freelancer.experience && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Experience</h3>
                  <p className="text-gray-700">{freelancer.experience} years of experience</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {freelancer.skills && freelancer.skills.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(freelancer.skills) ? freelancer.skills : freelancer.skills.split(',')).map((skill, idx) => (
                  <span 
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium text-sm"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WORK & HISTORY */}
        {jobs.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-8 border">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Briefcase size={24} className="text-blue-600" />
              Work History ({jobs.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div key={job._id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{job.title}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-green-600">💰 ${job.budget}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      job.contractStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      job.contractStatus === 'funded' ? 'bg-blue-100 text-blue-700' :
                      job.contractStatus === 'active' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {job.contractStatus === 'pending' && '🕐 Pending'}
                      {job.contractStatus === 'funded' && '🔒 In Progress'}
                      {job.contractStatus === 'active' && '⚙️ Active'}
                      {job.contractStatus === 'released' && '✅ Completed'}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/job-details/${job._id}`)}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 text-sm"
                  >
                    View Job Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md text-center border">
            <p className="text-gray-500 text-sm">Total Jobs</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center border">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {jobs.filter(j => j.contractStatus === 'released').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center border">
            <p className="text-gray-500 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {jobs.filter(j => j.contractStatus === 'active' || j.contractStatus === 'funded').length}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FreelancerProfile;
