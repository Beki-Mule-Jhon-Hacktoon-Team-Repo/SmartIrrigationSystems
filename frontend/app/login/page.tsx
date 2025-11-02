// "use client";

// import type React from "react";

// import { Navbar } from "@/components/navbar";
// import { Footer } from "@/components/footer";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Link from "next/link";
// import { useEffect, useState, useCallback } from "react";
// import { Eye, EyeOff } from "lucide-react";
// import { useAppDispatch } from "@/store/hooks";
// import { loginStart, loginSuccess, logout } from "@/store/authSlice";
// import {
//   auth,
//   provider,
//   signInWithPopup,
//   firebaseSignOut,
//   onAuthStateChanged,
// } from "@/lib/firebase";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const dispatch = useAppDispatch();
//   const router = useRouter();
'use client';


'use client';


import type React from 'react';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginStart, loginSuccess, logout } from '@/store/authSlice';
import {
  auth,
  provider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
} from '@/lib/firebase';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  // lightweight toast helper (top-right)
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
      el.style.top = '24px'; // moved to top
      el.style.zIndex = '9999';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '8px';
      el.style.color = '#fff';
      el.style.fontSize = '14px';
      el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 220ms ease, transform 220ms ease';
      el.style.transform = 'translateY(-8px)';
      if (type === 'success') el.style.background = '#16a34a';
      else if (type === 'error') el.style.background = '#dc2626';
      else el.style.background = '#2563eb';
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-8px)';
        setTimeout(() => el.remove(), 300);
      }, duration);
    } catch (e) {
      console.log('toast:', message);
    }
  };

  // controlled form state
  const [email, setEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const authState = useAppSelector((s) => s.auth);

  const getApiBase = () =>
    process.env.NEXT_PUBLIC_API_BASE_URL &&
    process.env.NEXT_PUBLIC_API_BASE_URL !== ''
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : typeof window !== 'undefined'
      ? window.location.origin.replace(/:3000$/, ':5001')
      : 'http://localhost:5001';

  // POST /api/v1/auth/login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    dispatch(loginStart());
    try {
      const url = `${getApiBase()}/api/v1/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Login failed (${res.status})`);
      }
      const body = await res.json().catch(() => ({}));
      const user = body?.data?.user || null;
      const token = body?.token || ''; // ensure idToken always provided (empty string fallback)
      dispatch(loginSuccess({ user, idToken: token }));
      showToast('Login successful', { type: 'success' });
      // redirect according to role
      if (user?.role === 'admin') router.push('/admin');
      else router.push('/farmer');
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login failed. Check credentials or server.', {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useCallback(async () => {
    dispatch(loginStart());
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const url = `${getApiBase()}/api/v1/auth/google`;

      // send idToken to backend for server-side verification and user creation
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (networkErr) {
        console.error(
          'Network error when calling backend:',
          networkErr,
          'url:',
          url
        );
        throw networkErr;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '(no body)');
        console.error('Backend returned non-OK status', res.status, txt);
        throw new Error('Server verification failed');
      }

      const body = await res.json().catch(() => ({}));
      const serverUser = body?.data?.user || {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
      };
      // Prefer server token if returned, otherwise fallback to Firebase idToken
      const serverToken = body?.token || idToken || '';
      dispatch(loginSuccess({ user: serverUser, idToken: serverToken || '' }));
      showToast('Signed in with Google', { type: 'success' });


      // store authenticated user and idToken in redux (idToken from Firebase)
      dispatch(loginSuccess({ user: serverUser, idToken: idToken || '' }));
      showToast('Signed in with Google', { type: 'success' });


      console.log('Logged in user:', serverUser);
      // redirect to /farmers after successful login
      if (serverUser?.role === 'admin') {
        router.push('/admin');
      }

      if (serverUser?.role === 'user') {
        router.push('/farmer');
      }

      console.log(serverUser);
    } catch (err) {
      console.error('Google login error', err);
      showToast('Google login failed. See console.', { type: 'error' });
    }
  }, [dispatch, router]);

  useEffect(() => {
    // subscribe to Firebase auth state and restore
    const unsub = onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        try {
          const idToken = await u.getIdToken();

          // Try to fetch the canonical server user (so we have role and other DB fields)
          const url = `${getApiBase()}/api/v1/auth/google`;
          let serverUser = null;
          try {
            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (resp.ok) {
              const body = await resp.json().catch(() => ({}));
              serverUser = body?.data?.user || null;
              // prefer server token if provided
              const serverToken = body?.token || idToken || '';
              const user = serverUser || {
                name: u.displayName,
                email: u.email,
                picture: u.photoURL,
              };
              dispatch(loginSuccess({ user, idToken: serverToken || '' }));
            } else {
              console.warn('Auth verify returned non-OK', resp.status);
              const user = {
                name: u.displayName,
                email: u.email,
                picture: u.photoURL,
              };
              dispatch(loginSuccess({ user, idToken: idToken || '' }));
            }
          } catch (e) {
            console.warn(
              'Could not reach auth endpoint to hydrate server user:',
              e
            );
            const user = {
              name: u.displayName,
              email: u.email,
              picture: u.photoURL,
            };
            dispatch(loginSuccess({ user, idToken: idToken || '' }));
          }


          const user = serverUser || {
            name: u.displayName,
            email: u.email,
            picture: u.photoURL,
          };

          // ensure idToken string stored (fallback to empty string)
          dispatch(loginSuccess({ user, idToken: idToken || '' }));

        } catch (e) {
          console.error('onAuthStateChanged handler failed:', e);
        }
      } else {
        dispatch(logout());
      }
    });
    return () => unsub();
  }, [dispatch]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground">
              Sign in to your SmartAgriSense account
            </p>
          </div>

          <div className="mb-4">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              onClick={loginWithGoogle}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5"
              >
                <path
                  fill="#fbbc05"
                  d="M43.6 20.5H42V20H24v8h11.3C34.6 32 30 34 24 34c-7 0-13-6-13-13s6-13 13-13c3.3 0 6.3 1.2 8.6 3.2l6.1-6.1C34.6 2.9 29.6 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c12 0 21.7-8.9 22-20.8.4-1.4.4-2.9.4-3.7 0-.8 0-1.5-.8-2z"
                />
                <path
                  fill="#518ef8"
                  d="M6.3 14.9l6.6 4.8C14.9 17.2 19 13 24 13c3.3 0 6.3 1.2 8.6 3.2l6.1-6.1C34.6 2.9 29.6 1 24 1 16.9 1 10.7 4.8 6.3 14.9z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
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
                  placeholder="Enter your password"
                  required
                  className="bg-input pr-10"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                />
                Remember me
              </label>
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
