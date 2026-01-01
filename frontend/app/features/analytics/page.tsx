import { Header, Footer } from "@/components/landing";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Eye, 
  Users, 
  MessageSquare,
  ArrowRight,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Brain
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const metrics = [
  {
    icon: Eye,
    label: "Impressions",
    value: "125.4K",
    change: "+24%",
    positive: true,
  },
  {
    icon: Users,
    label: "Profile Views",
    value: "3,847",
    change: "+18%",
    positive: true,
  },
  {
    icon: MessageSquare,
    label: "Engagement",
    value: "8.2%",
    change: "+12%",
    positive: true,
  },
  {
    icon: TrendingUp,
    label: "Followers",
    value: "+892",
    change: "This month",
    positive: true,
  },
];

const features = [
  {
    icon: LineChart,
    title: "Performance Tracking",
    description: "Track impressions, engagement, clicks, and follower growth over time with beautiful visualizations.",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Our AI analyzes your content performance and provides actionable recommendations to improve engagement.",
  },
  {
    icon: Target,
    title: "Audience Analysis",
    description: "Understand who engages with your content—their industries, roles, and what topics resonate most.",
  },
  {
    icon: Activity,
    title: "Best Time to Post",
    description: "AI determines your optimal posting times based on when your specific audience is most active.",
  },
  {
    icon: PieChart,
    title: "Content Mix Analysis",
    description: "See which content types (text, carousel, image) perform best for your audience.",
  },
  {
    icon: Zap,
    title: "Viral Potential Score",
    description: "Before you post, our AI predicts engagement potential and suggests improvements.",
  },
];

const insights = [
  {
    type: "recommendation",
    title: "Post more on Tuesdays",
    description: "Your Tuesday posts get 34% more engagement than other days.",
  },
  {
    type: "insight",
    title: "Stories outperform tips",
    description: "Personal story posts get 2.3x more comments than tip-based content.",
  },
  {
    type: "alert",
    title: "Engagement dip detected",
    description: "Your last 3 posts had lower engagement. Try adding a question at the end.",
  },
];

export default function AnalyticsPage() {
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
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Insights</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Data-driven content{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  that converts
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                Stop guessing what works. Our AI-powered analytics show you exactly what content drives engagement, followers, and business results.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/25">
                    See Your Analytics
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
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
                    <span className="text-sm text-slate-500 ml-2">Analytics Dashboard</span>
                  </div>
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {metrics.map((metric, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                            <metric.icon className="w-4 h-4" />
                            <span>{metric.label}</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{metric.value}</div>
                          <div className={`text-sm ${metric.positive ? "text-emerald-400" : "text-red-400"}`}>
                            {metric.change}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chart Placeholder */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-white">Engagement Over Time</span>
                        <div className="flex gap-2 text-sm">
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">30 days</span>
                          <span className="px-2 py-1 text-slate-500">90 days</span>
                        </div>
                      </div>
                      <div className="h-48 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-violet-600 to-cyan-500 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Insights */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {insights.map((insight, i) => (
                        <div key={i} className={`rounded-xl p-4 ${
                          insight.type === "recommendation" ? "bg-emerald-500/10 border border-emerald-500/20" :
                          insight.type === "insight" ? "bg-cyan-500/10 border border-cyan-500/20" :
                          "bg-amber-500/10 border border-amber-500/20"
                        }`}>
                          <div className={`text-xs font-medium uppercase mb-1 ${
                            insight.type === "recommendation" ? "text-emerald-400" :
                            insight.type === "insight" ? "text-cyan-400" :
                            "text-amber-400"
                          }`}>
                            AI {insight.type}
                          </div>
                          <div className="font-semibold text-white text-sm">{insight.title}</div>
                          <div className="text-xs text-slate-400 mt-1">{insight.description}</div>
                        </div>
                      ))}
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
                Analytics powered by AI
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Go beyond vanity metrics. Understand what truly drives your LinkedIn success.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
              <BarChart3 className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to grow with data?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Stop posting blindly. Start creating content backed by AI-powered insights.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
                View Your Analytics
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
