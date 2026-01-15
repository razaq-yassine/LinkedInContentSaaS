import { Header, Footer } from "@/components/landing";
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquare,
  Mail,
  ArrowRight,
  ChevronRight,
  Zap,
  Brain,
  Calendar,
  BarChart3,
  CreditCard,
  Shield
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const categories = [
  {
    icon: Zap,
    title: "Getting Started",
    description: "New to PostInAi? Start here.",
    articles: [
      "How to create your first post",
      "Setting up your voice profile",
      "Connecting your LinkedIn account",
      "Understanding the dashboard",
    ],
    color: "violet",
  },
  {
    icon: Brain,
    title: "AI Features",
    description: "Learn about our AI capabilities.",
    articles: [
      "How voice matching works",
      "Training the AI on your style",
      "Generating different content types",
      "Using AI suggestions effectively",
    ],
    color: "blue",
  },
  {
    icon: Calendar,
    title: "Scheduling & Publishing",
    description: "Master content scheduling.",
    articles: [
      "Scheduling posts in advance",
      "Best times to post",
      "Managing your content queue",
      "Publishing directly to LinkedIn",
    ],
    color: "green",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Understand your performance.",
    articles: [
      "Reading your analytics dashboard",
      "Understanding engagement metrics",
      "AI-powered insights explained",
      "Tracking follower growth",
    ],
    color: "orange",
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Manage your subscription.",
    articles: [
      "Upgrading your plan",
      "Understanding usage limits",
      "Cancellation and refunds",
      "Invoice and payment history",
    ],
    color: "pink",
  },
  {
    icon: Shield,
    title: "Account & Security",
    description: "Keep your account secure.",
    articles: [
      "Changing your password",
      "Two-factor authentication",
      "Data privacy and security",
      "Deleting your account",
    ],
    color: "gray",
  },
];

const popularArticles = [
  "How to create your first AI-generated post",
  "Understanding your voice profile",
  "Why is my post not generating?",
  "How to upgrade to Pro plan",
  "Connecting LinkedIn - troubleshooting",
];

const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
  cyan: { bg: "hover:border-cyan-500/30", text: "text-cyan-400", iconBg: "bg-cyan-500/10 border border-cyan-500/20" },
  teal: { bg: "hover:border-teal-500/30", text: "text-teal-400", iconBg: "bg-teal-500/10 border border-teal-500/20" },
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="pt-32">
        {/* Hero with Search */}
        <section className="pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center py-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                How can we help?
              </h1>

              <p className="text-xl text-slate-400 mb-8">
                Search our knowledge base or browse categories below.
              </p>

              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-12 border-b border-slate-800">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Popular Articles</h2>
              <div className="flex flex-wrap gap-2">
                {popularArticles.map((article, i) => (
                  <Link
                    key={i}
                    href={`/help/article/${article.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-4 py-2 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 rounded-full text-sm transition-colors"
                  >
                    {article}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, i) => {
                  const colors = colorClasses[category.color];
                  return (
                    <div
                      key={i}
                      className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 ${colors.bg} transition-colors`}
                    >
                      <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                        <category.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{category.title}</h3>
                      <p className="text-sm text-slate-500 mb-4">{category.description}</p>
                      <ul className="space-y-2">
                        {category.articles.map((article, j) => (
                          <li key={j}>
                            <Link
                              href={`/help/article/${article.toLowerCase().replace(/\s+/g, '-')}`}
                              className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                              {article}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Still need help?
                </h2>
                <p className="text-slate-400">
                  Our support team is here to help you succeed.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 text-center">
                  <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">Documentation</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Detailed guides and tutorials
                  </p>
                  <Link href="/docs">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                      View Docs
                    </Button>
                  </Link>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 text-center">
                  <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">Live Chat</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Chat with our support team
                  </p>
                  <Button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-lg shadow-violet-500/25">
                    Start Chat
                  </Button>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 text-center">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">Email Support</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    We&apos;ll respond within 24 hours
                  </p>
                  <Link href="mailto:support@postinai.com">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                      Send Email
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {[
                  { q: "How does the AI learn my writing style?", a: "Our AI analyzes your past LinkedIn posts, writing samples, and voice recordings to create a unique voice profile that captures your tone, vocabulary, and style." },
                  { q: "Can I edit the AI-generated content?", a: "Absolutely! You have full control to edit, regenerate, or refine any content before publishing. The AI is a starting point, not the final word." },
                  { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption and never share your data. Your content is never used to train our models without explicit consent." },
                  { q: "What if I'm not satisfied with the output?", a: "You can regenerate content unlimited times, adjust your voice profile, or contact support for personalized help optimizing your results." },
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                    <p className="text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/pricing">
                  <Button variant="outline" className="rounded-full border-slate-700 text-slate-300 hover:bg-slate-800">
                    View All FAQs
                    <ArrowRight className="w-4 h-4 ml-2" />
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
