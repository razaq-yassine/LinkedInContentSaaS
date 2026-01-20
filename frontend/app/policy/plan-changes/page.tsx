import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { FileText, ArrowUp, ArrowDown, ShoppingCart, CreditCard, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PlanChangesPolicyPage() {
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
                <span>Plan Changes & Credit Policy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Plan Changes & Credit Policy
              </h1>

              <p className="text-lg text-slate-400 mb-4">
                Last updated: January 20, 2025
              </p>
              <p className="text-slate-400">
                This policy explains how plan upgrades, downgrades, and credit purchases work in PostInAi.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
              
              {/* Plan Upgrades */}
              <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-slate-800">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Plan Upgrades</h2>
                    <p className="text-slate-400">Moving from a lower plan to a higher plan</p>
                  </div>
                </div>

                <div className="space-y-4 text-slate-300">
                  <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">What Happens:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Your current subscription is <strong>cancelled immediately</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Your new plan starts <strong>immediately</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Your existing credits are <strong>preserved</strong> and new plan credits are <strong>added</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>You pay the <strong>full price</strong> for the new plan (no proration)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300 mb-1">Important:</p>
                        <p className="text-sm text-amber-200">
                          No proration is applied. You pay the full price for the new plan, but you keep all your existing credits plus receive the new plan's credits immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Example:</h4>
                    <p className="text-sm text-slate-300">
                      If you have Starter plan (40 credits/month) with 20 credits remaining, and upgrade to Pro plan (100 credits/month):
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      <li>• Your 20 remaining credits are preserved</li>
                      <li>• You immediately have access to 100 credits/month</li>
                      <li>• Your total available credits: 20 (preserved) + 100 (new plan) = 120 credits</li>
                      <li>• On your next billing cycle, credits reset to 100 (Pro plan limit)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Plan Downgrades */}
              <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-slate-800">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Plan Downgrades</h2>
                    <p className="text-slate-400">Moving from a paid plan to the free plan</p>
                  </div>
                </div>

                <div className="space-y-4 text-slate-300">
                  <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">What Happens:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Your subscription is <strong>scheduled for cancellation</strong> at the end of your billing period</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>You keep <strong>premium features and credits</strong> until your billing period ends</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>On your period end date, you're moved to the <strong>Free plan</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>No further charges after your current period ends</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300 mb-1">Premium Access Until Period End:</p>
                        <p className="text-sm text-amber-200">
                          You continue to have full access to premium features and your credits until your billing period ends. This ensures you get full value from your current subscription.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Example:</h4>
                    <p className="text-sm text-slate-300">
                      If you have Pro plan (100 credits/month) with 50 credits remaining, and downgrade to Free plan:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      <li>• You keep premium features and 50 credits until your billing period ends (e.g., 15 days)</li>
                      <li>• On the period end date, your plan changes to Free</li>
                      <li>• Subscription credits reset to 5 (Free plan limit)</li>
                      <li>• Purchased credits (if any) remain unchanged</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Credit Purchases */}
              <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-slate-800">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Purchased Credits</h2>
                    <p className="text-slate-400">Buying additional credits that never expire</p>
                  </div>
                </div>

                <div className="space-y-4 text-slate-300">
                  <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">Key Features:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Purchased credits <strong>never expire</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Only available for users with <strong>paid plans</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Used <strong>after</strong> subscription credits are exhausted</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span><strong>Not affected</strong> by monthly subscription resets</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-purple-300 mb-1">Credit Usage Priority:</p>
                        <p className="text-sm text-purple-200">
                          Subscription credits are always used first. Purchased credits are only used after your monthly subscription credits are exhausted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Example:</h4>
                    <p className="text-sm text-slate-300">
                      If you have Pro plan (100 credits/month) with 30 subscription credits remaining, and 50 purchased credits:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      <li>• Total available: 30 (subscription) + 50 (purchased) = 80 credits</li>
                      <li>• When you use credits, subscription credits are used first</li>
                      <li>• After 30 credits are used, purchased credits start being used</li>
                      <li>• On next billing cycle: subscription resets to 100, purchased credits remain at 50</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Monthly Resets */}
              <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-4">Monthly Credit Resets</h2>
                <div className="space-y-4 text-slate-300">
                  <p className="text-sm">
                    Subscription credits reset to your plan's limit at the beginning of each billing cycle. Purchased credits are never reset and remain available until used.
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">What Resets:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>✅ Subscription credits → Reset to plan limit</li>
                      <li>❌ Purchased credits → Never reset</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
                <p className="text-slate-300 mb-4">
                  If you have any questions about plan changes or credits, please contact our support team.
                </p>
                <Link 
                  href="/contact"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Contact Support
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
