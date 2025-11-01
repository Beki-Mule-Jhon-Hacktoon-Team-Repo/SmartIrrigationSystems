"use client";

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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <FeaturesSection />

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
