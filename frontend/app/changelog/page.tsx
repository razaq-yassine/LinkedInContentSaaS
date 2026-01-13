"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Brain, 
  Image as ImageIcon, 
  MessageSquare, 
  Calendar,
  Zap,
  Users,
  FileText,
  TrendingUp,
  Linkedin,
  Target,
  Layers,
  Settings,
  ChevronLeft,
  CheckCircle2,
  Upload
} from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  features: {
    icon: any;
    title: string;
    description: string;
    tag?: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.0",
    date: "January 2025",
    title: "ContentAI 2.0 - The Intelligence Update",
    description: "A massive upgrade with AI-powered image generation, advanced conversation management, and more ways to create engaging LinkedIn content.",
    features: [
      {
        icon: ImageIcon,
        title: "AI Image Generation",
        description: "Create stunning professional images for your LinkedIn posts with just one click. AI automatically generates visuals that match your content.",
        tag: "New"
      },
      {
        icon: Layers,
        title: "Carousel Post Creator",
        description: "Design eye-catching multi-slide carousel posts. Each slide gets its own AI-generated visual that you can customize and regenerate.",
        tag: "New"
      },
      {
        icon: MessageSquare,
        title: "Smart Conversations",
        description: "Keep your content organized with intelligent conversations. Pick up where you left off and refine your posts over multiple sessions.",
        tag: "New"
      },
      {
        icon: TrendingUp,
        title: "Content Ideas Engine",
        description: "Never run out of inspiration! Get 10-15 personalized content ideas based on your expertise, plus trending topics in your industry.",
        tag: "New"
      },
      {
        icon: Linkedin,
        title: "LinkedIn Integration",
        description: "Connect your LinkedIn account to import your profile and analyze your writing style for even more authentic posts.",
        tag: "New"
      },
      {
        icon: Upload,
        title: "Image Upload Support",
        description: "Upload your own images for AI to analyze and create content around. Perfect for sharing experiences, events, and achievements.",
        tag: "New"
      },
      {
        icon: Target,
        title: "Advanced Post Controls",
        description: "Fine-tune your posts with tone, length, and hashtag controls. Enable trending topics for timely, relevant content.",
        tag: "Enhanced"
      },
      {
        icon: FileText,
        title: "Multiple Post Formats",
        description: "Choose between text posts, image posts, and carousels. Each format is optimized for maximum LinkedIn engagement.",
        tag: "Enhanced"
      },
      {
        icon: Calendar,
        title: "Post Scheduling",
        description: "Schedule your posts for the best engagement times. Plan your content calendar weeks in advance.",
        tag: "Enhanced"
      },
      {
        icon: Brain,
        title: "Smarter AI Responses",
        description: "Improved AI that better understands your professional context and creates more authentic, personalized content.",
        tag: "Enhanced"
      }
    ]
  },
  {
    version: "1.0",
    date: "November 2024",
    title: "ContentAI Launch",
    description: "The initial release bringing AI-powered LinkedIn content creation to professionals worldwide.",
    features: [
      {
        icon: Brain,
        title: "AI Content Generation",
        description: "Generate authentic LinkedIn posts using advanced AI that matches your writing style and professional voice."
      },
      {
        icon: FileText,
        title: "CV-Based Profile Building",
        description: "Upload your CV to automatically extract your expertise and experience for personalized content that sounds like you."
      },
      {
        icon: Sparkles,
        title: "Writing Style Analysis",
        description: "AI learns your unique tone, vocabulary, and writing patterns from your existing posts."
      },
      {
        icon: MessageSquare,
        title: "Comment Suggestions",
        description: "Get AI-powered suggestions for engaging comments on LinkedIn posts in your feed."
      },
      {
        icon: Users,
        title: "Easy Onboarding",
        description: "5-step guided setup to build your complete profile with AI assistance at every stage."
      },
      {
        icon: Target,
        title: "Audience Targeting",
        description: "Define your audience and content goals for laser-focused post generation that resonates."
      },
      {
        icon: CheckCircle2,
        title: "LinkedIn Preview",
        description: "See exactly how your post will look on LinkedIn before publishing."
      },
      {
        icon: Settings,
        title: "Personalization Settings",
        description: "Customize your content preferences, posting style, and default generation settings."
      }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Product Updates</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                What&apos;s New
              </span>
            </h1>
            <p className="text-xl text-slate-400">
              Track the evolution of ContentAI. Every update brings you closer to perfect LinkedIn content.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog Entries */}
      <section className="pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="space-y-16">
            {changelog.map((entry, index) => (
              <div key={entry.version} className="relative">
                {/* Version Badge */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg shadow-cyan-500/20">
                    <Zap className="w-5 h-5" />
                    Version {entry.version}
                  </div>
                  <span className="text-slate-500 font-medium">{entry.date}</span>
                </div>

                {/* Entry Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3">
                    {entry.title}
                  </h2>
                  <p className="text-lg text-slate-400">
                    {entry.description}
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {entry.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      {feature.tag && (
                        <div className="absolute top-4 right-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            feature.tag === "New" 
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                              : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                          }`}>
                            {feature.tag}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider (except for last entry) */}
                {index < changelog.length - 1 && (
                  <div className="mt-16 pt-16 border-t border-slate-800/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to experience ContentAI 2.0?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of professionals creating authentic LinkedIn content with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 shadow-lg shadow-cyan-500/20">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-slate-600 bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 ContentAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
