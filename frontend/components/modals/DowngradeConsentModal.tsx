'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';

interface DowngradeConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  periodEndDate: string | null;
}

export default function DowngradeConsentModal({
  open,
  onClose,
  onConfirm,
  currentPlan,
  periodEndDate,
}: DowngradeConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Confirm Plan Downgrade
          </DialogTitle>
          <DialogDescription className="pt-2">
            Review what will happen when you downgrade to the free plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Concise Summary */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What will happen:
            </p>
            <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
              <li>• Premium features remain active until {formatDate(periodEndDate)}</li>
              <li>• Credits preserved until period end</li>
              <li>• On {formatDate(periodEndDate)}, moved to Free plan</li>
              <li>• Subscription cancelled (no further charges)</li>
            </ul>
          </div>

          {/* Period End Highlight */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Premium access until:
              </p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {formatDate(periodEndDate)}
              </p>
            </div>
          </div>

          {/* Policy Link */}
          <div className="pt-2">
            <Link
              href="/policy/plan-changes"
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Read full plan change policy
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="downgrade-agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="downgrade-agreement"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              I understand and agree. I'll keep premium access until {formatDate(periodEndDate)}, then my plan will change to Free.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            Keep Current Plan
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !agreed}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Downgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
