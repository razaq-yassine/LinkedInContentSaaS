"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/landing";
import { Check, Zap, Crown, Building2, ArrowRight, HelpCircle, Sparkles, Brain, Cpu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, type Plan } from "@/app/api-config";

const planIcons: Record<string, React.ElementType> = {
  free: Zap,
  starter: Sparkles,
  pro: Crown,
  unlimited: Building2,
};

const planGradients: Record<string, string> = {
  free: "from-gray-500 to-gray-600",
  starter: "from-cyan-500 to-teal-500",
  pro: "from-violet-600 to-indigo-600",
  unlimited: "from-emerald-500 to-teal-600",
};

const faqs = [
  {
    question: "How does the AI learn my unique voice?",
    answer: "Our advanced neural network analyzes your past LinkedIn posts, writing patterns, vocabulary choices, and professional background. It learns your tone, style, and the topics you're passionate about to generate content that sounds authentically like you.",
  },
  {
    question: "What AI models power PostInAi?",
    answer: "We use state-of-the-art large language models fine-tuned specifically for LinkedIn content. Our AI understands LinkedIn's algorithm, engagement patterns, and what makes posts go viral while maintaining your authentic voice.",
  },
  {
    question: "Can I try PostInAi for free?",
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

const fallbackPlans: Plan[] = [
  {
    id: "1",
    plan_name: "free",
    display_name: "Free Plan",
    description: "Perfect for getting started with LinkedIn content generation",
    price_monthly: 0,
    price_yearly: 0,
    credits_limit: 5,
    estimated_posts: { min: 2, max: 10, display: "~2-10 posts" },
    features: ["5 credits per month (~2-10 posts)", "All post formats", "Email support"],
    is_active: true,
    sort_order: 1,
  },
  {
    id: "2",
    plan_name: "starter",
    display_name: "Starter Plan",
    description: "Perfect for professionals getting started",
    price_monthly: 1200,
    price_yearly: 12000,
    credits_limit: 40,
    estimated_posts: { min: 16, max: 80, display: "~16-80 posts" },
    features: ["40 credits per month (~16-80 posts)", "All post formats (text, image, carousel, video)", "Priority support", "Unlimited regenerations", "AI research included"],
    is_active: true,
    sort_order: 2,
  },
  {
    id: "3",
    plan_name: "pro",
    display_name: "Pro Plan",
    description: "For creators who post frequently",
    price_monthly: 2500,
    price_yearly: 25000,
    credits_limit: 100,
    estimated_posts: { min: 40, max: 200, display: "~40-200 posts" },
    features: ["100 credits per month (~40-200 posts)", "All post formats", "Priority support", "Unlimited regenerations", "AI research included", "Advanced analytics"],
    is_active: true,
    sort_order: 3,
  },
  {
    id: "4",
    plan_name: "unlimited",
    display_name: "Unlimited Plan",
    description: "Unlimited content creation for power users",
    price_monthly: 5000,
    price_yearly: 50000,
    credits_limit: -1,
    estimated_posts: { min: 999, max: 999, display: "Unlimited" },
    features: ["Unlimited credits", "Unlimited posts", "All post formats", "Priority support", "Dedicated account manager", "Custom integrations", "API access", "White-label options"],
    is_active: true,
    sort_order: 4,
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/subscription/plans`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const activePlans = data
            .filter((plan: Plan) => plan.is_active)
            .sort((a: Plan, b: Plan) => a.sort_order - b.sort_order)
            .slice(0, 4);
          setPlans(activePlans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        // Keep using fallback plans
      }
    }
    fetchPlans();
  }, []);

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

        {/* Pricing Toggle */}
        <section className="pb-12 relative">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex items-center bg-slate-900/80 backdrop-blur-xl rounded-full p-1.5 shadow-lg border border-slate-700/50">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Save 16%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24 relative">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan, i) => {
                const IconComponent = planIcons[plan.plan_name] || Zap;
                const gradient = planGradients[plan.plan_name] || "from-gray-500 to-gray-600";
                const isPopular = plan.plan_name === "starter";

                return (
                  <div
                    key={plan.id}
                    className="relative group"
                  >
                    {/* Card Glow */}
                    {isPopular && (
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                    )}

                    <div className={`relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border ${isPopular ? "border-violet-500/50" : "border-slate-700/50"
                      } p-6 flex flex-col h-full`}>
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
                        <span className="text-4xl font-bold text-white">
                          {plan.price_monthly === 0
                            ? "Free"
                            : billingCycle === 'monthly'
                              ? `$${(plan.price_monthly / 100).toFixed(0)}`
                              : `$${(plan.price_yearly / 100 / 12).toFixed(0)}`
                          }
                        </span>
                        {plan.price_monthly > 0 && <span className="text-slate-500">/month</span>}
                      </div>
                      {plan.price_monthly > 0 && billingCycle === 'yearly' && (
                        <div className="mb-6 space-y-1">
                          <p className="text-xs text-slate-500">
                            ${(plan.price_yearly / 100).toFixed(0)}/year
                          </p>
                          <p className="text-sm text-emerald-400 font-semibold">
                            💰 Save ${((plan.price_monthly * 12 - plan.price_yearly) / 100).toFixed(0)}/year
                          </p>
                        </div>
                      )}
                      {plan.price_monthly > 0 && billingCycle === 'monthly' && (
                        <div className="mb-6">
                          <p className="text-sm text-cyan-400">
                            Or save with yearly billing
                          </p>
                        </div>
                      )}
                      {plan.price_monthly === 0 && <div className="mb-6" />}

                      <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span>
                          {plan.credits_limit === -1
                            ? "Unlimited"
                            : `${plan.credits_limit} credits/month`}
                          {plan.estimated_posts && ` (${plan.estimated_posts.display})`}
                        </span>
                      </div>

                      <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular ? "bg-cyan-500/20" : "bg-emerald-500/20"
                              }`}>
                              <Check className={`w-3 h-3 ${isPopular ? "text-cyan-400" : "text-emerald-400"}`} />
                            </div>
                            <span className="text-slate-400">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link href="/login">
                        <Button
                          className={`w-full py-6 text-lg font-semibold rounded-xl ${isPopular
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
