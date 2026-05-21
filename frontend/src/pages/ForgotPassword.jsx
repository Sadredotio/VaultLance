import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, this sends an email. For now, it returns the token.
      const res = await API.post('/users/forgotpassword', { email });
      
      // FOR TESTING: Copy the URL from the console and paste it in your browser!
      console.log("TESTING RESET URL:", res.data.resetUrl); 
      
      toast.success("Reset link sent! (Check console for the link)");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
        <p className="text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 rounded-lg focus:outline-blue-500" 
            required 
          />
          <button type="submit" className="bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;