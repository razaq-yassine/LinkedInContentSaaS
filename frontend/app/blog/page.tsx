import { Header, Footer } from "@/components/landing";
import { 
  BookOpen, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Brain,
  Lightbulb,
  Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const featuredPost = {
  title: "The Future of LinkedIn Content: How AI is Changing Personal Branding",
  excerpt: "Discover how artificial intelligence is revolutionizing the way professionals create and share content on LinkedIn, and what it means for your personal brand.",
  category: "AI & Technology",
  readTime: "8 min read",
  date: "Dec 28, 2025",
  image: "bg-gradient-to-br from-violet-500 to-indigo-600",
};

const posts = [
  {
    title: "10 LinkedIn Post Hooks That Stop the Scroll",
    excerpt: "Learn the psychology behind attention-grabbing opening lines that make people stop scrolling and start reading.",
    category: "LinkedIn Tips",
    readTime: "5 min read",
    date: "Dec 25, 2025",
    icon: Lightbulb,
  },
  {
    title: "How to Build a Content Calendar That Actually Works",
    excerpt: "A step-by-step guide to planning your LinkedIn content strategy for maximum consistency and engagement.",
    category: "Strategy",
    readTime: "7 min read",
    date: "Dec 22, 2025",
    icon: TrendingUp,
  },
  {
    title: "The Science of Viral LinkedIn Posts",
    excerpt: "We analyzed 10,000 viral posts to understand what makes content spread on LinkedIn. Here's what we found.",
    category: "Research",
    readTime: "10 min read",
    date: "Dec 19, 2025",
    icon: Brain,
  },
  {
    title: "Personal Branding for Introverts",
    excerpt: "You don't need to be loud to build a powerful personal brand. Here's how introverts can shine on LinkedIn.",
    category: "Personal Branding",
    readTime: "6 min read",
    date: "Dec 16, 2025",
    icon: Users,
  },
  {
    title: "AI Writing Tools: A Complete Comparison",
    excerpt: "We tested 15 AI writing tools for LinkedIn content. Here's our honest review and recommendations.",
    category: "Tools",
    readTime: "12 min read",
    date: "Dec 13, 2025",
    icon: Brain,
  },
  {
    title: "The Best Times to Post on LinkedIn in 2026",
    excerpt: "New data reveals when your audience is most active. Optimize your posting schedule for maximum reach.",
    category: "Analytics",
    readTime: "4 min read",
    date: "Dec 10, 2025",
    icon: TrendingUp,
  },
];

const categories = [
  { name: "All", count: 48 },
  { name: "LinkedIn Tips", count: 15 },
  { name: "AI & Technology", count: 12 },
  { name: "Personal Branding", count: 10 },
  { name: "Strategy", count: 8 },
  { name: "Success Stories", count: 3 },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" />
                <span>PostInAi Blog</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Insights for{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  LinkedIn success
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Expert tips, AI insights, and strategies to grow your personal brand and generate leads on LinkedIn.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-8">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {categories.map((cat, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    i === 0 
                      ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <Link href="/blog/future-of-linkedin-content">
                <div className="group relative rounded-2xl overflow-hidden border border-slate-700/50">
                  <div className="bg-gradient-to-br from-violet-600 to-cyan-600 h-96 lg:h-[500px]">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm w-fit mb-4">
                        {featuredPost.category}
                      </span>
                      <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4 group-hover:text-cyan-200 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-white/80 mb-4 max-w-2xl">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span>{featuredPost.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => (
                  <Link key={i} href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <article className="group bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all h-full">
                      <div className="h-48 bg-slate-800/50 flex items-center justify-center">
                        <post.icon className="w-16 h-16 text-slate-600 group-hover:text-violet-400 transition-colors" />
                      </div>
                      <div className="p-6">
                        <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">
                          {post.category}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-2 mb-2 group-hover:text-violet-400 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Button variant="outline" className="rounded-full px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                  Load More Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Get weekly LinkedIn tips in your inbox
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join 10,000+ professionals getting actionable insights to grow their LinkedIn presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-6 shadow-lg shadow-cyan-500/25">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
