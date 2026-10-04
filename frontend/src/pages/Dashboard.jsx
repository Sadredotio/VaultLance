import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api";
import toast from "react-hot-toast";
import {
  Clock,
  Award,
  Tag,
  Briefcase,
  Target,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Send,
  Search,
  X,
  LayoutGrid,
  List,
  Plus,
  Layers,
  TrendingUp,
  Calendar,
} from "lucide-react";

/* ───────────────────────── Styles & helpers ───────────────────────── */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.dash-root { font-family: 'Manrope', system-ui, sans-serif; }
.dash-grid {
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, black, transparent 70%);
  -webkit-mask-image: linear-gradient(to bottom, black, transparent 70%);
}
@media (prefers-reduced-motion: no-preference) {
  .dash-reveal { animation: dashReveal .7s cubic-bezier(.2,.7,.2,1) both; }
}
@keyframes dashReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
`;

const SURFACE = "rounded-2xl border border-white/[0.08] bg-zinc-900/50";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const GHOST_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

const STATUS = {
  open: { label: "Open", dot: "bg-emerald-400", chip: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
  in_progress: { label: "In progress", dot: "bg-sky-400", chip: "text-sky-300 bg-sky-400/10 ring-sky-400/20" },
  completed: { label: "Completed", dot: "bg-violet-400", chip: "text-violet-300 bg-violet-400/10 ring-violet-400/20" },
  closed: { label: "Closed", dot: "bg-zinc-500", chip: "text-zinc-400 bg-zinc-400/10 ring-zinc-400/20" },
};

const toSkills = (s) =>
  Array.isArray(s)
    ? s
    : typeof s === "string"
    ? s.split(",").map((x) => x.trim()).filter(Boolean)
    : [];

const StatusChip = ({ status }) => {
  const s = STATUS[status] || STATUS.closed;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const SkillChips = ({ skills, max = 3 }) => {
  const list = toSkills(skills);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.slice(0, max).map((skill, idx) => (
        <span key={idx} className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-zinc-300">
          {skill}
        </span>
      ))}
      {list.length > max && (
        <span className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500">+{list.length - max}</span>
      )}
    </div>
  );
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
);

const SkeletonCard = () => (
  <div className={`${SURFACE} p-5 space-y-4`}>
    <div className="flex justify-between">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-6 w-14" />
      <Skeleton className="h-6 w-14" />
    </div>
  </div>
);

/* ───────────────────────── Job card (grid) ───────────────────────── */

const JobCard = ({ job, canDelete, onOpen, onDelete }) => (
  <article
    role="link"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => e.key === "Enter" && onOpen()}
    className={`${SURFACE} group relative flex cursor-pointer flex-col overflow-hidden p-5 transition-colors duration-200 hover:border-amber-300/30 hover:bg-zinc-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}
  >
    <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-amber-400/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

    <div className="relative flex items-start justify-between gap-3">
      <StatusChip status={job.status} />
      <div className="text-right">
        <p className="text-xl font-bold tabular-nums text-white">${job.budget?.toLocaleString()}</p>
        <p className="text-xs text-zinc-500">budget</p>
      </div>
    </div>

    <div className="relative mt-5">
      {job.category && (
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-300/90">
          <Tag size={11} /> {job.category}
        </p>
      )}
      <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white">{job.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">{job.description}</p>
    </div>

    <div className="relative mt-4">
      <SkillChips skills={job.skills} />
    </div>

    <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 mt-5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        {job.timeline && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} /> {job.timeline}
          </span>
        )}
        {job.experienceLevel && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            <Award size={12} /> {job.experienceLevel}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} /> {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg p-2 text-zinc-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
            title="Delete this job"
            aria-label="Delete this job"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <ArrowUpRight className="h-5 w-5 text-zinc-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-300" />
      </div>
    </div>
  </article>
);

/* ───────────────────────── Job row (list view) ───────────────────────── */

