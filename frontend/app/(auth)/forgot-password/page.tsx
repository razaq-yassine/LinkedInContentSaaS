"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { ArrowLeft, Brain, KeyRound, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (error: any) {
      setError(error.detail || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 mb-6">
              If an account exists with <strong className="text-white">{email}</strong>, we've sent a password reset link. Please check your inbox.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="text-violet-400 hover:underline"
              >
                try again
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,1),rgba(2,6,23,1))]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_50%)]" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/login">
          <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Button>
        </Link>
      </div>
      
      <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">ContentAI</span>
          </Link>
          
          <div className="w-14 h-14 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-6 px-4 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>

          <Button 
            className="w-full py-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-violet-500/25" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-sm text-center text-slate-400 mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
