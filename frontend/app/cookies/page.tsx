import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Cookie, Settings, BarChart, Shield, ToggleRight, Scale, MapPin } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="pb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Cookie className="w-4 h-4" />
                <span>Cookie Policy</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Cookie Policy
              </h1>
              
              <p className="text-lg text-slate-400 mb-4">
                Last updated: January 1, 2026
              </p>
              <p className="text-slate-400">
                This Cookie Policy explains how PostInAi Inc. uses cookies and similar technologies when you visit our website and use our services.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* What Are Cookies */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">What Are Cookies?</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience.</p>
                  <p>We also use similar technologies like local storage, pixels, and beacons for similar purposes.</p>
                </div>
              </div>

              {/* Types of Cookies */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Types of Cookies We Use</h2>
                </div>
                <div className="space-y-6 text-slate-400">
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Essential Cookies</h3>
                    <p>Required for basic website functionality. These cannot be disabled as they are necessary for the site to work properly.</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Session management and authentication</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Load balancing and server routing</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Functional Cookies</h3>
                    <p>Enable enhanced functionality and personalization, such as remembering your preferences.</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Language preferences</li>
                      <li>• User interface customization</li>
                      <li>• Recently viewed content</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Analytics Cookies</h3>
                    <p>Help us understand how visitors interact with our website to improve our services.</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Page views and navigation patterns</li>
                      <li>• Feature usage statistics</li>
                      <li>• Performance monitoring</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Marketing Cookies</h3>
                    <p>Used to deliver relevant advertisements and track campaign effectiveness.</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Targeted advertising</li>
                      <li>• Social media integration</li>
                      <li>• Conversion tracking</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Third-Party Cookies */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Third-Party Services</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We use cookies from these trusted third-party services:</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-1">Google Analytics</h4>
                      <p className="text-sm">Website traffic analysis</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-1">Stripe</h4>
                      <p className="text-sm">Payment processing</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-1">Intercom</h4>
                      <p className="text-sm">Customer support chat</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-1">LinkedIn</h4>
                      <p className="text-sm">OAuth and integrations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* US Privacy Rights */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    <Scale className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Your US Privacy Rights</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>Under various US state privacy laws, you have specific rights regarding cookies and online tracking:</p>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">California (CCPA/CPRA)</h3>
                    <p className="text-sm">California residents have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information, including data collected via cookies. We honor the Global Privacy Control (GPC) signal.</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Virginia, Colorado, Connecticut, Utah & Other States</h3>
                    <p className="text-sm">Residents of states with comprehensive privacy laws can opt out of targeted advertising and the processing of personal data for certain purposes.</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h3 className="text-white font-semibold mb-2">Global Privacy Control (GPC)</h3>
                    <p className="text-sm">We recognize and honor browser-based opt-out signals including the Global Privacy Control. When we detect a GPC signal, we automatically limit non-essential cookies.</p>
                  </div>
                  
                  <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <p className="text-cyan-200 text-sm"><strong>Do Not Sell or Share My Personal Information:</strong> To exercise your right to opt out, use our cookie banner, adjust your browser settings, or contact us at <a href="mailto:privacy@contentai.com" className="underline hover:text-cyan-400">privacy@contentai.com</a>.</p>
                  </div>
                </div>
              </div>

              {/* State-by-State Compliance */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">State Privacy Law Compliance</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We comply with the following US state privacy laws that regulate cookies and online tracking:</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">California (CCPA/CPRA)</p>
                      <p className="text-xs text-slate-500">Effective Jan 1, 2023</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">Virginia (VCDPA)</p>
                      <p className="text-xs text-slate-500">Effective Jan 1, 2023</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">Colorado (CPA)</p>
                      <p className="text-xs text-slate-500">Effective Jul 1, 2023</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">Connecticut (CTDPA)</p>
                      <p className="text-xs text-slate-500">Effective Jul 1, 2023</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">Utah (UCPA)</p>
                      <p className="text-xs text-slate-500">Effective Dec 31, 2023</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm">Texas, Oregon, Montana & More</p>
                      <p className="text-xs text-slate-500">Effective 2024-2025</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Managing Cookies */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Managing Your Cookie Preferences</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>You can control cookies in several ways:</p>
                  <ul className="space-y-3 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Cookie Banner:</strong> Use our cookie consent banner to manage your preferences when you first visit our site. You can accept all, reject optional cookies, or customize your choices.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Browser Settings:</strong> Most browsers allow you to block or delete cookies. Check your browser&apos;s help section for instructions.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Global Privacy Control:</strong> Enable GPC in your browser to automatically signal your opt-out preference to websites.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Opt-Out Links:</strong> Use industry opt-out tools like the <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">NAI Consumer Opt-Out</a> or <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">DAA Opt-Out</a>.</span>
                    </li>
                  </ul>
                  <p className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
                    <strong>Note:</strong> Disabling certain cookies may affect the functionality of our services.
                  </p>
                </div>
              </div>

              {/* Updates */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Updates to This Policy</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We may update this Cookie Policy from time to time. We will notify you of significant changes by posting a notice on our website or sending you an email.</p>
                  <p>For questions about our use of cookies, contact us at <a href="mailto:privacy@contentai.com" className="text-cyan-400 hover:underline">privacy@contentai.com</a>.</p>
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
