import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, ArrowRight, CheckCircle2, ChevronRight,
  ShoppingCart, BarChart3, ShieldCheck, Users,
  FileText, MessageSquare, TrendingUp, Star
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: ShoppingCart,
    color: "blue",
    title: "Customer Portal",
    desc: "Customers log in to view live quotations, negotiate pricing, submit counter-offers, and confirm orders — without a single email.",
    role: "For: Procurement Teams",
  },
  {
    icon: BarChart3,
    color: "purple",
    title: "Sales Executive Workspace",
    desc: "Manage all proposals in one place. Track deal stage, apply discounts, route for approval, and see exactly where every quotation stands.",
    role: "For: Account Executives",
  },
  {
    icon: ShieldCheck,
    color: "emerald",
    title: "Admin & Finance Control",
    desc: "Configure discount governance rules, approval tiers, user roles, and audit every commercial decision with an immutable log.",
    role: "For: Finance & Management",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Quotation Created",
    desc: "Sales executive builds a pricing proposal and sends it to the customer.",
  },
  {
    step: "02",
    title: "Customer Negotiates",
    desc: "Customer reviews terms, submits a counter-offer with discount justification.",
  },
  {
    step: "03",
    title: "Approve & Confirm",
    desc: "Finance or manager approves the discount. Customer confirms. Order is auto-generated.",
  },
];

const STATS = [
  { value: "3×", label: "Faster deal closure" },
  { value: "40%", label: "Less back-and-forth email" },
  { value: "100%", label: "Audit trail on every discount" },
  { value: "3", label: "Role-based portal access" },
];

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    pill: "bg-blue-100 text-blue-700",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    pill: "bg-purple-100 text-purple-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    pill: "bg-emerald-100 text-emerald-700",
  },
};

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const roleRedirects = { customer: "/portal", sales_executive: "/sales", admin: "/admin" };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(roleRedirects[role] || "/portal", { replace: true });
    }
  }, [isAuthenticated, role]);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 lg:px-16 bg-white/90 backdrop-blur border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="pt-36 pb-20 px-6 md:px-10 lg:px-16 text-center relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Hackathon badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
            Odoo Hackathon 2026 — B2B Sales Platform
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Close Better Deals.{" "}
            <span className="text-blue-600">Faster.</span>{" "}
            <span className="text-slate-500">Together.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            DealFlow360 is a connected B2B commerce platform that unifies{" "}
            <strong className="text-slate-800">customer quotation negotiation</strong>,{" "}
            <strong className="text-slate-800">discount approval governance</strong>, and{" "}
            <strong className="text-slate-800">order management</strong> in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-sm font-semibold rounded-xl shadow-sm transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────── */}
      <section className="py-14 px-6 border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLE FEATURE CARDS ───────────────────────── */}
      <section className="py-20 px-6 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-600">
              Three Portals. One Platform.
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for every role in your deal cycle
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Each role gets a dedicated, tailored workspace — no information overload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const c = colorMap[f.color];
              return (
                <div
                  key={f.title}
                  className={`p-7 rounded-2xl border ${c.border} ${c.bg} hover:shadow-lg transition-all group`}
                >
                  <div className={`inline-flex p-3 rounded-xl ${c.bg} border ${c.border} mb-5`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${c.pill}`}>
                    {f.role}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  <Link
                    to="/signup"
                    className={`inline-flex items-center gap-1.5 mt-5 text-xs font-semibold ${c.text} hover:underline`}
                  >
                    Get started <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 lg:px-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-400">
              The Deal Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How DealFlow360 works
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              From quotation creation to confirmed order in 3 structured steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative p-7 bg-white/5 border border-white/10 rounded-2xl">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-6 text-white/20 z-10">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
                <span className="text-4xl font-extrabold text-white/15">{step.step}</span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
            >
              Start for Free — No Credit Card <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">
              DealFlow360 <span className="text-slate-400 font-normal">· Odoo Hackathon 2026</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link to="/login" className="hover:text-slate-800 transition">Sign In</Link>
            <Link to="/signup" className="hover:text-slate-800 transition">Sign Up</Link>
            <a
              href="https://github.com/Mudit-tyagi-dev/Odoo_Hackathon2026"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-slate-800 transition"
            >
               <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.286-.01-1.04-.015-2.04-3.338.724-4.042-1.608-4.042-1.608-.543-1.38-1.328-1.746-1.328-1.746-1.083-.744.082-.729.082-.729 1.204.085 1.838 1.24 1.838 1.24 1.066 1.835 2.803 1.306 3.49.999.108-.776.416-1.306.757-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.466-2.38 1.235-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.007-.322 3.3 1.23.957-.266 1.984-.398 3.01-.403 1.024.005 2.052.137 3.01.403 2.28-1.552 3.287-1.23 3.287-1.23.655 1.653.243 2.873.118 3.176.77.84 1.233 1.911 1.233 3.22 0 4.61-2.805 5.624-5.475 5.92.43.37.81 1.103.81 2.22 0 1.606-.015 2.896-.015 3.289 0 .322.216.698.825.578C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z"/></svg>

            </a>
          </div>
          <p className="text-xs text-slate-400">© 2026 DealFlow360 Team. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
