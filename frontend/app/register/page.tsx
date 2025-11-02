'use client';

import type React from 'react';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/authSlice';


export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // lightweight toast helper
  const showToast = (
    message: string,
    opts: { duration?: number; type?: 'info' | 'success' | 'error' } = {}
  ) => {
    const { duration = 4000, type = 'info' } = opts;
    try {
      const el = document.createElement('div');
      el.textContent = message;
      el.style.position = 'fixed';
      el.style.right = '16px';
      el.style.top = '24px'; // top-right placement
      el.style.zIndex = '9999';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '8px';
      el.style.color = '#fff';
      el.style.fontSize = '14px';
      el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 220ms ease, transform 220ms ease';
      el.style.transform = 'translateY(8px)';
      if (type === 'success') el.style.background = '#16a34a';
      else if (type === 'error') el.style.background = '#dc2626';
      else el.style.background = '#2563eb';
      document.body.appendChild(el);
      // trigger show
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 300);
      }, duration);
    } catch (e) {
      /* fallback */ console.log('toast:', message);
    }
  };

  const passwordRequirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
  ];

  const getApiBase = () =>
    process.env.NEXT_PUBLIC_API_BASE_URL &&
    process.env.NEXT_PUBLIC_API_BASE_URL !== ''
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : typeof window !== 'undefined'
      ? window.location.origin.replace(/:3000$/, ':5001')
      : 'http://localhost:5001';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      showToast('Passwords do not match', { type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const url = `${getApiBase()}/api/v1/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Register failed (${res.status})`);
      }

      const body = await res.json().catch(() => ({}));
      const user = body?.data?.user || null;
      const token = body?.token || null;
      if (user && token) {
        // store in redux + localStorage (authSlice handles persisting)
        dispatch(loginSuccess({ user, idToken: token }));
        showToast('Account created and signed in', { type: 'success' });
        // redirect according to role
        if (user?.role === 'admin') window.location.href = '/admin';
        else window.location.href = '/farmer';
      } else {
        showToast('Account created. Please sign in.', { type: 'success' });
        window.location.href = '/login';
      }

    } catch (err) {
      console.error('Register error:', err);
      showToast('Registration failed. See console.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground">Join SmartAgriSense today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Smart AgriSense"
                required
                className="bg-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="smartagrisense@gmail.com"
                required
                className="bg-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="space-y-2 mt-3 p-3 bg-muted/30 rounded-lg">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span
                      className={
                        req.met ? 'text-foreground' : 'text-muted-foreground'
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  required
                  className="bg-input pr-10"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border mt-1"
                required
              />
              <span className="text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
