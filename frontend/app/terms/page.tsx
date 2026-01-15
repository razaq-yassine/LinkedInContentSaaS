import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { FileText, Scale, AlertTriangle, CreditCard, Ban, RefreshCw } from "lucide-react";

export default function TermsOfServicePage() {
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
                <FileText className="w-4 h-4" />
                <span>Terms of Service</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Terms of Service
              </h1>

              <p className="text-lg text-slate-400 mb-4">
                Last updated: January 1, 2026
              </p>
              <p className="text-slate-400">
                Please read these Terms of Service (&quot;Terms&quot;) carefully before using PostInAi&apos;s services. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

              {/* Acceptance */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Scale className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>By creating an account or using PostInAi services, you agree to these Terms of Service, our Privacy Policy, and any additional terms that may apply. If you do not agree, do not use our services.</p>
                  <p>You must be at least 18 years old and capable of forming a binding contract to use our services. By using PostInAi, you represent that you meet these requirements.</p>
                </div>
              </div>

              {/* Service Description */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">2. Service Description</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>PostInAi provides AI-powered content generation services for LinkedIn, including:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• AI-generated post creation and optimization</li>
                    <li>• Voice matching technology to replicate your writing style</li>
                    <li>• Content scheduling and calendar management</li>
                    <li>• Analytics and performance tracking</li>
                    <li>• Integration with LinkedIn and other platforms</li>
                  </ul>
                  <p>We reserve the right to modify, suspend, or discontinue any part of our services at any time with reasonable notice.</p>
                </div>
              </div>

              {/* User Responsibilities */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">3. User Responsibilities</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>You are responsible for:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Maintaining the confidentiality of your account credentials</li>
                    <li>• All activities that occur under your account</li>
                    <li>• Ensuring your content complies with LinkedIn&apos;s terms of service</li>
                    <li>• Not using the service for illegal, harmful, or misleading purposes</li>
                    <li>• Not attempting to reverse engineer or extract our AI models</li>
                    <li>• Not using automated means to access the service beyond intended use</li>
                  </ul>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">4. Payment & Subscription</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p><strong className="text-white">Free Plan:</strong> Includes limited features at no cost. No credit card required.</p>
                  <p><strong className="text-white">Paid Plans:</strong> Billed monthly or annually in advance. Payments are processed securely through Stripe.</p>
                  <p><strong className="text-white">Automatic Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date.</p>
                  <p><strong className="text-white">Refunds:</strong> We offer a 14-day money-back guarantee for first-time subscribers. After this period, refunds are provided at our discretion.</p>
                  <p><strong className="text-white">Price Changes:</strong> We may change prices with 30 days&apos; notice. Price changes take effect at your next billing cycle.</p>
                </div>
              </div>

              {/* Intellectual Property */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">5. Intellectual Property</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p><strong className="text-white">Your Content:</strong> You retain ownership of content you create using our services. You grant us a limited license to process your content to provide our services.</p>
                  <p><strong className="text-white">Our Services:</strong> PostInAi, including our AI models, software, and branding, are owned by PostInAi Inc. and protected by intellectual property laws.</p>
                  <p><strong className="text-white">AI-Generated Content:</strong> Content generated by our AI is owned by you. However, similar content may be generated for other users due to the nature of AI.</p>
                </div>
              </div>

              {/* Prohibited Uses */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                    <Ban className="w-6 h-6 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">6. Prohibited Uses</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>You may not use PostInAi to:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Generate spam, misleading, or fraudulent content</li>
                    <li>• Create content that infringes on others&apos; rights</li>
                    <li>• Harass, abuse, or harm others</li>
                    <li>• Violate any applicable laws or regulations</li>
                    <li>• Impersonate others or misrepresent your identity</li>
                    <li>• Distribute malware or engage in hacking activities</li>
                    <li>• Resell or redistribute our services without authorization</li>
                  </ul>
                </div>
              </div>

              {/* Termination */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-slate-500/10 border border-slate-500/20 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">7. Termination</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>You may cancel your account at any time through your account settings. We may suspend or terminate your account if you violate these Terms.</p>
                  <p>Upon termination, your right to use our services ends immediately. We will delete your data within 30 days unless required to retain it by law.</p>
                </div>
              </div>

              {/* Disclaimers */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">8. Disclaimers & Limitation of Liability</h2>
                <div className="space-y-4 text-slate-400">
                  <p>OUR SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT OUR SERVICES WILL BE ERROR-FREE OR UNINTERRUPTED.</p>
                  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, POSTINAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
                  <p>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
                </div>
              </div>

              {/* Governing Law */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">9. Governing Law & Disputes</h2>
                <div className="space-y-4 text-slate-400">
                  <p>These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.</p>
                  <p>Any disputes shall be resolved through binding arbitration in San Francisco, California, in accordance with the rules of the American Arbitration Association.</p>
                  <p>You waive any right to participate in class action lawsuits against PostInAi.</p>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">10. Contact Information</h2>
                <div className="text-slate-400">
                  <p className="mb-4">For questions about these Terms, contact us:</p>
                  <div className="space-y-2">
                    <p><strong className="text-white">Email:</strong> <a href="mailto:legal@postinai.com" className="text-teal-400 hover:underline">legal@postinai.com</a></p>
                    <p><strong className="text-white">Address:</strong> PostInAi Inc., 548 Market St #82756, San Francisco, CA 94104, USA</p>
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
