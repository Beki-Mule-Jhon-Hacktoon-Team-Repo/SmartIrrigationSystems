"use client";

import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Farm Manager, Punjab",
      content:
        "SmartAgriSense reduced our water usage by 45% while increasing yield by 20%. The AI recommendations are spot-on.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Agricultural Entrepreneur",
      content:
        "The mobile app makes it so easy to manage multiple farms. Best investment we made this season.",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      role: "Large-Scale Farmer",
      content:
        "Real-time alerts have saved my crops multiple times. The weather integration is incredibly accurate.",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Trusted by Farmers</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            See what our users are saying
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-foreground/60">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
