"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  HeartPulse,
  Syringe,
  AlertTriangle,
  Plus,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"

interface HealthData {
  upcomingVaccinations: Array<{
    id: string
    vaccineName: string
    nextDueDate: string
    birdCount: number
  }>
  activeIncidents: Array<{
    id: string
    dateNoticed: string
    symptoms: string
    outcome: string
    birdCount: number
  }>
  recentVaccinations: Array<{
    id: string
    vaccineName: string
    dateGiven: string
    birdCount: number
  }>
}

export default function HealthPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health/summary")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch health data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHealth()
  }, [])

  const quickActions = [
    { label: t("health.vaccinations"), href: "/health/vaccinations/new", icon: Syringe, color: "bg-purple-500" },
    { label: t("health.incidents"), href: "/health/incidents/new", icon: AlertTriangle, color: "bg-red-500" },
  ]

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-48" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-orange-50 rounded-2xl" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("health.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track vaccinations and health incidents
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="card-warm hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", action.color)}>
                  <action.icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Add New</p>
                  <p className="text-sm text-muted-foreground">{action.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming Vaccinations */}
      <Card className="card-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Syringe className="h-5 w-5 text-purple-500" />
            Vaccinations Due
          </CardTitle>
          <Link href="/health/vaccinations">
            <Button variant="ghost" size="sm" className="text-orange-600">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.upcomingVaccinations && data.upcomingVaccinations.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingVaccinations.map((vax) => (
                <div
                  key={vax.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{vax.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {vax.birdCount} bird{vax.birdCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(vax.nextDueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Syringe className="h-10 w-10 mx-auto text-purple-200 mb-2" />
              <p className="text-muted-foreground">No vaccinations due</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Health Incidents */}
      <Card className="card-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Health Issues
          </CardTitle>
          <Link href="/health/incidents">
            <Button variant="ghost" size="sm" className="text-orange-600">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.activeIncidents && data.activeIncidents.length > 0 ? (
            <div className="space-y-3">
              {data.activeIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/health/incidents/${incident.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{incident.symptoms}</p>
                    <p className="text-sm text-muted-foreground">
                      {incident.birdCount} bird{incident.birdCount !== 1 ? "s" : ""} affected
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    {t("health.outcome.ongoing")}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <HeartPulse className="h-10 w-10 mx-auto text-green-200 mb-2" />
              <p className="text-muted-foreground text-green-600">All birds healthy!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Vaccinations */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Recent Vaccinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentVaccinations && data.recentVaccinations.length > 0 ? (
            <div className="space-y-3">
              {data.recentVaccinations.slice(0, 5).map((vax) => (
                <div
                  key={vax.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{vax.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {vax.birdCount} bird{vax.birdCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(vax.dateGiven).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">{t("common.noData")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
