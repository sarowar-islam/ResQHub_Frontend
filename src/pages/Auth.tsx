import { useState, useEffect } from "react";
import {
  Shield, Eye, EyeOff, ArrowLeft, Check, Heart,
  Building2, User, Mail, Phone, Lock, AlertCircle, CheckCircle,
  BriefcaseBusiness
} from "lucide-react";
import { toast } from "sonner";
import { useSession, type UserRole } from "../context/SessionContext";
import { useUserLocation } from "../context/LocationContext";
import { db } from "../context/DataContext";

type AuthMode = "login" | "signup" | "forgot" | "confirm" | "reset";
export type { UserRole };

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
  const session = useSession();
  const userLocation = useUserLocation();
  const [mode, setMode] = useState<AuthMode>(session.recovering ? "reset" : initialMode);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setRole(defaultRole); }, [defaultRole]);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => { if (session.recovering) setMode("reset"); }, [session.recovering]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode !== "reset") {
      if (!email) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    }
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    if (mode === "signup" || mode === "reset") {
      if (mode === "signup" && !name.trim()) e.name = "Full name is required";
      if (mode === "signup" && phone && !/^\+?[\d\s-]{7,15}$/.test(phone.trim())) e.phone = "Enter a valid phone number";
      if (!confirmPassword) e.confirmPassword = "Please confirm your password";
      else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await session.signIn(email.trim(), password);
        toast.success("Welcome back! Loading your dashboard…");
      } else if (mode === "signup") {
        const { needsConfirmation } = await session.signUp({
          email: email.trim(), password, name: name.trim(), phone: phone.trim(), role,
          lat: userLocation.location?.lat, lng: userLocation.location?.lng, locationLabel: userLocation.location?.label,
        });
        if (needsConfirmation) setMode("confirm");
        else toast.success("Account created! Loading your dashboard…");
      } else if (mode === "reset") {
        await session.updatePassword(password);
        toast.success("Password updated. You're signed in.");
        setPassword(""); setConfirmPassword("");
      }
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      if (mode === "login") setErrors({ password: msg });
      else if (mode === "signup" && /exist|registered/i.test(msg)) setErrors({ email: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrors({ email: "Email required" }); return; }
    setLoading(true);
    try {
      await session.sendPasswordReset(email.trim());
      toast.success("Password reset link sent to your email.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await session.resendConfirmation(email.trim());
      toast.success("Confirmation email sent again.");
    } catch (err: any) {
      toast.error(err.message);
    }
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
            Volunteers, NGOs and people in need coordinating support through ResQHub.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Victims Helped", value: db.stats.victimsHelped.toLocaleString() },
            { label: "Registered Volunteers", value: db.stats.registeredVolunteers.toLocaleString() },
            { label: "Active Requests", value: db.stats.activeRequests.toLocaleString() },
            { label: "Partner NGOs", value: db.stats.partnerNGOs.toLocaleString() },
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
          {session.authNotice && mode !== "confirm" && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {session.authNotice}
            </div>
          )}

          {/* Confirm your email */}
          {mode === "confirm" && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#0f1b2d] text-center mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Check your inbox</h2>
              <p className="text-sm text-gray-500 text-center mb-7">We sent a confirmation link to <strong>{email}</strong>. Open it, then sign in.</p>
              <button onClick={() => setMode("login")} className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 mb-3" style={{ background: "#1e3a5f" }}>
                <Check className="w-4 h-4" /> I've confirmed, sign in
              </button>
              <p className="text-xs text-center text-gray-400 mt-4">
                Didn't receive it?{" "}
                <button onClick={resend} className="text-[#0d9488] font-medium hover:underline">Resend email</button>
              </p>
            </div>
          )}

          {/* Set new password (after clicking the reset link) */}
          {mode === "reset" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-2xl font-extrabold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Choose a new password</h2>
              <p className="text-sm text-gray-500 mb-2">Enter a new password for your account.</p>
              <div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password"
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:border-[#1e3a5f] ${errors.password ? "border-red-400" : "border-gray-200"}`} />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                <PasswordStrength password={password} />
              </div>
              <div>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:border-[#1e3a5f] ${errors.confirmPassword ? "border-red-400" : "border-gray-200"}`} />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: "#1e3a5f" }}>
                {loading ? "Saving…" : "Update password"}
              </button>
            </form>
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

              {mode === "signup" && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-[#0f1b2d] mb-2">I am registering as a…</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.victim][]).map(([r, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (signup) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: "" })); }}
                        placeholder="Your full name"
                        className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.name ? "border-red-400" : "border-gray-200"}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: "" })); }}
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.email ? "border-red-400" : "border-gray-200"}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>

                {/* Phone (signup, optional) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">
                      Phone Number <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel" value={phone} onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: "" })); }}
                        placeholder="+880 17XXXXXXXX"
                        className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.phone ? "border-red-400" : "border-gray-200"}`}
                      />
                    </div>
                    {errors.phone
                      ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>
                      : <p className="text-[10px] text-gray-400 mt-1">You can add or update this later in your profile.</p>
                    }
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

                {/* Confirm password (signup) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all ${errors.confirmPassword ? "border-red-400" : "border-gray-200"}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                  </div>
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
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); setConfirmPassword(""); setShowConfirmPass(false); }}
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
