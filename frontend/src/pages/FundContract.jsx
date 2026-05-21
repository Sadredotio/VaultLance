import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import API from '../api';
import { Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const FundContract = () => {
  const { contractId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [job, setJob] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [contractId]);

  const fetchData = async () => {
    try {
      const contractRes = await API.get(`/contracts/${contractId}`);
      setContract(contractRes.data);
      
      const walletRes = await API.get('/wallet');
      setWallet(walletRes.data);
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Failed to load contract');
      navigate('/my-postings');
    } finally {
      setLoading(false);
    }
  };

  const handleFundContract = async () => {
    if (!wallet || wallet.balance < contract.amount) {
      toast.error('Insufficient wallet balance. Add more funds first.');
      return;
    }

    setFunding(true);
    try {
      await API.post(`/contracts/${contractId}/fund`);
      toast.success('Contract funded! Money locked in escrow.');
      setTimeout(() => navigate('/my-contracts'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Funding failed');
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const sufficient = wallet?.balance >= contract?.amount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <Navbar />

      <div className="max-w-3xl mx-auto mt-10 px-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Lock className="w-10 h-10 text-orange-600" />
            Fund Contract & Lock Funds in Escrow
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Contract Details */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contract Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Freelancer Name:</span>
                  <span className="text-gray-900 font-bold">{contract?.freelancerId?.name || 'Unknown'}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Amount to Lock:</span>
                  <span className="text-3xl font-bold text-green-600">${contract?.amount?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Terms:</span>
                  <span className="text-gray-900">{contract?.terms}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-blue-900 font-semibold">Current Status:</span>
                  <span className="text-blue-900 font-bold uppercase">{contract?.status}</span>
                </div>
              </div>
            </div>

            {/* What Happens */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> What Happens When You Fund?
              </h3>
              <ul className="space-y-3 text-blue-900">
                <li className="flex gap-3">
                  <span className="text-2xl">💰</span>
                  <span><strong>Money Locked:</strong> ${contract?.amount?.toFixed(2)} will be held in platform escrow</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">👷</span>
                  <span><strong>Freelancer Starts:</strong> They can begin work on your project</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">✅</span>
                  <span><strong>You Approve:</strong> When work is done, you'll review and approve it</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">💸</span>
                  <span><strong>Payment Released:</strong> After your approval, payment goes to freelancer</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Wallet Status */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Wallet Status</h3>
              
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Available Balance</p>
                <p className="text-4xl font-bold text-blue-600">${wallet?.balance?.toFixed(2)}</p>
              </div>

              <div className="p-4 mb-6 rounded-lg border-2" style={{
                borderColor: sufficient ? '#10b981' : '#ef4444',
                backgroundColor: sufficient ? '#ecfdf5' : '#fef2f2'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  {sufficient ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-900">Sufficient Funds</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-red-900">Insufficient Funds</span>
                    </>
                  )}
                </div>
                <p className="text-sm" style={{color: sufficient ? '#047857' : '#7f1d1d'}}>
                  {sufficient 
                    ? `You have enough to fund this contract`
                    : `Need $${(contract?.amount - wallet?.balance).toFixed(2)} more`
                  }
                </p>
              </div>

              {!sufficient && (
                <button
                  onClick={() => navigate('/wallet')}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 mb-3 transition"
                >
                  Add Funds to Wallet
                </button>
              )}

              <button
                onClick={handleFundContract}
                disabled={!sufficient || funding}
                className={`w-full px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                  sufficient && !funding
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {funding && <Loader className="w-5 h-5 animate-spin" />}
                {funding ? 'Funding...' : 'Fund Contract Now 🔒'}
              </button>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
              <p className="font-bold mb-2">⚠️ Important</p>
              <p>Once funded, the money cannot be refunded. The freelancer will then begin work on your project.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundContract;
