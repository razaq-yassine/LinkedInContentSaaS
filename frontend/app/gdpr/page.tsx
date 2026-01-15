import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Shield, Globe, FileCheck, UserCheck, Download, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GDPRPage() {
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
                <span>GDPR Compliance</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                GDPR Compliance
              </h1>
              
              <p className="text-lg text-slate-400">
                PostInAi is committed to protecting the privacy rights of individuals in the European Union (EU) and European Economic Area (EEA) under the General Data Protection Regulation (GDPR).
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* Our Commitment */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Our GDPR Commitment</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>As a US-based company serving customers worldwide, we have implemented comprehensive measures to comply with GDPR requirements:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• We only process personal data with a valid legal basis</li>
                    <li>• We implement data protection by design and by default</li>
                    <li>• We maintain records of all data processing activities</li>
                    <li>• We have appointed a Data Protection Officer (DPO)</li>
                    <li>• We use Standard Contractual Clauses (SCCs) for data transfers</li>
                  </ul>
                </div>
              </div>

              {/* Legal Basis */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Legal Basis for Processing</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>We process your personal data based on the following legal grounds:</p>
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-2">Contract Performance</h4>
                      <p className="text-sm">Processing necessary to provide our services, manage your account, and fulfill our contractual obligations.</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-2">Consent</h4>
                      <p className="text-sm">Processing based on your explicit consent, such as marketing communications and AI model training.</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-2">Legitimate Interests</h4>
                      <p className="text-sm">Processing necessary for our legitimate business interests, such as security, fraud prevention, and service improvement.</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-2">Legal Obligations</h4>
                      <p className="text-sm">Processing required to comply with applicable laws and regulations.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Rights */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Your GDPR Rights</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-slate-400">
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right of Access</h4>
                    <p className="text-sm">Request a copy of your personal data we hold.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Rectification</h4>
                    <p className="text-sm">Request correction of inaccurate personal data.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Erasure</h4>
                    <p className="text-sm">Request deletion of your personal data (&quot;right to be forgotten&quot;).</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Restrict Processing</h4>
                    <p className="text-sm">Request limitation of how we use your data.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Data Portability</h4>
                    <p className="text-sm">Receive your data in a structured, machine-readable format.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Object</h4>
                    <p className="text-sm">Object to processing based on legitimate interests.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Withdraw Consent</h4>
                    <p className="text-sm">Withdraw consent at any time for consent-based processing.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Right to Lodge a Complaint</h4>
                    <p className="text-sm">File a complaint with a supervisory authority.</p>
                  </div>
                </div>
              </div>

              {/* Exercise Your Rights */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Exercise Your Rights</h2>
                </div>
                <div className="space-y-4 text-slate-300">
                  <p>To exercise any of your GDPR rights, you can:</p>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Link href="/contact">
                      <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Request Data Export
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Request Data Deletion
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm mt-4">We will respond to your request within 30 days. You may also email us directly at <a href="mailto:dpo@contentai.com" className="text-cyan-400 hover:underline">dpo@contentai.com</a>.</p>
                </div>
              </div>

              {/* Data Transfers */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">International Data Transfers</h2>
                </div>
                <div className="space-y-4 text-slate-400">
                  <p>When we transfer personal data from the EU/EEA to the United States, we rely on:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong className="text-white">Standard Contractual Clauses (SCCs)</strong> - EU-approved contractual safeguards</li>
                    <li>• <strong className="text-white">Supplementary Measures</strong> - Additional technical and organizational protections</li>
                    <li>• <strong className="text-white">Data Processing Agreements</strong> - With all sub-processors</li>
                  </ul>
                </div>
              </div>

              {/* Contact DPO */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Contact Our Data Protection Officer</h2>
                </div>
                <div className="text-slate-400">
                  <p className="mb-4">For any GDPR-related inquiries or concerns, contact our Data Protection Officer:</p>
                  <div className="space-y-2">
                    <p><strong className="text-white">Email:</strong> <a href="mailto:dpo@contentai.com" className="text-cyan-400 hover:underline">dpo@contentai.com</a></p>
                    <p><strong className="text-white">Address:</strong> Data Protection Officer, PostInAi Inc., 548 Market St #82756, San Francisco, CA 94104, USA</p>
                  </div>
                  <p className="mt-4">You also have the right to lodge a complaint with your local data protection authority if you believe we have not adequately addressed your concerns.</p>
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
