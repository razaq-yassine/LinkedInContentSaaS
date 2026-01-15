import { Header, Footer } from "@/components/landing";
import { 
  Mic, 
  Brain, 
  Fingerprint, 
  Sparkles, 
  MessageSquare,
  ArrowRight,
  Check,
  Wand2,
  FileText,
  RefreshCw,
  Target
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const voiceAttributes = [
  { label: "Tone", value: "Professional yet approachable" },
  { label: "Style", value: "Story-driven with data" },
  { label: "Vocabulary", value: "Industry-specific" },
  { label: "Structure", value: "Hook → Story → Lesson" },
];

const features = [
  {
    icon: Brain,
    title: "Neural Voice Analysis",
    description: "Our AI analyzes thousands of data points from your writing to understand your unique voice signature.",
  },
  {
    icon: Fingerprint,
    title: "Voice Fingerprint",
    description: "We create a unique voice profile that captures your tone, vocabulary, sentence structure, and personality.",
  },
  {
    icon: RefreshCw,
    title: "Continuous Learning",
    description: "The more you use PostInAi, the better it understands your voice. It learns from your edits and preferences.",
  },
  {
    icon: Target,
    title: "Audience Adaptation",
    description: "Maintain your voice while adapting content for different audiences—executives, peers, or junior professionals.",
  },
];

const sources = [
  {
    icon: FileText,
    title: "Past LinkedIn Posts",
    description: "Import your post history and let AI learn from your best content",
  },
  {
    icon: MessageSquare,
    title: "Writing Samples",
    description: "Upload articles, blogs, or any content that represents your voice",
  },
  {
    icon: Mic,
    title: "Voice Recordings",
    description: "Speak naturally and AI converts your spoken ideas into written content",
  },
];

export default function VoicePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Fingerprint className="w-4 h-4" />
                <span>Voice Matching Technology</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                AI that writes{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  exactly like you
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                Our advanced voice matching technology learns your unique writing style, tone, and personality to generate content that&apos;s authentically yours.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-cyan-400 font-semibold shadow-lg shadow-cyan-500/25">
                    Create Your Voice Profile
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Voice Profile Demo */}
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
                    <span className="text-sm text-slate-500 ml-2">Your Voice Profile</span>
                  </div>
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Voice Profile Card */}
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Fingerprint className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Voice Profile</h3>
                            <p className="text-purple-100">95% accuracy match</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {voiceAttributes.map((attr, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-3">
                              <span className="text-purple-100">{attr.label}</span>
                              <span className="font-medium">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Comparison */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-white">See the difference</h4>
                        
                        <div className="space-y-4">
                          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <div className="text-xs text-slate-500 mb-2">❌ Generic AI</div>
                            <p className="text-slate-400 text-sm">
                              &quot;Here are 5 tips for better productivity: 1. Wake up early. 2. Make a to-do list...&quot;
                            </p>
                          </div>
                          
                          <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4">
                            <div className="text-xs text-cyan-400 mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              With Your Voice
                            </div>
                            <p className="text-white text-sm">
                              &quot;I used to think productivity meant doing more. After burning out twice, I learned it&apos;s about doing what matters. Here&apos;s my framework...&quot;
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Personal stories • Your vocabulary • Your structure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                How voice matching works
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Our AI uses multiple data sources to build your unique voice profile.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              {sources.map((source, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 text-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <source.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{source.title}</h3>
                    <p className="text-slate-400 text-sm">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Process Steps */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", label: "Upload your content" },
                { step: "2", label: "AI analyzes patterns" },
                { step: "3", label: "Voice profile created" },
                { step: "4", label: "Generate authentic posts" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                      {item.step}
                    </div>
                    <span className="text-slate-300 font-medium">{item.label}</span>
                  </div>
                  {i < 3 && <div className="hidden md:block w-8 h-0.5 bg-slate-700" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Advanced voice technology
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Powered by neural networks trained on millions of writing samples.
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

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Fingerprint className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to create your voice profile?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              In just 5 minutes, our AI will learn your unique writing style and start generating authentic content.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
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
