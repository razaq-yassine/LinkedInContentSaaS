"use client";

import { Header, Footer } from "@/components/landing";
import { Star, TrendingUp, ArrowRight, Quote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const featuredStories = [
  {
    company: "Calendly",
    logo: "C",
    logoImage: "/images/logos/calendly.png",
    logoColor: "from-blue-500 to-cyan-500",
    industry: "SaaS",
    quote: "PostInAi helped us build a consistent LinkedIn presence across our entire leadership team. Our inbound leads increased by 340% in just 3 months.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    avatar: "SJ",
    avatarImage: "/images/avatars/sarah.jpg",
    avatarColor: "from-pink-500 to-rose-500",
    stats: [
      { label: "Lead increase", value: "340%" },
      { label: "Time saved weekly", value: "12hrs" },
      { label: "Engagement rate", value: "8.2%" },
    ],
  },
  {
    company: "Buffer",
    logo: "B",
    logoImage: "/images/logos/buffer.png",
    logoColor: "from-violet-500 to-purple-500",
    industry: "Social Media",
    quote: "As a founder, I never had time for content. PostInAi changed that. Now I post daily without the stress, and my thought leadership is driving real business results.",
    author: "Michael Chen",
    role: "Founder & CEO",
    avatar: "MC",
    avatarImage: "/images/avatars/michael.jpg",
    avatarColor: "from-blue-500 to-cyan-500",
    stats: [
      { label: "Followers gained", value: "15K" },
      { label: "Speaking invites", value: "12" },
      { label: "Podcast features", value: "8" },
    ],
  },
  {
    company: "Pipedrive",
    logo: "P",
    logoImage: "/images/logos/pipedrive.png",
    logoColor: "from-green-500 to-emerald-500",
    industry: "Sales CRM",
    quote: "We rolled out PostInAi to our entire sales team. The combination of personal branding and social selling has transformed our pipeline generation.",
    author: "David Park",
    role: "VP of Sales",
    avatar: "DP",
    avatarImage: "/images/avatars/david.jpg",
    avatarColor: "from-orange-500 to-amber-500",
    stats: [
      { label: "Pipeline generated", value: "$2.4M" },
      { label: "Sales cycle reduction", value: "40%" },
      { label: "Team adoption", value: "100%" },
    ],
  },
];

const companies = [
  { name: "Reforge", logo: "/images/logos/reforge.png" },
  { name: "Lavender", logo: "/images/logos/lavender.png" },
  { name: "Beehiiv", logo: "/images/logos/beehiiv.png" },
  { name: "Grain", logo: "/images/logos/grain.png" },
  { name: "Superside", logo: "/images/logos/superside.png" },
  { name: "Loom", logo: "/images/logos/loom.png" },
  { name: "Descript", logo: "/images/logos/descript.png" },
  { name: "Lattice", logo: "/images/logos/lattice.png" },
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
                grow with PostInAi
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join professionals and teams who are building their LinkedIn presence and driving real business results.
            </p>
          </div>
        </section>

        {/* Trusted By - Horizontal Scrolling */}
        <section className="py-12 border-y border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <p className="text-center text-slate-500 mb-8">Trusted by teams at leading companies</p>
          </div>
          <div className="relative">
            <div className="flex animate-scroll-x">
              {[...companies, ...companies, ...companies].map((company, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mx-4 px-5 h-16 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-3 hover:border-cyan-500/50 transition-colors group"
                >
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-9 h-9 rounded-lg object-contain bg-white p-1"
                  />
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-cyan-400 transition-colors whitespace-nowrap">
                    {company.name}
                  </span>
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
                          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center p-1.5">
                            <img src={story.logoImage} alt={story.company} className="w-full h-full object-contain" />
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
                          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg ring-2 ring-slate-700">
                            <img src={story.avatarImage} alt={story.author} className="w-full h-full object-cover" />
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
              Join professionals already growing their LinkedIn presence with PostInAi.
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
