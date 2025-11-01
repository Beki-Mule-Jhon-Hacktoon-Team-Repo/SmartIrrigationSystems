"use client";

import type React from "react";

import { FarmerSidebar } from "@/components/farmer/sidebar";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <FarmerSidebar />
      <main className="flex-1 overflow-auto md:ml-0">{children}</main>
    </div>
  );
}
