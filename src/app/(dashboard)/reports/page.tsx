"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

const upcomingReports = [
  {
    name: "Flock Statistics",
    nameTl: "Estadistika ng Kawan",
    description: "Bird counts by status, sex, and breed",
    descriptionTl: "Bilang ng ibon ayon sa status, kasarian, at breed",
    icon: PieChart,
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Age Distribution",
    nameTl: "Distribusyon ng Edad",
    description: "Breakdown of flock by age groups",
    descriptionTl: "Breakdown ng kawan ayon sa grupo ng edad",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Breeding Records",
    nameTl: "Rekord ng Pag-aanak",
    description: "Hatch rates and offspring tracking",
    descriptionTl: "Rate ng pagpisa at pagsubaybay ng mga anak",
    icon: TrendingUp,
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Activity Timeline",
    nameTl: "Timeline ng Aktibidad",
    description: "Recent events and changes in your flock",
    descriptionTl: "Mga kamakailan nangyari sa iyong kawan",
    icon: Calendar,
    color: "bg-orange-100 text-orange-600",
  },
]

export default function ReportsPage() {
  const { language } = useLanguage()

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
          {language === "tl" ? "Mga Ulat" : "Reports"}
        </h1>
        <p className="text-muted-foreground">
          {language === "tl"
            ? "Tingnan ang mga estadistika at analytics ng iyong kawan"
            : "View statistics and analytics for your flock"}
        </p>
      </div>

      {/* Coming Soon Notice */}
      <Card className="card-warm border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-orange-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {language === "tl" ? "Paparating Na!" : "Coming Soon!"}
          </h3>
          <p className="text-muted-foreground">
            {language === "tl"
              ? "Ang mga ulat at analytics ay kasalukuyang ginagawa."
              : "Reports and analytics are currently in development."}
          </p>
        </CardContent>
      </Card>

      {/* Planned Reports */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          {language === "tl" ? "Mga Planong Ulat" : "Planned Reports"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingReports.map((report) => (
            <Card key={report.name} className="card-warm opacity-75">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.color}`}
                  >
                    <report.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-700">
                    {language === "tl" ? report.nameTl : report.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === "tl" ? report.descriptionTl : report.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
