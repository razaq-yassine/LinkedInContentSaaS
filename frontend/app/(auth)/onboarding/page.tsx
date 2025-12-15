"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Progress } from "@/components/ui/progress";
import Step1AccountType from "@/components/wizard/Step1AccountType";
import Step2StyleChoice from "@/components/wizard/Step2StyleChoice";
import Step3ImportPosts from "@/components/wizard/Step3ImportPosts";
import Step4UploadCV from "@/components/wizard/Step4UploadCV";
import Step5Preview from "@/components/wizard/Step5Preview";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("");
  const [styleChoice, setStyleChoice] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const handleStep1 = (type: string) => {
    setAccountType(type);
    setStep(2);
  };

  const handleStep2 = async (choice: string) => {
    setStyleChoice(choice);
    // Skip step 3 (posts import) if using top creators format
    if (choice === "top_creators") {
      setStep(4); // Go directly to CV upload
    } else {
      setStep(3); // Go to posts import for "my_style"
    }
  };

  const handleStep3 = async (importedPosts: string[]) => {
    setPosts(importedPosts);
    setStep(4);
  };

  const handleStep4 = async (file: File) => {
    setCvFile(file);
    setLoading(true);

    try {
      // Upload CV
      const formData = new FormData();
      formData.append("file", file);
      await api.onboarding.uploadCV(formData);

      // Import posts if any
      if (posts.length > 0) {
        await api.onboarding.importPosts(posts, styleChoice);
      }

      // Process everything
      const processResponse = await api.onboarding.process(styleChoice);
      setProfileData(processResponse.data.profile);

      setStep(5);
    } catch (error: any) {
      alert("Processing failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStep5 = async (preferences: any) => {
    setLoading(true);

    try {
      // Update preferences
      await api.onboarding.updatePreferences(preferences);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A66C2] mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-black mb-2">Processing your information...</p>
          <p className="text-sm text-[#666666]">
            This may take a minute. We're analyzing your CV and generating your profile.
          </p>
        </div>
      </div>
    );
  }

  const totalSteps = styleChoice === "top_creators" ? 4 : 5;
  const actualProgress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#F3F2F0] py-12 px-4">
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
          <Step3ImportPosts
            styleChoice={styleChoice}
            onNext={handleStep3}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4UploadCV onNext={handleStep4} onBack={() => setStep(3)} />
        )}
        {step === 5 && profileData && (
          <Step5Preview
            profileData={profileData}
            onComplete={handleStep5}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  );
}

