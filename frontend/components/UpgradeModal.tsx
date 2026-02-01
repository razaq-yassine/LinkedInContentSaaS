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
    // Only show for free users on their first login
    if (isOpen && userPlan === 'FREE') {
      // Check if user has ever seen the modal
      const hasSeenModal = localStorage.getItem('upgradeModalSeen');
      
      if (!hasSeenModal) {
        setShowModal(true);
        localStorage.setItem('upgradeModalSeen', 'true');
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

  if (!showModal || userPlan !== 'FREE') return null;

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] p-0 overflow-hidden border border-gray-200 flex flex-col" showCloseButton={false}>
        <DialogTitle className="sr-only">Upgrade Your Plan</DialogTitle>
        {/* Header */}
        <div className="relative bg-blue-600 p-6 text-white flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Unlock Your Full Potential! 🚀</h2>
              <p className="text-blue-100 text-sm">Upgrade for more credits</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-center mb-4">
            <p className="text-gray-700 mb-1">
              You're on the <span className="font-bold text-blue-600">Free Plan</span> with{' '}
              <span className="font-bold text-blue-600">{creditsRemaining} credits</span> remaining.
            </p>
            <p className="text-gray-600 text-sm">
              Upgrade to <span className="font-bold">Starter</span> and create 8x more content!
            </p>
          </div>

          {/* Starter Plan Highlight */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
              POPULAR
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Starter Plan</h3>
                <p className="text-gray-600 text-xs">Perfect for professionals</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">$12</div>
                <div className="text-xs text-gray-600">per month</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">40 credits/month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">~16-80 posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">All post formats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Priority support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Unlimited regenerations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">AI research FREE</span>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-base"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Starter Plan
            </Button>
          </div>

          {/* Other Plans Preview */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-sm text-gray-900">Pro Plan</h4>
              </div>
              <div className="text-xl font-bold text-blue-600">$25<span className="text-xs text-gray-600">/mo</span></div>
              <p className="text-xs text-gray-600 mt-0.5">100 credits • ~40-200 posts</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-sm text-gray-900">Unlimited</h4>
              </div>
              <div className="text-xl font-bold text-blue-600">$50<span className="text-xs text-gray-600">/mo</span></div>
              <p className="text-xs text-gray-600 mt-0.5">∞ Unlimited posts</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-sm text-blue-900">Join 10,000+ creators</span>
            </div>
            <p className="text-xs text-blue-700">
              already scaling their LinkedIn presence!
            </p>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleClose}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
          >
            Maybe later, continue with Free plan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

