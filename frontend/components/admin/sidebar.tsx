"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, MapPin, Cloud, FileText, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  { icon: BarChart3, label: "Overview", href: "/admin" },
  { icon: Users, label: "Farmers", href: "/admin/farmers" },
  { icon: MapPin, label: "Farms", href: "/admin/farms" },
  { icon: Cloud, label: "Weather Posts", href: "/admin/weather-posts" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-muted rounded-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border mt-12 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold">
              S
            </div>
            <div>
              <span className="font-semibold text-sidebar-foreground block">SmartAgriSense</span>
              <span className="text-xs text-sidebar-accent-foreground">Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" size="sm">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
