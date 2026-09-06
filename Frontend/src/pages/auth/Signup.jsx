import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, ArrowLeft, Eye, EyeOff,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { EMAIL_REGEX } from "../../utils/validation";
import { getSavedLanguage, saveLanguage, LANGUAGE_OPTIONS, SIGNUP_TRANSLATIONS } from "../../utils/authLanguage";

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
    { label: "Good", color: "bg-emerald-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

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
const TOTAL_STEPS = 2;

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState(getSavedLanguage());
  const t = SIGNUP_TRANSLATIONS[lang];
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
        errs.email = t.emailRequired;
      else if (!EMAIL_REGEX.test(formData.email.trim()))
        errs.email = t.emailInvalid;
    }
    if (s === 2) {
      if (!formData.name.trim())
        errs.name = t.nameRequired;
      else if (formData.name.trim().length < 2)
        errs.name = t.nameMinLength;

      const rawPhone = formData.phone.trim();
      if (!rawPhone) {
        errs.phone = t.phoneRequired;
      } else if (!/^\d{7,12}$/.test(rawPhone.replace(/[\s-]/g, ""))) {
        errs.phone = t.phoneInvalid;
      }

      if (!formData.password) {
        errs.password = t.passwordRequired;
      } else if (formData.password.length < 8) {
        errs.password = t.passwordMinLength;
      } else if (!/[A-Z]/.test(formData.password)) {
        errs.password = t.passwordUppercase;
      } else if (!/[0-9]/.test(formData.password)) {
        errs.password = t.passwordNumber;
      }

      if (!formData.confirmPassword) {
        errs.confirmPassword = t.confirmPasswordRequired;
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = t.passwordsDoNotMatch;
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

    // Final submit — step 2
    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        name: formData.name.trim(),
        phone: formData.countryCode + " " + formData.phone.trim(),
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2800);
    } catch (err) {
      setApiError(err.message || t.signupFailed);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Left panel content ─────────────────────────────── */
  const leftContent = {
    title: t.leftTitle,
    tagline: t.leftTagline,
    features: t.leftFeatures,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">

      {/* ─── LEFT PANEL — Dark branded product panel ─── */}
      <div className="hidden md:flex md:w-[42%] lg:w-[44%] bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex-col justify-between p-10 lg:p-14 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            DealFlow<span className="text-white/50">360</span>
          </span>
        </div>

        {/* Product pitch */}
        <div className="py-10 space-y-8">
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
        </div>

        <p className="text-[11px] text-white/25">
          © 2026 DealFlow360 · Odoo Hackathon Edition
        </p>
      </div>

      {/* ─── RIGHT PANEL — Signup form ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24 max-w-xl mx-auto w-full">

        {/* Mobile brand */}
        <div className="flex items-center gap-2 mb-6 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            DealFlow<span className="text-emerald-600">360</span>
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
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? "bg-emerald-600" : "bg-slate-200"
              } ${i === step - 1 ? "w-8" : "w-5"}`}
            />
          ))}
          <span className="text-[11px] text-slate-400 ml-1 font-medium">
            {t.step} {step} {t.of} {TOTAL_STEPS}
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
            <span>{t.back}</span>
          </button>
        )}

        {/* ── Success state ── */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.accountCreated}</h2>
            <p className="text-sm text-slate-500 max-w-xs">
              {t.welcome}{" "}
              <strong className="text-slate-800">{formData.name || "there"}</strong>!{" "}
              {t.redirecting}
            </p>
          </div>
        ) : (
          <>
            {/* ── STEP 1: Email ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{t.yourWorkEmail}</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {t.emailHint}
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
                      ${errors.email ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500"}`}
                  />
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow"
                  >
                    {t.continueBtn}
                  </button>
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  {t.alreadyHaveAccount}{" "}
                  <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                    {t.signIn}
                  </Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: Account details ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{t.createYourAccount}</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {t.alreadyHaveAccount}{" "}
                    <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                      {t.signIn}
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

                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    autoFocus
                    placeholder="Jane Doe"
                    onChange={(e) => setField("name", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                      ${errors.name ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500"}`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Phone with country code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.phoneNumber} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setField("countryCode", e.target.value)}
                      className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shrink-0"
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
                        ${errors.phone ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500"}`}
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
                    {t.password} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      placeholder={t.passwordPlaceholder}
                      onChange={(e) => setField("password", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.password ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500"}`}
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
                        strength.score === 3 ? "text-emerald-500" : "text-emerald-500"
                      }`}>
                        {t.strength[strength.label.toLowerCase()] || strength.label}
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
                    {t.confirmPassword} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      placeholder={t.confirmPlaceholder}
                      onChange={(e) => setField("confirmPassword", e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition
                        ${errors.confirmPassword ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500"}`}
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
                  {t.legalPrefix}{" "}
                  <button type="button" className="text-emerald-600 hover:underline font-medium">
                    {t.privacy}
                  </button>{" "}
                  {t.legalAnd}{" "}
                  <button type="button" className="text-emerald-600 hover:underline font-medium">
                    {t.terms}
                  </button>
                  {t.legalSuffix}
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
                      {t.creatingAccount}
                    </>
                  ) : (
                    t.createAccount
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