import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, ArrowLeft, ArrowRight, Check, Eye, EyeOff,
  CheckCircle2, AlertCircle, ShoppingCart, BarChart3, ShieldCheck
} from "lucide-react";
import { useAuth, ROLES } from "../../context/AuthContext";
import { EMAIL_REGEX, PHONE_REGEX } from "../../utils/validation";

/* ── Password strength scorer ─────────────────────────── */
function getPasswordStrength(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: "", color: "" };
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

/* ── Role cards for step 3 ─────────────────────────────── */
const ROLE_CARDS = [
  {
    id: ROLES.CUSTOMER,
    label: "Customer",
    icon: ShoppingCart,
    description: "View & negotiate your quotations, confirm orders, and manage billing",
    color: "blue",
  },
  {
    id: ROLES.SALES_EXECUTIVE,
    label: "Sales Executive",
    icon: BarChart3,
    description: "Manage proposals, submit counter-offers, and track deal pipelines",
    color: "purple",
  },
  {
    id: ROLES.ADMIN,
    label: "Admin",
    icon: ShieldCheck,
    description: "Full visibility: manage users, discounts, audit logs, and reports",
    color: "emerald",
  },
];

const ROLE_RING = {
  blue: "border-blue-500 bg-blue-50",
  purple: "border-purple-500 bg-purple-50",
  emerald: "border-emerald-500 bg-emerald-50",
};

const ICON_COLORS = {
  blue: "text-blue-600 bg-blue-100",
  purple: "text-purple-600 bg-purple-100",
  emerald: "text-emerald-600 bg-emerald-100",
};

/* ── Country codes ──────────────────────────────────────── */
const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: "IN" },
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+44", flag: "🇬🇧", label: "GB" },
  { code: "+61", flag: "🇦🇺", label: "AU" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
  { code: "+65", flag: "🇸🇬", label: "SG" },
];

