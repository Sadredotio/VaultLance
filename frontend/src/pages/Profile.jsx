import { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Briefcase, FileText, Code, Edit3, Save, X, Camera } from 'lucide-react';
import API, { SERVER_URL } from '../api';

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  
  // Image States
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [avatarFile, setAvatarFile] = useState(null); 

  // 👇 HELPER FUNCTION: Ensures the image path is always a valid URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return DEFAULT_AVATAR;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${SERVER_URL}${avatarPath}`;
  };

  // Initialize data correctly
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setHeadline(user.headline || '');
      setBio(user.bio || '');
      setSkills(Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''));
      setExperience(user.experience || '');
      
      // Use the helper to set the initial preview
      setAvatarPreview(getAvatarUrl(user.avatar));
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem('userInfo'));
      const token = storedUser?.token || user?.token;

      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('headline', headline);
      formData.append('bio', bio);
      formData.append('skills', skills);
      formData.append('experience', experience);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = {
        ...storedUser,
        ...data,
        token
      };

      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => { window.location.reload(); }, 800);
    } catch (error) {
      console.error("Critical Update Error:", error);
      toast.error(error.response?.data?.message || "Network error. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-10 px-6 pb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-500 mt-1">Update your professional identity.</p>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center sticky top-24">
              <div className="relative inline-block group">
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-100 object-cover shadow-sm" 
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }} // Safety fallback
                />
                {isEditing && (
                  <label className="absolute bottom-4 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{name || "Your Name"}</h2>
              <p className="text-blue-600 font-medium text-sm mt-1">{headline || "Add a headline"}</p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" disabled={!isEditing} value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Headline</label>
                <input type="text" disabled={!isEditing} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Flutter Developer" className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">About Me</label>
                <textarea rows="4" disabled={!isEditing} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Skills (separate with commas)</label>
                <input type="text" disabled={!isEditing} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node, MongoDB" className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
                <input type="number" disabled={!isEditing} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" className="w-full p-3 rounded-lg border bg-gray-50 focus:bg-white outline-none transition" min="0" max="99" />
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;