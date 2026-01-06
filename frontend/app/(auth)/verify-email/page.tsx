"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { Mail, Clock, ArrowLeft } from "lucide-react";

export default function VerifyEmailPage() {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [status, setStatus] = useState<"loading" | "idle" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill email from URL parameter
  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [emailParam]);

  // Auto-verify with token if present
  useEffect(() => {
    if (token) {
      const verifyEmail = async () => {
        try {
          const response = await api.auth.verifyEmail(token);
          setStatus("success");
          setMessage(response.data.message || "Email verified successfully!");
        } catch (error: any) {
          setStatus("error");
          setMessage(error.detail || "Verification failed. The link may be expired or invalid.");
          setMode("manual"); // Switch to manual mode on error
        }
      };
      verifyEmail();
    } else {
      setMode("manual");
      setStatus("idle");
    }
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (mode === "manual" && status === "idle" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, status, timeLeft]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setCode(newCode);
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      setMessage("Please enter all 6 digits");
      return;
    }

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setStatus("loading");
    try {
      const response = await api.auth.verifyEmailCode(email, verificationCode);
      setStatus("success");
      setMessage(response.data.message || "Email verified successfully!");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.detail || "Invalid verification code. Please try again.");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("Please enter your email address first");
      return;
    }

    setResendLoading(true);
    try {
      await api.auth.resendVerification(email);
      setMessage("Verification code sent! Check your email.");
      setTimeLeft(900); // Reset timer
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.detail || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl relative z-10">
        <div className="text-center">
          {/* Success State */}
          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <Link href="/login">
                <Button className="w-full py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-semibold">
                  Sign In to Your Account
                </Button>
              </Link>
            </>
          )}

          {/* Auto-verify Loading State */}
          {status === "loading" && mode === "auto" && (
            <>
              <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
              <p className="text-slate-400">Please wait while we verify your email address.</p>
            </>
          )}

          {/* Manual Code Entry */}
          {mode === "manual" && status !== "success" && (
            <>
              <Link href="/register">
                <Button variant="ghost" className="absolute top-4 left-4 gap-2 text-slate-400 hover:text-white hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>

              <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
              <p className="text-slate-400 mb-6">
                Enter the 6-digit code we sent to your email
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="py-5 px-4 rounded-xl bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Verification Code</Label>
                  <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-slate-800 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500"
                      />
                    ))}
                  </div>
                </div>

                {timeLeft > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Code expires in {formatTime(timeLeft)}</span>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-xl text-sm ${
                    status === "error" 
                      ? "bg-red-500/10 border border-red-500/20 text-red-400" 
                      : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                  }`}>
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-semibold"
                >
                  {status === "loading" ? "Verifying..." : "Verify Email"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">Didn't receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                  >
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Error state for auto-verify */}
          {status === "error" && mode === "auto" && (
            <>
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <p className="text-sm text-slate-500 mb-4">
                You can still verify using the code sent to your email
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
