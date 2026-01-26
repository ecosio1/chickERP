"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bird,
  Egg,
  Scale,
  HeartPulse,
  Syringe,
  AlertTriangle,
  Plus,
  ChevronRight,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { formatNumber } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"

interface DashboardData {
  summary: {
    totalBirds: number
    males: number
    females: number
    recentDeaths: number
    eggsLast7Days: number
    eggsLast30Days: number
  }
  alerts: {
    upcomingVaccinations: number
    activeHealthIncidents: number
    lowStockFeedsCount: number
  }
  recentBirds: Array<{
    id: string
    name: string | null
    sex: string
    hatchDate: string
    identifiers: Array<{ idType: string; idValue: string }>
  }>
}

export default function DashboardPage() {
  const { t, formatAge } = useLanguage()
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/reports/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const quickActions = [
    { label: t("bird.addNew"), href: "/birds/new", icon: Bird, color: "bg-blue-500" },
    { label: t("egg.addNew"), href: "/eggs/record", icon: Egg, color: "bg-amber-500" },
    { label: t("weight.record"), href: "/weights/record", icon: Scale, color: "bg-green-500" },
    { label: t("health.vaccinations"), href: "/health/vaccinations/new", icon: Syringe, color: "bg-purple-500" },
  ]

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-orange-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalAlerts =
    (data?.alerts.upcomingVaccinations || 0) +
    (data?.alerts.activeHealthIncidents || 0) +
    (data?.alerts.lowStockFeedsCount || 0)

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("dashboard.welcome")}, {profile?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2 rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("dashboard.totalBirds")}
            </CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bird className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {formatNumber(data?.summary.totalBirds || 0)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {data?.summary.males || 0} {t("dashboard.males")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                {data?.summary.females || 0} {t("dashboard.females")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("dashboard.eggsThisWeek")}
            </CardTitle>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Egg className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {formatNumber(data?.summary.eggsLast7Days || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data?.summary.eggsLast30Days || 0} {t("common.thisMonth").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("dashboard.recentDeaths")}
            </CardTitle>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {data?.summary.recentDeaths || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("common.thisWeek").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("dashboard.alerts")}
            </CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{totalAlerts}</div>
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
              {(data?.alerts.upcomingVaccinations || 0) > 0 && (
                <p>{data?.alerts.upcomingVaccinations} vaccines due</p>
              )}
              {(data?.alerts.activeHealthIncidents || 0) > 0 && (
                <p className="text-red-500">{data?.alerts.activeHealthIncidents} health issues</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Birds */}
      <Card className="card-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-700">
            Recently Added Birds
          </CardTitle>
          <Link href="/birds">
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recentBirds && data.recentBirds.length > 0 ? (
            <div className="space-y-3">
              {data.recentBirds.map((bird) => {
                const ageInDays = Math.floor(
                  (Date.now() - new Date(bird.hatchDate).getTime()) / (1000 * 60 * 60 * 24)
                )
                const displayId = bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6)
                return (
                  <Link
                    key={bird.id}
                    href={`/birds/${bird.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          bird.sex === "MALE"
                            ? "bg-blue-100 text-blue-600"
                            : bird.sex === "FEMALE"
                            ? "bg-pink-100 text-pink-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Bird className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{displayId}</p>
                        <p className="text-sm text-muted-foreground">
                          {bird.sex === "MALE"
                            ? t("bird.sex.male")
                            : bird.sex === "FEMALE"
                            ? t("bird.sex.female")
                            : t("bird.sex.unknown")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{formatAge(ageInDays)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bird className="h-12 w-12 mx-auto text-orange-200 mb-3" />
              <p className="text-muted-foreground">{t("common.noData")}</p>
              <Link href="/birds/new">
                <Button className="mt-4" variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("bird.addNew")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
