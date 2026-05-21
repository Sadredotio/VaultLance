import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { AlertTriangle, Loader, MessageSquare, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Disputes = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, open, resolved

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await API.get('/disputes/my-disputes');
      setDisputes(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setCommenting(true);
    try {
      await API.post(`/disputes/${selectedDispute._id}/comment`, {
        comment: comment
      });
      toast.success('Comment added');
      setComment('');
      fetchDisputes();
      if (selectedDispute) {
        setSelectedDispute({ ...selectedDispute, comments: [...selectedDispute.comments, { user: user._id, comment }] });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-900 border-green-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

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

      <div className="max-w-7xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-red-600" />
            Disputes
          </h1>
          <p className="text-gray-600 mt-2">
            Manage conflicting contracts and resolution requests
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-8">
          {['all', 'open', 'in_review', 'resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg font-bold capitalize transition ${
                filter === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'in_review' ? 'In Review' : tab} ({filteredDisputes.filter(d => d.status === tab).length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Disputes List */}
          <div className="lg:col-span-2">
            {filteredDisputes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No disputes found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDisputes.map((dispute) => (
                  <div
                    key={dispute._id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition ${
                      selectedDispute?._id === dispute._id
                        ? 'border-2 border-red-600 shadow-lg'
                        : 'border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-800">
                        {dispute.contractId?.jobId?.title || 'Contract'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      <strong>Type:</strong> {dispute.type.replace(/_/g, ' ')}
                    </p>

                    <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                      {dispute.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      {dispute.comments?.length || 0} comment(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedDispute ? (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Dispute Details</h2>

                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Contract</p>
                    <p className="font-bold text-gray-800">
                      {selectedDispute.contractId?.jobId?.title}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Status</p>
                    <p className={`font-bold ${
                      selectedDispute.status === 'open' ? 'text-red-600' :
                      selectedDispute.status === 'in_review' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {selectedDispute.status.toUpperCase()}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Type</p>
                    <p className="font-bold text-gray-800">
                      {selectedDispute.type.replace(/_/g, ' ')}
                    </p>
                  </div>

                  {selectedDispute.resolution && (
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-xs text-green-700 uppercase">Resolution</p>
                      <p className="font-bold text-green-900">
                        {selectedDispute.resolution.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <p className="text-sm text-red-900">
                    <strong>Issue:</strong> {selectedDispute.description}
                  </p>
                </div>

                {/* Comments */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({selectedDispute.comments?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedDispute.comments?.map((c, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-bold text-gray-800 text-xs mb-1">
                          {c.user?.name || 'User'} • {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-700">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Comment */}
                {selectedDispute.status !== 'resolved' && (
                  <div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-red-500 transition text-sm"
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={commenting}
                      className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold disabled:bg-gray-400"
                    >
                      {commenting ? '⏳ Adding...' : '💬 Add Comment'}
                    </button>
                  </div>
                )}

                {selectedDispute.status === 'resolved' && (
                  <div className="p-4 bg-green-50 rounded-lg text-sm text-green-900">
                    <p className="font-bold">✅ This dispute has been resolved.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 text-center opacity-50">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Select a dispute to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disputes;
