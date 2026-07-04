import { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Footer from "../components/Footer";
import {
  ShieldCheck,
  Wallet,
  Handshake,
  Search,
  FileCheck2,
  Lock,
  ArrowRight,
  Briefcase,
  Star,
  CheckCircle2,
  Quote,
} from "lucide-react";

const Home = () => {
  const { user, loading } = useContext(AuthContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ───────── TOP NAV ───────── */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
      <nav className="shadow-sm border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="VaultLance"
              className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
            />
            <span className="text-xl font-bold text-gray-900">VaultLance</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-40 -left-24 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 mb-6">
              <Lock className="w-4 h-4" /> Secure Vault-Backed Payments
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 max-w-3xl leading-tight">
              Freelance work, paid with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                zero payment risk
              </span>
            </h1>

            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mt-6">
              Clients fund every contract upfront. Freelancers get paid the
              moment work is approved. No chasing invoices, no disappearing
              clients — just Vault-protected freelancing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                Post a Job <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="bg-white text-gray-800 font-bold px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition flex items-center justify-center gap-2"
              >
                Find Freelance Work <Briefcase className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-gray-400 text-sm mt-6">
              Free to join · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ───────── TRUST STRIP ───────── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-gray-900">100%</p>
            <p className="text-gray-500 text-sm font-medium mt-1">Vault Protected</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">0%</p>
            <p className="text-gray-500 text-sm font-medium mt-1">Risk of Non-Payment</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">24/7</p>
            <p className="text-gray-500 text-sm font-medium mt-1">Dispute Support</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">Instant</p>
            <p className="text-gray-500 text-sm font-medium mt-1">Wallet Payouts</p>
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">
            How VaultLance Works
          </h2>
          <p className="text-gray-600 text-lg mt-3 max-w-xl mx-auto">
            A simple, transparent flow that protects both sides of every deal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              icon: <Briefcase className="w-7 h-7 text-blue-600" />,
              title: "Post a Job",
              desc: "Clients describe the work and set a budget. Funds are locked in the Vault immediately.",
              bg: "bg-blue-50",
            },
            {
              icon: <Search className="w-7 h-7 text-emerald-600" />,
              title: "Get Matched",
              desc: "Freelancers apply with their proposed rate. Clients review profiles and hire with one click.",
              bg: "bg-emerald-50",
            },
            {
              icon: <FileCheck2 className="w-7 h-7 text-purple-600" />,
              title: "Work & Submit",
              desc: "The freelancer delivers the work and submits it for review — no payment ambiguity.",
              bg: "bg-purple-50",
            },
            {
              icon: <Wallet className="w-7 h-7 text-orange-600" />,
              title: "Get Paid Instantly",
              desc: "Once approved, funds release straight to the freelancer's wallet. Any unused Vault balance returns to the client.",
              bg: "bg-orange-50",
            },
          ].map((step, idx) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative"
            >
              <div className={`w-14 h-14 rounded-xl ${step.bg} flex items-center justify-center mb-5`}>
                {step.icon}
              </div>
              <span className="absolute top-6 right-6 text-3xl font-black text-gray-100">
                {idx + 1}
              </span>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── WHY THE VAULT ───────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
              Built on trust, secured by VaultLance
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Every contract on the platform runs through a secure Vault wallet
              system. Money never moves on promises — it moves on milestones.
            </p>

            <div className="space-y-5">
              {[
                "Client funds are held safely in the Vault until work is approved",
                "Freelancers see funded contracts before they start working",
                "Unused budget is automatically refunded to clients",
                "Built-in dispute resolution if something goes wrong",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">VaultLance Wallet</p>
                <p className="text-gray-500 text-sm">Contract #4821</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-gray-600 text-sm">Job Budget</span>
                <span className="font-bold text-gray-900">$1,200</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
                <span className="text-blue-700 text-sm font-medium">In Vault</span>
                <span className="font-bold text-blue-700">$1,200</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-100">
                <span className="text-emerald-700 text-sm font-medium">Status</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Approved & Released
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-gray-500 text-sm ml-2">
                "Paid the moment I submitted my work."
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOR CLIENTS / FOR FREELANCERS ───────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-10 text-white relative overflow-hidden">
          <Handshake className="w-10 h-10 mb-6 opacity-90" />
          <h3 className="text-2xl font-black mb-3">For Clients</h3>
          <p className="text-blue-100 mb-6 leading-relaxed">
            Post jobs, review applicants, and only pay for work you've approved.
            Your budget stays protected in the Vault the whole time.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Post Your First Job <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-10 text-white relative overflow-hidden">
          <Briefcase className="w-10 h-10 mb-6 opacity-90" />
          <h3 className="text-2xl font-black mb-3">For Freelancers</h3>
          <p className="text-emerald-100 mb-6 leading-relaxed">
            Apply to funded jobs with confidence. Submit your work and get paid
            straight to your wallet the moment it's approved.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-lg hover:bg-emerald-50 transition"
          >
            Find Work Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ───────── FOUNDER ───────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Meet the Founder
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <img
                src="/founder.jpg"
                alt="Md Sadre Alam"
                className="w-32 h-32 rounded-full object-cover shadow-lg ring-4 ring-blue-100"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 items-center justify-center text-white text-4xl font-black shadow-lg ring-4 ring-blue-100"
                style={{ display: "none" }}
              >
                SA
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <Quote className="w-8 h-8 text-blue-200 mb-3 mx-auto md:mx-0" />
              <p className="text-gray-700 text-lg leading-relaxed mb-5">
                "I built VaultLance because I kept seeing the same problem in
                freelancing — clients worried about paying upfront, and
                freelancers worried about getting paid at all. The Vault fixes
                that for both sides. This platform is my attempt at making
                freelance work feel as safe as it should be."
              </p>
              <p className="font-bold text-gray-900 text-lg">Md Sadre Alam</p>
              <p className="text-blue-600 font-medium text-sm">
                Founder & Developer, VaultLance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to work without the risk?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join VaultLance today — it only takes a minute to get started.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            Create Your Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;