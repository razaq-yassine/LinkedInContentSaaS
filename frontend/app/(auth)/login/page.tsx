"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { ArrowLeft, Brain, Check, Wrench } from "lucide-react";
import axios from "axios";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

const benefits = [
  "AI that learns your unique voice",
  "Generate posts 10x faster",
  "Trusted by 2,000+ creators",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mockEmail, setMockEmail] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [error, setError] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [appName, setAppName] = useState("PostInAi");
  const router = useRouter();

  useEffect(() => {
    // Check maintenance mode and app settings
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
        );
        const data = response.data;
        const isMaintenanceMode = data.maintenance_mode === 'true' || data.maintenance_mode === true;
        setMaintenanceMode(isMaintenanceMode);
        setMaintenanceMessage(data.maintenance_message || '');
        setAppName(data.app_name || 'PostInAi');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.onboarding_completed) {
        router.push("/generate");
      } else {
        router.push("/onboarding");
      }
    }
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.auth.login(email, password);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data));

      if (response.data.onboarding_completed) {
        router.push("/generate");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      setError(error.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setLinkedInLoading(true);
    setError("");
    try {
      const response = await api.auth.linkedInLogin();
      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      setError("Failed to initiate LinkedIn login: " + (error.detail || error.message || "Unknown error"));
      setLinkedInLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const response = await api.auth.googleLogin();
      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      setError(error.detail || "Google login is not configured");
      setGoogleLoading(false);
    }
  };

  const handleMockLogin = async () => {
    if (!mockEmail) {
      setError("Please enter an email");
      return;
    }

    setMockLoading(true);
    setError("");
    try {
      const response = await api.auth.mockLogin(mockEmail);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data));

      if (response.data.onboarding_completed) {
        router.push("/generate");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      setError(error.detail || error.message || "Login failed");
    } finally {
      setMockLoading(false);
    }
  };

  // Show maintenance page if maintenance mode is active
  if (maintenanceMode) {
    return <MaintenanceBanner message={maintenanceMessage} variant="fullpage" />;
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
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">PostInAi</span>
          </Link>
          
          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Welcome back to{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">PostInAi</span>
              </h1>
              <p className="text-xl text-cyan-200/70">
                Continue creating AI-powered content that sounds like you.
              </p>
            </div>
            
            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-cyan-500/30 border border-cyan-400/30 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-cyan-100/80">{benefit}</span>
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 relative overflow-hidden">
        {/* Subtle background for right side */}
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
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  PostInAi
                </span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-slate-400">
                Sign in to continue creating AI-powered content
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 py-6 border-2 border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5]/10 rounded-xl font-medium transition-all"
                  onClick={handleLinkedInLogin}
                  disabled={linkedInLoading}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {linkedInLoading ? "Connecting..." : "Continue with LinkedIn"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 py-6 border-2 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl font-medium transition-all"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-950 px-4 text-slate-500">or continue with email</span>
                </div>
              </div>

              {/* Email/Password Login */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-6 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-6 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>

                <Button 
                  className="w-full py-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-violet-500/25" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Create free account
                </Link>
              </p>

              {/* Dev Mode Section */}
              <div className="pt-6 border-t border-slate-800">
                <p className="text-xs text-center text-slate-600 mb-4">Development Mode</p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleMockLogin()}
                    className="py-5 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                  <Button
                    variant="outline"
                    className="w-full py-5 rounded-xl text-sm border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                    onClick={handleMockLogin}
                    disabled={mockLoading}
                  >
                    {mockLoading ? "Signing in..." : "Quick Login (Dev Only)"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-center text-slate-600">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-violet-400 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


