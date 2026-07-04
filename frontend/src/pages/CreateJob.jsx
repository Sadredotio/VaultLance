import { useState, useContext, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const CreateJob = () => {
  const { user, setUser } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [requirements, setRequirements] = useState('');
  const [timeline, setTimeline] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setWalletBalance(user.walletBalance || 0);
    }
  }, [user]);

  const isFormValid =
    title.trim() &&
    description.trim() &&
    budget &&
    requirements.trim() &&
    timeline.trim() &&
    skillsRequired.trim() &&
    expectedOutcomes.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mandatory field validation
    if (!isFormValid) {
      return toast.error('Please fill in all required fields');
    }

    const budgetNum = Number(budget);
    if (budgetNum <= 0) {
      return toast.error('Budget must be greater than 0');
    }

    if (budgetNum > walletBalance) {
      return toast.error(`Insufficient balance. You have $${walletBalance} but need $${budgetNum}`);
    }

    const skillsArray = skillsRequired
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      return toast.error('Please specify at least one required skill');
    }

    try {
      setLoading(true);

      const response = await API.post('/jobs', {
        title,
        description,
        budget: budgetNum,
        requirements,
        timeline,
        skillsRequired: skillsArray,
        expectedOutcomes
      });

      const newBalance = response.data.newWalletBalance;
      setWalletBalance(newBalance);

      setUser({
        ...user,
        walletBalance: newBalance
      });

      toast.success(`Job Posted! Balance: $${newBalance} 🎉`);

      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
      console.error('❌ Error creating job:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to post job';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto mt-10 mb-16 bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Post a New Project</h2>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Wallet Balance</p>
            <p className="text-2xl font-bold text-blue-600">${walletBalance.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Build an E-commerce Website"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="4"
              placeholder="Describe the project in general terms..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Requirements Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Project Requirements <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1.5">
              What exactly does the freelancer need to build, fix, or deliver?
            </p>
            <textarea
              rows="3"
              placeholder="e.g. Responsive product catalog, cart, checkout with Stripe, admin dashboard..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Timeline Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Timeline / Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 2 weeks, or by July 15, 2026"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Skills Required Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Required Skills <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1.5">
              Comma-separated, e.g. React, Node.js, MongoDB
            </p>
            <input
              type="text"
              placeholder="React, Node.js, MongoDB, Tailwind CSS"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              disabled={loading}
            />
            {skillsRequired.trim() && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skillsRequired.split(',').map((s) => s.trim()).filter(Boolean).map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expected Outcomes Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Expected Outcomes <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1.5">
              What does "done" look like? Define the deliverables clearly.
            </p>
            <textarea
              rows="3"
              placeholder="e.g. A fully deployed, tested website with source code handed over via GitHub..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={expectedOutcomes}
              onChange={(e) => setExpectedOutcomes(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Budget Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Budget ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="500"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={loading}
            />
            {budget && Number(budget) > walletBalance && (
              <p className="text-red-500 text-sm mt-1">⚠️ Insufficient balance</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid || Number(budget) > walletBalance}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Posting...
              </>
            ) : (
              'Post Job'
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateJob;