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
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface UpgradeConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  currentPrice: number;
  newPrice: number;
  billingCycle: 'monthly' | 'yearly';
}

export default function UpgradeConsentModal({
  open,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  currentPrice,
  newPrice,
  billingCycle,
}: UpgradeConsentModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Confirm Plan Upgrade
          </DialogTitle>
          <DialogDescription className="pt-2">
            Review the key details before upgrading your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Concise Summary */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What will happen:
            </p>
            <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
              <li>• Current plan cancelled immediately</li>
              <li>• New plan starts immediately</li>
              <li>• Your credits are preserved and new plan credits added</li>
              <li>• Full price charged (no proration)</li>
            </ul>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current Plan</p>
              <p className="font-semibold capitalize text-sm">{currentPlan}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">New Plan</p>
              <p className="font-semibold capitalize text-sm">{newPlan}</p>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100 mb-1">New Monthly Cost</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ${newPrice.toFixed(2)}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
            </p>
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
              id="upgrade-agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="upgrade-agreement"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              I understand and agree to the plan change terms. My current subscription will be cancelled immediately and I'll be charged the full price for the new plan.
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
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !agreed}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Upgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
