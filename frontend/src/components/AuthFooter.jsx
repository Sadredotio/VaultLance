import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";

const AuthFooter = () => {
  return (
    <footer className="relative z-10 w-full">
      <div className="max-w-6xl mx-auto px-4 pb-6 pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white/80 transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white/80 transition">
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> support@vaultlance.com
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Bengaluru, India
            </span>
          </div>

          <p>© {new Date().getFullYear()} VaultLance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;