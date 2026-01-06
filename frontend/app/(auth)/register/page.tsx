"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { ArrowLeft, Brain, Check, Zap, Sparkles, FileText, Mail, CreditCard } from "lucide-react";
import axios from "axios";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

const freePlanBenefits = [
  { icon: Sparkles, text: "5 AI-generated posts per month" },
  { icon: Zap, text: "Basic voice analysis" },
  { icon: FileText, text: "Text posts included" },
  { icon: Mail, text: "Email support" },
  { icon: CreditCard, text: "No credit card required" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [appName, setAppName] = useState("ContentAI");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
        );
        const data = response.data;
        const isMaintenanceMode = data.maintenance_mode === 'true' || data.maintenance_mode === true;
        setMaintenanceMode(isMaintenanceMode);
        setMaintenanceMessage(data.maintenance_message || '');
        setAppName(data.app_name || 'ContentAI');
        setRegistrationEnabled(data.registration_enabled !== 'false' && data.registration_enabled !== false);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("one lowercase letter");
    if (!/\d/.test(pwd)) errors.push("one digit");
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain ${passwordErrors.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      await api.auth.register(email, password, name || undefined);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          setError(error.detail.map((e: any) => e.msg).join(", "));
        } else {
          setError(error.detail);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show maintenance page if maintenance mode is active
  if (maintenanceMode) {
    return <MaintenanceBanner message={maintenanceMessage} variant="fullpage" />;
  }

  // Show registration disabled page
  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
        <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl relative z-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Registration Closed</h1>
          <p className="text-slate-400 mb-6">New user registration is currently disabled. Please check back later or contact support.</p>
          <Link href="/login">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 mb-6">
              We've sent a verification link to <strong className="text-white">{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={async () => {
                  try {
                    await api.auth.resendVerification(email);
                    alert("Verification email sent!");
                  } catch (e: any) {
                    alert(e.detail || "Failed to resend email");
                  }
                }}
                className="text-violet-400 hover:underline"
              >
                click here to resend
              </button>
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-950 via-teal-950 to-slate-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.3),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.2),transparent_50%)]" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">ContentAI</span>
          </Link>
          
          {/* Main content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                <span>Free Plan - No Credit Card</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Start for{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">free today</span>
              </h1>
              <p className="text-xl text-cyan-200/70">
                Get started with our Free plan and experience AI-powered content creation.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-cyan-300/80 font-medium uppercase tracking-wider">What&apos;s included:</p>
              {freePlanBenefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-400/30 rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <span className="text-cyan-100/80">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "10x", label: "Faster creation" },
              { value: "2K+", label: "Active users" },
              { value: "95%", label: "Voice accuracy" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-cyan-300/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
        
        {/* Back Button */}
        <div className="p-6 relative z-10">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Button>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  ContentAI
                </span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-slate-400">
                Start generating AI-powered LinkedIn content today
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="py-5 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="py-5 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="py-5 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
                <p className="text-xs text-slate-500">
                  Must be at least 8 characters with uppercase, lowercase, and a number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="py-5 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <Button 
                className="w-full py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-cyan-500/25" 
                type="submit" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Sign in
              </Link>
            </p>

            <p className="text-xs text-center text-slate-600">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
