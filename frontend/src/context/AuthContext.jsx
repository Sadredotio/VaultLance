import { createContext, useState, useEffect } from "react";
import { disconnectSocket } from "../socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          setUser(JSON.parse(userInfo));
        } catch (e) {
          console.error("Auth initialization error:", e);
          localStorage.removeItem("userInfo");
        }
      }
      setLoading(false); // ✅ CRITICAL: Stop loading once check is done
    };
    
    initializeAuth();
  }, []);

  const login = (userData) => {
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    disconnectSocket();
  };

  return (
    // By passing setUser here, Profile.jsx can update the "Global" state
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export default AuthContext;