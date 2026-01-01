import { Header, Footer } from "@/components/landing";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Repeat, 
  Bell,
  ArrowRight,
  Check,
  CalendarDays,
  Timer,
  Brain,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CalendarDays,
    title: "Visual Content Calendar",
    description: "See your entire content strategy at a glance. Drag and drop posts to reschedule instantly.",
  },
  {
    icon: Brain,
    title: "AI Scheduling",
    description: "Our AI analyzes your audience activity and automatically suggests optimal posting times.",
  },
  {
    icon: Repeat,
    title: "Recurring Posts",
    description: "Set up evergreen content to automatically recycle. Keep your best posts working for you.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get notified when it's time to engage with comments or when your scheduled post goes live.",
  },
  {
    icon: Timer,
    title: "Queue Management",
    description: "Build a content queue and let the system post automatically at optimal times.",
  },
  {
    icon: Zap,
    title: "One-Click Publishing",
    description: "Review and publish directly to LinkedIn without leaving the platform.",
  },
];

const scheduledPosts = [
  { day: "Mon", time: "9:00 AM", title: "Industry insights post", status: "scheduled" },
  { day: "Wed", time: "12:00 PM", title: "Personal story", status: "scheduled" },
  { day: "Fri", time: "8:00 AM", title: "Weekend wisdom", status: "draft" },
];

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 left-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Calendar className="w-4 h-4" />
                <span>Content Calendar</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Plan, schedule, and{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  automate your content
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                Never miss a posting opportunity. Our AI-powered calendar helps you maintain consistency and post at the perfect time for maximum engagement.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/25">
                    Start Planning
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Preview */}
        <section className="pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/30 via-teal-600/20 to-cyan-600/30 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-sm text-slate-400">January 2026</span>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-sm text-slate-500 hover:bg-slate-700 rounded">←</button>
                      <button className="px-2 py-1 text-sm text-slate-500 hover:bg-slate-700 rounded">→</button>
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i - 3;
                        const isCurrentMonth = day > 0 && day <= 31;
                        const hasPost = [6, 8, 10, 13, 15, 20, 22, 27].includes(day);
                        const isToday = day === 15;
                        
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${
                              !isCurrentMonth ? "text-slate-700" :
                              isToday ? "bg-gradient-to-br from-cyan-600 to-teal-600 text-white" :
                              hasPost ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                              "text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            <span>{isCurrentMonth ? day : ""}</span>
                            {hasPost && !isToday && <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Upcoming Posts */}
                    <div className="border-t border-slate-700/50 pt-6">
                      <h3 className="font-semibold text-white mb-4">Upcoming Posts</h3>
                      <div className="space-y-3">
                        {scheduledPosts.map((post, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-xs text-cyan-400">{post.day}</span>
                              <span className="text-xs font-semibold text-cyan-300">{post.time.split(" ")[0]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white">{post.title}</p>
                              <p className="text-sm text-slate-500">{post.time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              post.status === "scheduled" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700 text-slate-400"
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        ))}
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
                Smart scheduling for smart creators
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Our calendar isn&apos;t just a scheduler—it&apos;s an AI-powered content planning system.
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

        {/* Benefits */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Consistency is key to LinkedIn success
                </h2>
                <p className="text-slate-400 mb-8">
                  The algorithm rewards consistent posting. Our calendar ensures you never go silent, even on your busiest days.
                </p>
                <ul className="space-y-4">
                  {[
                    "Batch create content in one session",
                    "Schedule weeks of posts in advance",
                    "AI suggests optimal posting frequency",
                    "Never miss your best posting times",
                    "Track your consistency score",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl p-8 text-white">
                  <Clock className="w-16 h-16 mb-6 opacity-80" />
                  <h3 className="text-2xl font-bold mb-4">Best time to post</h3>
                  <p className="text-violet-100 mb-6">Based on your audience activity:</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <span>Tuesday</span>
                      <span className="font-bold">9:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <span>Wednesday</span>
                      <span className="font-bold">12:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <span>Thursday</span>
                      <span className="font-bold">8:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to plan your content?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Start scheduling your LinkedIn posts and never miss a posting opportunity again.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
                Start Scheduling Free
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
