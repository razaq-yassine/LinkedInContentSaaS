"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Settings, Check } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent has been given in this session
    const consentGiven = sessionStorage.getItem("cookie_consent");
    if (!consentGiven) {
      // Small delay before showing banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (acceptAll: boolean = false) => {
    const finalPreferences = acceptAll
      ? { essential: true, functional: true, analytics: true, marketing: true }
      : preferences;
    
    sessionStorage.setItem("cookie_consent", JSON.stringify(finalPreferences));
    sessionStorage.setItem("cookie_consent_timestamp", new Date().toISOString());
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true);
  };

  const handleAcceptSelected = () => {
    saveConsent(false);
  };

  const handleDeclineOptional = () => {
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    saveConsent(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Main Banner */}
        <div className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-cyan-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">
                We Value Your Privacy
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                We use cookies to enhance your browsing experience and analyze site traffic. 
                Under US privacy laws including CCPA, you have the right to opt out of certain data collection.{" "}
                <Link href="/cookies" className="text-cyan-400 hover:underline">
                  Learn more
                </Link>
              </p>

              {/* Preference Options (Expandable) */}
              {showPreferences && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <PreferenceToggle
                    label="Essential Cookies"
                    description="Required for basic site functionality"
                    checked={true}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <PreferenceToggle
                    label="Functional Cookies"
                    description="Remember your preferences and settings"
                    checked={preferences.functional}
                    onChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, functional: checked }))
                    }
                  />
                  <PreferenceToggle
                    label="Analytics Cookies"
                    description="Help us understand how you use our site"
                    checked={preferences.analytics}
                    onChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, analytics: checked }))
                    }
                  />
                  <PreferenceToggle
                    label="Marketing Cookies"
                    description="Used for targeted advertising"
                    checked={preferences.marketing}
                    onChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, marketing: checked }))
                    }
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept All
                </button>
                
                <button
                  onClick={handleDeclineOptional}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Reject Optional
                </button>
                
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {showPreferences ? "Hide" : "Customize"}
                </button>

                {showPreferences && (
                  <button
                    onClick={handleAcceptSelected}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save Preferences
                  </button>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDeclineOptional}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close cookie banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PreferenceToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function PreferenceToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: PreferenceToggleProps) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-cyan-500" : "bg-slate-600"
          } ${disabled ? "" : "peer-focus:ring-2 peer-focus:ring-cyan-500/50"}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}
