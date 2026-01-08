'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Zap, Crown, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: string;
  creditsRemaining?: number;
}

export function UpgradeModal({ isOpen, onClose, userPlan, creditsRemaining = 0 }: UpgradeModalProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show for free users on login
    if (isOpen && userPlan === 'free') {
      // Check if user has seen modal today
      const lastShown = localStorage.getItem('upgradeModalLastShown');
      const today = new Date().toDateString();
      
      if (lastShown !== today) {
        setShowModal(true);
        localStorage.setItem('upgradeModalLastShown', today);
      }
    }
  }, [isOpen, userPlan]);

  const handleUpgrade = () => {
    setShowModal(false);
    onClose();
    router.push('/billing?tab=plans');
  };

  const handleClose = () => {
    setShowModal(false);
    onClose();
  };

  if (!showModal || userPlan !== 'free') return null;

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border border-gray-200" showCloseButton={false}>
        <DialogTitle className="sr-only">Upgrade Your Plan</DialogTitle>
        {/* Header */}
        <div className="relative bg-blue-600 p-8 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Unlock Your Full Potential! 🚀</h2>
              <p className="text-blue-100 text-sm">Limited time offer for new users</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-2">
              You're currently on the <span className="font-bold text-blue-600">Free Plan</span> with only{' '}
              <span className="font-bold text-blue-600">{creditsRemaining} credits</span> remaining.
            </p>
            <p className="text-gray-600">
              Upgrade to <span className="font-bold text-blue-600">Starter</span> and create 8x more content! 🎯
            </p>
          </div>

          {/* Starter Plan Highlight */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6 border-2 border-blue-500 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MOST POPULAR
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Starter Plan</h3>
                <p className="text-gray-600 text-sm">Perfect for professionals</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">$12</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">40 credits/month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">~16-80 posts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">All post formats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Unlimited regenerations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">AI research FREE</span>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg shadow-sm"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Upgrade to Starter Plan Now
            </Button>
          </div>

          {/* Other Plans Preview */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900">Pro Plan</h4>
              </div>
              <div className="text-2xl font-bold text-blue-600">$25<span className="text-sm text-gray-600">/mo</span></div>
              <p className="text-xs text-gray-600 mt-1">100 credits • ~40-200 posts</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900">Unlimited</h4>
              </div>
              <div className="text-2xl font-bold text-blue-600">$50<span className="text-sm text-gray-600">/mo</span></div>
              <p className="text-xs text-gray-600 mt-1">∞ Unlimited posts</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-900">Join 10,000+ creators</span>
            </div>
            <p className="text-sm text-blue-700">
              who are already scaling their LinkedIn presence with our Pro plans!
            </p>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleClose}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Maybe later, continue with Free plan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

