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
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setWalletBalance(user.walletBalance || 0);
      console.log('👤 User loaded:', { name: user.name, walletBalance: user.walletBalance });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!title || !description || !budget) {
        return toast.error("Please fill all fields");
    }

    const budgetNum = Number(budget);
    if (budgetNum <= 0) {
      return toast.error("Budget must be greater than 0");
    }

    if (budgetNum > walletBalance) {
      return toast.error(`Insufficient balance. You have $${walletBalance} but need $${budgetNum}`);
    }

    try {
      setLoading(true);
      console.log('📤 Creating job with:', { title, description, budget: budgetNum });
      
      // 1. Send data to Backend
      const response = await API.post('/jobs', { 
        title, 
        description, 
        budget: budgetNum 
      });

      console.log('✅ Job created successfully:', response.data);

      // Update local and global wallet balance
      const newBalance = response.data.newWalletBalance;
      setWalletBalance(newBalance);
      
      // 🔥 UPDATE GLOBAL AUTH CONTEXT 🔥
      setUser({
        ...user,
        walletBalance: newBalance
      });

      // 2. Success Feedback
      toast.success(`Job Posted! Balance: $${newBalance} 🎉`);
      
      // 3. Redirect back to Dashboard to see the new job
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
      console.error('❌ Error creating job:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to post job';
      console.error('Error details:', { 
        status: error.response?.status,
        data: error.response?.data,
        message: errorMsg
      });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Post a New Project</h2>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Wallet Balance</p>
            <p className="text-2xl font-bold text-blue-600">${walletBalance.toFixed(2)}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Project Title</label>
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
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea 
              rows="4"
              placeholder="Describe the requirements..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Budget Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Budget ($)</label>
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
            disabled={loading || !title || !description || !budget || Number(budget) > walletBalance}
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