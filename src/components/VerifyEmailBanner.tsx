import { useState } from "react";
import { AlertCircle, Mail, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "../context/SessionContext";

interface VerifyEmailBannerProps {
  onClose?: () => void;
}

export default function VerifyEmailBanner({ onClose }: VerifyEmailBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const session = useSession();

  const handleVerify = () => {
    const code = otpValues.join("");
    if (code.length < 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      session.setEmailVerified(true);
      toast.success("Email verified successfully!");
      setShowModal(false);
      onClose?.();
    }, 1000);
  };

  const sendOtp = () => {
    setShowModal(true);
    toast.info("Verification code sent to your email.");
  };

  return (
    <>
      {/* Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Email verification required</p>
            <p className="text-xs text-amber-700">Please verify your email to request help and access all features.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={sendOtp}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Verify Now
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OTP Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verify your email</h3>
                <p className="text-xs text-gray-500 mt-1">We sent a 6-digit code to <strong>{session.email}</strong></p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

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
                      const next = document.getElementById(`verify-otp-${i + 1}`);
                      next?.focus();
                    }
                  }}
                  id={`verify-otp-${i}`}
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-[#1e3a5f] focus:outline-none transition-colors"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#1e3a5f" }}
            >
              {loading ? <span className="animate-spin rounded-full border-2 border-white border-t-transparent w-4 h-4" /> : <Check className="w-4 h-4" />}
              Verify Email
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              Didn't receive it?{" "}
              <button onClick={() => toast.info("New OTP sent to your email.")} className="text-[#0d9488] font-medium hover:underline">Resend OTP</button>
            </p>
          </div>
        </>
      )}
    </>
  );
}
