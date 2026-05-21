import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams(); // Gets token from URL
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/resetpassword/${token}`, { password });
      toast.success("Password reset successfully! Please login.");
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired token");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create New Password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="password" 
            placeholder="New Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 rounded-lg" 
            required 
          />
          <button type="submit" className="bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;