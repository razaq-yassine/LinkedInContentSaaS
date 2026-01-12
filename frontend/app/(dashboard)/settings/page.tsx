"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { LinkedInConnect } from "@/components/LinkedInConnect";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Lock, Shield, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasPassword(data.has_password);
        setIsOAuthUser(data.google_connected || data.linkedin_connected);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];
  const passwordsMatch = newPassword === confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordErrors.length > 0) {
      setPasswordMessage({ type: 'error', text: 'Password does not meet requirements' });
      return;
    }

    if (!passwordsMatch) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setPasswordLoading(true);
    try {
      // Use set-password endpoint if user doesn't have password yet
      const endpoint = hasPassword ? '/api/auth/change-password' : '/api/auth/set-password';
      const body = hasPassword 
        ? { current_password: currentPassword, new_password: newPassword }
        : { new_password: newPassword };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: hasPassword ? 'Password changed successfully!' : 'Password set successfully! You can now login with email and password.' });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);
      } else {
        setPasswordMessage({ type: 'error', text: data.detail || 'Failed to change password' });
      }
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setPasswordLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F2F0] via-white to-[#F3F2F0] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-[#666666] dark:text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F2F0] via-white to-[#F3F2F0] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-5 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white mb-1 sm:mb-2">Account Settings</h1>
          <p className="text-sm sm:text-base text-[#666666] dark:text-slate-400">Manage your connected accounts and security settings</p>
        </div>

        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Connected Accounts Section */}
          <div className="overflow-hidden rounded-lg border border-[#E0DFDC] dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Connected Accounts</h2>
                  <p className="text-white/80 text-xs sm:text-sm">Link your social media accounts</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8">
              <div className="space-y-4">
                <LinkedInConnect />
                <GoogleConnect />
              </div>
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-900">Why connect accounts?</p>
                    <p className="text-[11px] sm:text-xs text-blue-700 mt-1">
                      Connecting your accounts allows seamless content sharing and profile synchronization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="overflow-hidden rounded-lg border border-[#E0DFDC] dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Password & Security</h2>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {hasPassword ? 'Update your password to keep your account secure' : 'Set a password to enable email login'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8">
              {/* Info banner for OAuth users without password */}
              {!hasPassword && isOAuthUser && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Set a Password</p>
                      <p className="text-[11px] sm:text-xs text-blue-700 mt-1">
                        You logged in with {isOAuthUser ? 'social login' : 'OAuth'}. Set a password to enable login with your email address.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Current Password - Only show if user has password */}
                {hasPassword && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="current-password" className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-1.5 sm:gap-2">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A66C2]" />
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="h-11 sm:h-10 text-base sm:text-sm border-[#E0DFDC] focus:border-[#0A66C2] focus:ring-[#0A66C2] transition-colors"
                      required
                    />
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="new-password" className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-1.5 sm:gap-2">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A66C2]" />
                    {hasPassword ? 'New Password' : 'Password'}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={hasPassword ? "Enter your new password" : "Enter your password"}
                    className="h-11 sm:h-10 text-base sm:text-sm border-[#E0DFDC] focus:border-[#0A66C2] focus:ring-[#0A66C2] transition-colors"
                    required
                  />
                  {newPassword && passwordErrors.length > 0 && (
                    <div className="mt-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[11px] sm:text-xs font-medium text-amber-900 mb-1.5 sm:mb-2">Password must contain:</p>
                      <ul className="space-y-1">
                        {passwordErrors.map((error, idx) => (
                          <li key={idx} className="text-[11px] sm:text-xs text-amber-700 flex items-center gap-1.5 sm:gap-2">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {newPassword && passwordErrors.length === 0 && (
                    <div className="mt-2 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-[11px] sm:text-xs text-green-700 flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Password meets all requirements
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-1.5 sm:gap-2">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A66C2]" />
                    {hasPassword ? 'Confirm New Password' : 'Confirm Password'}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={hasPassword ? "Confirm your new password" : "Confirm your password"}
                    className="h-11 sm:h-10 text-base sm:text-sm border-[#E0DFDC] focus:border-[#0A66C2] focus:ring-[#0A66C2] transition-colors"
                    required
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] sm:text-xs text-red-600 flex items-center gap-1.5 sm:gap-2 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="text-[11px] sm:text-xs text-green-600 flex items-center gap-1.5 sm:gap-2 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Message Display */}
                {passwordMessage && (
                  <div className={`p-3 sm:p-4 rounded-lg border ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
                      passwordMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {passwordMessage.text}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-3 sm:pt-4">
                  <Button
                    type="submit"
                    disabled={passwordLoading || passwordErrors.length > 0 || !passwordsMatch || (hasPassword === true && !currentPassword)}
                    className="w-full bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:from-[#004182] hover:to-[#0A66C2] text-white font-semibold py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {passwordLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {hasPassword ? 'Updating Password...' : 'Setting Password...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {hasPassword ? 'Update Password' : 'Set Password'}
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Security Tips */}
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                <p className="text-[11px] sm:text-xs font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">🔐 Security Tips:</p>
                <ul className="space-y-1 text-[11px] sm:text-xs text-gray-600 dark:text-slate-300">
                  <li>• Use a unique password you don't use elsewhere</li>
                  <li>• Consider using a password manager</li>
                  <li>• Change your password regularly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


