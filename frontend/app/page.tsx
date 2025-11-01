"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Droplets, TrendingUp, Cloud, Zap, Award, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance">
                Smart Irrigation, Powered by AI
              </h1>
              <p className="text-lg text-muted-foreground text-balance">
                Optimize water usage, increase crop yield, and reduce costs with intelligent irrigation management
                powered by AI and real-time sensor data.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Login
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">✓ No credit card required • 14-day free trial • Easy setup</p>
          </div>
          <div className="h-96 md:h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <Droplets className="w-48 h-48 text-primary/30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your irrigation efficiently and sustainably.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Based Recommendations",
                description:
                  "Get intelligent irrigation suggestions based on soil moisture, weather, and historical data.",
              },
              {
                icon: <Cloud className="w-8 h-8" />,
                title: "Real-Time Monitoring",
                description:
                  "Monitor soil moisture, temperature, and humidity 24/7 with instant alerts and notifications.",
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Water & Cost Savings",
                description: "Reduce water consumption by up to 40% and increase crop yield with optimized irrigation.",
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Weather Integration",
                description: "Automatic weather forecasting to adjust irrigation schedules and prevent water waste.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Multi-Farm Management",
                description: "Manage multiple farms from a single dashboard with role-based access control.",
              },
              {
                icon: <Droplets className="w-8 h-8" />,
                title: "Predictive Analytics",
                description: "AI-powered predictions help you make informed decisions for crop planning.",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Impact</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how SmartAgriSense is transforming agriculture across the globe.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "40%", label: "Water Savings" },
              { number: "35%", label: "Cost Reduction" },
              { number: "25%", label: "Yield Increase" },
              { number: "500+", label: "Active Farmers" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-muted/30 rounded-lg">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Farmers Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Trusted by farmers across the country.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "SmartAgriSense has transformed how I manage my farm. Water savings alone have paid for the system in months!",
                author: "John Martinez",
                role: "Wheat Farmer, Kansas",
              },
              {
                quote:
                  "The AI recommendations are incredibly accurate. My crop yield has increased significantly while using less water.",
                author: "Sarah Chen",
                role: "Vegetable Farmer, California",
              },
              {
                quote:
                  "Best investment for my farm. The real-time alerts help me catch issues before they become problems.",
                author: "Mike O'Brien",
                role: "Corn Farmer, Iowa",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6">
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Optimize Your Farm?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of farmers already using SmartAgriSense to grow better.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
