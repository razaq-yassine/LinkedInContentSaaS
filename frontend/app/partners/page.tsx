import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Handshake, Building2, Users, DollarSign, Headphones, Rocket, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const partnerTypes = [
  {
    icon: Building2,
    title: "Agency Partners",
    description: "For marketing agencies managing multiple client accounts.",
    benefits: ["White-label solutions", "Volume discounts", "Dedicated account manager", "Priority support"],
    color: "violet"
  },
  {
    icon: Users,
    title: "Referral Partners",
    description: "Earn commissions by referring customers to PostInAi.",
    benefits: ["20% recurring commission", "90-day cookie window", "Real-time tracking dashboard", "Marketing materials"],
    color: "cyan"
  },
  {
    icon: Rocket,
    title: "Integration Partners",
    description: "Build integrations that connect PostInAi to your platform.",
    benefits: ["API access", "Technical documentation", "Co-marketing opportunities", "Featured in marketplace"],
    color: "emerald"
  },
];

const stats = [
  { value: "200+", label: "Active Partners" },
  { value: "$2M+", label: "Partner Earnings" },
  { value: "50K+", label: "Referred Users" },
  { value: "30+", label: "Integrations" },
];

export default function PartnersPage() {
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
                <Handshake className="w-4 h-4" />
                <span>Partner Program</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Grow together with{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  PostInAi
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Join our partner ecosystem and unlock new revenue streams while helping professionals create better content.
              </p>
              
              <Link href="/contact?subject=Partnership Inquiry">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                  Become a Partner
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-slate-500 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Partnership Programs</h2>
                <p className="text-slate-400">Choose the program that fits your business.</p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {partnerTypes.map((type, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-colors">
                    <div className={`w-14 h-14 bg-${type.color}-500/10 border border-${type.color}-500/20 rounded-xl flex items-center justify-center mb-6`}>
                      <type.icon className={`w-7 h-7 text-${type.color}-400`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                    <p className="text-slate-400 mb-6">{type.description}</p>
                    <ul className="space-y-3">
                      {type.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-center gap-2 text-slate-300 text-sm">
                          <Check className={`w-4 h-4 text-${type.color}-400`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                <p className="text-slate-400">Get started in three simple steps.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-400 font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-white font-semibold mb-2">Apply</h3>
                  <p className="text-slate-500 text-sm">Fill out our partner application with details about your business.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400 font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-white font-semibold mb-2">Get Approved</h3>
                  <p className="text-slate-500 text-sm">Our team reviews applications and responds within 48 hours.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-white font-semibold mb-2">Start Earning</h3>
                  <p className="text-slate-500 text-sm">Access your dashboard, resources, and start growing together.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Partner Benefits</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Competitive Commissions</h3>
                        <p className="text-slate-400 text-sm">Earn up to 20% recurring commission on referred customers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Dedicated Support</h3>
                        <p className="text-slate-400 text-sm">Get a dedicated partner manager to help you succeed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Co-Marketing</h3>
                        <p className="text-slate-400 text-sm">Joint webinars, case studies, and promotional opportunities.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-8">
                  <h3 className="text-white font-semibold mb-4">Ready to Partner?</h3>
                  <p className="text-slate-400 mb-6">Join hundreds of partners already growing with PostInAi.</p>
                  <Link href="/contact?subject=Partnership Application">
                    <Button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
