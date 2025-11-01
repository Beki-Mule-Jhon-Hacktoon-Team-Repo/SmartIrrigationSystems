import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="grow max-w-3xl w-full mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-6" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">
          404 — Page not found
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Oops — the page you were looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-4">
          <Link href="/">
            <Button size="lg">Go home</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
