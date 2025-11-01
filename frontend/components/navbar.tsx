"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout as logoutAction } from "@/store/authSlice";
import { auth, firebaseSignOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authState = useAppSelector((s) => s.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/reset-password");
  const isDashboard =
    pathname.includes("/farmer") || pathname.includes("/admin");

  if (isDashboard) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              S
            </div>
            <span className="hidden sm:inline font-semibold text-foreground">
              SmartAgriSense
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isAuthPage && (
              <>
                <Link
                  href="/#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#impact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Impact
                </Link>
                <Link
                  href="/#testimonials"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Testimonials
                </Link>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                ))}
            </Button>
            {!isAuthPage && (
              <>
                {authState?.user ? (
                  <div className="flex items-center gap-3">
                    {(authState.user as any)?.role === "user" && (
                      <Link href="/farmer">
                        <Button size="sm" variant="ghost">
                          Farmer
                        </Button>
                      </Link>
                    )}
                    {authState.user.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authState.user.picture}
                        alt={authState.user.name || "avatar"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {(authState.user.name || "U").charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-foreground hidden sm:inline">
                      {authState.user.name || authState.user.email}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await firebaseSignOut(auth);
                        } catch (e) {
                          console.error("Sign out error", e);
                        }
                        dispatch(logoutAction());
                        router.push("/login");
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">Get Started</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                ))}
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-4">
            {!isAuthPage && (
              <>
                <Link
                  href="/#features"
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  Features
                </Link>
                <Link
                  href="/#impact"
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  Impact
                </Link>
                <Link
                  href="/#testimonials"
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  Testimonials
                </Link>
              </>
            )}
            {!isAuthPage && (
              <div className="flex gap-2 pt-2">
                {authState?.user ? (
                  <>
                    {(authState.user as any)?.role === "user" && (
                      <Link href="/farmer" className="flex-1">
                        <Button className="w-full" size="sm" variant="ghost">
                          Farmer
                        </Button>
                      </Link>
                    )}
                    <Button
                      className="flex-1 w-full"
                      size="sm"
                      onClick={async () => {
                        try {
                          await firebaseSignOut(auth);
                        } catch (e) {
                          console.error("Sign out error", e);
                        }
                        dispatch(logoutAction());
                        router.push("/login");
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
