'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give some time for webhook to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900">Processing your subscription...</h2>
              <p className="text-gray-600">Please wait while we activate your plan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-200 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to Pro!
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900">Your credits are ready!</p>
                <p className="text-sm text-green-700">
                  Start creating amazing LinkedIn content with your new credits.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Full access to all post formats</p>
            <p>✓ Priority support</p>
            <p>✓ Unlimited regenerations</p>
            <p>✓ AI research included</p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            onClick={() => router.push('/generate')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Start Creating
          </Button>
          <Button
            onClick={() => router.push('/billing')}
            variant="outline"
            className="flex-1"
          >
            View Billing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

