'use client';

import { AlertTriangle, Wrench } from 'lucide-react';

interface MaintenanceBannerProps {
  message: string;
  variant?: 'banner' | 'fullpage';
}

export function MaintenanceBanner({ message, variant = 'banner' }: MaintenanceBannerProps) {
  if (variant === 'fullpage') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-slate-300 mb-6">
            {message || "We're currently performing scheduled maintenance. Please check back soon!"}
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-400/80 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>We'll be back shortly</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-amber-950 py-3 px-4">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <Wrench className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          {message || "We're currently performing scheduled maintenance. Please check back soon!"}
        </p>
      </div>
    </div>
  );
}
