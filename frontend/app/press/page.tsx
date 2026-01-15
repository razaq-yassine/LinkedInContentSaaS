import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Newspaper, Download, Image, FileText, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const pressReleases = [
  { date: "Dec 15, 2025", title: "PostInAi Raises $15M Series A to Expand AI Voice Matching Technology", excerpt: "Funding led by Sequoia Capital will accelerate product development and global expansion." },
  { date: "Oct 3, 2025", title: "PostInAi Surpasses 50,000 Users, Generates 2 Million LinkedIn Posts", excerpt: "Milestone highlights growing demand for AI-powered content creation tools." },
  { date: "Jul 20, 2025", title: "PostInAi Launches Advanced Analytics Dashboard for Pro Users", excerpt: "New features help creators understand and optimize their LinkedIn performance." },
  { date: "Mar 8, 2025", title: "PostInAi Introduces Voice Matching 2.0 with 95% Accuracy", excerpt: "Breakthrough in AI technology enables more authentic content generation." },
];

const mediaFeatures = [
  { outlet: "TechCrunch", title: "PostInAi is changing how professionals create LinkedIn content", date: "Nov 2025" },
  { outlet: "Forbes", title: "10 AI Tools Every Professional Should Know in 2025", date: "Oct 2025" },
  { outlet: "The Verge", title: "The rise of AI content tools that don't sound like AI", date: "Sep 2025" },
  { outlet: "Business Insider", title: "This startup wants to clone your writing voice", date: "Aug 2025" },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="pt-32 pb-20 flex items-center justify-center min-h-[80vh]">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Newspaper className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Press Kit Coming Soon</h1>
            <p className="text-xl text-slate-400 mb-8">
              We&apos;re preparing our press resources. Please check back later or contact us directly for media inquiries.
            </p>
            <Link href="/contact?subject=Press Inquiry">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function PressPageDisabled() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Newspaper className="w-4 h-4" />
                <span>Press & Media</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Press Kit
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Resources for journalists and media professionals covering PostInAi.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact?subject=Press Inquiry">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8">
                    <Mail className="w-5 h-5 mr-2" />
                    Media Inquiries
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Download className="w-5 h-5 mr-2" />
                  Download Press Kit
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Company Info */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">About PostInAi</h2>
                  <div className="space-y-4 text-slate-400">
                    <p>
                      PostInAi is a New Mexico-based technology company that develops AI-powered content creation tools for LinkedIn professionals.
                    </p>
                    <p>
                      PostInAi&apos;s proprietary voice matching technology helps users create authentic content that matches their unique writing style.
                    </p>
                    <p>
                      The company has raised $18M in funding from leading investors including Sequoia Capital, Andreessen Horowitz, and Y Combinator.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                  <h3 className="text-white font-semibold mb-6">Quick Facts</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-800 pb-3">
                      <span className="text-slate-500">Founded</span>
                      <span className="text-white">2023</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-3">
                      <span className="text-slate-500">Headquarters</span>
                      <span className="text-white">New Mexico, USA</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-3">
                      <span className="text-slate-500">Employees</span>
                      <span className="text-white">35+</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-3">
                      <span className="text-slate-500">Users</span>
                      <span className="text-white">50,000+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Funding</span>
                      <span className="text-white">$18M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Assets */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">Brand Assets</h2>
                <p className="text-slate-400">Download official logos and brand materials.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">C</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Primary Logo</h3>
                  <p className="text-slate-500 text-sm mb-4">PNG, SVG formats</p>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Product Screenshots</h3>
                  <p className="text-slate-500 text-sm mb-4">High-res images</p>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Brand Guidelines</h3>
                  <p className="text-slate-500 text-sm mb-4">PDF document</p>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">Press Releases</h2>

              <div className="space-y-4">
                {pressReleases.map((release, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 rounded-xl p-6 transition-colors cursor-pointer">
                    <p className="text-cyan-400 text-sm mb-2">{release.date}</p>
                    <h3 className="text-white font-semibold text-lg mb-2">{release.title}</h3>
                    <p className="text-slate-400 text-sm">{release.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Media Coverage */}
        <section className="py-20 bg-slate-900/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">Media Coverage</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {mediaFeatures.map((feature, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex items-start justify-between">
                    <div>
                      <p className="text-cyan-400 font-semibold mb-1">{feature.outlet}</p>
                      <p className="text-white text-sm mb-2">{feature.title}</p>
                      <p className="text-slate-500 text-xs">{feature.date}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-12">
                <Mail className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Media Contact</h2>
                <p className="text-slate-400 mb-6">
                  For press inquiries, interview requests, or additional information, please contact our communications team.
                </p>
                <div className="text-slate-300">
                  <p><strong className="text-white">Email:</strong> <a href="mailto:press@postinai.com" className="text-cyan-400 hover:underline">press@postinai.com</a></p>
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
