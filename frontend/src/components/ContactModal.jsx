import { useState } from "react";
import toast from "react-hot-toast";
import { X, Mail, Send, User, MessageSquare } from "lucide-react";

/**
 * ContactModal
 * A lightweight modal with a support query form.
 * Controlled from the parent via `isOpen` and `onClose`.
 *
 * Wire `handleSubmit` up to your real API endpoint
 * (e.g. API.post('/support/contact', formData)) when ready —
 * it currently simulates a submit so the UI is ready to use immediately.
 */
const ContactModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!message.trim()) {
      newErrors.message = "Please describe your query";
    } else if (message.trim().length < 10) {
      newErrors.message = "Please add a few more details (min 10 characters)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO: replace with your real endpoint, e.g.:
      // await API.post('/support/contact', { name, email, message });
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success("Your message has been sent! We'll get back to you soon.", {
        icon: "✅",
        style: {
          background: "#10b981",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
          padding: "16px",
        },
      });

      handleClose();
    } catch (error) {
      toast.error("Something went wrong. Please try again.", {
        icon: "❌",
        style: {
          background: "#ef4444",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
          padding: "16px",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="contact-modal-title"
                className="text-lg font-black text-gray-900"
              >
                Contact Support
              </h2>
              <p className="text-gray-500 text-xs">
                We usually reply within 24 hours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close contact form"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label
              htmlFor="contact-name"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
            >
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="contact-name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.name
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="contact-email"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="contact-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs font-medium">{errors.email}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label
              htmlFor="contact-message"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
            >
              Your Query
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <textarea
                id="contact-message"
                rows={4}
                placeholder="Tell us what you need help with..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors({ ...errors, message: "" });
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                  errors.message
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              />
            </div>
            {errors.message && (
              <p className="text-red-500 text-xs font-medium">
                {errors.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Submit Query</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;