"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dataParam = searchParams.get("data");
    const errorParam = searchParams.get("error");
    
    // Check for error first
    if (errorParam) {
      router.push(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }
    
    if (dataParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(dataParam));
        
        // Store token and user data
        localStorage.setItem("token", userData.access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Redirect based on onboarding status
        if (userData.onboarding_completed) {
          router.push("/generate");
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Failed to parse login callback data:", error);
        router.push("/login?error=Authentication%20failed.%20Please%20try%20again.");
      }
    } else {
      router.push("/login?error=Authentication%20failed.%20Please%20try%20again.");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <p className="text-xl font-semibold text-slate-800">Completing LinkedIn login...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
