import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import {
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is VaultLance?",
        a: "VaultLance is a freelancing platform where every contract is protected by a secure Vault. Clients fund jobs upfront, and freelancers get paid the moment their work is approved — no chasing invoices, no payment risk on either side.",
      },
      {
        q: "Is it free to join?",
        a: "Yes. Creating an account as a client or freelancer is completely free, and there's no credit card required to sign up.",
      },
      {
        q: "Do I need to be a freelancer or a client to join?",
        a: "Neither is required exclusively — during sign up you'll choose whether you want to hire (client) or find work (freelancer). You can always reach out to support if you need your account type changed later.",
      },
    ],
  },
  {
    category: "The Vault & Payments",
    questions: [
      {
        q: "What exactly is the Vault?",
        a: "The Vault is where a client's payment is held the moment a job starts. It isn't sent to the freelancer immediately, and the client can't pull it back either — it simply waits safely until the work is reviewed and approved.",
      },
      {
        q: "When does the freelancer actually get paid?",
        a: "The instant a client approves submitted work, funds are released from the Vault straight to the freelancer's wallet. There's no waiting period on our end.",
      },
      {
        q: "What happens to unused budget?",
        a: "If the final cost of a job is less than the amount originally locked in the Vault, the difference is automatically refunded to the client once the contract is closed.",
      },
      {
        q: "Are there any fees?",
        a: "VaultLance charges a small platform fee on completed contracts to cover payment processing and dispute support. The exact fee is shown before you confirm any job or proposal.",
      },
    ],
  },
  {
    category: "Disputes & Support",
    questions: [
      {
        q: "What if a client or freelancer doesn't deliver as agreed?",
        a: "Either side can open a dispute directly from the contract page. Our support team reviews the submitted work, messages, and contract terms to help both sides reach a fair resolution.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payment data is processed through encrypted, industry-standard channels, and VaultLance never stores raw card details on its own servers.",
      },
      {
        q: "How can I contact support?",
        a: "You can reach our team any time at support@vaultlance.com, or use the contact form linked in the footer of this page.",
      },
    ],
  },
];

const FAQItem = ({ item, isOpen, onClick }) => {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-blue-200 transition-colors">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded-2xl"
      >
        <span className="font-bold text-gray-900 text-base md:text-lg">
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 text-blue-600 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-gray-600 text-sm md:text-base leading-relaxed">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [openKey, setOpenKey] = useState("Getting Started-0");
  const [isContactOpen, setIsContactOpen] = useState(false);

  const toggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

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

        <div className="max-w-4xl mx-auto px-6 pt-16 pb-14 relative text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 mb-6">
            <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
          </span>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            Questions? We've got{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              answers
            </span>
          </h1>
          <p className="text-gray-600 text-lg mt-5 max-w-xl mx-auto">
            Everything you need to know about how VaultLance keeps your work
            and payments safe.
          </p>
        </div>
      </section>

      {/* ───────── FAQ LIST ───────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        {faqData.map((group) => (
          <div key={group.category} className="mb-12 last:mb-0">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 mb-4">
              {group.category}
            </h2>
            <div className="space-y-4">
              {group.questions.map((item, idx) => {
                const key = `${group.category}-${idx}`;
                return (
                  <FAQItem
                    key={key}
                    item={item}
                    isOpen={openKey === key}
                    onClick={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Still have questions CTA */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-10 text-center text-white">
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-black mb-2">Still have questions?</h3>
          <p className="text-blue-100 mb-6">
            Our support team is happy to help with anything not covered here.
          </p>
          <button
            type="button"
            onClick={() => setIsContactOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Contact Support
          </button>
        </div>
      </section>

      <Footer />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};

export default FAQ;