/* ── Total steps ────────────────────────────────────────── */
const TOTAL_STEPS = 4;

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Steps: 1=email, 2=company, 3=role, 4=details
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    role: "",
    firstName: "",
    lastName: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(formData.password);
  const setField = (key, val) => {
    setFormData((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: null }));
    setApiError("");
  };

  /* ── Per-step validators ─────────────────────────────── */
  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!formData.email.trim())
        errs.email = "Work email is required.";
      else if (!EMAIL_REGEX.test(formData.email.trim()))
        errs.email = "Enter a valid work email address.";
    }
    if (s === 2) {
      if (!formData.companyName.trim())
        errs.companyName = "Company / firm name is required.";
      else if (formData.companyName.trim().length < 3)
        errs.companyName = "Name must be at least 3 characters.";
    }
    if (s === 3) {
      if (!formData.role) errs.role = "Please select your role to continue.";
    }
    if (s === 4) {
      if (!formData.firstName.trim()) errs.firstName = "First name is required.";
      if (!formData.lastName.trim()) errs.lastName = "Last name is required.";
      const rawPhone = formData.phone.trim();
      if (!rawPhone) {
        errs.phone = "Phone number is required.";
      } else if (!/^\d{7,12}$/.test(rawPhone.replace(/[\s-]/g, ""))) {
        errs.phone = "Enter a valid phone number (7-12 digits).";
      }
      if (!formData.password) {
        errs.password = "Password is required.";
      } else if (formData.password.length < 8) {
        errs.password = "Password must be at least 8 characters.";
      } else if (!/[A-Z]/.test(formData.password)) {
        errs.password = "Password must contain at least one uppercase letter.";
      } else if (!/[0-9]/.test(formData.password)) {
        errs.password = "Password must contain at least one number.";
      }
      if (!formData.confirmPassword) {
        errs.confirmPassword = "Please confirm your password.";
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = "Passwords do not match.";
      }
    }
    return errs;
  };

  const handleNext = async () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep((p) => p + 1);
      return;
    }

    // Final submit — step 4
    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        companyName: formData.companyName,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.countryCode + formData.phone,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2800);
    } catch (err) {
      setApiError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Left panel content based on step ───────────────── */
  const leftContent = {
    title: "Stop losing deals to slow approvals.",
    tagline: "Start negotiating. Start winning.",
    features: [
      "Real-time counter-offers between customer & sales",
      "Multi-level approval engine with governance rules",
      "Customer self-service portal with live pricing",
    ],
  };

  const selectedRoleCard = ROLE_CARDS.find((r) => r.id === formData.role);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">

      {/* ─── LEFT PANEL — Dark branded product panel ─── */}
      <div className="hidden md:flex md:w-[42%] lg:w-[44%] bg-slate-900 text-white flex-col justify-between p-10 lg:p-14 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            DealFlow<span className="text-white/50">360</span>
          </span>
        </div>

        {/* Role-aware content card (matching Balancia left panel) */}
        <div className="py-10 space-y-8">
          {step === 3 && selectedRoleCard ? (
            <div className="space-y-5">
              <div
                className={`inline-flex p-3 rounded-2xl ${ICON_COLORS[selectedRoleCard.color]}`}
              >
                <selectedRoleCard.icon className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold leading-tight">
                {selectedRoleCard.label} Portal
              </h2>
              <p className="text-base text-white/70 leading-relaxed">
                {selectedRoleCard.description}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                <div className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">
                  DealFlow360
                </div>
                <h2 className="text-2xl font-extrabold leading-tight mb-2">
                  {leftContent.title}
                </h2>
                <p className="text-sm text-white/60 leading-relaxed mb-5">
                  {leftContent.tagline}
                </p>
                <ul className="space-y-3">
                  {leftContent.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                      <CheckCircle2 className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-white/25">
          © 2026 DealFlow360 · Odoo Hackathon Edition
        </p>
      </div>

      {/* ─── RIGHT PANEL — Signup form ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24 max-w-xl mx-auto w-full">

        {/* Mobile brand */}
        <div className="flex items-center gap-2 mb-6 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="text-lg font-extrabold text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? "bg-blue-600" : "bg-slate-200"
              } ${i === step - 1 ? "w-8" : "w-5"}`}
            />
          ))}
          <span className="text-[11px] text-slate-400 ml-1 font-medium">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Back arrow */}
        {step > 1 && !success && (
          <button
            type="button"
            onClick={() => { setStep((p) => p - 1); setErrors({}); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        {/* ── Success state ── */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Account created!</h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Welcome to DealFlow360,{" "}
              <strong className="text-slate-800">{formData.firstName}</strong>! Redirecting
              to sign in...
            </p>
          </div>
        ) : (
          <>
            {/* ── STEP 1: Email ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Your work email</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    If your company already uses DealFlow360, we'll connect you automatically.
                  </p>
                </div>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={formData.email}
                    autoFocus
                    placeholder="you@yourcompany.com"
                    onChange={(e) => setField("email", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    className={`flex-1 px-4 py-3 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                      ${errors.email ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                  />
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow"
                  >
                    Continue
                  </button>
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: Company name ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Your firm name</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    This becomes your organisation's identity in DealFlow360. Must be unique.
                  </p>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.companyName}
                    autoFocus
                    placeholder="e.g. Acme Corporation"
                    onChange={(e) => setField("companyName", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    className={`flex-1 px-4 py-3 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                      ${errors.companyName ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                  />
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow"
                  >
                    Continue
                  </button>
                </div>
                {errors.companyName && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.companyName}
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 3: Role selection ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Select your role</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    This determines your dashboard and access permissions within DealFlow360.
                  </p>
                </div>
                <div className="space-y-3">
                  {ROLE_CARDS.map((rc) => {
                    const Icon = rc.icon;
                    const isSelected = formData.role === rc.id;
                    return (
                      <button
                        key={rc.id}
                        type="button"
                        onClick={() => setField("role", rc.id)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? ROLE_RING[rc.color]
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${ICON_COLORS[rc.color]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">
                              {rc.label}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {rc.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.role && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.role}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ── STEP 4: Full details form ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* First & Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      placeholder="First Name"
                      autoFocus
                      onChange={(e) => setField("firstName", e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.firstName ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                    />
                    {errors.firstName && (
                      <p className="text-[11px] text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      placeholder="Last Name"
                      onChange={(e) => setField("lastName", e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.lastName ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                    />
                    {errors.lastName && (
                      <p className="text-[11px] text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Company name (read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Firm Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    readOnly
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                  />
                </div>

                {/* Phone with country code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setField("countryCode", e.target.value)}
                      className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 cursor-pointer shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      placeholder="98765 43210"
                      onChange={(e) =>
                        setField("phone", e.target.value.replace(/[^\d\s-]/g, ""))
                      }
                      className={`flex-1 px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.phone ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      placeholder="Min 8 chars, uppercase, number"
                      onChange={(e) => setField("password", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.password ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {formData.password && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              strength.score >= n ? strength.color : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[11px] font-medium ${
                        strength.score <= 1 ? "text-red-500" :
                        strength.score === 2 ? "text-amber-500" :
                        strength.score === 3 ? "text-blue-500" : "text-emerald-500"
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      placeholder="Re-enter password"
                      onChange={(e) => setField("confirmPassword", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.confirmPassword ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Legal consent */}
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  By signing up, I agree to the Company's{" "}
                  <button type="button" className="text-blue-600 hover:underline font-medium">
                    Privacy Statement
                  </button>{" "}
                  and{" "}
                  <button type="button" className="text-blue-600 hover:underline font-medium">
                    Terms of Service
                  </button>
                </p>

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
