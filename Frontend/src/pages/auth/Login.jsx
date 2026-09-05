import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye, EyeOff, Zap, ArrowRight, CheckCircle2,
  ShoppingCart, BarChart3, ShieldCheck, AlertCircle
} from "lucide-react";
import { useAuth, ROLES, ROLE_REDIRECTS, ROLE_LABELS } from "../../context/AuthContext";
import { EMAIL_REGEX } from "../../utils/validation";
import { getSavedLanguage, saveLanguage, LANGUAGE_OPTIONS, LOGIN_TRANSLATIONS } from "../../utils/authLanguage";

const ROLE_OPTIONS = [
  {
    id: ROLES.CUSTOMER,
    label: "Customer",
    icon: ShoppingCart,
    hint: "View & negotiate your quotations",
    color: "blue",
  },
  {
    id: ROLES.SALES_EXECUTIVE,
    label: "Sales Executive",
    icon: BarChart3,
    hint: "Manage proposals & pipeline",
    color: "purple",
  },
  {
    id: ROLES.ADMIN,
    label: "Admin",
    icon: ShieldCheck,
    hint: "Full platform visibility & control",
    color: "emerald",
  },
];

const DEMO_CREDENTIALS = {
  [ROLES.CUSTOMER]: { email: "rohan@acme-corp.com", password: "Customer@123" },
  [ROLES.SALES_EXECUTIVE]: { email: "aarav@dealflow360.com", password: "Sales@123" },
  [ROLES.ADMIN]: { email: "admin@dealflow360.com", password: "Admin@123" },
};

export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  // If already logged in, redirect to user's home workspace
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_REDIRECTS[role] || "/portal", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const [selectedRole, setSelectedRole] = useState(ROLES.CUSTOMER);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState(getSavedLanguage());
  const t = LOGIN_TRANSLATIONS[lang];

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = t.emailRequired;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = t.emailInvalid;
    }
    if (!password) {
      errs.password = t.passwordRequired;
    } else if (password.length < 6) {
      errs.password = t.passwordMinLength;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const user = await login({ email: email.trim(), password, selectedRole });
      navigate(ROLE_REDIRECTS[user.role] || "/portal", { replace: true });
    } catch (err) {
      setApiError(err.message || t.signInFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    const creds = DEMO_CREDENTIALS[selectedRole];
    setEmail(creds.email);
    setPassword(creds.password);
    setErrors({});
    setApiError("");
  };

  const roleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole);
  const colorMap = {
    blue: "from-blue-700 to-blue-900",
    purple: "from-purple-700 to-purple-900",
    emerald: "from-emerald-700 to-emerald-900",
  };
  const panelGradient = colorMap[roleConfig?.color] || colorMap.blue;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">

      {/* ─── LEFT PANEL — Dark product description ─── */}
      <div
        className={`hidden md:flex md:w-[42%] lg:w-[45%] bg-gradient-to-br ${panelGradient} text-white flex-col justify-between p-10 lg:p-14 transition-all duration-500 shrink-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            DealFlow<span className="text-white/70">360</span>
          </span>
        </div>

        {/* Product pitch */}
        <div className="space-y-6 py-10">
          <div className="text-xs font-bold tracking-widest uppercase text-white/50">
            {t.rolePortal[selectedRole] || `${roleConfig?.label} Portal`}
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            {t.pitchTitle}<br />
            <span className="text-white/70">{t.pitchHighlight}</span>
          </h2>
          <p className="text-sm text-white/70 leading-relaxed max-w-xs">
            {t.pitch}
          </p>
          <ul className="space-y-3 pt-2">
            {t.features.map((feat) => (
              <li key={feat} className="flex items-start gap-3 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-white/30">
          © 2026 DealFlow360 · Odoo Hackathon Edition
        </p>
      </div>

      {/* ─── RIGHT PANEL — Sign In form ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24 max-w-xl mx-auto w-full">

        {/* Mobile brand */}
        <div className="flex items-center gap-2 mb-8 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
        </div>

        {/* Language selector */}
        <div className="flex justify-end mb-4">
          <select
            value={lang}
            aria-label="Language"
            onChange={(e) => {
              setLang(e.target.value);
              saveLanguage(e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.signIn}
          </h1>
          <p className="text-sm text-slate-500">
            {t.subtitle}
          </p>
        </div>

        {/* Role selector tabs */}
        {/* <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1 mb-7">
          {ROLE_OPTIONS.map((r) => {
            const Icon = r.icon;
            const isActive = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  setErrors({});
                  setApiError("");
                  setEmail("");
                  setPassword("");
                }}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="hidden sm:block">{r.label}</span>
              </button>
            );
          })}
        </div> */}

        {/* Demo credentials helper */}
        {/* <button
          type="button"
          onClick={fillDemo}
          className="mb-5 w-full text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl py-2.5 px-4 font-medium hover:bg-blue-100 transition text-left flex items-center justify-between"
        >
          <span>
            🔑 Use demo credentials for{" "}
            <strong>{ROLE_LABELS[selectedRole] || "Customer"}</strong>
          </span>
          <span className="text-blue-400">Auto-fill →</span>
        </button> */}

        {/* API Error */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs mb-5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {t.workEmail} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              placeholder="you@yourcompany.com"
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: null }));
              }}
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                ${errors.email
                  ? "border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"
                }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                {t.password} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline font-medium"
                onClick={() => {/* TODO: forgot password flow */}}
              >
                {t.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                placeholder="••••••••"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: null }));
                }}
                className={`w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                  ${errors.password
                    ? "border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    : "border-slate-200 focus:ring-2 focus:ring-blue-50 focus:border-blue-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:pointer-events-none mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t.signingIn}
              </>
            ) : (
              <>
                {t.signIn}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-xs text-slate-500 mt-8">
          {t.dontHaveAccount}{" "}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            {t.createOneFree}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
