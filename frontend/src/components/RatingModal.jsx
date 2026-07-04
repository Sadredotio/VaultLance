import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';

/**
 * RatingModal
 * Props:
 *   contract      - the full contract object (must be status === 'released')
 *   currentUser   - logged-in user object
 *   onClose()     - called when modal should close
 *   onSubmitted() - called after a successful review submission
 */
const RatingModal = ({ contract, currentUser, onClose, onSubmitted }) => {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isClient = currentUser?.role === 'client';

  // Who are we rating?
  const reviewee = isClient
    ? (contract.freelancerId || {})   // client rates freelancer
    : (contract.clientId    || {});   // freelancer rates client

  const revieweeName = reviewee?.name || (isClient ? 'Freelancer' : 'Client');
  const revieweeAvatar = reviewee?.avatar || null;

  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    setLoading(true);
    try {
      await API.post('/reviews', {
        contractId: contract._id,
        rating,
        comment,
      });
      toast.success('Review submitted! Thank you.');
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Leave a Review</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              How was working with {revieweeName}?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Reviewee info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            {revieweeAvatar ? (
              <img
                src={revieweeAvatar.startsWith('http') ? revieweeAvatar : `http://localhost:5000${revieweeAvatar}`}
                alt={revieweeName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {revieweeName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{revieweeName}</p>
              <p className="text-xs text-gray-500 capitalize">{isClient ? 'Freelancer' : 'Client'}</p>
            </div>
          </div>

          {/* Project info */}
          <div className="text-sm text-gray-500 -mt-2">
            Project: <span className="font-semibold text-gray-700">{contract?.jobId?.title || 'Completed Project'}</span>
          </div>

          {/* Star rating */}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 mb-3">Your Rating</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hovered || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-sm font-semibold text-yellow-500">
                {labels[hovered || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share your experience working with ${revieweeName}…`}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {loading ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;