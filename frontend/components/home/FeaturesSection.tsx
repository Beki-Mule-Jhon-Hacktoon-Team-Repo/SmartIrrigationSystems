"use client";

import { Card } from "@/components/ui/card";
import {
  Zap,
  Cloud,
  BarChart3,
  AlertCircle,
  Smartphone,
  Droplets,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Cloud,
      title: "Weather-Aware Scheduling",
      description:
        "AI predicts rainfall and adjusts irrigation automatically, saving water and preventing crop damage.",
    },
    {
      icon: Zap,
      title: "Real-Time Monitoring",
      description:
        "Track soil moisture, temperature, and humidity in real-time from your smartphone or dashboard.",
    },
    {
      icon: BarChart3,
      title: "AI Predictions",
      description:
        "Advanced ML models analyze soil and weather data to recommend optimal irrigation schedules.",
    },
    {
      icon: AlertCircle,
      title: "Smart Alerts",
      description:
        "Get instant notifications for low moisture, high temperature, or rainfall predictions.",
    },
    {
      icon: Droplets,
      title: "Water Conservation",
      description:
        "Save up to 40% on water usage while improving crop yield and sustainability.",
    },
    {
      icon: Smartphone,
      title: "Mobile Control",
      description:
        "Start or stop irrigation remotely with one tap from your phone, anywhere, anytime.",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Powerful Features
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to optimize irrigation and maximize crop yield
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={i}
                className="p-6 hover:shadow-lg hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-foreground/70 text-sm">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
