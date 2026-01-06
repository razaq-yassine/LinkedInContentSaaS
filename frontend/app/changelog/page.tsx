"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Brain, 
  Image as ImageIcon, 
  MessageSquare, 
  Calendar,
  Shield,
  Zap,
  Users,
  FileText,
  TrendingUp,
  Mail,
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
    description: "A massive upgrade with AI-powered image generation, advanced conversation management, and enterprise-grade security features.",
    features: [
      {
        icon: ImageIcon,
        title: "AI Image Generation",
        description: "Generate professional LinkedIn images using Cloudflare AI. Automatically creates images from your post content with custom prompts and regeneration options.",
        tag: "New"
      },
      {
        icon: Layers,
        title: "Carousel PDF Generator",
        description: "Create multi-slide carousel posts with AI-generated visuals. Each slide is individually customizable with regeneration support.",
        tag: "New"
      },
      {
        icon: MessageSquare,
        title: "Conversation Management",
        description: "Organize your content creation with smart conversations. Auto-generated titles, date-based grouping, and inline editing for seamless workflow.",
        tag: "New"
      },
      {
        icon: Brain,
        title: "TOON Profile Context",
        description: "Token-efficient profile format that reduces AI costs by 50%. Intelligent defaults for missing information with industry-specific templates.",
        tag: "Enhanced"
      },
      {
        icon: TrendingUp,
        title: "Content Ideas Engine",
        description: "Get 10-15 evergreen content ideas from your CV plus 5-10 trending topics from web search. Never run out of inspiration.",
        tag: "New"
      },
      {
        icon: Linkedin,
        title: "LinkedIn OAuth Integration",
        description: "Connect your LinkedIn account to import profile data and sync your posts for better writing style analysis.",
        tag: "New"
      },
      {
        icon: Mail,
        title: "Email Verification System",
        description: "Secure 6-digit verification codes with 15-minute expiration. One-click verification links and resend functionality.",
        tag: "New"
      },
      {
        icon: Target,
        title: "Advanced Post Options",
        description: "Fine-tune your posts with tone, length, hashtag count controls. Enable trending topics and internet search for timely content.",
        tag: "Enhanced"
      },
      {
        icon: FileText,
        title: "Multiple Post Formats",
        description: "Generate text posts, image posts, and carousel posts with format-specific optimization and preview.",
        tag: "Enhanced"
      },
      {
        icon: Calendar,
        title: "Post Scheduling",
        description: "Schedule your posts for optimal engagement times. Manage scheduled posts with an intuitive calendar interface.",
        tag: "Enhanced"
      },
      {
        icon: Zap,
        title: "Token Usage Tracking",
        description: "Real-time tracking of AI token consumption with detailed cost breakdown for every generation.",
        tag: "New"
      },
      {
        icon: Upload,
        title: "Image Upload in Chat",
        description: "Upload up to 4 images in the generation interface for visual context. AI analyzes your images to create better content.",
        tag: "New"
      }
    ]
  },
  {
    version: "1.0",
    date: "November 2024",
    title: "ContentAI Launch - The Foundation",
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
        description: "Upload your CV to automatically extract your expertise, experience, and professional context for personalized content."
      },
      {
        icon: Sparkles,
        title: "Writing Style Analysis",
        description: "AI analyzes your existing posts to learn your unique tone, vocabulary, and writing patterns."
      },
      {
        icon: MessageSquare,
        title: "Comment Worthiness Evaluator",
        description: "Evaluate LinkedIn posts to determine if they're worth engaging with. Get AI-powered insights and comment suggestions."
      },
      {
        icon: Users,
        title: "Smart Onboarding Wizard",
        description: "5-step guided onboarding to build your complete profile with AI assistance at every stage."
      },
      {
        icon: Target,
        title: "Target Audience Profiling",
        description: "Define your audience personas and content goals for laser-focused post generation."
      },
      {
        icon: CheckCircle2,
        title: "LinkedIn Post Preview",
        description: "See how your post will look on LinkedIn before publishing with an authentic preview interface."
      },
      {
        icon: Shield,
        title: "Admin Dashboard",
        description: "Comprehensive admin panel for user management, system settings, and platform monitoring."
      },
      {
        icon: Settings,
        title: "User Preferences",
        description: "Customize your content mix, posting frequency, and default generation settings."
      },
      {
        icon: Zap,
        title: "Fast & Secure",
        description: "Built on FastAPI and Next.js 14 for blazing-fast performance with enterprise-grade security."
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
