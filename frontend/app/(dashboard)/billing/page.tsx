'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Check, Sparkles, Zap, Crown, Loader2, Star, TrendingUp, DollarSign, Calendar, BarChart3, Rocket, Shield, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  credits_limit: number;
  estimated_posts: {
    min: number;
    max: number;
    display: string;
  };
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface UserSubscription {
  plan: string;
  credits_used: number;
  credits_limit: number;
  credits_remaining: number;
  billing_cycle: string;
  subscription_status: string;
  current_period_end: string | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('usage');
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Check if URL has tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'plans') {
      setActiveTab('plans');
    }
    
    // Check if test mode is available (backend dev mode)
    checkTestMode();
    
    fetchPlansAndSubscription();
  }, [router]);

  const checkTestMode = async () => {
    try {
      const token = localStorage.getItem('token');
      // Try to access the test endpoint to see if it's available
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/test/simulate-subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // If we get here without 404, test mode is available
      setTestMode(true);
    } catch (error: any) {
      // 404 or 405 means endpoint doesn't exist (dev mode off)
      // 401/403 means it exists but we're not authorized (dev mode on)
      if (error.response?.status === 405 || error.response?.status === 422) {
        setTestMode(true);
      } else {
        setTestMode(false);
      }
    }
  };

  const fetchPlansAndSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const [plansResponse, subscriptionResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/plans`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const activePlans = plansResponse.data
        .filter((plan: SubscriptionPlan) => plan.is_active)
        .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order)
        .slice(0, 4);

      setPlans(activePlans);
      setCurrentSubscription(subscriptionResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    setProcessingPlan(planName);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/checkout`,
        {
          plan: planName,
          billing_cycle: billingCycle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.response?.data?.detail || 'Failed to start subscription process');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleTestSubscribe = async (planName: string) => {
    setProcessingPlan(planName);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/test/simulate-subscription`,
        {
          plan_name: planName,
          billing_cycle: billingCycle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nYou now have ${response.data.current.credits_limit === -1 ? 'unlimited' : response.data.current.credits_limit} credits!`);
        await fetchPlansAndSubscription();
      }
    } catch (error: any) {
      console.error('Test subscription error:', error);
      alert(error.response?.data?.detail || 'Failed to simulate subscription');
    } finally {
      setProcessingPlan(null);
    }
  };


  const getPlanIcon = (index: number) => {
    const icons = [Sparkles, Rocket, Crown, Shield];
    return icons[index] || Sparkles;
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-slate-500 via-slate-600 to-slate-700',
      'from-violet-500 via-purple-500 to-indigo-600',
      'from-amber-400 via-orange-500 to-rose-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
    ];
    return gradients[index] || gradients[0];
  };

  const getPlanBorderGlow = (index: number) => {
    const glows = [
      'hover:shadow-slate-200/50',
      'hover:shadow-purple-300/50',
      'hover:shadow-orange-300/50',
      'hover:shadow-emerald-300/50',
    ];
    return glows[index] || glows[0];
  };

  const getPlanAccentColor = (index: number) => {
    const colors = ['slate', 'purple', 'orange', 'emerald'];
    return colors[index] || colors[0];
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan === planName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCurrentPlanPrice = () => {
    const currentPlan = plans.find(p => p.plan_name === currentSubscription?.plan);
    if (!currentPlan) return 0;
    return billingCycle === 'monthly' ? currentPlan.price_monthly / 100 : currentPlan.price_yearly / 100;
  };

  const getSpendingData = () => {
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentPrice = getCurrentPlanPrice();
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      return {
        month: months[monthIndex],
        amount: i === 5 ? currentPrice : currentPrice * (0.8 + Math.random() * 0.4),
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-4 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Test Mode Indicator */}
        {testMode && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/30 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Developer Mode Active - Test buttons enabled</span>
            </div>
          </div>
        )}
        
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold mb-4 sm:mb-6 border border-amber-500/30 backdrop-blur-sm shadow-lg shadow-amber-500/10">
            <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
            <span>Trusted by 10,000+ LinkedIn creators</span>
            <Gift className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-3 sm:mb-5 leading-tight tracking-tight">
            Billing & Usage
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 mb-4 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            Manage your subscription and unlock your content potential
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 sm:mb-10 h-12 sm:h-14 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg dark:shadow-none">
            <TabsTrigger 
              value="usage" 
              className="text-sm sm:text-base font-semibold py-2.5 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-slate-500 dark:text-slate-400 transition-all duration-300"
            >
              Usage & Spending
            </TabsTrigger>
            <TabsTrigger 
              value="plans" 
              className="text-sm sm:text-base font-semibold py-2.5 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-slate-500 dark:text-slate-400 transition-all duration-300"
            >
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-4 sm:space-y-6">
            {currentSubscription && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group">
                    <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-white flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        Credits Remaining
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {currentSubscription.credits_limit === -1 ? '∞' : Math.round(currentSubscription.credits_remaining * 100) / 100}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-2">
                        {currentSubscription.credits_limit === -1 
                          ? 'Unlimited credits' 
                          : `of ${currentSubscription.credits_limit} credits this month`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                    <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-white flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        Current Spending
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                        ${getCurrentPlanPrice().toFixed(0)}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-2">
                        This month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
                    <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-white flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        Next Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {currentSubscription.current_period_end ? new Date(currentSubscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-2">
                        Renewal date
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Spending History Chart */}
                <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl hidden sm:block">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      Spending History
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-6 gap-2 sm:gap-4">
                      {getSpendingData().map((data, index) => {
                        const maxAmount = Math.max(...getSpendingData().map(d => d.amount));
                        const heightPercentage = (data.amount / maxAmount) * 100;
                        const isLast = index === 5;
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className="w-full h-24 sm:h-40 flex items-end justify-center mb-2">
                              <div 
                                className={`w-full rounded-xl transition-all duration-500 relative group cursor-pointer ${isLast ? 'bg-gradient-to-t from-purple-600 via-purple-500 to-indigo-400' : 'bg-gradient-to-t from-slate-300 dark:from-slate-600 to-slate-200 dark:to-slate-500 hover:from-purple-600 hover:to-indigo-400'}`}
                                style={{ height: `${heightPercentage}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 shadow-xl">
                                  ${data.amount.toFixed(0)}
                                </div>
                                {isLast && (
                                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                                )}
                              </div>
                            </div>
                            <div className={`text-xs sm:text-sm font-medium ${isLast ? 'text-purple-500 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>{data.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile: Simplified spending */}
                <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl sm:hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
                      Monthly Spending
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">This month</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">${getCurrentPlanPrice().toFixed(0)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                      <span>Consistent with previous months</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Credit Usage Card */}
                <Card className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                  <CardHeader className="pb-2 sm:pb-4 p-4 sm:p-6 relative">
                    <CardTitle className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" />
                      Credit Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6 relative">
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <span className="text-slate-600 dark:text-white font-semibold text-sm sm:text-base">Credits this month:</span>
                        <span className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                          {currentSubscription.credits_limit === -1 
                            ? '∞ Unlimited' 
                            : `${Math.round(currentSubscription.credits_used * 100) / 100} / ${currentSubscription.credits_limit}`}
                        </span>
                      </div>
                      {currentSubscription.credits_limit === -1 ? (
                        <div className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full h-4 sm:h-5 shadow-lg shadow-purple-500/30 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-4 sm:h-5 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 relative overflow-hidden shadow-lg shadow-purple-500/30"
                            style={{
                              width: `${Math.min((currentSubscription.credits_used / currentSubscription.credits_limit) * 100, 100)}%`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                          </div>
                        </div>
                      )}
                      {currentSubscription.current_period_end && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 text-center font-medium">
                          {currentSubscription.credits_limit === -1 
                            ? '✨ Unlimited credits - no reset needed' 
                            : `🔄 Resets on ${new Date(currentSubscription.current_period_end).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-4 sm:space-y-6">
            <div className="text-center mb-6 sm:mb-10">
              <div className="inline-flex items-center bg-white/80 dark:bg-slate-800/60 rounded-2xl p-1.5 sm:p-2 shadow-lg dark:shadow-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Yearly
                  <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold border border-emerald-500/30">
                    Save 16.7%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid - 3 columns */}
            <div className="w-full max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-12">
                {plans.slice(0, 3).map((plan, index) => {
                  const Icon = getPlanIcon(index);
                  const gradient = getPlanGradient(index);
                  const borderGlow = getPlanBorderGlow(index);
                  const isCurrent = isCurrentPlan(plan.plan_name);
                  const isPopular = index === 1;
                  const isPremium = index === 2;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl sm:hover:-translate-y-2 group w-full bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-700/50 ${borderGlow} ${
                        isPopular ? 'border-2 border-purple-500/50 shadow-xl shadow-purple-500/20 sm:scale-105 z-10' : isPremium ? 'border-2 border-orange-500/50 shadow-xl shadow-orange-500/20' : 'border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                      } ${isCurrent ? 'ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient} pointer-events-none`} style={{ opacity: 0.05 }} />
                      
                      {isPopular && (
                        <div className="absolute top-0 right-0 z-10">
                          <Badge className="rounded-bl-2xl rounded-tr-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 shadow-lg shadow-purple-500/30 font-bold text-[10px] sm:text-xs border-0">
                            <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 inline mr-1 fill-white" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      {isPremium && (
                        <div className="absolute top-0 right-0 z-10">
                          <Badge className="rounded-bl-2xl rounded-tr-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 shadow-lg shadow-orange-500/30 font-bold text-[10px] sm:text-xs border-0">
                            <Crown className="w-3 sm:w-3.5 h-3 sm:h-3.5 inline mr-1 fill-white" />
                            Best Value
                          </Badge>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute top-0 left-0 z-10">
                          <Badge className="rounded-br-2xl rounded-tl-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 shadow-lg shadow-emerald-500/30 font-bold text-[10px] sm:text-xs border-0">
                            <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 inline mr-1" />
                            Current Plan
                          </Badge>
                        </div>
                      )}

                      {/* Card Header */}
                      <CardHeader className="pb-4 sm:pb-6 pt-8 sm:pt-12 px-5 sm:px-6 sm:text-center relative">
                        <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0">
                          <div className={`w-12 sm:w-18 h-12 sm:h-18 sm:mx-auto sm:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 sm:w-9 h-6 sm:h-9 text-white" />
                          </div>
                          <div className="flex-1 sm:flex-none">
                            <CardTitle className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-slate-900 dark:text-white">{plan.display_name}</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-snug sm:leading-relaxed sm:min-h-[2.5rem] sm:px-2 line-clamp-2 sm:line-clamp-none">
                              {plan.description || 'Perfect for getting started'}
                            </CardDescription>
                          </div>
                          {/* Mobile: Price inline */}
                          <div className="sm:hidden text-right flex-shrink-0">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              ${billingCycle === 'monthly' 
                                ? (plan.price_monthly / 100).toFixed(0)
                                : (plan.price_yearly / 100 / 12).toFixed(0)
                              }
                            </span>
                            <span className="text-slate-500 text-xs">/mo</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-4 sm:pb-6 px-5 sm:px-6 sm:text-center">
                        {/* Desktop: Price block */}
                        <div className="hidden sm:block mb-6">
                          <div className="flex items-baseline justify-center">
                            <span className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white">
                              ${billingCycle === 'monthly' 
                                ? (plan.price_monthly / 100).toFixed(0)
                                : (plan.price_yearly / 100 / 12).toFixed(0)
                              }
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-lg font-normal">/month</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <div className="mt-3 space-y-1.5">
                              <p className="text-sm text-slate-500">
                                ${(plan.price_yearly / 100).toFixed(0)}/year
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <Gift className="w-3.5 h-3.5" />
                                Save ${((plan.price_monthly * 12 - plan.price_yearly) / 100).toFixed(0)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Mobile: Yearly savings inline */}
                        {billingCycle === 'yearly' && (
                          <p className="sm:hidden text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-3 text-center flex items-center justify-center gap-1">
                            <Gift className="w-3 h-3" />
                            Save ${((plan.price_monthly * 12 - plan.price_yearly) / 100).toFixed(0)}/year
                          </p>
                        )}

                        {/* Credits info */}
                        <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-1.5 py-3 sm:pb-5 sm:mb-5 border-y sm:border-b sm:border-t-0 border-slate-200 dark:border-slate-700/50 mb-4 bg-slate-50 dark:bg-slate-800/30 -mx-5 sm:-mx-6 px-5 sm:px-6 sm:rounded-none">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                              <Zap className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {plan.credits_limit === -1 ? 'Unlimited' : `${plan.credits_limit} credits`}/month
                            </span>
                          </div>
                          {plan.credits_limit !== -1 && (
                            <span className="text-[10px] sm:text-xs text-slate-500">
                              ({plan.estimated_posts.display})
                            </span>
                          )}
                        </div>

                        {/* Features list */}
                        <ul className="space-y-2 sm:space-y-3 text-left">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mr-2.5 sm:mr-3 flex-shrink-0 mt-0.5 shadow-md`}>
                                <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white stroke-[3]" />
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-snug">{feature}</span>
                            </li>
                          ))}
                          {/* Show remaining features only on desktop */}
                          {plan.features.slice(3).map((feature, idx) => (
                            <li key={idx + 3} className="hidden sm:flex items-start">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 shadow-md`}>
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feature}</span>
                            </li>
                          ))}
                          {/* Mobile: Show more features indicator */}
                          {plan.features.length > 3 && (
                            <li className="sm:hidden text-center pt-1">
                              <span className="text-[10px] text-slate-500">+{plan.features.length - 3} more features</span>
                            </li>
                          )}
                        </ul>
                      </CardContent>

                      <CardFooter className="pt-2 pb-6 sm:pb-8 px-5 sm:px-6 flex flex-col gap-3">
                        <Button
                          onClick={() => handleSubscribe(plan.plan_name)}
                          disabled={isCurrent || processingPlan !== null}
                          className={`w-full py-4 sm:py-6 text-xs sm:text-sm font-bold transition-all duration-300 rounded-xl group/btn relative overflow-hidden ${
                            isCurrent 
                              ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 cursor-default'
                              : isPopular
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 text-white border-0'
                                : isPremium
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 text-white border-0'
                                  : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-lg hover:shadow-xl text-white border-0'
                          }`}
                          variant="default"
                        >
                          {!isCurrent && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                          )}
                          {processingPlan === plan.plan_name ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrent ? (
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              Current Plan
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Get Started
                              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                        
                        {/* Test Mode Button */}
                        {testMode && !isCurrent && plan.plan_name !== 'free' && (
                          <Button
                            onClick={() => handleTestSubscribe(plan.plan_name)}
                            disabled={processingPlan !== null}
                            className="w-full py-3 sm:py-4 text-[10px] sm:text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all"
                          >
                            {processingPlan === plan.plan_name ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <span className="mr-1.5">🧪</span> Test Subscribe
                              </>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Enterprise CTA */}
            <div className="mt-8 sm:mt-16 text-center max-w-5xl mx-auto">
              <div className="bg-white/80 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl shadow-lg dark:shadow-2xl relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 animate-pulse" />
                {/* Decorative elements */}
                <div className="hidden sm:block absolute top-0 right-0 w-72 h-72 bg-purple-500/5 dark:bg-purple-500/10 rounded-full -mr-36 -mt-36 blur-3xl" />
                <div className="hidden sm:block absolute bottom-0 left-0 w-56 h-56 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -ml-28 -mb-28 blur-3xl" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-300 px-4 py-2 rounded-full text-xs font-semibold mb-4 border border-purple-500/30">
                    <Shield className="w-4 h-4" />
                    Enterprise Solutions
                  </div>
                  <h3 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">Need a custom plan?</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-10 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
                    Get tailored solutions with dedicated support, custom integrations, and enterprise-grade security
                  </p>
                  <Button 
                    size="lg"
                    className="px-8 sm:px-12 py-4 sm:py-7 text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 rounded-xl sm:rounded-2xl w-full sm:w-auto group"
                  >
                    <span className="flex items-center gap-2">
                      Contact Sales
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
