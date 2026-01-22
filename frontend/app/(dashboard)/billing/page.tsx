'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Check, Sparkles, Zap, Crown, Loader2, Star, TrendingUp, DollarSign, Calendar, BarChart3, Rocket, Shield, Gift, ArrowRight, ShoppingCart, ArrowDown, CreditCard, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UpgradeConsentModal from '@/components/modals/UpgradeConsentModal';
import DowngradeConsentModal from '@/components/modals/DowngradeConsentModal';
import PurchaseCreditsModal from '@/components/modals/PurchaseCreditsModal';
import CreditPurchaseSuggestionModal from '@/components/modals/CreditPurchaseSuggestionModal';
import { cn } from '@/lib/utils';

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
  current_period_start: string | null;
  current_period_end: string | null;
  scheduled_downgrade_plan: string | null;
  scheduled_downgrade_date: string | null;
  breakdown?: {
    subscription: {
      limit: number;
      used: number;
      available: number;
    };
    purchased: {
      balance: number;
    };
    total_available: number;
  };
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [creditSuggestionModalOpen, setCreditSuggestionModalOpen] = useState(false);
  const [creditSuggestionError, setCreditSuggestionError] = useState<string>('');
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Try to access the test endpoint to see if it's available
      const response = await axios.get(
        `${apiUrl}/api/test/simulate-subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const [plansResponse, subscriptionResponse, breakdownResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/subscription/plans`, { timeout: 10000 }),
        axios.get(`${apiUrl}/api/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        axios.get(`${apiUrl}/api/subscription/credits/breakdown`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }).catch(() => null), // Optional, fallback if not available
      ]);

      const activePlans = plansResponse.data
        .filter((plan: SubscriptionPlan) => plan.is_active)
        .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order)
        .slice(0, 4);

      setPlans(activePlans);
      const subscriptionData = subscriptionResponse.data;
      if (breakdownResponse?.data) {
        subscriptionData.breakdown = breakdownResponse.data;
      }
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    // Check if this is an upgrade (user has paid plan)
    const currentPlan = currentSubscription?.plan;
    const isUpgrade = currentPlan && currentPlan !== 'free' && currentPlan !== planName;
    
    if (isUpgrade) {
      // Show upgrade consent modal
      setSelectedUpgradePlan(planName);
      setUpgradeModalOpen(true);
    } else {
      // New subscription - proceed directly
      await proceedWithSubscription(planName);
    }
  };

  const proceedWithSubscription = async (planName: string) => {
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
      const errorMessage = error.response?.data?.detail || 'Failed to start subscription process';
      
      // Check if it's a yearly→monthly restriction error
      if (errorMessage.includes('Yearly subscriptions cannot be switched')) {
        // Show credit purchase suggestion modal
        setCreditSuggestionError(errorMessage);
        setCreditSuggestionModalOpen(true);
      } else {
        alert(errorMessage);
      }
      setProcessingPlan(null);
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedUpgradePlan) return;
    
    setUpgradeModalOpen(false);
    setProcessingPlan(selectedUpgradePlan);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(
        `${apiUrl}/api/subscription/upgrade`,
        {
          plan: selectedUpgradePlan,
          billing_cycle: billingCycle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      // Refresh subscription data
      await fetchPlansAndSubscription();
      alert('Upgrade successful! Your new plan is now active.');
    } catch (error: any) {
      console.error('Upgrade error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to upgrade subscription';
      
      // Check if it's a yearly→monthly restriction error
      if (errorMessage.includes('Yearly subscriptions cannot be switched')) {
        // Show credit purchase suggestion modal
        setCreditSuggestionError(errorMessage);
        setCreditSuggestionModalOpen(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setProcessingPlan(null);
      setSelectedUpgradePlan(null);
    }
  };

  const handleDowngrade = () => {
    setDowngradeModalOpen(true);
  };

  const handleDowngradeConfirm = async () => {
    setDowngradeModalOpen(false);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/downgrade`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh subscription data
      await fetchPlansAndSubscription();
      alert('Downgrade scheduled. You\'ll keep premium access until your billing period ends.');
    } catch (error: any) {
      console.error('Downgrade error:', error);
      alert(error.response?.data?.detail || 'Failed to schedule downgrade');
    }
  };

  const handleTestSubscribe = async (planName: string) => {
    setProcessingPlan(planName);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/api/test/simulate-subscription`,
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
    const icons = [Zap, Rocket, Crown, Shield];
    return icons[index] || Zap;
  };

  const getPlanTheme = (index: number, isPopular: boolean, isPremium: boolean) => {
    if (isPopular) {
      return {
        accent: 'blue',
        iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        checkBg: 'bg-blue-500',
        buttonClass: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40',
        borderClass: 'border-blue-500 dark:border-blue-400',
        badgeBg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
        cardShadow: 'shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30',
      };
    }
    if (isPremium) {
      return {
        accent: 'purple',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        checkBg: 'bg-purple-500',
        buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40',
        borderClass: 'border-purple-500 dark:border-purple-400',
        badgeBg: 'bg-gradient-to-r from-purple-600 to-pink-600',
        cardShadow: 'shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30',
      };
    }
    return {
      accent: 'slate',
      iconBg: 'bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
      checkBg: 'bg-slate-500 dark:bg-slate-400',
      buttonClass: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30',
      borderClass: 'border-slate-200 dark:border-slate-700',
      badgeBg: 'bg-slate-600',
      cardShadow: 'shadow-lg hover:shadow-xl',
    };
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan === planName;
  };

  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(p => p.plan_name === currentSubscription.plan);
  };

  const getNextPlan = () => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan || !currentSubscription) return null;
    
    // If there's a scheduled downgrade, that's the next plan
    if (currentSubscription.scheduled_downgrade_plan) {
      return plans.find(p => p.plan_name === currentSubscription.scheduled_downgrade_plan) || null;
    }
    
    // Otherwise, next plan is the same as current plan (continuing)
    return currentPlan;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Test Mode Indicator */}
        {testMode && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Developer Mode Active</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Billing & Usage
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Manage your subscription and track your content creation
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-10 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-md">
            <TabsTrigger 
              value="usage" 
              className="text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:from-white dark:data-[state=active]:to-slate-100 dark:data-[state=active]:text-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-300"
            >
              <Activity className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger 
              value="plans" 
              className="text-sm font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:from-white dark:data-[state=active]:to-slate-100 dark:data-[state=active]:text-slate-900 text-slate-600 dark:text-slate-400 transition-all duration-300"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {currentSubscription && (
              <>
                {/* Stats Cards - Clean Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Credits Remaining */}
                  <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Credits Remaining</span>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {currentSubscription.credits_limit === -1 ? '∞' : Math.round(currentSubscription.credits_remaining * 100) / 100}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {currentSubscription.credits_limit === -1 
                          ? 'Unlimited' 
                          : `of ${currentSubscription.credits_limit} this month`}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Current Spending */}
                  <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Cost</span>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                        ${getCurrentPlanPrice().toFixed(0)}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        per month
                      </p>
                    </CardContent>
                  </Card>

                  {/* Next Billing */}
                  <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Next Billing</span>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {currentSubscription.current_period_end 
                          ? new Date(currentSubscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                          : 'N/A'}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Renewal date
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Plan & Next Plan Comparison */}
                {(() => {
                  const currentPlan = getCurrentPlan();
                  const nextPlan = getNextPlan();
                  
                  if (!currentPlan || !nextPlan || !currentSubscription) return null;
                  
                  const currentPlanIndex = plans.findIndex(p => p.plan_name === currentPlan.plan_name);
                  const currentIcon = getPlanIcon(currentPlanIndex);
                  const CurrentIcon = currentIcon;
                  
                  const isDowngrading = currentSubscription.scheduled_downgrade_plan !== null;
                  const isSamePlan = nextPlan.plan_name === currentPlan.plan_name;
                  
                  // Calculate next period dates
                  const currentPeriodStart = currentSubscription.current_period_start 
                    ? new Date(currentSubscription.current_period_start)
                    : null;
                  const currentPeriodEnd = currentSubscription.current_period_end
                    ? new Date(currentSubscription.current_period_end)
                    : null;
                  
                  // Next period starts when current period ends
                  const nextPeriodStart = currentPeriodEnd;
                  // Calculate next period end based on billing cycle
                  const nextPeriodEnd = currentPeriodEnd && currentPeriodStart
                    ? (() => {
                        const periodLength = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
                        return new Date(currentPeriodEnd.getTime() + periodLength);
                      })()
                    : null;
                  
                  const formatDate = (date: Date | null) => {
                    if (!date) return 'N/A';
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  };
                  
                  // Find the next upgrade plan (higher tier)
                  const nextUpgradePlan = plans
                    .filter(p => p.sort_order > currentPlan.sort_order)
                    .sort((a, b) => a.sort_order - b.sort_order)[0];
                  
                  return (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                          Your Plan
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {isDowngrading ? 'Plan change scheduled' : 'Current billing period'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        {/* Current Plan Card */}
                        <Card className="flex-1 w-full md:max-w-sm bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-md">
                                <Check className="w-3 h-3 mr-1" />
                                Current
                              </Badge>
                              {nextUpgradePlan && (
                                <Button
                                  onClick={() => {
                                    setSelectedUpgradePlan(nextUpgradePlan.plan_name);
                                    setUpgradeModalOpen(true);
                                  }}
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                                  Upgrade
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                                <CurrentIcon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                  {currentPlan.display_name}
                                </CardTitle>
                                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                                  {currentPlan.description || 'Your current plan'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                ${billingCycle === 'monthly' 
                                  ? (currentPlan.price_monthly / 100).toFixed(0)
                                  : (currentPlan.price_yearly / 100 / 12).toFixed(0)
                                }
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">/mo</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-amber-500" />
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {currentPlan.credits_limit === -1 ? 'Unlimited' : currentPlan.credits_limit} credits/mo
                              </span>
                            </div>
                            {currentPeriodStart && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Period: {formatDate(currentPeriodStart)} - {formatDate(currentPeriodEnd)}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Arrow */}
                        <>
                          <div className="hidden md:flex items-center justify-center">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                              isDowngrading 
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500"
                            )}>
                              <ArrowRight className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="md:hidden flex items-center justify-center">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                              isDowngrading 
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500"
                            )}>
                              <ArrowDown className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </>

                        {/* Next Plan Card */}
                        <Card className={cn(
                          "flex-1 w-full md:max-w-sm border-2 shadow-lg hover:shadow-xl transition-all duration-300",
                          isDowngrading
                            ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-500 dark:border-amber-400"
                            : "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-500 dark:border-blue-400"
                        )}>
                          <CardHeader className="pb-3">
                            <Badge className={cn(
                              "text-white border-0 shadow-md mb-2",
                              isDowngrading
                                ? "bg-gradient-to-r from-amber-600 to-orange-600"
                                : "bg-gradient-to-r from-blue-600 to-cyan-600"
                            )}>
                              {isDowngrading ? (
                                <>
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Scheduled
                                </>
                              ) : (
                                <>
                                  <Star className="w-3 h-3 mr-1 fill-white" />
                                  Next Period
                                </>
                              )}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                                isDowngrading
                                  ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
                              )}>
                                {(() => {
                                  const nextPlanIndex = plans.findIndex(p => p.plan_name === nextPlan.plan_name);
                                  const NextIcon = getPlanIcon(nextPlanIndex);
                                  return <NextIcon className="w-6 h-6 text-white" />;
                                })()}
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                  {nextPlan.display_name}
                                </CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                  {isDowngrading 
                                    ? 'Effective after current period'
                                    : isSamePlan 
                                      ? 'Continuing with same plan'
                                      : nextPlan.description || 'Next period plan'
                                  }
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-baseline gap-1">
                              <span className={cn(
                                "text-3xl font-bold bg-clip-text text-transparent",
                                isDowngrading
                                  ? "bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
                                  : "bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400"
                              )}>
                                ${billingCycle === 'monthly' 
                                  ? (nextPlan.price_monthly / 100).toFixed(0)
                                  : (nextPlan.price_yearly / 100 / 12).toFixed(0)
                                }
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">/mo</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className={cn(
                                "w-4 h-4",
                                isDowngrading ? "text-amber-500" : "text-blue-500"
                              )} />
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {nextPlan.credits_limit === -1 ? 'Unlimited' : nextPlan.credits_limit} credits/mo
                              </span>
                            </div>
                            {nextPeriodStart && nextPeriodEnd && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Period: {formatDate(nextPeriodStart)} - {formatDate(nextPeriodEnd)}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })()}

                {/* Credit Usage Progress */}
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      Credit Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {/* Main Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Total Available</span>
                          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {currentSubscription.breakdown?.total_available === -1 
                              ? 'Unlimited' 
                              : currentSubscription.breakdown 
                                ? Math.round(currentSubscription.breakdown.total_available * 100) / 100
                                : Math.round(currentSubscription.credits_remaining * 100) / 100}
                          </span>
                        </div>
                        {currentSubscription.credits_limit !== -1 && (
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 shadow-md"
                              style={{
                                width: `${Math.min((currentSubscription.credits_remaining / currentSubscription.credits_limit) * 100, 100)}%`
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Breakdown */}
                      {currentSubscription.breakdown && currentSubscription.breakdown.total_available !== -1 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Subscription Credits</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {Math.round(currentSubscription.breakdown.subscription.available * 100) / 100} / {currentSubscription.breakdown.subscription.limit}
                            </span>
                          </div>
                          {currentSubscription.breakdown.purchased.balance > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                Purchased Credits
                              </span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {Math.round(currentSubscription.breakdown.purchased.balance * 100) / 100}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {currentSubscription.current_period_end && currentSubscription.credits_limit !== -1 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                          Credits reset on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Credits */}
                {currentSubscription.plan !== 'free' && (
                  <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-0 shadow-xl shadow-slate-900/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                              <ShoppingCart className="w-4 h-4 text-white" />
                            </div>
                            Need more credits?
                          </h3>
                          <p className="text-sm text-slate-300 mt-1.5">
                            Purchase additional credits that never expire
                          </p>
                        </div>
                        <Button
                          onClick={() => setPurchaseModalOpen(true)}
                          className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 h-11 px-6 rounded-xl"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Buy Credits
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-8">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all",
                    billingCycle === 'monthly'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                    billingCycle === 'yearly'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Yearly
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.slice(0, 3).map((plan, index) => {
                const Icon = getPlanIcon(index);
                const isCurrent = isCurrentPlan(plan.plan_name);
                const isPopular = index === 1;
                const isPremium = index === 2;
                const theme = getPlanTheme(index, isPopular, isPremium);

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative bg-white dark:bg-slate-800 border-2 transition-all duration-300 hover:-translate-y-1 group",
                      isPopular 
                        ? "border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30" 
                        : isPremium
                          ? "border-purple-500 dark:border-purple-400 shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30"
                          : "border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600",
                      isCurrent && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900"
                    )}
                  >
                    {/* Badge */}
                    {(isPopular || isPremium) && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <Badge className={cn(
                          "px-4 py-1.5 text-xs font-semibold text-white border-0 shadow-lg",
                          isPopular ? "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30" : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30"
                        )}>
                          <Star className="w-3 h-3 mr-1 fill-white" />
                          {isPopular ? 'Most Popular' : 'Best Value'}
                        </Badge>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Current
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pt-8 pb-4">
                      <div className={cn(
                        "w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
                        theme.iconBg,
                        isPopular && "shadow-blue-500/30",
                        isPremium && "shadow-purple-500/30",
                        !isPopular && !isPremium && "shadow-slate-500/20"
                      )}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.display_name}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {plan.description || 'Perfect for getting started'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="text-center pb-4">
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center">
                          <span className={cn(
                            "text-4xl font-bold",
                            isPopular ? "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" :
                            isPremium ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" :
                            "text-slate-900 dark:text-white"
                          )}>
                            ${billingCycle === 'monthly' 
                              ? (plan.price_monthly / 100).toFixed(0)
                              : (plan.price_yearly / 100 / 12).toFixed(0)
                            }
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 ml-1">/mo</span>
                        </div>
                        {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center justify-center gap-1">
                            <Gift className="w-4 h-4" />
                            Save ${((plan.price_monthly * 12 - plan.price_yearly) / 100).toFixed(0)}/year
                          </p>
                        )}
                      </div>

                      {/* Credits */}
                      <div className={cn(
                        "rounded-xl py-3 px-4 mb-6 border",
                        isPopular ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" :
                        isPremium ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" :
                        "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      )}>
                        <div className="flex items-center justify-center gap-2">
                          <Zap className={cn(
                            "w-4 h-4",
                            isPopular ? "text-blue-500" : isPremium ? "text-purple-500" : "text-amber-500"
                          )} />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {plan.credits_limit === -1 ? 'Unlimited' : plan.credits_limit} credits/mo
                          </span>
                        </div>
                        {plan.credits_limit !== -1 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {plan.estimated_posts.display}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 text-left">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                              theme.checkBg
                            )}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2 pt-4 pb-6 px-6">
                      <Button
                        onClick={() => handleSubscribe(plan.plan_name)}
                        disabled={isCurrent || processingPlan !== null}
                        className={cn(
                          "w-full h-12 font-semibold transition-all duration-300 rounded-xl",
                          isCurrent 
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                            : theme.buttonClass
                        )}
                      >
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
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                      
                      {/* Test Mode Button */}
                      {testMode && !isCurrent && plan.plan_name !== 'free' && (
                        <Button
                          onClick={() => handleTestSubscribe(plan.plan_name)}
                          disabled={processingPlan !== null}
                          variant="outline"
                          className="w-full h-10 text-xs font-medium border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                        >
                          {processingPlan === plan.plan_name ? (
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          ) : (
                            <span className="mr-1">🧪</span>
                          )}
                          Test Subscribe
                        </Button>
                      )}
                      
                      {/* Downgrade button */}
                      {isCurrent && currentSubscription && currentSubscription.plan !== 'free' && (
                        <Button
                          onClick={handleDowngrade}
                          variant="ghost"
                          className="w-full h-9 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <ArrowDown className="w-3 h-3 mr-1.5" />
                          Downgrade to Free
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Enterprise CTA */}
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-0 text-center shadow-2xl shadow-slate-900/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full -ml-24 -mb-24 blur-3xl" />
              <CardContent className="py-12 px-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-xs font-semibold mb-5 border border-white/10 backdrop-blur-sm">
                  <Shield className="w-4 h-4" />
                  Enterprise Solutions
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Need a custom plan?</h3>
                <p className="text-slate-300 mb-8 max-w-md mx-auto">
                  Get dedicated support, custom integrations, and enterprise-grade security
                </p>
                <Button 
                  className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  Contact Sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedUpgradePlan && (
          <UpgradeConsentModal
            open={upgradeModalOpen}
            onClose={() => {
              setUpgradeModalOpen(false);
              setSelectedUpgradePlan(null);
            }}
            onConfirm={handleUpgradeConfirm}
            currentPlan={currentSubscription?.plan || 'free'}
            newPlan={selectedUpgradePlan}
            currentPrice={getCurrentPlanPrice()}
            newPrice={
              plans.find(p => p.plan_name === selectedUpgradePlan)
                ? (billingCycle === 'monthly'
                    ? plans.find(p => p.plan_name === selectedUpgradePlan)!.price_monthly / 100
                    : plans.find(p => p.plan_name === selectedUpgradePlan)!.price_yearly / 100)
                : 0
            }
            billingCycle={billingCycle}
          />
        )}

        <DowngradeConsentModal
          open={downgradeModalOpen}
          onClose={() => setDowngradeModalOpen(false)}
          onConfirm={handleDowngradeConfirm}
          currentPlan={currentSubscription?.plan || 'free'}
          periodEndDate={currentSubscription?.current_period_end || null}
        />

        <PurchaseCreditsModal
          open={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          onSuccess={() => {
            setPurchaseModalOpen(false);
            fetchPlansAndSubscription();
          }}
        />

        <CreditPurchaseSuggestionModal
          open={creditSuggestionModalOpen}
          onClose={() => {
            setCreditSuggestionModalOpen(false);
            setCreditSuggestionError('');
          }}
          onPurchaseCredits={() => {
            setCreditSuggestionModalOpen(false);
            setCreditSuggestionError('');
            setPurchaseModalOpen(true);
          }}
          errorMessage={creditSuggestionError}
          daysRemaining={(() => {
            // Extract days remaining from error message if available
            const match = creditSuggestionError.match(/ends in (\d+) days/);
            return match ? parseInt(match[1], 10) : undefined;
          })()}
        />
      </div>
    </div>
  );
}
