"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut, FileX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Step1AccountType from "@/components/wizard/Step1AccountType";
import Step2StyleChoice from "@/components/wizard/Step2StyleChoice";
import Step4UploadCV from "@/components/wizard/Step4UploadCV";
import Step5Preview from "@/components/wizard/Step5Preview";
import FeatureSlider from "@/components/onboarding/FeatureSlider";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [styleChoice, setStyleChoice] = useState("");
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    model?: string;
    provider?: string;
    details?: {
      [key: string]: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    };
  } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({ 
    open: false, 
    title: "", 
    message: "" 
  });

  useEffect(() => {
    // Restore profile data from localStorage if on step 4 (preview)
    const savedProfileData = localStorage.getItem("onboarding_profile_data");
    if (savedProfileData && step === 4) {
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
          setStep(4);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStep1 = (_type: string) => {
    setStep(2);
  };

  const handleStep2 = async (choice: string) => {
    setStyleChoice(choice);
    // Always go to CV upload (Step 3)
    setStep(3);
  };

  const handleStep3 = async (file: File) => {
    // Directly process CV and go to preview (no posts import step)
    await handleProcessing(file, []);
  };

  const handleBackFromStep4 = () => {
    setStep(3); // Back to CV upload
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
        
        // Capture token usage
        if (profileDataFromResponse.token_usage) {
          setTokenUsage(profileDataFromResponse.token_usage);
        }
        
        // Save to localStorage for persistence
        localStorage.setItem("onboarding_profile_data", JSON.stringify(profileDataFromResponse));
        setStep(4);
      } catch (processError: unknown) {
        console.warn("Profile processing failed:", processError);
        const errorDetail = processError && typeof processError === 'object'
          ? ('response' in processError && processError.response && typeof processError.response === 'object' && 'data' in processError.response && processError.response.data && typeof processError.response.data === 'object' && 'detail' in processError.response.data
              ? (processError.response.data as { detail?: string }).detail
              : 'detail' in processError
              ? (processError as { detail?: string }).detail
              : 'message' in processError
              ? (processError as { message?: string }).message
              : undefined)
          : undefined;
        alert(`Profile processing failed: ${errorDetail || "Unknown error"}\n\nPlease try again or contact support if the issue persists.`);
      }
    } catch (error: unknown) {
      console.error("Processing error:", error);
      
      // Extract error message from various possible locations
      let errorMessage = "";
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('detail' in error) {
          errorMessage = String((error as { detail?: unknown }).detail || "");
        } else if ('message' in error) {
          errorMessage = String((error as { message?: unknown }).message || "");
        } else if ('error' in error) {
          errorMessage = String((error as { error?: unknown }).error || "");
        } else {
          errorMessage = JSON.stringify(error) || "";
        }
      } else {
        errorMessage = String(error) || "";
      }
      
      console.log("Extracted error message:", errorMessage);
      
      // Check if this is a CV validation error
      const lowerMessage = errorMessage.toLowerCase();
      if (lowerMessage.includes("cv") || 
          lowerMessage.includes("resume") ||
          lowerMessage.includes("doesn't appear to be") ||
          lowerMessage.includes("not a cv")) {
        setErrorDialog({
          open: true,
          title: "Invalid Document",
          message: "The file you uploaded doesn't appear to be a CV or Resume. Please make sure you're uploading your actual CV/Resume in PDF format."
        });
      } else {
        setErrorDialog({
          open: true,
          title: "Upload Failed",
          message: errorMessage && errorMessage !== "{}" 
            ? errorMessage 
            : "Something went wrong while processing your file. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  interface UserPreferences {
    post_type_distribution?: {
      text_only?: number;
      text_with_image?: number;
      carousel?: number;
      video?: number;
    };
    hashtag_count?: number;
    [key: string]: unknown;
  }

  const handleStep5 = async (preferences: UserPreferences) => {
    setLoading(true);

    try {
      console.log("Step 5: Starting completion with preferences:", preferences);
      
      // Update preferences
      console.log("Step 5: Updating preferences...");
      await api.user.updatePreferences(preferences);
      console.log("Step 5: Preferences updated successfully");

      // Clear saved profile data
      localStorage.removeItem("onboarding_profile_data");

      // Complete onboarding
      console.log("Step 5: Completing onboarding...");
      await api.onboarding.complete();
      console.log("Step 5: Onboarding completed successfully");

      // Update local storage
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.onboarding_completed = true;
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect to dashboard
      router.push("/generate");
    } catch (error: unknown) {
      console.error("Completion error:", error);
      console.error("Error type:", typeof error);
      
      let errorMessage = "Unknown error";
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object') {
          const responseData = error.response.data as Record<string, unknown>;
          errorMessage = (responseData.detail as string) || (responseData.message as string) || "Unknown error occurred";
        } else if ('detail' in error) {
          errorMessage = (error as { detail?: string }).detail || "Unknown error occurred";
        } else if ('message' in error) {
          errorMessage = (error as { message?: string }).message || "Unknown error occurred";
        } else {
          errorMessage = JSON.stringify(error) || "Unknown error occurred";
        }
      }
      
      alert("Completion failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A66C2] mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-black mb-2">Loading your progress...</p>
          <p className="text-sm text-[#666666]">Checking your onboarding status...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <FeatureSlider
        message="Processing your information..."
        subMessage="This may take a minute. We're analyzing your CV and generating your profile."
      />
    );
  }

  const totalSteps = 4; // Simplified flow: Account Type, Style Choice, CV Upload, Preview
  const actualProgress = (step / totalSteps) * 100;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F3F2F0] py-4 px-4 relative">
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
      <div className="max-w-3xl mx-auto mb-4">
        <div className="bg-white rounded-xl shadow-linkedin-md p-3 border border-[#E0DFDC]">
          <div className="flex justify-between items-center text-sm text-[#666666] mb-2">
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
        {step === 4 && profileData && (
          <Step5Preview
            profileData={profileData}
            tokenUsage={tokenUsage}
            onComplete={handleStep5}
            onBack={handleBackFromStep4}
          />
        )}
      </div>

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => {
        if (!open) {
          setErrorDialog({ ...errorDialog, open: false });
          setStep(3);
        }
      }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <FileX className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl text-center">{errorDialog.title}</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button 
              onClick={() => {
                setErrorDialog({ ...errorDialog, open: false });
                setStep(3);
              }}
              className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182]"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
