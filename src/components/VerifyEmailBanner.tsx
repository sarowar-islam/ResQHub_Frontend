import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "../context/SessionContext";

interface VerifyEmailBannerProps {
  onClose?: () => void;
}

export default function VerifyEmailBanner({ onClose }: VerifyEmailBannerProps) {
  const session = useSession();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await session.resendConfirmation(session.email);
      toast.success(`Confirmation email sent to ${session.email}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Email verification required</p>
          <p className="text-xs text-amber-700">Open the confirmation link sent to {session.email} to request help and access all features.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={resend} disabled={sending} className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60">
          {sending ? "Sending…" : "Resend email"}
        </button>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center text-amber-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
