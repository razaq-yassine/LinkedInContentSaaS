import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Plug, Linkedin, Calendar, BarChart3, Slack, Chrome, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const integrations = [
  {
    name: "LinkedIn",
    description: "Post directly to LinkedIn with one click. Schedule posts for optimal engagement times.",
    icon: Linkedin,
    status: "Available",
    color: "cyan",
    features: ["Direct posting", "Scheduled publishing", "Analytics sync", "Profile management"]
  },
  {
    name: "Google Calendar",
    description: "Sync your content calendar with Google Calendar to never miss a posting day.",
    icon: Calendar,
    status: "Available",
    color: "emerald",
    features: ["Two-way sync", "Event reminders", "Team calendars", "Time zone support"]
  },
  {
    name: "Slack",
    description: "Get notifications and collaborate on content directly in your Slack workspace.",
    icon: Slack,
    status: "Available",
    color: "violet",
    features: ["Post notifications", "Team collaboration", "Approval workflows", "Daily digests"]
  },
  {
    name: "Google Analytics",
    description: "Track how your LinkedIn posts drive traffic to your website.",
    icon: BarChart3,
    status: "Available",
    color: "amber",
    features: ["Traffic tracking", "UTM parameters", "Goal conversions", "Custom reports"]
  },
  {
    name: "Chrome Extension",
    description: "Generate AI content while browsing LinkedIn directly from your browser.",
    icon: Chrome,
    status: "Available",
    color: "fuchsia",
    features: ["In-browser generation", "Quick actions", "Profile analysis", "Comment suggestions"]
  },
  {
    name: "Zapier",
    description: "Connect ContentAI to 5,000+ apps with automated workflows.",
    icon: Zap,
    status: "Coming Soon",
    color: "orange",
    features: ["5,000+ app connections", "Automated workflows", "Triggers & actions", "Multi-step zaps"]
  },
];

const useCases = [
  { title: "Marketing Teams", description: "Coordinate content across team members with Slack notifications and approval workflows." },
  { title: "Solo Creators", description: "Automate your posting schedule and track results without switching apps." },
  { title: "Agencies", description: "Manage multiple client accounts with direct LinkedIn integration and analytics." },
];

export default function IntegrationsPage() {
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
                <Plug className="w-4 h-4" />
                <span>Integrations</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Connect your{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  favorite tools
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                ContentAI integrates seamlessly with the tools you already use, making your content workflow smoother than ever.
              </p>
              
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Integrations Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Available Integrations</h2>
                <p className="text-slate-400">Connect ContentAI with your existing workflow.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-${integration.color}-500/10 border border-${integration.color}-500/20 rounded-xl flex items-center justify-center`}>
                        <integration.icon className={`w-6 h-6 text-${integration.color}-400`} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        integration.status === 'Available' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {integration.status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{integration.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{integration.description}</p>
                    
                    <ul className="space-y-2">
                      {integration.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-slate-500 text-sm">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {feature}
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
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                <p className="text-slate-400">Set up integrations in minutes.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-400 font-bold text-2xl">
                    1
                  </div>
                  <h3 className="text-white font-semibold mb-2">Connect</h3>
                  <p className="text-slate-500 text-sm">Click connect and authorize access with a single click. No technical setup required.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400 font-bold text-2xl">
                    2
                  </div>
                  <h3 className="text-white font-semibold mb-2">Configure</h3>
                  <p className="text-slate-500 text-sm">Customize settings to match your workflow. Choose what syncs and when.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 font-bold text-2xl">
                    3
                  </div>
                  <h3 className="text-white font-semibold mb-2">Automate</h3>
                  <p className="text-slate-500 text-sm">Let integrations work in the background while you focus on creating great content.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Built for Your Workflow</h2>
                <p className="text-slate-400">See how different teams use our integrations.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {useCases.map((useCase, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-2">{useCase.title}</h3>
                    <p className="text-slate-400 text-sm">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Build Custom Integrations</h2>
                  <p className="text-slate-400 mb-6">
                    Need a custom integration? Our REST API lets you build exactly what you need. Generate content, manage posts, and access analytics programmatically.
                  </p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>Full REST API access</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>Webhooks for real-time events</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>SDKs for Python, JavaScript, and more</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>Comprehensive documentation</span>
                    </div>
                  </div>
                  <Link href="/docs">
                    <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white">
                      View API Docs
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Example API Call</span>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-slate-300">
{`POST /api/v1/posts/generate

{
  "topic": "AI productivity tips",
  "tone": "professional",
  "length": "medium",
  "schedule": "2026-01-15T09:00:00Z"
}

// Response
{
  "id": "post_abc123",
  "content": "...",
  "scheduled_at": "2026-01-15T09:00:00Z",
  "status": "scheduled"
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-12">
                <Plug className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Streamline Your Workflow?</h2>
                <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                  Start using ContentAI with your favorite tools today. All integrations are included in every plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="rounded-full px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                      Request an Integration
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
