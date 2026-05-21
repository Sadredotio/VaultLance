import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { CheckCircle, Lock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const History = () => {
  const { user } = useContext(AuthContext);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch all contracts where this user is involved
        const { data } = await API.get('/contracts');
        setContracts(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn transition-opacity duration-500">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-10 px-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Transaction History</h2>
        <p className="text-gray-500 mb-8">View your escrow payments, locks, and releases.</p>

        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Loading transactions...</p>
        ) : contracts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-lg">No transactions found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {contracts.map((contract) => {
              // Determine transaction visuals based on Role and Status
              const isClient = user.role === 'client';
              const isReleased = contract.status === 'released';

              return (
                <div key={contract._id} className="border-b last:border-0 p-6 flex justify-between items-center hover:bg-gray-50 transition">
                  
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      isReleased ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {isReleased ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        {isReleased ? 'Funds Released' : 'Locked in Escrow'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Contract ID: {contract._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Amount & Arrow */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      {isClient ? (
                        <ArrowUpRight className={`w-5 h-5 ${isReleased ? 'text-gray-400' : 'text-yellow-600'}`} />
                      ) : (
                        <ArrowDownLeft className={`w-5 h-5 ${isReleased ? 'text-green-600' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-2xl font-black ${
                        isClient ? (isReleased ? 'text-gray-600' : 'text-yellow-600') : (isReleased ? 'text-green-600' : 'text-yellow-600')
                      }`}>
                        ${contract.amount}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isReleased ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {contract.status.toUpperCase()}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;