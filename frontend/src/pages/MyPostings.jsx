import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Search, PlusCircle } from 'lucide-react';

const MyPostings = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        const { data } = await API.get('/jobs/myjobs');
        setJobs(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  // Helper to choose the right icon/color for status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <Search className="w-5 h-5 text-blue-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Briefcase className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn transition-opacity duration-500">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 px-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">My Job Postings</h2>
            <p className="text-gray-500 mt-1">Manage and track the status of all your projects.</p>
          </div>
          <button 
            onClick={() => navigate('/create-job')}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg font-bold flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Post New Job
          </button>
        </div>

        {/* Jobs List */}
        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Loading your jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium">You haven't posted any jobs yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Side: Job Info */}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full mt-1 ${
                    job.status === 'open' ? 'bg-blue-50' : job.status === 'in_progress' ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    {getStatusIcon(job.status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{job.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-1 max-w-xl">{job.description}</p>
                  </div>
                </div>

                {/* Right Side: Status, Budget & Action */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Budget</p>
                    <span className="text-xl font-black text-green-600">${job.budget}</span>
                  </div>

                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                    job.status === 'open' ? 'bg-blue-100 text-blue-700' : 
                    job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>

                  <button 
                    onClick={() => navigate(`/job-details/${job._id}`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg transition"
                  >
                    View
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostings;