import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import RatingModal from '../components/RatingModal';
import API from '../api';
import toast from 'react-hot-toast';
import {
  Star, Briefcase, Mail, MessageCircle, MapPin,
  Clock, CheckCircle, Award, TrendingUp, User, Calendar
} from 'lucide-react';

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

const FreelancerProfile = () => {
  const { freelancerId } = useParams();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [ratingModal, setRatingModal] = useState(false);
  const [hasEligibleContract, setHasEligibleContract] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [eligibleContract, setEligibleContract] = useState(null);
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch freelancer profile
        const { data: freelancerData } = await API.get(`/users/${freelancerId}`);
        setFreelancer(freelancerData);

        // Fetch contracts to build project history
        const { data: allContracts } = await API.get('/contracts');
        const myContracts = allContracts.filter((c) => {
          const id = typeof c.freelancerId === 'object' ? c.freelancerId?._id : c.freelancerId;
          return id?.toString() === freelancerId?.toString();
        });

        setContracts(myContracts);

        // Fetch reviews for this freelancer
        try {
          const { data: reviewData } = await API.get(`/reviews/user/${freelancerId}`);
          setReviews(reviewData);
        } catch (_) {}

        // Check if current user has a completed contract with this freelancer and hasn't reviewed yet
        if (currentUser && currentUser._id !== freelancerId) {
          const shared = myContracts.find(c => {
            const cClientId = typeof c.clientId === 'object' ? c.clientId?._id : c.clientId;
            return c.status === 'released' && cClientId?.toString() === currentUser._id?.toString();
          });
          if (shared) {
            setHasEligibleContract(true);
            setEligibleContract(shared);
            try {
              const { data: checkData } = await API.get(`/reviews/check/${shared._id}`);
              setAlreadyReviewed(checkData.hasReviewed);
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Error fetching freelancer profile:', err);
        setError('Failed to load freelancer profile');
        toast.error('Failed to load profile');
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

  const completedContracts = contracts.filter(c => c.status === 'released');
  const activeContracts = contracts.filter(c => ['active', 'submission_pending'].includes(c.status));
  const pendingContracts = contracts.filter(c => c.status === 'pending');

  const successRate = contracts.length > 0
    ? Math.round((completedContracts.length / contracts.length) * 100)
    : 0;

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < Math.floor(rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status) => {
    const map = {
      pending:            { label: 'Pending',      cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      new:                { label: 'Awaiting Fund', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
      active:             { label: 'Active',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
      submission_pending: { label: 'Under Review', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
      released:           { label: 'Completed ✓',  cls: 'bg-green-100 text-green-700 border-green-200' },
      cancelled:          { label: 'Cancelled',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto mt-16 px-6">
          {/* Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
            <div className="flex gap-6">
              <div className="w-28 h-28 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-7 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-72" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !freelancer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto mt-20 px-6 text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600 text-lg font-medium mb-6">{error || 'Freelancer not found'}</p>
          <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const skills = Array.isArray(freelancer.skills)
    ? freelancer.skills
    : freelancer.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 h-40" />

      <div className="max-w-5xl mx-auto px-6 -mt-20">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={getAvatarUrl(freelancer.avatar)}
                alt={freelancer.name}
                className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900">{freelancer.name}</h1>
                  {freelancer.headline && (
                    <p className="text-gray-500 mt-1 text-base">{freelancer.headline}</p>
                  )}

                  {/* Rating row */}
                  <div className="flex items-center gap-3 mt-2">
                    {renderStars(freelancer.rating)}
                    <span className="text-sm font-semibold text-gray-700">
                      {freelancer.rating ? freelancer.rating.toFixed(1) : 'No rating yet'}
                    </span>
                    {contracts.length > 0 && (
                      <span className="text-xs text-gray-400">({contracts.length} project{contracts.length !== 1 ? 's' : ''})</span>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-blue-500" />
                      {freelancer.email}
                    </span>
                    {freelancer.experience && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-500" />
                        {freelancer.experience} yrs experience
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" />
                      Joined {new Date(freelancer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => navigate(`/messages?with=${freelancerId}`)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
                  >
                    <MessageCircle size={16} /> Message
                  </button>
                  {hasEligibleContract && (
                    alreadyReviewed ? (
                      <span className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm font-semibold">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" /> Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => setRatingModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
                      >
                        <Star size={16} /> Rate
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── STAT STRIP ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-3xl font-black text-blue-600">{contracts.length}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Total Projects</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{completedContracts.length}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-purple-600">{activeContracts.length}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Active</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-orange-500">{successRate}%</p>
              <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Success Rate</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          {[
            { key: 'overview', label: '👤 Overview' },
            { key: 'projects', label: `📁 Projects (${contracts.length})` },
            { key: 'skills',   label: `🛠 Skills (${skills.length})` },
            { key: 'reviews',  label: `⭐ Reviews (${reviews.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* About */}
            {freelancer.bio && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={18} className="text-blue-500" /> About
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{freelancer.bio}</p>
              </div>
            )}

            {/* Experience */}
            {freelancer.experience && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500" /> Experience
                </h3>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
                    <span className="text-3xl font-black text-blue-600">{freelancer.experience}</span>
                    <span className="text-blue-400 ml-1 font-medium">years</span>
                  </div>
                  <p className="text-gray-500 text-sm">of professional experience</p>
                </div>
              </div>
            )}

            {/* Skills preview */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award size={18} className="text-blue-500" /> Top Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-1.5 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 8 && (
                    <button
                      onClick={() => setActiveTab('skills')}
                      className="text-blue-500 text-sm font-medium hover:underline px-2"
                    >
                      +{skills.length - 8} more →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent projects */}
            {contracts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" /> Recent Projects
                </h3>
                <div className="space-y-3">
                  {contracts.slice(0, 3).map(contract => {
                    const job = typeof contract.jobId === 'object' ? contract.jobId : null;
                    return (
                      <div key={contract._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{job?.title || 'Project'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(contract.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className="font-bold text-green-600 text-sm">${contract.amount?.toLocaleString()}</span>
                          {getStatusBadge(contract.status)}
                        </div>
                      </div>
                    );
                  })}
                  {contracts.length > 3 && (
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="text-blue-500 text-sm font-medium hover:underline w-full text-center pt-1"
                    >
                      View all {contracts.length} projects →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!freelancer.bio && !freelancer.experience && skills.length === 0 && contracts.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-3">🌱</div>
                <p className="text-gray-500">This freelancer hasn't filled out their profile yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 font-medium">No projects yet</p>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[
                    { label: 'Completed', count: completedContracts.length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                    { label: 'Active', count: activeContracts.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Pending', count: pendingContracts.length, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                      <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {contracts.map(contract => {
                  const job = typeof contract.jobId === 'object' ? contract.jobId : null;
                  return (
                    <div
                      key={contract._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 text-lg leading-tight">{job?.title || 'Project'}</h4>
                          {job?.description && (
                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{job.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Started {new Date(contract.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {getStatusBadge(contract.status)}
                          <span className="text-xl font-black text-green-600">${contract.amount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {contract.status === 'released' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-green-600">
                          <CheckCircle size={15} />
                          <span className="text-xs font-medium">Project completed successfully</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── SKILLS TAB ── */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {skills.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🛠</div>
                <p className="text-gray-500 font-medium">No skills listed yet</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 mb-5 text-lg">All Skills ({skills.length})</h3>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-800 px-5 py-2.5 rounded-xl font-semibold text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      {skill}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-3">⭐</div>
                <p className="text-gray-500 font-medium">No reviews yet</p>
                <p className="text-gray-400 text-sm mt-1">Reviews appear after completed contracts</p>
              </div>
            ) : (
              <>
                {/* Average rating summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
                  <div className="text-center flex-shrink-0">
                    <p className="text-6xl font-black text-yellow-400">
                      {freelancer.rating ? freelancer.rating.toFixed(1) : '—'}
                    </p>
                    <div className="flex justify-center mt-1">
                      {renderStars(freelancer.rating)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1">
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-4">{star}</span>
                          <Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual reviews */}
                {reviews.map(review => (
                  <div key={review._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      {review.reviewerId?.avatar ? (
                        <img
                          src={review.reviewerId.avatar.startsWith('http') ? review.reviewerId.avatar : `http://localhost:5000${review.reviewerId.avatar}`}
                          alt={review.reviewerId?.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {(review.reviewerId?.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{review.reviewerId?.name || 'Anonymous'}</span>
                            <span className="ml-2 text-xs text-gray-400 capitalize">{review.reviewerRole}</span>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={13} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                        {review.jobId?.title && (
                          <p className="text-xs text-blue-600 mb-1.5">Project: {review.jobId.title}</p>
                        )}
                        {review.comment && (
                          <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>

      {/* Rating modal */}
      {ratingModal && eligibleContract && (
        <RatingModal
          contract={eligibleContract}
          currentUser={currentUser}
          onClose={() => setRatingModal(false)}
          onSubmitted={() => {
            setAlreadyReviewed(true);
            setRatingModal(false);
            API.get(`/reviews/user/${freelancerId}`)
              .then(r => setReviews(r.data))
              .catch(() => {});
          }}
        />
      )}

    </div>
  );
};

export default FreelancerProfile;