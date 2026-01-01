import { Header, Footer } from "@/components/landing";
import { Check, Zap, Crown, Building2, ArrowRight, HelpCircle, Sparkles, Brain, Cpu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, type Plan } from "@/app/api-config";

const planIcons: Record<string, React.ElementType> = {
  free: Zap,
  pro: Crown,
  agency: Building2,
};

const planGradients: Record<string, string> = {
  free: "from-gray-500 to-gray-600",
  pro: "from-violet-600 to-indigo-600",
  agency: "from-emerald-500 to-teal-600",
};

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

const faqs = [
  {
    question: "How does the AI learn my unique voice?",
    answer: "Our advanced neural network analyzes your past LinkedIn posts, writing patterns, vocabulary choices, and professional background. It learns your tone, style, and the topics you're passionate about to generate content that sounds authentically like you.",
  },
  {
    question: "What AI models power ContentAI?",
    answer: "We use state-of-the-art large language models fine-tuned specifically for LinkedIn content. Our AI understands LinkedIn's algorithm, engagement patterns, and what makes posts go viral while maintaining your authentic voice.",
  },
  {
    question: "Can I try ContentAI for free?",
    answer: "Yes! Our Free plan lets you generate up to 5 AI-powered posts per month. No credit card required. Experience the power of AI-driven content creation risk-free.",
  },
  {
    question: "How accurate is the voice matching?",
    answer: "Our voice matching technology achieves 95%+ accuracy after analyzing just 3-5 of your existing posts. The more content you provide, the better the AI understands your unique style.",
  },
  {
    question: "Can I generate images and carousels?",
    answer: "Yes! Pro and Agency plans include AI-generated images and carousel designs. Our image AI creates stunning visuals that complement your posts and increase engagement.",
  },
  {
    question: "Is my data used to train AI models?",
    answer: "No. Your content and data are never used to train our models. Your information is encrypted, private, and only used to improve your personal content generation.",
  },
];

async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscription/plans`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  } catch {
    // Fallback plans if API is unavailable
    return [
      {
        id: "1",
        plan_name: "free",
        display_name: "Free Plan",
        description: "Perfect for getting started with AI content",
        price_monthly: 0,
        price_yearly: 0,
        posts_limit: 5,
        features: ["5 AI posts per month", "Basic voice analysis", "Text posts only", "Email support"],
        is_active: true,
        sort_order: 1,
      },
      {
        id: "2",
        plan_name: "pro",
        display_name: "Pro Plan",
        description: "For creators serious about growth",
        price_monthly: 2900,
        price_yearly: 29000,
        posts_limit: 50,
        features: ["50 AI posts per month", "Advanced voice matching", "All post formats", "Priority support", "Custom writing style", "Analytics dashboard"],
        is_active: true,
        sort_order: 2,
      },
      {
        id: "3",
        plan_name: "agency",
        display_name: "Agency Plan",
        description: "For teams and agencies",
        price_monthly: 9900,
        price_yearly: 99000,
        posts_limit: 500,
        features: ["500 AI posts per month", "Premium AI models", "Multi-user access", "API access", "White-label options", "Dedicated support"],
        is_active: true,
        sort_order: 3,
      },
    ];
  }
}

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              <span>AI-Powered Pricing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Invest in{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                AI-powered growth
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your content goals. All plans include our cutting-edge AI that learns your voice and creates authentic content.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, i) => {
                const IconComponent = planIcons[plan.plan_name] || Zap;
                const gradient = planGradients[plan.plan_name] || "from-gray-500 to-gray-600";
                const isPopular = plan.plan_name === "pro";
                
                return (
                  <div
                    key={plan.id}
                    className="relative group"
                  >
                    {/* Card Glow */}
                    {isPopular && (
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                    )}
                    
                    <div className={`relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border ${
                      isPopular ? "border-violet-500/50" : "border-slate-700/50"
                    } p-8 flex flex-col h-full`}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Most Popular
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.display_name}</h3>
                      <p className="text-slate-500 mb-6">{plan.description}</p>
                      
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-white">{formatPrice(plan.price_monthly)}</span>
                        {plan.price_monthly > 0 && <span className="text-slate-500">/month</span>}
                      </div>
                      {plan.price_monthly > 0 && (
                        <p className="text-sm text-emerald-400 mb-6">
                          Save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% with annual billing
                        </p>
                      )}
                      {plan.price_monthly === 0 && <div className="mb-6" />}
                      
                      <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span>{plan.posts_limit} AI-generated posts/month</span>
                      </div>
                      
                      <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isPopular ? "bg-cyan-500/20" : "bg-emerald-500/20"
                            }`}>
                              <Check className={`w-3 h-3 ${isPopular ? "text-cyan-400" : "text-emerald-400"}`} />
                            </div>
                            <span className="text-slate-400">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link href="/login">
                        <Button 
                          className={`w-full py-6 text-lg font-semibold rounded-xl ${
                            isPopular 
                              ? "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20" 
                              : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                          }`}
                        >
                          {plan.price_monthly === 0 ? "Get Started Free" : "Start Free Trial"}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI Features Banner */}
        <section className="py-16 bg-gradient-to-r from-cyan-900/50 via-slate-900 to-teal-900/50 border-y border-slate-800">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Neural Voice Matching</div>
                  <div className="text-slate-500 text-sm">95% accuracy</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">GPT-4 Powered</div>
                  <div className="text-slate-500 text-sm">Latest AI models</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Smart Optimization</div>
                  <div className="text-slate-500 text-sm">Algorithm-aware</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <HelpCircle className="w-4 h-4" />
                <span>AI & Pricing FAQs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently asked questions
              </h2>
              <p className="text-slate-400">Everything you need to know about our AI and pricing</p>
            </div>
            
            <div className="max-w-3xl mx-auto grid gap-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to let AI transform your LinkedIn?
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals using AI to create content that sounds like them and converts like magic.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-lg shadow-cyan-500/25">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
