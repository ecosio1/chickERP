"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Bird,
  Egg,
  HeartPulse,
  Wheat,
  Warehouse,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Dumbbell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"

export function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
    { name: t("nav.birds"), href: "/birds", icon: Bird },
    { name: t("nav.eggs"), href: "/eggs", icon: Egg },
    { name: t("conditioning.title"), href: "/conditioning", icon: Dumbbell },
    { name: t("nav.health"), href: "/health", icon: HeartPulse },
    { name: t("nav.feed"), href: "/feed", icon: Wheat },
    { name: t("nav.coops"), href: "/coops", icon: Warehouse },
  ]

  const secondaryNav = [
    { name: t("nav.reports"), href: "/reports", icon: BarChart3 },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
            <Bird className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-orange-600">ChickERP</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/birds?search=true">
            <Button variant="ghost" size="icon" className="h-11 w-11">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-11 w-11"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-orange-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b border-orange-100">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Bird className="h-7 w-7 text-white" />
            </div>
            <div className="ml-3">
              <span className="font-bold text-xl text-orange-600">ChickERP</span>
              <p className="text-xs text-muted-foreground">Breeding Manager</p>
            </div>
          </div>

          {/* Search - Desktop only */}
          <div className="hidden lg:block p-4">
            <Link href="/birds?search=true">
              <Button
                variant="outline"
                className="w-full justify-start h-12 px-4 bg-orange-50/50 border-orange-100 hover:bg-orange-100/50 text-muted-foreground"
              >
                <Search className="h-4 w-4 mr-3" />
                {t("bird.search")}
              </Button>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}

            <div className="pt-4 pb-2">
              <div className="h-px bg-orange-100" />
            </div>

            {secondaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-orange-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <span className="text-sm font-bold text-orange-600">
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role?.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="h-5 w-5" />
              {t("settings.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] transition-all",
                  isActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-500"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "text-orange-600")} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
