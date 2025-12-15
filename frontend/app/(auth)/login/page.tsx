"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMockLogin = async () => {
    if (!email) {
      alert("Please enter an email");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.mockLogin(email);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data));

      // Redirect based on onboarding status
      if (response.data.onboarding_completed) {
        router.push("/generate");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      alert("Login failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ContentAI</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        <div className="space-y-6">
          {/* LinkedIn Login Button (Visual Only) */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6 border-blue-600 text-blue-600 hover:bg-blue-50"
            disabled
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Continue with LinkedIn (Coming Soon)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or for development</span>
            </div>
          </div>

          {/* Mock Login */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleMockLogin()}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleMockLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Mock Login (Dev Only)"}
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  );
}


