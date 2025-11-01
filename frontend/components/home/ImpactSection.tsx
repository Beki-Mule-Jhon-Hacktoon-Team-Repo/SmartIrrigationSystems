"use client";

import { Card } from "../ui/card";

export function ImpactSection() {
  const impacts = [
    {
      metric: "40%",
      label: "Water Savings",
      color: "from-primary to-accent",
    },
    {
      metric: "25%",
      label: "Yield Increase",
      color: "from-accent to-secondary",
    },
    {
      metric: "35%",
      label: "Cost Reduction",
      color: "from-secondary to-primary",
    },
    {
      metric: "5000+",
      label: "Active Farms",
      color: "from-primary/70 to-accent/70",
    },
  ];

  return (
    <section
      id="impact"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-r from-primary/5 to-accent/5"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Real Impact</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Join thousands of farmers improving their operations
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {impacts.map((item, i) => (
            <Card
              key={i}
              className="p-8 text-center border-0 bg-linear-to-br to-background"
            >
              <div
                className={`bg-linear-to-br ${item.color} rounded-lg p-8 mb-4`}
              >
                <div className="text-white text-4xl font-bold">
                  {item.metric}
                </div>
              </div>
              <p className="text-foreground/80 font-medium">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
