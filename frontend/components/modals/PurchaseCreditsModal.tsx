'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

interface CreditPricing {
  price_per_unit: number;
  purchase_steps: number[];
  bulk_discounts: Array<{ min: number; discount: number }>;
  max_purchase: number;
  enabled: boolean;
}

interface PurchaseCreditsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PurchaseCreditsModal({
  open,
  onClose,
  onSuccess,
}: PurchaseCreditsModalProps) {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<CreditPricing | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [priceInfo, setPriceInfo] = useState<{
    subtotal: number;
    discount_percentage: number;
    discount_amount: number;
    final_price: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      fetchPricing();
      setAgreed(false);
      setSelectedAmount(null);
      setPriceInfo(null);
    }
  }, [open]);

  const fetchPricing = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/pricing`
      );
      setPricing(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const calculatePrice = (credits: number) => {
    if (!pricing) return null;

    const basePrice = pricing.price_per_unit;
    let applicableDiscount = 0;

    // Find applicable discount
    const sortedDiscounts = [...pricing.bulk_discounts].sort(
      (a, b) => b.min - a.min
    );
    for (const discount of sortedDiscounts) {
      if (credits >= discount.min) {
        applicableDiscount = discount.discount;
        break;
      }
    }

    const subtotal = credits * basePrice;
    const discountAmount = subtotal * applicableDiscount;
    const finalPrice = subtotal - discountAmount;

    return {
      subtotal,
      discount_percentage: applicableDiscount * 100,
      discount_amount: discountAmount,
      final_price: Math.round(finalPrice),
    };
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    const calculated = calculatePrice(amount);
    setPriceInfo(calculated);
  };

  const handlePurchase = async () => {
    if (!selectedAmount || !priceInfo || !agreed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/purchase`,
        { credits_amount: selectedAmount },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.response?.data?.detail || 'Failed to start purchase process');
      setLoading(false);
    }
  };

  if (!pricing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!pricing.enabled) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Purchases Unavailable</DialogTitle>
            <DialogDescription>
              Credit purchases are currently disabled. Please contact support for assistance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription className="pt-2">
            Buy additional credits that never expire. These credits are separate from your subscription credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Purchased credits are permanent and will not reset monthly. They are used after your subscription credits are exhausted.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
              Select Credit Amount:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pricing.purchase_steps.map((amount) => {
                const calculated = calculatePrice(amount);
                const hasDiscount = calculated && calculated.discount_percentage > 0;
                return (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAmount === amount
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {amount}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        credits
                      </div>
                      {hasDiscount && (
                        <Badge className="mt-1 text-xs bg-green-500">
                          {calculated.discount_percentage}% off
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedAmount && priceInfo && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedAmount} credits × ${(priceInfo.subtotal / selectedAmount / 100).toFixed(2)}
                </span>
                <span className="text-sm font-semibold">
                  ${(priceInfo.subtotal / 100).toFixed(2)}
                </span>
              </div>
              {priceInfo.discount_percentage > 0 && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span className="text-sm">Discount ({priceInfo.discount_percentage}%)</span>
                  <span className="text-sm font-semibold">
                    -${(priceInfo.discount_amount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-purple-200 dark:border-purple-700 pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Total:</span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ${(priceInfo.final_price / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {selectedAmount && selectedAmount > pricing.max_purchase && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Maximum purchase limit is {pricing.max_purchase} credits per transaction.
              </p>
            </div>
          )}

          {/* Policy Link */}
          {selectedAmount && (
            <div className="pt-2">
              <Link
                href="/policy/plan-changes"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Read full credit purchase policy
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Agreement Checkbox */}
          {selectedAmount && priceInfo && (
            <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="purchase-agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="purchase-agreement"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                I understand and agree. Purchased credits never expire and are used after subscription credits.
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading || !selectedAmount || !agreed || (selectedAmount > pricing.max_purchase)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
