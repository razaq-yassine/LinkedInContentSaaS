"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Target, TrendingUp, Users, Calendar } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <Sparkles className="h-12 w-12" />,
    title: "AI-Powered Content Generation",
    description: "Create engaging LinkedIn posts in seconds with our advanced AI that understands your unique voice and industry.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: <Target className="h-12 w-12" />,
    title: "Personalized to Your Profile",
    description: "Content tailored to your expertise, career history, and target audience for maximum engagement.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: <TrendingUp className="h-12 w-12" />,
    title: "Trending Topics Integration",
    description: "Stay relevant with AI-suggested trending topics in your industry to boost visibility and reach.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: <Zap className="h-12 w-12" />,
    title: "Multiple Content Formats",
    description: "Generate text posts, carousels, and image ideas - all optimized for LinkedIn's algorithm.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: <Users className="h-12 w-12" />,
    title: "Grow Your Network",
    description: "Content designed to attract your ideal connections and establish you as a thought leader.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: <Calendar className="h-12 w-12" />,
    title: "Smart Content Calendar",
    description: "Plan and schedule your posts for optimal engagement times with our intelligent scheduling.",
    color: "from-violet-500 to-purple-600",
  },
];

interface FeatureSliderProps {
  message?: string;
  subMessage?: string;
}

export default function FeatureSlider({ 
  message = "Processing your information...",
  subMessage = "This may take a minute. We're analyzing your CV and generating your profile."
}: FeatureSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % features.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentFeature = features[currentSlide];

  return (
    <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E0DFDC] overflow-hidden">
          {/* Feature Slide */}
          <div className={`relative h-64 bg-gradient-to-br ${currentFeature.color} p-8 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 text-center">
              <div className="mb-4 transform transition-transform duration-500 hover:scale-110">
                {currentFeature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-2">{currentFeature.title}</h3>
              <p className="text-white/90 text-sm max-w-md">{currentFeature.description}</p>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 py-4 bg-[#F9F9F9]">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentSlide(index);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 bg-[#0A66C2]' 
                    : 'w-2 bg-[#D0D0D0] hover:bg-[#A0A0A0]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Loading Status */}
          <div className="p-6 text-center border-t border-[#E0DFDC]">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#E0DFDC] border-t-[#0A66C2]"></div>
              </div>
              <p className="text-lg font-semibold text-black">{message}</p>
            </div>
            <p className="text-sm text-[#666666]">{subMessage}</p>
          </div>
        </div>

        {/* Progress Pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Analyzing CV", "Extracting Skills", "Building Profile", "Generating Ideas"].map((step, index) => (
            <div
              key={step}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-500 ${
                index <= Math.floor(currentSlide / 1.5)
                  ? 'bg-[#0A66C2] text-white'
                  : 'bg-white text-[#666666] border border-[#E0DFDC]'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
