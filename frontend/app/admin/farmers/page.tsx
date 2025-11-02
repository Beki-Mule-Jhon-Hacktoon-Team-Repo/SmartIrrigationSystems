'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreVertical, Mail, Eye } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

type FarmerRow = {
  id: string;
  name: string;
  email: string;
  farms: number | string;
  location: string;
  status: string;
};

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAppSelector((s) => (s.auth && s.auth.idToken) || null);

  // lightweight toast for feedback
  const showToast = (
    msg: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    try {
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.position = 'fixed';
      el.style.top = '24px';
      el.style.right = '16px';
      el.style.padding = '8px 12px';
      el.style.borderRadius = '8px';
      el.style.zIndex = '9999';
      el.style.color = '#fff';
      el.style.background =
        type === 'error'
          ? '#dc2626'
          : type === 'success'
          ? '#16a34a'
          : '#2563eb';
      document.body.appendChild(el);
      requestAnimationFrame(() => (el.style.opacity = '1'));
      setTimeout(() => el.remove(), 3500);
    } catch (e) {
      /* ignore */
    }
  };

  const getApiBase = () =>
    process.env.NEXT_PUBLIC_API_BASE_URL &&
    process.env.NEXT_PUBLIC_API_BASE_URL !== ''
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : typeof window !== 'undefined'
      ? window.location.origin.replace(/:3000$/, ':5001')
      : 'http://localhost:5001';

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const url = `${getApiBase()}/api/v1/admin/users/regular`;

      // Resolve token: prefer Redux token, otherwise try localStorage 'auth' fallback
      let idToken = token;
      if (!idToken && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            idToken = parsed?.idToken || null;
          }
        } catch (e) {
          /* ignore parse errors */
        }
      }

      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) baseHeaders['Authorization'] = `Bearer ${idToken}`;

      const tryReq = async (headers: Record<string, string>) =>
        fetch(url, { headers });
      let res = await tryReq(baseHeaders);

      // If unauthorized and fallback admin creds are provided via env, retry with x-admin headers
      if (res.status === 401 || res.status === 403) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
        if (adminEmail && adminPassword) {
          const altHeaders = {
            ...baseHeaders,
            'x-admin-email': adminEmail,
            'x-admin-password': adminPassword,
          };
          res = await tryReq(altHeaders);
        } else {
          // no fallback creds — surface an actionable toast and stop
          showToast(
            'Unauthorized: admin access required. Sign in as an admin or set NEXT_PUBLIC_ADMIN_EMAIL / NEXT_PUBLIC_ADMIN_PASSWORD for local dev.',
            'error'
          );
          // do not throw raw server response to avoid repeated noisy stack traces
          setFarmers([]);
          return;
        }
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Failed to fetch (${res.status})`);
      }

      const body = await res.json().catch(() => ({}));
      const users = body?.data?.users || [];
      const mapped = users.map((u: any) => {
        const farmsCount =
          typeof u.farmsCount === 'number'
            ? u.farmsCount
            : Array.isArray(u.farms)
            ? u.farms.length
            : 0;
        const totalLitres =
          typeof u.totalLitresSaved === 'number'
            ? u.totalLitresSaved
            : Array.isArray(u.farms)
            ? u.farms.reduce(
                (acc: number, f: any) => acc + (f?.litresSaved || 0),
                0
              )
            : 0;
        const location =
          u.primaryLocation ||
          (Array.isArray(u.farms) && u.farms[0]?.location) ||
          '—';
        return {
          id: u._id || u.id || String(Math.random()),
          name: u.name || u.email || 'Unnamed',
          email: u.email || '—',
          farms: farmsCount,
          location,
          status: u.active === false ? 'Inactive' : 'Active',
          waterSaved: totalLitres ? `${Math.round(totalLitres)} L` : '—',
        } as FarmerRow;
      });
      setFarmers(mapped);
    } catch (err: any) {
      console.error('fetchFarmers error:', err);
      showToast(
        err && err.message ? String(err.message) : 'Failed to fetch farmers',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farmers</h1>
          <p className="text-muted-foreground">
            Manage all registered farmers on the platform.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search farmers..." className="pl-10" />
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold">Name</th>
              <th className="text-left py-3 px-4 font-semibold">Email</th>
              <th className="text-left py-3 px-4 font-semibold">Farms</th>
              <th className="text-left py-3 px-4 font-semibold">Location</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : (
              farmers.map((farmer) => (
                <tr
                  key={farmer.id}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{farmer.name}</td>
                  <td className="py-3 px-4">{farmer.email}</td>
                  <td className="py-3 px-4">{farmer.farms}</td>
                  <td className="py-3 px-4">{farmer.location}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        farmer.status === 'Active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100'
                      }`}
                    >
                      {farmer.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-muted rounded-lg">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded-lg">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded-lg">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
