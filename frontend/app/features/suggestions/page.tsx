import { Header, Footer } from "@/components/landing";
import { 
  Lightbulb, 
  TrendingUp, 
  Sparkles, 
  Target,
  Brain,
  ArrowRight,
  Check,
  Zap,
  RefreshCw,
  MessageSquare,
  BarChart3,
  Shuffle,
  Clock,
  Users,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: TrendingUp,
    title: "Trending Topic Detection",
    description: "Our AI monitors LinkedIn trends in real-time to suggest topics that are gaining traction in your industry.",
  },
  {
    icon: Brain,
    title: "AI-Powered Ideas",
    description: "Get personalized content ideas based on your expertise, audience interests, and past performance.",
  },
  {
    icon: Target,
    title: "Audience-Aligned Suggestions",
    description: "Suggestions are tailored to what your specific audience engages with most, maximizing reach and impact.",
  },
  {
    icon: RefreshCw,
    title: "Endless Inspiration",
    description: "Never run out of ideas. Generate new suggestions anytime with a single click.",
  },
  {
    icon: Shuffle,
    title: "Topic Diversity",
    description: "Our algorithm ensures variety in your content, preventing repetitive topics and keeping your feed fresh.",
  },
  {
    icon: BarChart3,
    title: "Performance-Based Learning",
    description: "The more you use it, the smarter it gets. AI learns from your top-performing posts to suggest winners.",
  },
];

const suggestionCategories = [
  { name: "Industry Insights", count: "15+ ideas", color: "cyan" },
  { name: "Personal Stories", count: "10+ ideas", color: "violet" },
  { name: "How-To Guides", count: "12+ ideas", color: "emerald" },
  { name: "Thought Leadership", count: "8+ ideas", color: "amber" },
];

const exampleSuggestions = [
  {
    topic: "The hidden cost of not investing in employee development",
    category: "Thought Leadership",
    trending: true,
  },
  {
    topic: "3 automation tools that saved me 10 hours this week",
    category: "How-To Guide",
    trending: false,
  },
  {
    topic: "Why I stopped chasing viral posts (and what I do instead)",
    category: "Personal Story",
    trending: true,
  },
  {
    topic: "The 2024 skills gap: what the data really shows",
    category: "Industry Insight",
    trending: false,
  },
];

const benefits = [
  "Beat writer's block instantly",
  "Stay relevant with trending topics",
  "Maintain consistent posting schedule",
  "Diversify your content mix",
  "Align content with audience interests",
  "Save hours of brainstorming time",
];

export default function SuggestionsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 left-0 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-sm font-medium mb-6">
                <Lightbulb className="w-4 h-4" />
                <span>Smart Suggestions</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Never run out of{" "}
                <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  content ideas
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
                Our AI analyzes trends, your audience, and your expertise to deliver personalized content ideas that resonate and drive engagement.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-rose-500/25">
                    Get Content Ideas
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-slate-700 text-slate-300 hover:bg-slate-800">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Preview */}
        <section className="pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-600/30 via-amber-600/20 to-rose-600/30 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Content Ideas for You</span>
                    </div>
                    <button className="px-3 py-1 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {suggestionCategories.map((cat, i) => (
                        <div 
                          key={i} 
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                            cat.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            cat.color === 'violet' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                            cat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {cat.name} <span className="text-slate-300 ml-1">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Suggestion Cards */}
                    <div className="space-y-3">
                      {exampleSuggestions.map((suggestion, i) => (
                        <div 
                          key={i} 
                          className="group flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-rose-500/30 hover:bg-slate-800/70 transition-all cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white group-hover:text-rose-300 transition-colors">{suggestion.topic}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-slate-400">{suggestion.category}</span>
                              {suggestion.trending && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">
                                  <TrendingUp className="w-3 h-3" />
                                  Trending
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Load More */}
                    <div className="mt-6 text-center">
                      <button className="text-sm text-slate-300 hover:text-rose-400 transition-colors">
                        Show more ideas →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                AI that knows what your audience wants
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto">
                Our suggestion engine uses machine learning to understand trends, analyze your performance, and deliver ideas that work.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600/20 to-amber-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  <span>Beat Writer&apos;s Block</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  From blank page to brilliant post in seconds
                </h2>
                <p className="text-slate-300 mb-8">
                  Stop staring at an empty screen. Our AI delivers ready-to-use content ideas that align with your brand, audience, and goals.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-600/20 to-amber-600/20 rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-rose-600 to-amber-600 rounded-2xl p-6 sm:p-8 text-white">
                  <Lightbulb className="w-16 h-16 mb-6 opacity-80" />
                  <h3 className="text-2xl font-bold mb-4">How it works</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                      <div>
                        <p className="font-semibold">Tell us your niche</p>
                        <p className="text-rose-100 text-sm">Set up your profile with industry and expertise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="font-semibold">AI analyzes trends</p>
                        <p className="text-rose-100 text-sm">We scan millions of posts for what&apos;s working</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                      <div>
                        <p className="font-semibold">Get personalized ideas</p>
                        <p className="text-rose-100 text-sm">Receive tailored suggestions daily</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                      <div>
                        <p className="font-semibold">Create with one click</p>
                        <p className="text-rose-100 text-sm">Turn any idea into a full post instantly</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">50+</div>
                <p className="text-slate-300 text-sm">Ideas generated daily</p>
              </div>
              <div className="text-center p-6">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">10x</div>
                <p className="text-slate-300 text-sm">Faster content planning</p>
              </div>
              <div className="text-center p-6">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">95%</div>
                <p className="text-slate-300 text-sm">User satisfaction rate</p>
              </div>
              <div className="text-center p-6">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">24/7</div>
                <p className="text-slate-300 text-sm">Trend monitoring</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to unlock endless content ideas?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Stop struggling with what to post. Let AI deliver personalized content suggestions that your audience will love.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-rose-500/25">
                Get Started Free
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
