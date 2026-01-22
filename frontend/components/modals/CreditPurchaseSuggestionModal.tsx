'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Sparkles, Calendar } from 'lucide-react';

interface CreditPurchaseSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onPurchaseCredits: () => void;
  errorMessage: string;
  daysRemaining?: number;
}

export default function CreditPurchaseSuggestionModal({
  open,
  onClose,
  onPurchaseCredits,
  errorMessage,
  daysRemaining,
}: CreditPurchaseSuggestionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            Plan Switch Not Available
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-600 dark:text-slate-400">
            Yearly subscriptions cannot be switched to monthly until the last 30 days of your subscription period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Message */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {errorMessage}
            </p>
          </div>

          {/* Days Remaining Info */}
          {daysRemaining !== undefined && daysRemaining > 30 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Your subscription ends in {daysRemaining} days
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You can switch to monthly billing within the last 30 days of your subscription period.
                </p>
              </div>
            </div>
          )}

          {/* Alternative Solution */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Need immediate access?
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                  Purchase credits to get immediate access to more content generation. Purchased credits never expire and are used after your subscription credits.
                </p>
                <Button
                  onClick={onPurchaseCredits}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Buy Credits
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
            I'll Wait
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
