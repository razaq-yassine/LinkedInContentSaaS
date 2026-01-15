'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/request-code`,
        { email }
      );

      setCodeSent(true);
      setStep('code');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many code requests. Please wait 15 minutes before requesting another code.');
      } else if (err.response?.status === 423) {
        setError('Account temporarily locked. Please try again later.');
      } else {
        setError(err.response?.data?.detail || 'Failed to send code. Please check your email address.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/login`,
        { email, code }
      );

      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
      
      router.push('/admin/dashboard');
    } catch (err: any) {
      if (err.response?.status === 423) {
        setError('Too many failed attempts. Please wait 15 minutes before trying again.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait before trying again.');
      } else {
        setError(err.response?.data?.detail || 'Invalid code. Please check and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    setCodeSent(false);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/request-code`,
        { email }
      );

      setCodeSent(true);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many code requests. Please wait 15 minutes before requesting another code.');
      } else {
        setError(err.response?.data?.detail || 'Failed to resend code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">
            {step === 'email' ? 'Enter your email to receive a login code' : 'Enter the code sent to your email'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Code...' : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {codeSent && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Code sent! Check your email inbox.
              </div>
            )}

            <div>
              <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email-display"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Login Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the 6-digit code sent to your email. Code expires in 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setCodeSent(false);
                  setError('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
