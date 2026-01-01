import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Code, Book, Zap, Key, Webhook, Database, ArrowRight, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const quickStart = [
  { step: "1", title: "Get your API key", description: "Generate an API key from your dashboard settings." },
  { step: "2", title: "Install the SDK", description: "Install our official SDK for your preferred language." },
  { step: "3", title: "Make your first request", description: "Generate AI content with a simple API call." },
];

const endpoints = [
  { method: "POST", path: "/api/v1/posts/generate", description: "Generate a new LinkedIn post" },
  { method: "GET", path: "/api/v1/posts", description: "List all generated posts" },
  { method: "GET", path: "/api/v1/posts/{id}", description: "Get a specific post" },
  { method: "POST", path: "/api/v1/voice/analyze", description: "Analyze writing samples for voice matching" },
  { method: "GET", path: "/api/v1/voice/profile", description: "Get current voice profile" },
  { method: "GET", path: "/api/v1/analytics", description: "Get analytics data" },
];

const sdks = [
  { name: "Python", icon: "🐍", install: "pip install contentai" },
  { name: "JavaScript", icon: "🟨", install: "npm install @contentai/sdk" },
  { name: "Ruby", icon: "💎", install: "gem install contentai" },
  { name: "Go", icon: "🔵", install: "go get github.com/contentai/go-sdk" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="pb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Code className="w-4 h-4" />
                <span>API Documentation</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                API Documentation
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Integrate ContentAI&apos;s powerful AI content generation into your applications with our REST API.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 rounded-xl p-6 transition-colors cursor-pointer">
                  <Book className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Getting Started</h3>
                  <p className="text-slate-500 text-sm">Quick start guide</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 hover:border-violet-500/30 rounded-xl p-6 transition-colors cursor-pointer">
                  <Key className="w-8 h-8 text-violet-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Authentication</h3>
                  <p className="text-slate-500 text-sm">API keys & auth</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-6 transition-colors cursor-pointer">
                  <Webhook className="w-8 h-8 text-emerald-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Webhooks</h3>
                  <p className="text-slate-500 text-sm">Event notifications</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 rounded-xl p-6 transition-colors cursor-pointer">
                  <Database className="w-8 h-8 text-amber-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Rate Limits</h3>
                  <p className="text-slate-500 text-sm">Usage limits</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">Quick Start</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {quickStart.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-3 top-0 w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {item.step}
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 pl-8">
                      <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code Example */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">Example Request</span>
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-slate-300">
{`curl -X POST https://api.contentai.com/v1/posts/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "AI in marketing",
    "tone": "professional",
    "length": "medium"
  }'`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="py-12 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">Official SDKs</h2>
              
              <div className="grid md:grid-cols-4 gap-4">
                {sdks.map((sdk, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <span className="text-3xl mb-3 block">{sdk.icon}</span>
                    <h3 className="text-white font-semibold mb-2">{sdk.name}</h3>
                    <code className="text-cyan-400 text-xs bg-slate-800 px-2 py-1 rounded">{sdk.install}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">API Endpoints</h2>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {endpoints.map((endpoint, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-cyan-400 text-sm flex-1">{endpoint.path}</code>
                      <span className="text-slate-500 text-sm hidden md:block">{endpoint.description}</span>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section className="py-12 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Authentication</h2>
                  <div className="space-y-4 text-slate-400">
                    <p>
                      All API requests require authentication using an API key. Include your key in the Authorization header:
                    </p>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <code className="text-cyan-400 text-sm">Authorization: Bearer YOUR_API_KEY</code>
                    </div>
                    <p>
                      API keys can be generated from your dashboard. Keep your keys secure and never expose them in client-side code.
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Rate Limits</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Free Plan</span>
                        <span className="text-white font-mono">100 requests/day</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-slate-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Pro Plan</span>
                        <span className="text-white font-mono">1,000 requests/day</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-violet-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Agency Plan</span>
                        <span className="text-white font-mono">10,000 requests/day</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-12">
                <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Build?</h2>
                <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                  Get your API key and start integrating ContentAI into your application today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                      Get API Key
                    </Button>
                  </Link>
                  <a href="https://github.com/contentai" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="rounded-full px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on GitHub
                    </Button>
                  </a>
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
