"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Header, 
  Hero, 
  Features, 
  HowItWorks, 
  Testimonials, 
  CTA, 
  Footer 
} from "@/components/landing";

function LandingPageContent() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Safety: always show landing page after 2s (prevents stuck loading if JS/API fails)
    const fallbackTimer = setTimeout(() => setIsChecking(false), 2000);

    // Check if running in PWA standalone mode
    const isStandalone = 
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       (window.navigator as any).standalone === true ||
       document.referrer.includes('android-app://'));

    if (isStandalone) {
      // Check if user is logged in
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Redirect to dashboard or onboarding based on status
          if (user.onboarding_completed) {
            router.replace("/generate");
          } else {
            router.replace("/onboarding");
          }
        } catch (error) {
          // If user data is invalid, redirect to login
          router.replace("/login");
        }
      } else {
        // Not logged in, redirect to login
        router.replace("/login");
      }
      clearTimeout(fallbackTimer);
    } else {
      // Not in standalone mode, show landing page
      clearTimeout(fallbackTimer);
      setIsChecking(false);
    }

    return () => clearTimeout(fallbackTimer);
  }, [router]);

  // Show loading state while checking (prevents flash of landing page in PWA)
  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return <LandingPageContent />;
}