const JobRow = ({ job, canDelete, onOpen, onDelete }) => (
  <article
    role="link"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => e.key === "Enter" && onOpen()}
    className={`${SURFACE} group flex cursor-pointer items-center gap-5 px-5 py-4 transition-colors duration-200 hover:border-amber-300/30 hover:bg-zinc-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300`}
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="truncate text-base font-semibold text-white">{job.title}</h3>
        <StatusChip status={job.status} />
      </div>
      <p className="mt-1 truncate text-sm text-zinc-500">
        {[job.category, job.timeline, job.experienceLevel].filter(Boolean).join(" · ") || job.description}
      </p>
    </div>
    <div className="hidden lg:block">
      <SkillChips skills={job.skills} max={3} />
    </div>
    <p className="w-24 text-right text-lg font-bold tabular-nums text-white">${job.budget?.toLocaleString()}</p>
    {canDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded-lg p-2 text-zinc-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
        title="Delete this job"
        aria-label="Delete this job"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )}
    <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-zinc-600 transition group-hover:text-amber-300" />
  </article>
);

/* ───────────────────────── Contract stepper (freelancer) ───────────────────────── */

const STEPS = ["Funding", "Working", "Review"];
const STEP_INDEX = { new: 0, active: 1, submission_pending: 2 };
const STEP_HINT = {
  new: "Waiting for the client to fund this contract.",
  active: "Funded. You can start work now.",
  submission_pending: "Your submission is being reviewed.",
};

