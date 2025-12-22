"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Step1AccountType from "@/components/wizard/Step1AccountType";
import Step2StyleChoice from "@/components/wizard/Step2StyleChoice";
import Step3ImportPosts from "@/components/wizard/Step3ImportPosts";
import Step4UploadCV from "@/components/wizard/Step4UploadCV";
import Step5Preview from "@/components/wizard/Step5Preview";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [accountType, setAccountType] = useState("");
  const [styleChoice, setStyleChoice] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // Restore profile data from localStorage if on step 5
    const savedProfileData = localStorage.getItem("onboarding_profile_data");
    if (savedProfileData && step === 5) {
      try {
        setProfileData(JSON.parse(savedProfileData));
      } catch (error) {
        console.error("Failed to restore profile data:", error);
      }
    }
  }, [step]);

  useEffect(() => {
    // Check onboarding state on mount
    const checkOnboardingState = async () => {
      try {
        const stateResponse = await api.onboarding.state();
        const state = stateResponse.data;
        
        console.log("Onboarding state:", state);
        
        // If user has already processed profile data, resume at preview step
        if (state.has_processed_profile && state.profile_data) {
          console.log("Resuming from preview step with saved profile data");
          setProfileData(state.profile_data);
          setStep(5);
        } else if (state.current_step > 1) {
          // Resume from saved step
          console.log(`Resuming from step ${state.current_step}`);
          setStep(state.current_step);
        }
      } catch (error) {
        console.error("Failed to fetch onboarding state:", error);
      } finally {
        setInitializing(false);
      }
    };
    
    checkOnboardingState();
    
    // Check if returning from LinkedIn OAuth
    const linkedInConnected = searchParams.get("linkedin_connected");
    const postsParam = searchParams.get("posts");
    
    if (linkedInConnected === "true" && postsParam) {
      try {
        const decodedPosts = JSON.parse(decodeURIComponent(postsParam));
        if (Array.isArray(decodedPosts) && decodedPosts.length > 0) {
          // Store posts in sessionStorage for Step3ImportPosts to pick up
          sessionStorage.setItem("linkedin_imported_posts", JSON.stringify(decodedPosts));
          
          // Clean URL
          window.history.replaceState({}, "", "/onboarding");
        }
      } catch (error) {
        console.error("Failed to parse LinkedIn posts from URL:", error);
      }
    }
  }, [searchParams]);

  const handleStep1 = (type: string) => {
    setAccountType(type);
    setStep(2);
  };

  const handleStep2 = async (choice: string) => {
    setStyleChoice(choice);
    // Always go to CV upload (Step 3)
    setStep(3);
  };

  const handleStep3 = async (file: File) => {
    setCvFile(file);
    // Always go to posts import step after CV upload
    setStep(4);
  };

  const handleStep4 = async (importedPosts: string[]) => {
    setPosts(importedPosts);
    // Process CV and posts, then go to preview
    await handleProcessing(cvFile!, importedPosts);
  };

  const handleBackFromStep4 = () => {
    setStep(3); // Back to CV upload
  };

  const handleBackFromStep5 = () => {
    setStep(4); // Back to posts import
  };

  const handleProcessing = async (file: File, importedPosts: string[]) => {
    setLoading(true);

    try {
      // Upload CV
      console.log("Uploading CV...");
      await api.onboarding.uploadCV(file);
      console.log("CV uploaded successfully");

      // Import posts if any
      if (importedPosts.length > 0) {
        console.log("Importing posts...");
        await api.onboarding.importPosts(importedPosts, styleChoice);
        console.log("Posts imported successfully");
      }

      // Process everything - but skip on API errors (rate limits, etc.)
      console.log("Processing profile...");
      try {
        const processResponse = await api.onboarding.process(styleChoice);
        console.log("Process response:", processResponse);
        const profileDataFromResponse = processResponse.data.profile;
        setProfileData(profileDataFromResponse);
        // Save to localStorage for persistence
        localStorage.setItem("onboarding_profile_data", JSON.stringify(profileDataFromResponse));
        setStep(5);
      } catch (processError: any) {
        console.warn("Profile processing failed, skipping to generate:", processError);
        // Complete onboarding and redirect to generate page
        try {
          await api.onboarding.complete();
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          userData.onboarding_completed = true;
          localStorage.setItem("user", JSON.stringify(userData));
          router.push("/generate");
        } catch (completeError) {
          console.error("Failed to complete onboarding:", completeError);
          router.push("/generate");
        }
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      const errorMessage = error?.detail || error?.message || JSON.stringify(error) || "Unknown error occurred";
      alert("Processing failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep5 = async (preferences: any) => {
    setLoading(true);

    try {
      // Update preferences
      await api.user.updatePreferences(preferences);

      // Clear saved profile data
      localStorage.removeItem("onboarding_profile_data");

      // Complete onboarding
      await api.onboarding.complete();

      // Update local storage
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.onboarding_completed = true;
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect to dashboard
      router.push("/generate");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Unknown error";
      console.error("Completion error:", error);
      alert("Completion failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 5) * 100;

  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A66C2] mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-black mb-2">
            {initializing ? "Loading your progress..." : "Processing your information..."}
          </p>
          <p className="text-sm text-[#666666]">
            {initializing 
              ? "Checking your onboarding status..." 
              : "This may take a minute. We're analyzing your CV and generating your profile."}
          </p>
        </div>
      </div>
    );
  }

  const totalSteps = 5; // All flows now have 5 steps
  const actualProgress = (step / totalSteps) * 100;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F3F2F0] py-12 px-4 relative">
      {/* Logout Button - Bottom Left */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="fixed bottom-6 left-6 text-[#666666] hover:text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Logout
      </Button>
      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="bg-white rounded-xl shadow-linkedin-md p-6 border border-[#E0DFDC]">
          <div className="flex justify-between items-center text-sm text-[#666666] mb-3">
            <span className="font-semibold text-black">
              Step {step} of {totalSteps}
            </span>
            <span className="text-[#0A66C2] font-semibold">
              {Math.round(actualProgress)}% Complete
            </span>
          </div>
          <Progress value={actualProgress} className="h-2 bg-[#E0DFDC]" />
        </div>
      </div>

      {/* Step Content */}
      <div>
        {step === 1 && <Step1AccountType onNext={handleStep1} />}
        {step === 2 && (
          <Step2StyleChoice onNext={handleStep2} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <Step4UploadCV onNext={handleStep3} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <Step3ImportPosts
            styleChoice={styleChoice}
            onNext={handleStep4}
            onBack={handleBackFromStep4}
          />
        )}
        {step === 5 && profileData && (
          <Step5Preview
            profileData={profileData}
            onComplete={handleStep5}
            onBack={handleBackFromStep5}
          />
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}

