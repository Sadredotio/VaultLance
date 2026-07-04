import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          toast.error("Authentication failed");
          return navigate("/login");
        }

        localStorage.setItem("token", token);

        API.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        const { data } = await API.get("/users/me");

        login({
          ...data,
          token,
        });

        toast.success("Logged in successfully!");

        navigate("/dashboard");
      } catch (err) {
        console.error(err);

        toast.error("Authentication failed");

        navigate("/login");
      }
    };

    authenticate();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="animate-spin text-5xl mb-4">⟳</div>
        <h2 className="text-2xl font-bold">
          Signing you in...
        </h2>
      </div>
    </div>
  );
};

export default OAuthSuccess;