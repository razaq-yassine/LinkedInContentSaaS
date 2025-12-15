import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">ContentAI</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-slate-900">
          LinkedIn Posts That Sound Like <span className="text-blue-600">You</span>
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          AI-powered content generation that matches your authentic voice. No more generic posts.
          Create content that engages, built on your expertise and writing style.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Start Creating Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Why ContentAI?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-xl font-bold mb-2">Authentic Voice</h4>
            <p className="text-slate-600">
              AI learns your writing style from your past posts. Every post sounds genuinely like you.
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="text-xl font-bold mb-2">Smart Generation</h4>
            <p className="text-slate-600">
              Comment worthiness evaluation ensures you only engage when you can add real value.
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-bold mb-2">Professional Results</h4>
            <p className="text-slate-600">
              Top creator format with hooks, data-driven insights, and powerful endings.
            </p>
          </Card>
        </div>
      </section>

      {/* Features List */}
      <section className="container mx-auto px-4 py-20 bg-white rounded-2xl my-12">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Everything You Need</h3>
          <div className="space-y-6">
            {[
              "AI analyzes your CV and writing style",
              "Chat-based post generation interface",
              "Comment worthiness evaluation (24-point rubric)",
              "Multiple content formats (Text, Carousel, Image prompts)",
              "Customizable preferences and toggles",
              "Content history and performance tracking",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  ✓
                </div>
                <p className="text-lg text-slate-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Create Better Content?</h3>
        <p className="text-xl text-slate-600 mb-8">
          Join professionals who are building their personal brand with authentic content.
        </p>
        <Link href="/login">
          <Button size="lg" className="text-lg px-12">
            Get Started Now
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>&copy; 2025 ContentAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
