import { useState, useEffect } from "react";
import {
  Shield, Eye, EyeOff, ArrowLeft, Check, Heart,
  Building2, User, Mail, Phone, Lock, AlertCircle, CheckCircle,
  BriefcaseBusiness
} from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "signup" | "forgot" | "otp";
export type UserRole = "victim" | "volunteer" | "ngo" | "admin";

const DEMO_ACCOUNTS: Record<UserRole, { label: string; email: string; password: string; hint: string }> = {
  victim: { label: "Victim Portal", email: "victim@resqhub.demo", password: "Victim@123", hint: "Role: Needs help" },
  volunteer: { label: "Volunteer Portal", email: "volunteer@resqhub.demo", password: "Volunteer@123", hint: "Role: Community volunteer" },
  ngo: { label: "NGO Portal", email: "ngo@resqhub.demo", password: "Ngo@123456", hint: "Role: Relief organization" },
  admin: { label: "Admin Portal", email: "admin@resqhub.demo", password: "Admin@123456", hint: "Role: System admin" },
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-teal-500", "bg-green-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-500">{labels[score] && <span className={`font-medium ${score <= 1 ? "text-red-500" : score === 2 ? "text-orange-500" : score === 3 ? "text-yellow-600" : "text-green-600"}`}>{labels[score]}</span>} password</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1">
            <CheckCircle className={`w-3 h-3 ${c.pass ? "text-green-500" : "text-gray-300"}`} />
            <span className={`text-[10px] ${c.pass ? "text-green-600" : "text-gray-400"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AuthProps {
  initialMode?: AuthMode;
  defaultRole?: UserRole;
  onNavigate: (v: string) => void;
}

export default function Auth({ initialMode = "login", defaultRole = "victim", onNavigate }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [signupMethod, setSignupMethod] = useState<"google" | "email" | "phone">("google");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (signupMethod === "email" || mode === "login") {
      if (!email) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    }
    if (signupMethod === "phone" && mode === "signup") {
      if (!phone) e.phone = "Phone number is required";
    }
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    if (mode === "signup") {
      if (!name) e.name = "Full name is required";
      if (signupMethod !== "google" && !phone) e.phone = "Phone number is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === "login") {
      const demoAccount = DEMO_ACCOUNTS[role];
      if (email.toLowerCase() !== demoAccount.email || password !== demoAccount.password) {
        setErrors({
          email: "Use the demo credentials shown below.",
          password: "Use the demo credentials shown below.",
        });
        toast.error(`Invalid login for ${demoAccount.label}. Use the demo credentials below.`);
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "login") {
        toast.success("Welcome back! Redirecting to your dashboard…");
        setTimeout(() => onNavigate(role), 800);
      } else if (mode === "signup") {
        setMode("otp");
        toast.info("OTP sent to your phone number.");
      }
    }, 1200);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrors({ email: "Email required" }); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Password reset link sent to your email.");
      setMode("login");
    }, 1000);
  };

  const handleOtpSubmit = () => {
    const code = otpValues.join("");
    if (code.length < 6) { toast.error("Please enter all 6 digits."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Account verified! Welcome to ResQHub.");
      onNavigate(role);
    }, 1000);
  };

  const roleConfig = {
    victim:    { icon: User,            label: "I Need Help",      desc: "Disaster-affected individual",  color: "#dc2626" },
    volunteer: { icon: Heart,           label: "I Want to Help",   desc: "Register as a volunteer",        color: "#0d9488" },
    ngo:       { icon: Building2,       label: "Organization",     desc: "NGO or relief organization",     color: "#1e3a5f" },
    admin:     { icon: BriefcaseBusiness, label: "Admin Access",    desc: "Operations and oversight",       color: "#7c3aed" },
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f4f8" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-10" style={{ background: "#1e3a5f" }}>
        <div>
          <button onClick={() => onNavigate("landing")} className="flex items-center gap-2 text-blue-300 hover:text-white text-sm transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" /> Back to ResQHub
          </button>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ResQHub</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Emergency help<br />
            <span style={{ color: "#0d9488" }}>starts here.</span>
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Join 12,000+ volunteers and 89 NGOs already coordinating support through ResQHub.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Victims Helped", value: "48,250+" },
            { label: "Active Volunteers", value: "12,847" },
            { label: "Response Time", value: "< 2.4h" },
            { label: "Partner NGOs", value: "89" },
          ].map(s => (
            <div key={s.label} className="bg-white/8 rounded-xl p-4">
              <p className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
              <p className="text-xs text-blue-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Mobile back button */}
        <button onClick={() => onNavigate("landing")} className="lg:hidden self-start mb-6 flex items-center gap-2 text-gray-500 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="w-full max-w-md">
          {/* OTP Screen */}
          {mode === "otp" && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#0f1b2d] text-center mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verify your number</h2>
              <p className="text-sm text-gray-500 text-center mb-7">We sent a 6-digit code to <strong>{phone || "+880 XXXXXXXXXX"}</strong></p>
              <div className="flex gap-3 justify-center mb-6">
                {otpValues.map((v, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={v}
                    onChange={e => {
                      const newVal = [...otpValues];
                      newVal[i] = e.target.value.replace(/\D/, "");
                      setOtpValues(newVal);
                      if (e.target.value && i < 5) {
                        const next = document.getElementById(`otp-${i + 1}`);
                        next?.focus();
                      }
                    }}
                    id={`otp-${i}`}
                    className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-[#1e3a5f] focus:outline-none transition-colors"
                  />
                ))}
              </div>
              <button
                onClick={handleOtpSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "#1e3a5f" }}
              >
                {loading ? <span className="animate-spin rounded-full border-2 border-white border-t-transparent w-4 h-4" /> : <Check className="w-4 h-4" />}
                Verify & Continue
              </button>
              <p className="text-xs text-center text-gray-400 mt-4">
                Didn't receive it?{" "}
                <button onClick={() => toast.info("New OTP sent.")} className="text-[#0d9488] font-medium hover:underline">Resend OTP</button>
              </p>
            </div>
          )}

          {/* Forgot Password */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot}>
              <h2 className="text-2xl font-extrabold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reset password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send a reset link.</p>
              <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Email address</label>
              <div className="relative mb-5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.email ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60" style={{ background: "#1e3a5f" }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button type="button" onClick={() => setMode("login")} className="w-full mt-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </form>
          )}

          {/* Login / Signup */}
          {(mode === "login" || mode === "signup") && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {mode === "login"
                  ? "Sign in to access your ResQHub portal."
                  : "Join ResQHub and start making a difference today."}
              </p>

              {(mode === "login" || mode === "signup") && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-[#0f1b2d] mb-2">{mode === "login" ? "Continue as…" : "I am registering as a…"}</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.victim][]).map(([r, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r);
                            const demoAccount = DEMO_ACCOUNTS[r];
                            if (mode === "login") {
                              setEmail(demoAccount.email);
                              setPassword(demoAccount.password);
                            }
                          }}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all ${isActive ? "border-2" : "border-gray-200 hover:border-gray-300"}`}
                          style={isActive ? { borderColor: cfg.color, background: cfg.color + "10" } : {}}
                        >
                          <Icon className="w-4 h-4" style={{ color: isActive ? cfg.color : "#6b7280" }} />
                          <span className="text-[10px] font-bold" style={{ color: isActive ? cfg.color : "#374151" }}>{cfg.label}</span>
                          <span className="text-[8px] text-gray-400 leading-tight">{cfg.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="mb-5 rounded-2xl border border-[#dffaf6] bg-[#f0fdfb] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488] mb-2">Demo credentials</p>
                  <div className="space-y-2 text-[11px] text-slate-600">
                    {(Object.entries(DEMO_ACCOUNTS) as [UserRole, typeof DEMO_ACCOUNTS.victim][]).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setRole(key);
                          setEmail(item.email);
                          setPassword(item.password);
                        }}
                        className="w-full text-left rounded-xl bg-white px-2.5 py-2 border border-[#d7f5ee] hover:border-[#0d9488] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#0f1b2d]">{item.label}</span>
                          <span className="text-[10px] text-[#0d9488]">Use</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">{item.email} / {item.password}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Social login (placeholder) */}
              <div className="flex gap-3 mb-5">
                {["Google", "Facebook"].map(provider => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => toast.info(`${provider} login coming soon.`)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold">{provider[0]}</span>
                    {provider}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (signup) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Mohammad Rafiqul Islam"
                        className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.name ? "border-red-400" : "border-gray-200"}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                {(signupMethod === "email" || mode === "login") && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.email ? "border-red-400" : "border-gray-200"}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                  </div>
                )}

                {/* Phone */}
                {(mode === "signup" && (signupMethod === "phone" || signupMethod === "email")) && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+880 17XXXXXXXX"
                        className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.phone ? "border-red-400" : "border-gray-200"}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                  </div>
                )}

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#0f1b2d]">Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-xs text-[#0d9488] hover:underline">Forgot password?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.password ? "border-red-400" : "border-gray-200"}`}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                  {mode === "signup" && <PasswordStrength password={password} />}
                </div>

                {/* Remember me */}
                {mode === "login" && (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setRemember(v => !v)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${remember ? "border-[#1e3a5f] bg-[#1e3a5f]" : "border-gray-300"}`}
                    >
                      {remember && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-gray-600">Remember me for 30 days</span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                  style={{ background: "#1e3a5f" }}
                >
                  {loading
                    ? <span className="animate-spin rounded-full border-2 border-white border-t-transparent w-4 h-4" />
                    : mode === "login" ? "Sign In to ResQHub" : "Create Account"
                  }
                </button>
              </form>

              <p className="text-xs text-center text-gray-500 mt-5">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
                  className="font-semibold text-[#0d9488] hover:underline"
                >
                  {mode === "login" ? "Create one free" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
