import { Header, Footer } from "@/components/landing";
import { 
  Lightbulb, 
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Eye,
  Users,
  Hash,
  Clock,
  Target
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tipCategories = [
  {
    title: "Writing Hooks",
    icon: Sparkles,
    color: "violet",
    tips: [
      "Start with a bold, controversial statement",
      "Use numbers (\"3 things I learned...\")",
      "Ask a thought-provoking question",
      "Share a surprising statistic",
      "Begin with \"I was wrong about...\"",
    ],
  },
  {
    title: "Engagement Boosters",
    icon: MessageSquare,
    color: "blue",
    tips: [
      "End posts with a clear question",
      "Reply to every comment within 1 hour",
      "Tag relevant people (sparingly)",
      "Use line breaks for readability",
      "Add a P.S. with a call-to-action",
    ],
  },
  {
    title: "Algorithm Hacks",
    icon: TrendingUp,
    color: "green",
    tips: [
      "Post when your audience is most active",
      "Keep posts under 1,300 characters for mobile",
      "Avoid external links in the main post",
      "Engage with others before and after posting",
      "Use 3-5 relevant hashtags maximum",
    ],
  },
  {
    title: "Visual Content",
    icon: Eye,
    color: "pink",
    tips: [
      "Carousels get 3x more engagement",
      "Use high-contrast, readable text on images",
      "First slide is your hook—make it count",
      "Include your face for higher trust",
      "Keep carousel slides under 10",
    ],
  },
];

const proTips = [
  {
    icon: Clock,
    title: "Best Posting Times",
    description: "Tuesday-Thursday, 8-10 AM or 12-1 PM in your audience's timezone typically performs best.",
  },
  {
    icon: Hash,
    title: "Hashtag Strategy",
    description: "Use 3-5 hashtags: 1 broad (500K+ followers), 2 medium (10K-500K), 2 niche (under 10K).",
  },
  {
    icon: Users,
    title: "Engagement Window",
    description: "The first hour after posting is crucial. Stay online and reply to every comment quickly.",
  },
  {
    icon: Target,
    title: "Content Mix",
    description: "Follow the 4-1-1 rule: 4 value posts, 1 promotional, 1 personal story per week.",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  violet: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
  blue: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  green: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  pink: { bg: "bg-fuchsia-500/20", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
};

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
                <Lightbulb className="w-4 h-4" />
                <span>LinkedIn Tips</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Actionable tips for{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  LinkedIn success
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                Proven strategies and tactics from creators who&apos;ve grown to 100K+ followers. Save this page and implement one tip at a time.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25">
                    Try Tips with AI
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tip Categories */}
        <section className="pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {tipCategories.map((category, i) => {
                const colors = colorClasses[category.color];
                return (
                  <div key={i} className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all`}>
                    <div className={`w-12 h-12 ${colors.bg} border ${colors.border} rounded-xl flex items-center justify-center mb-4`}>
                      <category.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{category.title}</h3>
                    <ul className="space-y-3">
                      {category.tips.map((tip, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span className="text-slate-400">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pro Tips */}
        <section className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Pro tips from top creators
              </h2>
              <p className="text-slate-400">Advanced strategies for maximum impact</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {proTips.map((tip, i) => (
                <div key={i} className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                    <tip.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{tip.title}</h3>
                  <p className="text-sm text-slate-400">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl p-8 lg:p-12 text-white">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6">Quick Reference Checklist</h2>
                <p className="text-violet-100 mb-8">Before hitting &quot;Post&quot;, make sure you&apos;ve checked these:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Hook grabs attention in first 2 lines",
                    "Content provides clear value",
                    "Easy to scan (line breaks, bullets)",
                    "Ends with a question or CTA",
                    "3-5 relevant hashtags",
                    "No external links in main post",
                    "Proofread for typos",
                    "Posting at optimal time",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3">
                      <div className="w-5 h-5 border-2 border-white rounded flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Let AI apply these tips for you
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              PostInAi automatically implements these best practices in every post it generates.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-violet-500/25">
                Try PostInAi Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
