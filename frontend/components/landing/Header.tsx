"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Sparkles, Brain, Zap, Wrench } from "lucide-react";
import axios from "axios";

const navigation = {
  features: [
    { name: "AI Content Writer", href: "/features/ai-writer", desc: "Generate authentic posts with AI" },
    { name: "Content Calendar", href: "/features/calendar", desc: "Schedule and manage your posts" },
    { name: "Voice Matching", href: "/features/voice", desc: "AI that writes like you" },
    { name: "Smart Suggestions", href: "/features/suggestions", desc: "Get content ideas when stuck" },
  ],
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/settings`
        );
        const data = response.data;
        setMaintenanceMode(data.maintenance_mode === 'true' || data.maintenance_mode === true);
        setMaintenanceMessage(data.maintenance_message || '');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Maintenance Banner or Announcement Banner */}
      {maintenanceMode ? (
        <div className="bg-amber-500 text-amber-950 py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
            <Wrench className="w-4 h-4" />
            <span className="font-medium">{maintenanceMessage || "We're currently performing scheduled maintenance. Please check back soon!"}</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
            <Zap className="w-4 h-4" />
            <span className="font-medium">PostInAi 2.0 is here!</span>
            <Link href="/changelog" className="underline hover:no-underline ml-1">
              See what&apos;s new →
            </Link>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/logo-dark.png" 
                alt="PostInAi" 
                className="h-8 w-auto hidden lg:block"
              />
              <img 
                src="/logo-dark-sm.png" 
                alt="PostInAi" 
                className="h-6 w-auto lg:hidden"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Features Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("features")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 px-4 py-2 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-slate-800/50 transition-colors">
                  Features
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === "features" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "features" && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/50 py-2 animate-fade-in">
                    {navigation.features.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 hover:bg-cyan-500/10 transition-colors"
                      >
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.desc}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/pricing" className="px-4 py-2 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-slate-800/50 transition-colors">
                Pricing
              </Link>
              <Link href="/customers" className="px-4 py-2 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-slate-800/50 transition-colors">
                Customers
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-6 shadow-lg shadow-cyan-500/20">
                  Try Free
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 py-4 animate-fade-in">
            <div className="container mx-auto px-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Features</p>
                {navigation.features.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-2 py-2 text-slate-300 hover:text-violet-400"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">Log in</Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600">Try Free</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
