import { Link } from "react-router-dom";

/**
 * Lightweight header for auth flows (Login, Register, Forgot/Reset Password).
 * NOT sticky/absolute — sits naturally in normal document flow so it never
 * interferes with each page's own min-h-screen centering layout.
 */
const AuthHeader = () => {
  return (
    <div className="shrink-0">
      {/* Brand accent bar — same treatment as the main Navbar/Footer */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />

      <header className="h-14 flex items-center bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl w-full mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 hover:opacity-90 transition"
          >
            <img
              src="/logo.png"
              alt="VaultLance"
              className="h-8 w-8 rounded-full object-cover border-2 border-white/20 shadow-sm"
            />
            <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              VaultLance
            </span>
          </Link>
        </div>
      </header>
    </div>
  );
};

export default AuthHeader;