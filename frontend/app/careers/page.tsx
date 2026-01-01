import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Briefcase, MapPin, Clock, Heart, Zap, Globe, Coffee, Laptop, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive medical, dental, and vision insurance for you and your family." },
  { icon: Laptop, title: "Remote First", description: "Work from anywhere in the world with flexible hours." },
  { icon: Zap, title: "Equity", description: "Meaningful equity stake so you share in our success." },
  { icon: Coffee, title: "Unlimited PTO", description: "Take the time you need to recharge and be your best." },
  { icon: Globe, title: "Learning Budget", description: "$2,000 annual budget for courses, books, and conferences." },
  { icon: Clock, title: "401(k) Match", description: "4% company match to help you save for the future." },
];

const openings = [
  { title: "Senior AI/ML Engineer", department: "Engineering", location: "Remote (US)", type: "Full-time", description: "Build and improve our voice matching AI models." },
  { title: "Full Stack Engineer", department: "Engineering", location: "Remote (US/EU)", type: "Full-time", description: "Work on our Next.js frontend and Python backend." },
  { title: "Product Designer", department: "Design", location: "Remote (US)", type: "Full-time", description: "Design delightful experiences for our users." },
  { title: "Growth Marketing Manager", department: "Marketing", location: "Remote (US)", type: "Full-time", description: "Drive user acquisition and engagement." },
  { title: "Customer Success Manager", department: "Support", location: "Remote (US/EU)", type: "Full-time", description: "Help our customers succeed with ContentAI." },
  { title: "Technical Writer", department: "Product", location: "Remote", type: "Contract", description: "Create documentation and educational content." },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Briefcase className="w-4 h-4" />
                <span>Careers at ContentAI</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Build the future of{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  AI content creation
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Join a team of passionate builders creating tools that help millions of professionals share their voice on LinkedIn.
              </p>
              
              <Link href="#openings">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                  View Open Positions
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Why Join ContentAI?</h2>
                <p className="text-slate-400">We take care of our team so they can focus on doing their best work.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-slate-500 text-sm">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Culture */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Our Culture</h2>
                  <div className="space-y-4 text-slate-400">
                    <p>
                      We&apos;re a remote-first team spread across the US and Europe, united by our passion for AI and helping creators succeed.
                    </p>
                    <p>
                      We believe in transparency, ownership, and moving fast. Every team member has a direct impact on our product and our users.
                    </p>
                    <p>
                      We value work-life balance and trust our team to manage their time. Results matter more than hours logged.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                  <h3 className="text-white font-semibold mb-6">What We Look For</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span className="text-slate-400">Passion for AI and its potential to help people</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span className="text-slate-400">Ownership mentality—you see problems and solve them</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span className="text-slate-400">Strong communication skills in a remote environment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span className="text-slate-400">Growth mindset and continuous learner</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span className="text-slate-400">User empathy—you care about the people you build for</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section id="openings" className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Open Positions</h2>
                <p className="text-slate-400">Find your next opportunity at ContentAI.</p>
              </div>
              
              <div className="space-y-4">
                {openings.map((job, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 rounded-xl p-6 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1">{job.title}</h3>
                        <p className="text-slate-500 text-sm mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <Link href={`/contact?subject=Job Application: ${job.title}`}>
                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-12">
                <h2 className="text-3xl font-bold text-white mb-4">Don&apos;t see the right role?</h2>
                <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                  We&apos;re always looking for talented people. Send us your resume and tell us how you can contribute.
                </p>
                <Link href="/contact?subject=General Application">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    Send General Application
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
