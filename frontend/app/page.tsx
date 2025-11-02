"use client";

import React, { useEffect, useState } from "react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Droplets,
  TrendingUp,
  Cloud,
  Zap,
  Award,
  Users,
  Leaf,
} from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { ImpactSection } from "@/components/home/ImpactSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaSection } from "@/components/home/CtaSection";

export default function LandingPage() {
  // Posts loaded from backend
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const url = "http://localhost:5000/api/v1/blog";

    setLoadingPosts(true);
    setPostsError(null);

    fetch(url, { headers: { "Content-Type": "application/json" } })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(body || `Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const items =
          data && data.data && Array.isArray(data.data.items)
            ? data.data.items
            : [];
        setPosts(items);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load posts:", err);
        setPostsError(String(err.message || err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingPosts(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <FeaturesSection />

      {/* New: Blog & Weather Section (static UI) */}
      <section className="px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Blog & Weather</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Share updates with your community and view current field conditions.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Created posts (read-only) */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Created posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Read-only view of posts (static UI / loaded from
                    localStorage if present).
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Read-only</div>
              </div>

              <div className="space-y-4">
                {loadingPosts ? (
                  <div className="text-sm text-muted-foreground">
                    Loading posts...
                  </div>
                ) : postsError ? (
                  <div className="text-sm text-red-500">{postsError}</div>
                ) : posts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No posts yet.
                  </div>
                ) : (
                  posts.map((p) => (
                    <article
                      key={p.id}
                      className="p-3 border rounded hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.time} • Tags:{" "}
                            {Array.isArray(p.tags)
                              ? p.tags.join(", ")
                              : String(p.tags)}
                          </div>
                        </div>
                        <Link href="#" className="text-xs text-primary">
                          Read
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {p.excerpt}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </Card>

            {/* Weather card (right) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Current field weather</h3>
                <div className="text-xs text-muted-foreground">Static</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">23°C</div>
                <div>
                  <div className="text-sm font-medium">Partly Cloudy</div>
                  <div className="text-xs text-muted-foreground">
                    Humidity 39% • Wind 6 km/h
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="py-2 bg-slate-50 rounded">
                  <div className="text-xs text-muted-foreground">Now</div>
                  <div className="font-semibold">23°</div>
                </div>
                <div className="py-2 bg-slate-50 rounded">
                  <div className="text-xs text-muted-foreground">+3h</div>
                  <div className="font-semibold">22°</div>
                </div>
                <div className="py-2 bg-slate-50 rounded">
                  <div className="text-xs text-muted-foreground">+6h</div>
                  <div className="font-semibold">20°</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Source: Local weather station (static display)
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <ImpactSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CtaSection />

      <Footer />
    </div>
  );
}
