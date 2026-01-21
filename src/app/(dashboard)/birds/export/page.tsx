"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Download,
  Bird,
  Scale,
  Egg,
  Syringe,
  HeartPulse,
  Swords,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { EXPORT_TEMPLATES } from "@/lib/export-utils"

type ExportStatus = "idle" | "loading" | "success" | "error"

interface ExportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onExport: () => Promise<void>
  status: ExportStatus
  filters?: React.ReactNode
}

function ExportCard({ title, description, icon, onExport, status, filters }: ExportCardProps) {
  return (
    <Card className="card-warm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {filters && <div className="mt-4">{filters}</div>}
            <Button
              onClick={onExport}
              disabled={status === "loading"}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExportPage() {
  const { t, language } = useLanguage()

  // Export states
  const [birdsStatus, setBirdsStatus] = useState<ExportStatus>("idle")
  const [weightsStatus, setWeightsStatus] = useState<ExportStatus>("idle")
  const [eggsStatus, setEggsStatus] = useState<ExportStatus>("idle")
  const [vaccinationsStatus, setVaccinationsStatus] = useState<ExportStatus>("idle")
  const [healthStatus, setHealthStatus] = useState<ExportStatus>("idle")
  const [fightsStatus, setFightsStatus] = useState<ExportStatus>("idle")

  // Filters
  const [birdStatusFilter, setBirdStatusFilter] = useState("all")
  const [weightsStartDate, setWeightsStartDate] = useState("")
  const [weightsEndDate, setWeightsEndDate] = useState("")
  const [eggsStartDate, setEggsStartDate] = useState("")
  const [eggsEndDate, setEggsEndDate] = useState("")
  const [healthOutcomeFilter, setHealthOutcomeFilter] = useState("all")

  const downloadFile = async (url: string, setStatus: (s: ExportStatus) => void) => {
    setStatus("loading")
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Export failed")
      }

      const blob = await res.blob()
      const contentDisposition = res.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : "export.csv"

      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      setStatus("success")
      setTimeout(() => setStatus("idle"), 2000)
    } catch (error) {
      console.error("Export error:", error)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  const exportBirds = () => {
    const params = new URLSearchParams()
    if (birdStatusFilter !== "all") params.set("status", birdStatusFilter)
    return downloadFile(`/api/export/birds?${params}`, setBirdsStatus)
  }

  const exportWeights = () => {
    const params = new URLSearchParams()
    if (weightsStartDate) params.set("startDate", weightsStartDate)
    if (weightsEndDate) params.set("endDate", weightsEndDate)
    return downloadFile(`/api/export/weights?${params}`, setWeightsStatus)
  }

  const exportEggs = () => {
    const params = new URLSearchParams()
    if (eggsStartDate) params.set("startDate", eggsStartDate)
    if (eggsEndDate) params.set("endDate", eggsEndDate)
    return downloadFile(`/api/export/eggs?${params}`, setEggsStatus)
  }

  const exportVaccinations = () => {
    return downloadFile("/api/export/vaccinations", setVaccinationsStatus)
  }

  const exportHealthIncidents = () => {
    const params = new URLSearchParams()
    if (healthOutcomeFilter !== "all") params.set("outcome", healthOutcomeFilter)
    return downloadFile(`/api/export/health-incidents?${params}`, setHealthStatus)
  }

  const exportFights = () => {
    return downloadFile("/api/export/fights", setFightsStatus)
  }

  const downloadTemplate = (templateKey: keyof typeof EXPORT_TEMPLATES) => {
    const template = EXPORT_TEMPLATES[templateKey]
    const csvContent = [
      template.headers.join(","),
      template.example.join(","),
    ].join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${templateKey}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/birds">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("export.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("export.description")}
          </p>
        </div>
      </div>

      {/* Export Data Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {language === "tl" ? "Mag-export ng Data" : "Export Data"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Birds Export */}
          <ExportCard
            title={t("export.birds")}
            description={t("export.birdsDesc")}
            icon={<Bird className="h-6 w-6 text-orange-500" />}
            onExport={exportBirds}
            status={birdsStatus}
            filters={
              <div>
                <Label className="text-sm text-muted-foreground">{t("export.filterByStatus")}</Label>
                <Select value={birdStatusFilter} onValueChange={setBirdStatusFilter}>
                  <SelectTrigger className="mt-1 rounded-xl border-2 border-orange-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("export.allStatuses")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("bird.status.active")}</SelectItem>
                    <SelectItem value="SOLD">{t("bird.status.sold")}</SelectItem>
                    <SelectItem value="DECEASED">{t("bird.status.deceased")}</SelectItem>
                    <SelectItem value="ARCHIVED">{t("bird.status.archived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />

          {/* Weights Export */}
          <ExportCard
            title={t("export.weights")}
            description={t("export.weightsDesc")}
            icon={<Scale className="h-6 w-6 text-orange-500" />}
            onExport={exportWeights}
            status={weightsStatus}
            filters={
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm text-muted-foreground">{t("export.startDate")}</Label>
                  <Input
                    type="date"
                    value={weightsStartDate}
                    onChange={(e) => setWeightsStartDate(e.target.value)}
                    className="mt-1 rounded-xl border-2 border-orange-100"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t("export.endDate")}</Label>
                  <Input
                    type="date"
                    value={weightsEndDate}
                    onChange={(e) => setWeightsEndDate(e.target.value)}
                    className="mt-1 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>
            }
          />

          {/* Eggs Export */}
          <ExportCard
            title={t("export.eggs")}
            description={t("export.eggsDesc")}
            icon={<Egg className="h-6 w-6 text-orange-500" />}
            onExport={exportEggs}
            status={eggsStatus}
            filters={
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm text-muted-foreground">{t("export.startDate")}</Label>
                  <Input
                    type="date"
                    value={eggsStartDate}
                    onChange={(e) => setEggsStartDate(e.target.value)}
                    className="mt-1 rounded-xl border-2 border-orange-100"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t("export.endDate")}</Label>
                  <Input
                    type="date"
                    value={eggsEndDate}
                    onChange={(e) => setEggsEndDate(e.target.value)}
                    className="mt-1 rounded-xl border-2 border-orange-100"
                  />
                </div>
              </div>
            }
          />

          {/* Vaccinations Export */}
          <ExportCard
            title={t("export.vaccinations")}
            description={t("export.vaccinationsDesc")}
            icon={<Syringe className="h-6 w-6 text-orange-500" />}
            onExport={exportVaccinations}
            status={vaccinationsStatus}
          />

          {/* Health Incidents Export */}
          <ExportCard
            title={t("export.healthIncidents")}
            description={t("export.healthIncidentsDesc")}
            icon={<HeartPulse className="h-6 w-6 text-orange-500" />}
            onExport={exportHealthIncidents}
            status={healthStatus}
            filters={
              <div>
                <Label className="text-sm text-muted-foreground">{t("export.filterByOutcome")}</Label>
                <Select value={healthOutcomeFilter} onValueChange={setHealthOutcomeFilter}>
                  <SelectTrigger className="mt-1 rounded-xl border-2 border-orange-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("export.allOutcomes")}</SelectItem>
                    <SelectItem value="RECOVERED">{t("health.outcome.recovered")}</SelectItem>
                    <SelectItem value="ONGOING">{t("health.outcome.ongoing")}</SelectItem>
                    <SelectItem value="DECEASED">{t("health.outcome.deceased")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />

          {/* Fights Export */}
          <ExportCard
            title={t("export.fights")}
            description={t("export.fightsDesc")}
            icon={<Swords className="h-6 w-6 text-orange-500" />}
            onExport={exportFights}
            status={fightsStatus}
          />
        </div>
      </div>

      {/* Import Templates Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {t("export.templates")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("export.templatesDesc")}
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(EXPORT_TEMPLATES) as Array<keyof typeof EXPORT_TEMPLATES>).map((key) => (
            <Card key={key} className="card-warm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 capitalize">{key}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {EXPORT_TEMPLATES[key].headers.length} {language === "tl" ? "kolum" : "columns"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => downloadTemplate(key)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 rounded-xl border-2 border-orange-100"
                >
                  <Download className="h-3 w-3 mr-2" />
                  {t("export.downloadTemplate")}
                </Button>
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
