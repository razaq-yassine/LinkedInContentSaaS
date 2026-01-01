import { Header, Footer } from "@/components/landing";
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  Target, 
  Mic, 
  FileText, 
  Wand2,
  ArrowRight,
  Check,
  Lightbulb,
  PenTool,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "Neural Voice Learning",
    description: "Our AI analyzes your writing patterns, vocabulary, tone, and style to create a unique voice profile that captures your authentic self.",
  },
  {
    icon: Lightbulb,
    title: "Smart Topic Suggestions",
    description: "Never run out of ideas. Our AI suggests trending topics in your industry that align with your expertise and audience interests.",
  },
  {
    icon: PenTool,
    title: "Hook Generation",
    description: "Create scroll-stopping opening lines that grab attention. Our AI knows what makes people stop scrolling and start reading.",
  },
  {
    icon: RefreshCw,
    title: "Instant Variations",
    description: "Generate multiple versions of any post instantly. Test different angles, tones, and formats to find what resonates best.",
  },
];

const capabilities = [
  "Text posts optimized for engagement",
  "Carousel content with slide-by-slide generation",
  "Image posts with AI-generated visuals",
  "Video scripts for talking-head content",
  "Poll posts that drive interaction",
  "Document posts with key takeaways",
];

const process = [
  {
    step: "01",
    title: "Share Your Idea",
    description: "Type a topic, paste an article, or just speak your thoughts. Our AI understands natural language.",
  },
  {
    step: "02",
    title: "AI Analyzes & Creates",
    description: "The AI applies your voice profile, optimizes for LinkedIn's algorithm, and generates engaging content.",
  },
  {
    step: "03",
    title: "Review & Refine",
    description: "Edit, regenerate, or request variations. You're always in control of the final output.",
  },
  {
    step: "04",
    title: "Publish & Track",
    description: "Post directly to LinkedIn or schedule for later. Track performance to improve future content.",
  },
];

export default function AIWriterPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 left-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                <span>AI Content Writer</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Write LinkedIn posts that{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  sound like you
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                Our AI learns your unique voice and writing style, then generates authentic content that engages your audience and drives real business results.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/25">
                    Try AI Writer Free
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
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/30 via-teal-600/20 to-cyan-600/30 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MessageSquare className="w-4 h-4" />
                          <span>Your input</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                          <p className="text-slate-300">Write a post about my experience transitioning from employee to entrepreneur after 10 years in corporate...</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium">Inspiring</button>
                          <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Story-driven</button>
                          <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm">With lessons</button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <span>AI-generated post</span>
                        </div>
                        <div className="bg-cyan-500/10 rounded-xl border border-cyan-500/20 p-4">
                          <p className="text-white font-medium mb-2">10 years ago, I had a corner office and a steady paycheck.</p>
                          <p className="text-slate-300 text-sm">Today, I have a laptop, a dream, and zero regrets.</p>
                          <p className="text-slate-300 text-sm mt-2">Here&apos;s what nobody tells you about leaving corporate...</p>
                          <p className="text-slate-500 text-sm mt-2">...</p>
                        </div>
                      </div>
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
                AI that writes like a human
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Our neural network doesn&apos;t just generate text—it understands context, emotion, and what makes content resonate.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {features.map((feature, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Types */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                  <FileText className="w-4 h-4" />
                  <span>Multiple Formats</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  One AI, endless content types
                </h2>
                <p className="text-slate-400 mb-8">
                  From quick text updates to comprehensive carousel posts, our AI adapts to any format LinkedIn supports.
                </p>
                <ul className="space-y-4">
                  {capabilities.map((cap, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-slate-300">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 rounded-3xl blur-xl" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg text-sm font-medium">Text Post</span>
                    <span className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Carousel</span>
                    <span className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Image</span>
                    <span className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-sm">Video Script</span>
                  </div>
                  <div className="h-64 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Wand2 className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                      <p className="text-slate-300 font-medium">AI generates your content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-24 bg-gradient-to-b from-slate-900/50 to-slate-950">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                From idea to post in minutes
              </h2>
              <p className="text-slate-400">A simple 4-step process powered by advanced AI</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {process.map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to write smarter with AI?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals creating authentic LinkedIn content in minutes, not hours.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
                Start Writing Free
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
