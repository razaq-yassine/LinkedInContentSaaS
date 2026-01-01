import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Brain, Target, Heart, Sparkles, Users, Globe, Rocket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const team = [
  { name: "Alex Chen", role: "CEO & Co-founder", image: "AC", bio: "Former LinkedIn PM, Stanford CS" },
  { name: "Sarah Johnson", role: "CTO & Co-founder", image: "SJ", bio: "Ex-Google AI researcher" },
  { name: "Marcus Williams", role: "Head of Product", image: "MW", bio: "10+ years in SaaS" },
  { name: "Emily Rodriguez", role: "Head of AI", image: "ER", bio: "PhD in NLP, MIT" },
];

const values = [
  { icon: Heart, title: "User First", description: "Everything we build starts with understanding our users' needs and challenges." },
  { icon: Sparkles, title: "AI for Good", description: "We believe AI should augment human creativity, not replace it." },
  { icon: Target, title: "Excellence", description: "We set high standards and continuously strive to exceed them." },
  { icon: Users, title: "Community", description: "We're building more than a product—we're building a community of creators." },
];

const milestones = [
  { year: "2023", title: "Founded", description: "ContentAI was born from a simple idea: AI should help you sound more like yourself." },
  { year: "2024", title: "Launch", description: "Launched our beta with voice matching technology and reached 1,000 users." },
  { year: "2025", title: "Growth", description: "Expanded to 10,000+ users and introduced advanced analytics." },
  { year: "2026", title: "Today", description: "Serving 50,000+ creators worldwide with industry-leading AI." },
];

export default function AboutPage() {
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
                <Brain className="w-4 h-4" />
                <span>About ContentAI</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Empowering creators to{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  share their voice
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                We&apos;re on a mission to help professionals share their expertise and grow their personal brand on LinkedIn—authentically and efficiently.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                  <p className="text-slate-400 mb-4">
                    LinkedIn has become the world&apos;s most important professional platform, but creating consistent, engaging content takes time most professionals don&apos;t have.
                  </p>
                  <p className="text-slate-400 mb-4">
                    We founded ContentAI to solve this problem—not by generating generic content, but by building AI that truly understands and replicates your unique voice.
                  </p>
                  <p className="text-slate-400">
                    Our proprietary voice matching technology analyzes your writing patterns, tone, and style to generate content that sounds authentically like you.
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-2">50K+</p>
                      <p className="text-slate-500">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-2">2M+</p>
                      <p className="text-slate-500">Posts Generated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-2">95%</p>
                      <p className="text-slate-500">Voice Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-2">50+</p>
                      <p className="text-slate-500">Countries</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Our Values</h2>
                <p className="text-slate-400">The principles that guide everything we do.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{value.title}</h3>
                    <p className="text-slate-500 text-sm">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Our Journey</h2>
                <p className="text-slate-400">From idea to industry leader.</p>
              </div>
              
              <div className="space-y-6">
                {milestones.map((milestone, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-20 flex-shrink-0">
                      <span className="text-cyan-400 font-bold">{milestone.year}</span>
                    </div>
                    <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-slate-400 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Leadership Team</h2>
                <p className="text-slate-400">The people building the future of content creation.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                      {member.image}
                    </div>
                    <h3 className="text-white font-semibold">{member.name}</h3>
                    <p className="text-violet-400 text-sm mb-2">{member.role}</p>
                    <p className="text-slate-500 text-sm">{member.bio}</p>
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
                <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Join Us on Our Mission</h2>
                <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                  Whether you&apos;re looking to try our product or join our team, we&apos;d love to hear from you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                      <Rocket className="w-5 h-5 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/careers">
                    <Button size="lg" variant="outline" className="rounded-full px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                      View Open Positions
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
