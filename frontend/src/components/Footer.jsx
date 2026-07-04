import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Github, Linkedin, Twitter, Instagram,
  Mail, ArrowUpRight,
} from 'lucide-react';
import ContactModal from './ContactModal';

/**
 * Global Footer
 * Drop this at the bottom of any page (e.g. Home, Dashboard, etc.)
 * Visually distinct from page body via a dark background + top accent bar.
 */
const Footer = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className="relative bg-gray-950 text-gray-300">
      {/* Top accent bar — separates footer from page body */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">

        {/* ── Top grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">

          {/* Brand column */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <img
                src="/logo.png"
                alt="VaultLance"
                className="h-10 w-10 rounded-full object-cover border-2 border-white/10 shadow-md"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                VaultLance
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-5">
              The freelancing platform where every contract is protected.
              Clients fund upfront, freelancers get paid the moment work is approved —
              no chasing invoices, no risk.
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon href="https://github.com/sadredotio" label="GitHub"><Github className="w-4 h-4" /></SocialIcon>
              <SocialIcon href="https://www.linkedin.com/in/md-sadre-alam-80602129a/" label="LinkedIn"><Linkedin className="w-4 h-4" /></SocialIcon>
              <SocialIcon href="https://x.com/md_sadre7797" label="Twitter"><Twitter className="w-4 h-4" /></SocialIcon>
              <SocialIcon href="https://instagram.com/sadredotio" label="Instagram"><Instagram className="w-4 h-4" /></SocialIcon>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Platform</h4>
            <FooterLink to="/dashboard">Find Jobs</FooterLink>
            <FooterLink to="/create-job">Post a Job</FooterLink>
            <FooterLink to="/wallet">Wallet</FooterLink>
            <FooterLink to="/disputes">Disputes</FooterLink>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Company</h4>
            <FooterLink to="/">About</FooterLink>
            <FooterLink to="/login">Log In</FooterLink>
            <FooterLink to="/register">Sign Up</FooterLink>
          </div>

          {/* Help & Support links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Help & Support</h4>
            <FooterLink to="/faq">FAQs</FooterLink>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm py-1.5 group"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} VaultLance. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Every contract secured by VaultLance
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm py-1.5 group"
  >
    {children}
    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
  </Link>
);

const SocialIcon = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all"
  >
    {children}
  </a>
);

export default Footer;