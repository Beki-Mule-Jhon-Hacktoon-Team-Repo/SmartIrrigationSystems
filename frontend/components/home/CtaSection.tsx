"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-r from-primary to-orange-200 text-primary-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Optimize Your Farm?
        </h2>
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
  );
}
