import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Eye, Database, UserCheck, Globe, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                <Shield className="w-4 h-4" />
                <span>Privacy Policy</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Your privacy matters to us
              </h1>
              
              <p className="text-lg text-slate-400 mb-4">
                Last updated: January 1, 2026
              </p>
              <p className="text-slate-400">
                This Privacy Policy describes how ContentAI Inc. (&quot;ContentAI,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares information about you when you use our website, applications, and services.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* Information We Collect */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p><strong className="text-white">Personal Information:</strong> When you create an account, we collect your name, email address, and payment information (processed securely through Stripe).</p>
                  <p><strong className="text-white">Content Data:</strong> We collect the content you create, upload, or generate using our AI services, including LinkedIn posts and voice samples for voice matching.</p>
                  <p><strong className="text-white">Usage Data:</strong> We automatically collect information about how you interact with our services, including pages viewed, features used, and time spent.</p>
                  <p><strong className="text-white">Device Information:</strong> We collect device identifiers, browser type, operating system, and IP address for security and analytics purposes.</p>
                </div>
              </div>

              {/* How We Use Information */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
                </div>
                <ul className="space-y-3 text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To provide, maintain, and improve our AI content generation services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To train and improve our AI models (with your explicit consent)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To process payments and prevent fraud</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To send you service updates, security alerts, and support messages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To respond to your requests and provide customer support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>To comply with legal obligations</span>
                  </li>
                </ul>
              </div>

              {/* CCPA Rights */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Your California Privacy Rights (CCPA)</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):</p>
                  <ul className="space-y-3 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Right to Know:</strong> You can request information about the personal data we collect, use, and disclose.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Right to Delete:</strong> You can request deletion of your personal data, subject to certain exceptions.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Right to Opt-Out:</strong> You can opt-out of the sale of your personal information. Note: We do not sell personal information.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span><strong className="text-white">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</span>
                    </li>
                  </ul>
                  <p className="mt-4">To exercise these rights, contact us at <a href="mailto:privacy@contentai.com" className="text-cyan-400 hover:underline">privacy@contentai.com</a>.</p>
                </div>
              </div>

              {/* Data Security */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Data Security</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We implement industry-standard security measures to protect your personal information:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• End-to-end encryption for data in transit (TLS 1.3)</li>
                    <li>• AES-256 encryption for data at rest</li>
                    <li>• Regular security audits and penetration testing</li>
                    <li>• SOC 2 Type II compliance</li>
                    <li>• Multi-factor authentication support</li>
                  </ul>
                </div>
              </div>

              {/* Data Retention */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Data Retention & International Transfers</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We retain your personal information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.</p>
                  <p>Our servers are located in the United States. If you access our services from outside the US, your information may be transferred to and processed in the US, which may have different data protection laws than your country.</p>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Contact Us</h2>
                </div>
                <div className="text-slate-400">
                  <p className="mb-4">If you have questions about this Privacy Policy or our data practices, contact us:</p>
                  <div className="space-y-2">
                    <p><strong className="text-white">Email:</strong> <a href="mailto:privacy@contentai.com" className="text-cyan-400 hover:underline">privacy@contentai.com</a></p>
                    <p><strong className="text-white">Address:</strong> ContentAI Inc., 548 Market St #82756, San Francisco, CA 94104, USA</p>
                  </div>
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
