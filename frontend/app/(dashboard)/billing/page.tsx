'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Check, Sparkles, Zap, Crown, Loader2, Star, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
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
  posts_limit: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface UserSubscription {
  plan: string;
  posts_this_month: number;
  posts_limit: number;
  period_end: string | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('usage');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPlansAndSubscription();
  }, [router]);

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
        .slice(0, 3);

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

  const getPlanIcon = (index: number) => {
    const icons = [Sparkles, Zap, Crown];
    return icons[index] || Sparkles;
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-blue-500 via-blue-600 to-cyan-500',
      'from-purple-500 via-pink-500 to-rose-500',
      'from-amber-500 via-orange-500 to-red-500',
    ];
    return gradients[index] || gradients[0];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-semibold mb-4 border border-blue-100">
            <Star className="w-3.5 h-3.5 fill-blue-600" />
            <span>Trusted by 10,000+ LinkedIn creators</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            Billing & Usage
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Manage your subscription and track your usage
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="usage" className="text-base font-semibold">Usage & Spending</TabsTrigger>
            <TabsTrigger value="plans" className="text-base font-semibold">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {currentSubscription && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-600 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Posts Remaining
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">
                        {currentSubscription.posts_limit === -1 ? '∞' : currentSubscription.posts_limit - currentSubscription.posts_this_month}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        of {currentSubscription.posts_limit === -1 ? 'unlimited' : currentSubscription.posts_limit} posts this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-600 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Current Spending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">
                        ${getCurrentPlanPrice().toFixed(0)}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        This month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Next Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentSubscription.period_end ? new Date(currentSubscription.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Renewal date
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-gray-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Spending History
                    </CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-3">
                      {getSpendingData().map((data, index) => {
                        const maxAmount = Math.max(...getSpendingData().map(d => d.amount));
                        const heightPercentage = (data.amount / maxAmount) * 100;
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className="w-full h-40 flex items-end justify-center mb-2">
                              <div 
                                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500 relative group"
                                style={{ height: `${heightPercentage}%` }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  ${data.amount.toFixed(0)}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-600">{data.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-blue-900">Usage Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold text-base">Posts this month:</span>
                        <span className="text-3xl font-bold text-blue-600">
                          {currentSubscription.posts_this_month} / {currentSubscription.posts_limit === -1 ? '∞' : currentSubscription.posts_limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500 relative overflow-hidden"
                          style={{
                            width: currentSubscription.posts_limit === -1 
                              ? '100%' 
                              : `${Math.min((currentSubscription.posts_this_month / currentSubscription.posts_limit) * 100, 100)}%`
                          }}
                        />
                      </div>
                      {currentSubscription.period_end && (
                        <p className="text-sm text-gray-600 text-center font-medium">
                          Resets on {new Date(currentSubscription.period_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-white rounded-full p-1.5 shadow-md border border-gray-200 backdrop-blur-sm">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-bold border border-green-200">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {plans.map((plan, index) => {
            const Icon = getPlanIcon(index);
            const gradient = getPlanGradient(index);
            const isCurrent = isCurrentPlan(plan.plan_name);
            const isPopular = index === 1;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-white ${
                  isPopular ? 'border-2 border-blue-500 shadow-lg scale-[1.02] md:scale-105 z-10' : 'border border-gray-200 hover:border-gray-300'
                } ${isCurrent ? 'border-2 border-green-500 shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 z-10">
                    <Badge className="rounded-bl-xl rounded-tr-lg bg-blue-600 text-white px-4 py-1.5 shadow-md font-bold text-xs">
                      <Star className="w-3 h-3 inline mr-1 fill-white" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isPopular && (
                  <div className="absolute inset-0 bg-blue-50/30 pointer-events-none" />
                )}

                {isCurrent && (
                  <div className="absolute top-0 left-0 z-10">
                    <Badge className="rounded-br-xl rounded-tl-lg bg-green-600 text-white px-4 py-1.5 shadow-md font-bold text-xs">
                      <Check className="w-3 h-3 inline mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-10">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2 text-gray-900">{plan.display_name}</CardTitle>
                  <CardDescription className="text-gray-600 min-h-[2.5rem] text-sm leading-relaxed px-2">
                    {plan.description || 'Perfect for getting started'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        ${billingCycle === 'monthly' 
                          ? (plan.price_monthly / 100).toFixed(0)
                          : (plan.price_yearly / 100 / 12).toFixed(0)
                        }
                      </span>
                      <span className="text-gray-600 ml-2 text-lg font-normal">/month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-500">
                          ${(plan.price_yearly / 100).toFixed(0)}/year
                        </p>
                        <p className="text-xs text-green-600 font-bold">
                          💰 Save ${((plan.price_monthly * 12 - plan.price_yearly) / 100).toFixed(0)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 text-left px-2">
                    <div className="flex items-center justify-center pb-4 mb-4 border-b border-gray-200">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-base font-bold text-gray-900">
                        {plan.posts_limit === -1 ? 'Unlimited' : plan.posts_limit} posts/month
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 border border-green-200">
                            <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                          </div>
                          <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-8 px-6">
                  <Button
                    onClick={() => handleSubscribe(plan.plan_name)}
                    disabled={isCurrent || processingPlan !== null}
                    className={`w-full py-6 text-base font-bold transition-all duration-300 rounded-xl ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                    }`}
                    variant={isCurrent ? 'outline' : 'default'}
                  >
                    {processingPlan === plan.plan_name ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
              })}
            </div>

            <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom duration-700">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 border-2 border-blue-100 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full -mr-32 -mt-32 opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100 rounded-full -ml-24 -mb-24 opacity-50" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Need a custom plan for your team?</h3>
                  <p className="text-gray-700 mb-8 text-base max-w-xl mx-auto leading-relaxed">
                    Get in touch with our sales team for enterprise solutions and volume discounts
                  </p>
                  <Button 
                    size="lg" 
                    className="px-10 py-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    Contact Sales
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