const ContractCard = ({ contract, onSubmit, onView }) => {
  const idx = STEP_INDEX[contract.status] ?? 0;
  return (
    <article className={`${SURFACE} flex flex-col gap-5 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">{contract.jobId?.title || "Project"}</h3>
          <p className="mt-1 text-sm text-zinc-500">{STEP_HINT[contract.status]}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums text-amber-300">${contract.amount?.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">your earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => (
          <div key={label}>
            <div className={`h-1 rounded-full ${i <= idx ? "bg-amber-300" : "bg-white/10"}`} />
            <p className={`mt-2 text-xs font-medium ${i === idx ? "text-amber-300" : i < idx ? "text-zinc-300" : "text-zinc-600"}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        {contract.status === "active" && (
          <button onClick={onSubmit} className={`${PRIMARY_BTN} flex-1`}>
            <Send className="h-4 w-4" /> Submit work
          </button>
        )}
        <button onClick={onView} className={`${GHOST_BTN} flex-1`}>
          View contract <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

/* ───────────────────────── Application card (client) ───────────────────────── */

const ApplicationCard = ({ app, onAccept, onReject, onProfile }) => {
  const f = app.freelancer;
  return (
    <article className={`${SURFACE} flex flex-col gap-5 p-5`}>
      <div className="flex items-start gap-4">
        {f.avatar ? (
          <img src={f.avatar} alt={f.name} className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover ring-1 ring-white/10" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-xl font-bold text-amber-300 ring-1 ring-amber-300/20">
            {f.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-semibold text-white">{f.name}</h4>
          <p className="truncate text-sm text-zinc-500">{f.headline || "Professional Freelancer"}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-300/10 px-2.5 py-1 text-sm font-semibold text-amber-300">
          <Star className="h-3.5 w-3.5 fill-amber-300" />
          {f.rating ? f.rating.toFixed(1) : "N/A"}
        </div>
      </div>

      {app.jobId && typeof app.jobId === "object" && app.jobId.title && (
        <p className="text-sm text-zinc-500">
          Applied to <span className="text-zinc-300">{app.jobId.title}</span>
        </p>
      )}

      <SkillChips skills={f.skills} />

      <div className="flex items-end justify-between rounded-xl bg-white/[0.04] p-4">
        <div>
          <p className="text-xs text-zinc-500">Proposed budget</p>
          <p className="text-2xl font-bold tabular-nums text-white">${app.amount}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Experience</p>
          <p className="text-lg font-semibold text-zinc-200">{f.experience ? `${f.experience} yrs` : "—"}</p>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex gap-2">
          <button onClick={onAccept} className={`${PRIMARY_BTN} flex-1`}>
            <CheckCircle2 className="h-4 w-4" /> Hire
          </button>
          <button onClick={onReject} className={`${GHOST_BTN} flex-1 hover:border-red-400/30 hover:text-red-300`}>
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>
        <button onClick={onProfile} className="w-full rounded-lg py-2 text-sm font-medium text-zinc-400 transition hover:text-amber-300">
          View complete profile
        </button>
      </div>
    </article>
  );
};

/* ───────────────────────── Dashboard ───────────────────────── */

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]); // for freelancer
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 Dashboard Debug:", { user, authLoading, loading });
  }, [user, authLoading, loading]);

  // ACCEPT APPLICATION
  const handleAccept = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/accept`);
      toast.success("Application accepted!");
      setApplications((prev) => prev.filter((app) => app._id !== contractId));
    } catch (error) {
      toast.error("Failed to accept application");
    }
  };

  // REJECT APPLICATION
  const handleReject = async (contractId) => {
    try {
      await API.put(`/contracts/${contractId}/reject`);
      toast.success("Application rejected!");
      setApplications((prev) => prev.filter((app) => app._id !== contractId));
    } catch (error) {
      toast.error("Failed to reject application");
    }
  };

  // DELETE JOB (CLIENT ONLY)
  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await API.delete(`/jobs/${jobId}`);
      toast.success("Job deleted successfully!");
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error("Delete Job Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  useEffect(() => {
    if (authLoading) {
      console.log("⏳ Auth still loading...");
      return;
    }

    if (!user) {
      console.warn("❌ No user found, redirecting to login");
      navigate("/login");
      return;
    }

    console.log("✅ User loaded, fetching dashboard data for:", user.email);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get stats based on user role
        if (user.role === "client") {
          const statsRes = await API.get("/jobs/stats");
          setStats(statsRes.data);
        } else if (user.role === "freelancer") {
          const statsRes = await API.get("/contracts/stats/freelancer");
          setStats(statsRes.data);
        }

        const endpoint = user.role === "client" ? "/jobs/myjobs" : "/jobs";
        const jobsRes = await API.get(endpoint);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);

        // ── CLIENT: fetch pending applications ──────────────────────────
        if (user.role === "client") {
          const contractsRes = await API.get("/contracts");

          const pendingApps = contractsRes.data.filter((c) => {
            // clientId may be a populated object OR a plain string ID
            const clientIdStr =
              c.clientId && typeof c.clientId === "object"
                ? c.clientId._id?.toString()
                : c.clientId?.toString();
            return c.status === "pending" && clientIdStr === user._id?.toString();
          });

          const appsWithFreelancers = await Promise.all(
            pendingApps.map(async (app) => {
              // freelancerId is populated by the backend as an object
              if (app.freelancerId && typeof app.freelancerId === "object") {
                return { ...app, freelancer: app.freelancerId };
              }
              // fallback: fetch freelancer data manually
              const freelancerRes = await API.get(`/users/${app.freelancerId}`);
              return { ...app, freelancer: freelancerRes.data };
            })
          );

          setApplications(appsWithFreelancers);
        }

        // ── FREELANCER: fetch accepted/active contracts ──────────────────
        if (user.role === "freelancer") {
          const contractsRes = await API.get("/contracts");

          const myActiveContracts = contractsRes.data.filter((c) => {
            // freelancerId may be a populated object OR a plain string ID
            const freelancerIdStr =
              c.freelancerId && typeof c.freelancerId === "object"
                ? c.freelancerId._id?.toString()
                : c.freelancerId?.toString();
            return (
              freelancerIdStr === user._id?.toString() &&
              ["new", "active", "submission_pending"].includes(c.status)
            );
          });

          setActiveContracts(myActiveContracts);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  /* ── Early states ── */

  if (authLoading) {
    return (
      <div className="dash-root flex h-screen items-center justify-center bg-zinc-950">
        <style>{FONT_CSS}</style>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-300" />
          <p className="font-semibold text-zinc-100">Signing you in...</p>
          <p className="mt-1 text-sm text-zinc-500">This only takes a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dash-root flex h-screen items-center justify-center bg-zinc-950">
        <style>{FONT_CSS}</style>
        <div className={`${SURFACE} max-w-sm px-10 py-12 text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-lg font-bold text-white">You're not signed in</p>
          <p className="mt-2 text-sm text-zinc-500">Redirecting you to the login page...</p>
          <button onClick={() => navigate("/login")} className={`${PRIMARY_BTN} mt-6 w-full`}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="dash-root min-h-screen bg-zinc-950 pb-10 text-zinc-100">
        <style>{FONT_CSS}</style>
        <Navbar />
        <div className="mx-auto mt-10 max-w-3xl px-6">
          <div className={`${SURFACE} border-red-500/20 p-8`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Couldn't load your dashboard</h3>
            </div>
            <p className="mb-4 text-lg text-red-300">{error}</p>
            <div className="mb-6 rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
              <p className="mb-2 text-sm font-semibold text-zinc-300">Diagnostic info</p>
              <div className="space-y-1.5 text-sm text-zinc-400">
                <p>📧 User Email: {user?.email}</p>
                <p>👤 User Role: {user?.role}</p>
                <p>🔐 Token: {user?.token ? "✓ Present" : "✗ Missing"}</p>
                <p>⏰ Timestamp: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className={PRIMARY_BTN}>
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
              <button onClick={() => navigate("/dashboard")} className={GHOST_BTN}>
                <ArrowRight className="h-4 w-4" /> Refresh page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */

  const isClient = user.role === "client";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] || "there";

  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const haystack = [
      job.title,
      job.description,
      job.category,
      job.timeline,
      job.experienceLevel,
      job.status,
      job.budget,
      ...toSkills(job.skills),
    ]
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v))
      .join(" ")
      .toLowerCase()
      .replace(/_/g, " ");
    // every typed word must appear somewhere, in any order
    return matchesStatus && terms.every((t) => haystack.includes(t));
  });

  const distTotal = (stats.open || 0) + (stats.in_progress || 0) + (stats.completed || 0);
  const pct = (n) => (distTotal ? Math.round(((n || 0) / distTotal) * 100) : 0);

  const summary = isClient
    ? `You have ${stats.open} open ${stats.open === 1 ? "job" : "jobs"} and ${applications.length} ${applications.length === 1 ? "application" : "applications"} waiting for review.`
    : `You have ${activeContracts.length} active ${activeContracts.length === 1 ? "contract" : "contracts"} and ${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} to browse.`;

  const segments = [
    { key: "all", label: "All", count: stats.total },
    { key: "open", label: "Open", count: stats.open },
    { key: "in_progress", label: "In progress", count: stats.in_progress },
    { key: "completed", label: "Completed", count: stats.completed },
  ];

  /* ── Main UI ── */

  return (
    <div className="dash-root relative min-h-screen overflow-hidden bg-zinc-950 pb-16 text-zinc-100">
      <style>{FONT_CSS}</style>

      {/* Backdrop: dotted grid + single warm glow */}
      <div className="dash-grid pointer-events-none absolute inset-x-0 top-0 h-[32rem]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

      <Navbar />

      <main className="relative z-10 mx-auto mt-12 max-w-7xl px-6">

        {/* HEADER */}
        <header className="dash-reveal mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
              {isClient ? <Briefcase className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-base text-zinc-400">{loading ? "Fetching your latest activity..." : summary}</p>
          </div>
          {isClient && (
            <button onClick={() => navigate("/create-job")} className={`${PRIMARY_BTN} px-6 py-3`}>
              <Plus className="h-4 w-4" /> Post a job
            </button>
          )}
        </header>

        {/* STATS — bento */}
        <section className="dash-reveal mb-14 grid grid-cols-2 gap-4 md:grid-cols-4" style={{ animationDelay: "80ms" }}>
          <div className={`${SURFACE} col-span-2 p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">{isClient ? "Jobs posted" : "Total contracts"}</p>
                {loading ? (
                  <Skeleton className="mt-3 h-14 w-24" />
                ) : (
                  <p className="mt-2 text-6xl font-extrabold leading-none tabular-nums text-white">{stats.total}</p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Layers className="h-5 w-5 text-zinc-300" />
              </div>
            </div>

            {/* distribution bar */}
            <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="bg-emerald-400 transition-all duration-700" style={{ width: `${pct(stats.open)}%` }} />
              <div className="bg-sky-400 transition-all duration-700" style={{ width: `${pct(stats.in_progress)}%` }} />
              <div className="bg-violet-400 transition-all duration-700" style={{ width: `${pct(stats.completed)}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />{stats.open} open</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" />{stats.in_progress} in progress</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />{stats.completed} completed</span>
            </div>
          </div>

          <button
            onClick={() => isClient && setFilterStatus("open")}
            className={`${SURFACE} p-6 text-left transition hover:border-emerald-400/30 ${isClient ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            {loading ? <Skeleton className="mt-5 h-10 w-14" /> : <p className="mt-5 text-4xl font-extrabold tabular-nums text-white">{stats.open}</p>}
            <p className="mt-1 text-sm text-zinc-400">Open</p>
            <p className="text-xs text-zinc-600">Accepting bids</p>
          </button>

          <button
            onClick={() => isClient && setFilterStatus("in_progress")}
            className={`${SURFACE} p-6 text-left transition hover:border-sky-400/30 ${isClient ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10">
              <TrendingUp className="h-5 w-5 text-sky-400" />
            </div>
            {loading ? <Skeleton className="mt-5 h-10 w-14" /> : <p className="mt-5 text-4xl font-extrabold tabular-nums text-white">{stats.in_progress}</p>}
            <p className="mt-1 text-sm text-zinc-400">In progress</p>
            <p className="text-xs text-zinc-600">Active work</p>
          </button>
        </section>

        {/* ── FREELANCER: ACTIVE CONTRACTS ── */}
        {!isClient && activeContracts.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white">Active contracts</h2>
              <span className="text-sm text-zinc-500">{activeContracts.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activeContracts.map((contract) => (
                <ContractCard
                  key={contract._id}
                  contract={contract}
                  onSubmit={() => navigate(`/submit-work/${contract._id}`)}
                  onView={() => navigate(`/contract-details/${contract._id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── CLIENT: PENDING APPLICATIONS (shown first, they need action) ── */}
        {isClient && applications.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white">New applications</h2>
              <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-bold text-black">{applications.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <ApplicationCard
                  key={app._id}
                  app={app}
                  onAccept={() => handleAccept(app._id)}
                  onReject={() => handleReject(app._id)}
                  onProfile={() =>
                    navigate(
                      `/freelancer-profile/${typeof app.freelancerId === "string" ? app.freelancerId : app.freelancerId._id}`
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* ── JOBS ── */}
        <section>
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isClient ? "Your jobs" : "Browse available jobs"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isClient ? `${stats.total} posted in total` : "Find the right project for your skills"}
            </p>
          </div>

          {/* toolbar */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {isClient ? (
              <div className="inline-flex w-full max-w-full overflow-x-auto rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.08] lg:w-auto">
                {segments.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                      filterStatus === key ? "bg-amber-300 text-black shadow" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {label}
                    <span className={`ml-2 text-xs tabular-nums ${filterStatus === key ? "text-black/60" : "text-zinc-600"}`}>{count}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-72 lg:flex-none">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, skill or category"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-600 transition focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="inline-flex rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
                {[
                  { key: "grid", Icon: LayoutGrid, label: "Grid view" },
                  { key: "list", Icon: List, label: "List view" },
                ].map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    aria-label={label}
                    title={label}
                    className={`rounded-lg p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                      view === key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    canDelete={isClient && job.status === "open"}
                    onOpen={() => navigate(`/job-details/${job._id}`)}
                    onDelete={() => handleDeleteJob(job._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredJobs.map((job) => (
                  <JobRow
                    key={job._id}
                    job={job}
                    canDelete={isClient && job.status === "open"}
                    onOpen={() => navigate(`/job-details/${job._id}`)}
                    onDelete={() => handleDeleteJob(job._id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
                <Inbox className="h-7 w-7 text-zinc-500" />
              </div>
              <p className="text-lg font-semibold text-white">
                {q ? `No jobs match "${query}"` : `No ${filterStatus === "all" ? "" : filterStatus.replace("_", " ") + " "}jobs found`}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                {q
                  ? "Try a different keyword or clear the search."
                  : filterStatus === "all" && isClient
                  ? "Post your first job to start receiving applications."
                  : "Try a different filter."}
              </p>
              {filterStatus === "all" && isClient && !q && (
                <button onClick={() => navigate("/create-job")} className={`${PRIMARY_BTN} mt-6`}>
                  <Plus className="h-4 w-4" /> Post a job
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;