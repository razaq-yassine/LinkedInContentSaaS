'use client';

import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionCanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-300 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Subscription Canceled
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            No worries! Your payment was not processed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              You can return to the billing page anytime to upgrade your plan and unlock more features.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">Still available with your current plan:</p>
            <p>✓ Continue using your free credits</p>
            <p>✓ Access to all post formats</p>
            <p>✓ Email support</p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            onClick={() => router.push('/billing')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
          <Button
            onClick={() => router.push('/generate')}
            variant="outline"
            className="flex-1"
          >
            Continue Creating
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


