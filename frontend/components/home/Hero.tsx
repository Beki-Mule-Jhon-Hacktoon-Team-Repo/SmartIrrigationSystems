"use client";

import Link from "next/link";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  AI-Powered Agriculture
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-pretty">
                Smart <span className="text-primary">Irrigation</span> for{" "}
                <span className="text-accent">Sustainable</span> Farming
              </h1>

              <p className="text-lg text-foreground/70 text-pretty max-w-xl">
                Save water, increase crop yield, and reduce costs with
                AI-powered irrigation management. Real-time monitoring and
                weather-aware scheduling for modern farms.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Droplets className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold text-primary">40%</div>
                <div className="text-sm text-foreground/60">Water Saved</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">5000+</div>
                <div className="text-sm text-foreground/60">Active Farms</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">25%</div>
                <div className="text-sm text-foreground/60">Yield Increase</div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 md:h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-8 h-full flex items-center justify-center">
              <div className="space-y-6 w-full">
                <div className="bg-card rounded-lg p-4 space-y-2 border border-border shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">
                      Soil Moisture
                    </span>
                    <span className="text-2xl font-bold text-primary">72%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "72%" }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
                    <div className="text-xs text-foreground/60 mb-2">
                      Temperature
                    </div>
                    <div className="text-2xl font-bold text-accent">28°C</div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
                    <div className="text-xs text-foreground/60 mb-2">
                      Humidity
                    </div>
                    <div className="text-2xl font-bold text-accent">65%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
