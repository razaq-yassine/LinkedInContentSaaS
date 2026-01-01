import { Header, Footer } from "@/components/landing";
import { Star, TrendingUp, Users, Target, ArrowRight, Quote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const featuredStories = [
  {
    company: "TechStart Inc.",
    logo: "TS",
    logoColor: "from-blue-500 to-cyan-500",
    industry: "SaaS",
    quote: "ContentAI helped us build a consistent LinkedIn presence across our entire leadership team. Our inbound leads increased by 340% in just 3 months.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    avatar: "SJ",
    avatarColor: "from-pink-500 to-rose-500",
    stats: [
      { label: "Lead increase", value: "340%" },
      { label: "Time saved weekly", value: "12hrs" },
      { label: "Engagement rate", value: "8.2%" },
    ],
  },
  {
    company: "GrowthLabs",
    logo: "GL",
    logoColor: "from-violet-500 to-purple-500",
    industry: "Consulting",
    quote: "As a founder, I never had time for content. ContentAI changed that. Now I post daily without the stress, and my thought leadership is driving real business results.",
    author: "Michael Chen",
    role: "Founder & CEO",
    avatar: "MC",
    avatarColor: "from-blue-500 to-cyan-500",
    stats: [
      { label: "Followers gained", value: "15K" },
      { label: "Speaking invites", value: "12" },
      { label: "Podcast features", value: "8" },
    ],
  },
  {
    company: "Enterprise Solutions",
    logo: "ES",
    logoColor: "from-green-500 to-emerald-500",
    industry: "Enterprise Software",
    quote: "We rolled out ContentAI to our entire sales team. The combination of personal branding and social selling has transformed our pipeline generation.",
    author: "David Park",
    role: "VP of Sales",
    avatar: "DP",
    avatarColor: "from-orange-500 to-amber-500",
    stats: [
      { label: "Pipeline generated", value: "$2.4M" },
      { label: "Sales cycle reduction", value: "40%" },
      { label: "Team adoption", value: "100%" },
    ],
  },
];

const companies = [
  { name: "Company 1", initial: "A" },
  { name: "Company 2", initial: "B" },
  { name: "Company 3", initial: "C" },
  { name: "Company 4", initial: "D" },
  { name: "Company 5", initial: "E" },
  { name: "Company 6", initial: "F" },
  { name: "Company 7", initial: "G" },
  { name: "Company 8", initial: "H" },
];

const globalStats = [
  { icon: Users, value: "10,000+", label: "Active users" },
  { icon: TrendingUp, value: "50M+", label: "Impressions generated" },
  { icon: Target, value: "$50M+", label: "Revenue influenced" },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>Customer Stories</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              See how teams{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                grow with ContentAI
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join thousands of professionals and teams who are building their LinkedIn presence and driving real business results.
            </p>
          </div>
        </section>

        {/* Global Stats */}
        <section className="pb-20 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
              {globalStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-slate-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-12 border-y border-slate-800 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <p className="text-center text-slate-500 mb-8">Trusted by teams at leading companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {companies.map((company, i) => (
                <div key={i} className="w-16 h-16 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-center text-2xl font-bold text-slate-600">
                  {company.initial}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Stories */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Featured success stories
              </h2>
              <p className="text-slate-400">Learn how our customers are achieving their goals</p>
            </div>
            
            <div className="space-y-8">
              {featuredStories.map((story, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  
                  <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
                      {/* Content */}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-14 h-14 bg-gradient-to-br ${story.logoColor} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                            {story.logo}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{story.company}</div>
                            <div className="text-sm text-slate-500">{story.industry}</div>
                          </div>
                        </div>
                        
                        <Quote className="w-10 h-10 text-violet-500/30 mb-4" />
                        <p className="text-xl text-slate-300 leading-relaxed mb-6">
                          &ldquo;{story.quote}&rdquo;
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${story.avatarColor} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                            {story.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{story.author}</div>
                            <div className="text-sm text-slate-500">{story.role}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-8 flex flex-col justify-center">
                        <h4 className="text-lg font-semibold text-white mb-6">Results achieved</h4>
                        <div className="space-y-6">
                          {story.stats.map((stat, j) => (
                            <div key={j} className="flex items-center justify-between pb-4 border-b border-slate-700/50 last:border-0 last:pb-0">
                              <span className="text-slate-400">{stat.label}</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to write your success story?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals already growing their LinkedIn presence with ContentAI.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
                Start Your Free Trial
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
