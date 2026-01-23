"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bird,
  ArrowLeft,
  Edit,
  Scale,
  Egg,
  Syringe,
  Users,
  Home,
  Calendar,
  Hash,
  Trash2,
  Dumbbell,
  Swords,
  Trophy,
  ChevronRight,
  Palette,
  Crown,
  AlertTriangle,
} from "lucide-react"
import { PhotoGallery } from "@/components/birds/PhotoGallery"
import { RFIDLinkButton } from "@/components/birds/RFIDLinkButton"
import { useLanguage } from "@/hooks/use-language"
import { getColorById } from "@/lib/chicken-colors"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BirdDetail {
  id: string
  name: string | null
  sex: string
  status: string
  hatchDate: string
  deathDate: string | null
  causeOfDeath: string | null
  sireId: string | null
  damId: string | null
  coopId: string | null
  color: string | null
  combType: string | null
  earlyLifeNotes: string | null
  breedComposition: Record<string, number> | null
  breedOverride: boolean
  sire: { id: string; name: string | null; identifiers: Array<{ idType: string; idValue: string }> } | null
  dam: { id: string; name: string | null; identifiers: Array<{ idType: string; idValue: string }> } | null
  coop: { id: string; name: string } | null
  identifiers: Array<{ id: string; idType: string; idValue: string }>
  photos: Array<{ id: string; url: string; isPrimary: boolean; caption?: string | null }>
  notes: Array<{ id: string; content: string; createdAt: string }>
  eggs: Array<{ id: string; layDate: string; eggMark: string | null }>
  weights: Array<{ id: string; date: string; weightGrams: number; milestone: string | null }>
  vaccinations: Array<{ id: string; vaccine: string; dateGiven: string }>
  healthIncidents: Array<{ id: string; symptoms: string; outcome: string }>
  offspringAsSire: Array<{ id: string; name: string | null; sex: string; identifiers: Array<{ idType: string; idValue: string }> }>
  offspringAsDam: Array<{ id: string; name: string | null; sex: string; identifiers: Array<{ idType: string; idValue: string }> }>
}

const COMB_TYPE_LABELS: Record<string, { en: string; tl: string }> = {
  SINGLE: { en: "Single (Straight)", tl: "Single (Tuwid)" },
  PEA: { en: "Pea Comb", tl: "Pea Comb" },
  ROSE: { en: "Rose Comb", tl: "Rose Comb" },
  WALNUT: { en: "Walnut Comb", tl: "Walnut Comb" },
  BUTTERCUP: { en: "Buttercup Comb", tl: "Buttercup Comb" },
  V_SHAPED: { en: "V-Shaped Comb", tl: "V-Shaped Comb" },
  CUSHION: { en: "Cushion Comb", tl: "Cushion Comb" },
}

interface FightRecord {
  id: string
  date: string
  outcome: string
  location: string | null
  notes: string | null
}

interface ExerciseRecord {
  id: string
  date: string
  durationMinutes: number | null
  intensity: string | null
  notes: string | null
  exerciseType: { name: string; nameTl: string | null }
}

type TabType = "overview" | "conditioning" | "fights" | "offspring"

export default function BirdDetailPage() {
  const { t, formatAge, language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const [bird, setBird] = useState<BirdDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [fights, setFights] = useState<FightRecord[]>([])
  const [exercises, setExercises] = useState<ExerciseRecord[]>([])
  const [loadingFights, setLoadingFights] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(false)

  useEffect(() => {
    async function fetchBird() {
      try {
        const res = await fetch(`/api/birds/${params.id}`)
        if (res.ok) {
          const json = await res.json()
          setBird(json)
        } else {
          router.push("/birds")
        }
      } catch (error) {
        console.error("Failed to fetch bird:", error)
        router.push("/birds")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchBird()
  }, [params.id, router])

  useEffect(() => {
    if (activeTab === "fights" && bird && fights.length === 0 && !loadingFights) {
      setLoadingFights(true)
      fetch(`/api/birds/${bird.id}/fights`)
        .then((r) => r.json())
        .then((data) => setFights(data.fights || []))
        .finally(() => setLoadingFights(false))
    }
    if (activeTab === "conditioning" && bird && exercises.length === 0 && !loadingExercises) {
      setLoadingExercises(true)
      fetch(`/api/conditioning/records?birdId=${bird.id}`)
        .then((r) => r.json())
        .then((data) => setExercises(data.records || []))
        .finally(() => setLoadingExercises(false))
    }
  }, [activeTab, bird, fights.length, exercises.length, loadingFights, loadingExercises])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/birds/${params.id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/birds")
      }
    } catch (error) {
      console.error("Failed to delete bird:", error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-orange-100 rounded-xl w-32" />
          <div className="h-40 bg-orange-50 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-orange-50 rounded-2xl" />
            <div className="h-24 bg-orange-50 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!bird) {
    return (
      <div className="p-4 lg:p-8 text-center">
        <Bird className="h-16 w-16 mx-auto text-orange-200 mb-4" />
        <p className="text-muted-foreground">{t("common.notFound")}</p>
      </div>
    )
  }

  const ageInDays = Math.floor(
    (Date.now() - new Date(bird.hatchDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const getDisplayId = (b: { name: string | null; identifiers: Array<{ idType: string; idValue: string }> }) => {
    return b.identifiers[0]?.idValue || b.name || "Unknown"
  }

  const getSexColor = (sex: string) => {
    switch (sex) {
      case "MALE": return "bg-blue-100 text-blue-600 border-blue-200"
      case "FEMALE": return "bg-pink-100 text-pink-600 border-pink-200"
      default: return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const offspring = [...(bird.offspringAsSire || []), ...(bird.offspringAsDam || [])]
  const maleOffspring = offspring.filter((o) => o.sex === "MALE").length
  const femaleOffspring = offspring.filter((o) => o.sex === "FEMALE").length

  // Fight stats
  const wins = fights.filter((f) => f.outcome === "WIN").length
  const losses = fights.filter((f) => f.outcome === "LOSS").length
  const draws = fights.filter((f) => f.outcome === "DRAW").length
  const winRate = fights.length > 0 ? Math.round((wins / fights.length) * 100) : 0

  const tabs = [
    { id: "overview" as TabType, label: "Overview", labelTl: "Buod" },
    { id: "conditioning" as TabType, label: "Conditioning", labelTl: "Kondisyoning", show: bird.sex === "MALE" },
    { id: "fights" as TabType, label: "Fights", labelTl: "Laban", show: bird.sex === "MALE" },
    { id: "offspring" as TabType, label: "Offspring", labelTl: "Mga Anak" },
  ].filter((tab) => tab.show !== false)

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/birds">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {bird.identifiers[0]?.idValue || bird.name || `Bird #${bird.id.slice(-6)}`}
            </h1>
            <p className="text-muted-foreground">
              {bird.sex === "MALE" ? t("bird.sex.male") : bird.sex === "FEMALE" ? t("bird.sex.female") : t("bird.sex.unknown")}
              {" - "}
              {formatAge(ageInDays)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RFIDLinkButton
            birdId={bird.id}
            currentRfid={bird.identifiers?.find((id) => id.idType === "RFID")?.idValue || null}
            onRfidChange={(newRfid) => {
              if (newRfid) {
                // Add or update RFID identifier
                const existingIndex = bird.identifiers?.findIndex((id) => id.idType === "RFID") ?? -1
                if (existingIndex >= 0) {
                  const newIdentifiers = [...(bird.identifiers || [])]
                  newIdentifiers[existingIndex] = { ...newIdentifiers[existingIndex], idValue: newRfid }
                  setBird({ ...bird, identifiers: newIdentifiers })
                } else {
                  setBird({
                    ...bird,
                    identifiers: [...(bird.identifiers || []), { id: "temp", idType: "RFID", idValue: newRfid }],
                  })
                }
              } else {
                // Remove RFID identifier
                setBird({
                  ...bird,
                  identifiers: bird.identifiers?.filter((id) => id.idType !== "RFID") || [],
                })
              }
            }}
          />
          <Link href={`/birds/${bird.id}/edit`}>
            <Button variant="outline" className="rounded-xl border-2 border-orange-100">
              <Edit className="h-4 w-4 mr-2" />
              {t("action.edit")}
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("action.delete")}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this bird and all related records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleting ? t("common.loading") : t("action.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="card-warm">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <PhotoGallery
              birdId={bird.id}
              photos={bird.photos}
              sexColor={getSexColor(bird.sex)}
              onPhotosChange={(newPhotos) => setBird({ ...bird, photos: newPhotos })}
            />
            <div className="flex-1 space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    bird.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : bird.status === "SOLD"
                      ? "bg-yellow-100 text-yellow-700"
                      : bird.status === "DECEASED"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {bird.status === "ACTIVE"
                    ? t("bird.status.active")
                    : bird.status === "SOLD"
                    ? t("bird.status.sold")
                    : bird.status === "DECEASED"
                    ? t("bird.status.deceased")
                    : bird.status}
                </span>
                {bird.sex === "MALE" && fights.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    {wins}W-{losses}L-{draws}D ({winRate}%)
                  </span>
                )}
              </div>

              {/* Identifiers */}
              {bird.identifiers?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bird.identifiers.map((id) => (
                    <span
                      key={id.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      <Hash className="h-3 w-3" />
                      {id.idType}: {id.idValue}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">{t("bird.hatchDate")}:</span>
                  <span className="font-medium">
                    {new Date(bird.hatchDate).toLocaleDateString()}
                  </span>
                </div>
                {bird.coop && (
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">{t("bird.coop")}:</span>
                    <span className="font-medium">{bird.coop.name}</span>
                  </div>
                )}
                {bird.color && (() => {
                  const colorInfo = getColorById(bird.color)
                  return colorInfo ? (
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: colorInfo.hexCode }}
                      />
                      <span className="text-muted-foreground">{language === "tl" ? "Kulay" : "Color"}:</span>
                      <span className="font-medium">
                        {language === "tl" ? colorInfo.nameTl : colorInfo.name}
                      </span>
                    </div>
                  ) : null
                })()}
                {bird.combType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">{language === "tl" ? "Palong" : "Comb"}:</span>
                    <span className="font-medium">
                      {COMB_TYPE_LABELS[bird.combType]?.[language] || bird.combType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Life Notes - if present */}
      {bird.earlyLifeNotes && (
        <Card className="card-warm border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {language === "tl" ? "Mga Tala sa Maagang Buhay" : "Early Life Notes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{bird.earlyLifeNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-orange-500 text-white"
                : "bg-orange-50 text-gray-600 hover:bg-orange-100"
            )}
          >
            {language === "tl" ? tab.labelTl : tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Parents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="card-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("bird.father")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bird.sire ? (
                  <Link
                    href={`/birds/${bird.sire.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors -mx-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(bird.sire)}</span>
                  </Link>
                ) : (
                  <p className="text-muted-foreground py-3">{t("common.none")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("bird.mother")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bird.dam ? (
                  <Link
                    href={`/birds/${bird.dam.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors -mx-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-pink-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(bird.dam)}</span>
                  </Link>
                ) : (
                  <p className="text-muted-foreground py-3">{t("common.none")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="card-warm">
              <CardContent className="p-4 text-center">
                <Egg className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold text-gray-800">{bird.eggs?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t("egg.title")}</p>
              </CardContent>
            </Card>

            <Card className="card-warm">
              <CardContent className="p-4 text-center">
                <Scale className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-gray-800">{bird.weights?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t("weight.title")}</p>
              </CardContent>
            </Card>

            <Card className="card-warm">
              <CardContent className="p-4 text-center">
                <Syringe className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-gray-800">{bird.vaccinations?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t("health.vaccinations")}</p>
              </CardContent>
            </Card>

            <Card className="card-warm">
              <CardContent className="p-4 text-center">
                <Bird className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-gray-800">{offspring.length}</p>
                <p className="text-sm text-muted-foreground">{t("bird.offspring")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Weights */}
          {bird.weights?.length > 0 && (
            <Card className="card-warm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-700">
                  {t("weight.title")}
                </CardTitle>
                <Link href={`/weights/record?birdId=${bird.id}`}>
                  <Button variant="ghost" size="sm" className="text-orange-600">
                    + {t("weight.record")}
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bird.weights.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-green-50"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{w.weightGrams}g</span>
                        {w.milestone && (
                          <span className="ml-2 text-sm text-green-600">({w.milestone})</span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(w.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === "conditioning" && (
        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-500" />
              {t("conditioning.title")}
            </CardTitle>
            <Link href={`/conditioning/record?birdId=${bird.id}`}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                + Record Exercise
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingExercises ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            ) : exercises.length > 0 ? (
              <div className="space-y-3">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-purple-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {language === "tl" && exercise.exerciseType.nameTl
                            ? exercise.exerciseType.nameTl
                            : exercise.exerciseType.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {exercise.durationMinutes && (
                            <span>{exercise.durationMinutes} mins</span>
                          )}
                          {exercise.intensity && (
                            <span className="px-2 py-0.5 bg-purple-100 rounded-full text-xs">
                              {exercise.intensity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(exercise.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto text-purple-200 mb-3" />
                <p className="text-muted-foreground mb-4">No conditioning records yet</p>
                <Link href={`/conditioning/record?birdId=${bird.id}`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    Record First Exercise
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "fights" && (
        <Card className="card-warm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Swords className="h-5 w-5 text-red-500" />
              {t("fights.title")}
            </CardTitle>
            <Link href={`/birds/${bird.id}/fights`}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                + Add Fight
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {/* Fight Stats */}
            {fights.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-green-50">
                  <Trophy className="h-6 w-6 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold text-green-600">{wins}</p>
                  <p className="text-xs text-muted-foreground">{t("fights.outcome.win")}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50">
                  <Swords className="h-6 w-6 mx-auto text-red-500 mb-1" />
                  <p className="text-2xl font-bold text-red-600">{losses}</p>
                  <p className="text-xs text-muted-foreground">{t("fights.outcome.loss")}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-2xl font-bold text-gray-600 mt-2">{draws}</p>
                  <p className="text-xs text-muted-foreground">{t("fights.outcome.draw")}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-50">
                  <p className="text-2xl font-bold text-purple-600 mt-2">{winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            )}

            {loadingFights ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            ) : fights.length > 0 ? (
              <div className="space-y-3">
                {fights.map((fight) => (
                  <div
                    key={fight.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl",
                      fight.outcome === "WIN"
                        ? "bg-green-50"
                        : fight.outcome === "LOSS"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          fight.outcome === "WIN"
                            ? "bg-green-100"
                            : fight.outcome === "LOSS"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        )}
                      >
                        {fight.outcome === "WIN" ? (
                          <Trophy className="h-5 w-5 text-green-500" />
                        ) : (
                          <Swords className={cn("h-5 w-5", fight.outcome === "LOSS" ? "text-red-500" : "text-gray-500")} />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-semibold",
                            fight.outcome === "WIN"
                              ? "text-green-700"
                              : fight.outcome === "LOSS"
                              ? "text-red-700"
                              : "text-gray-700"
                          )}
                        >
                          {fight.outcome === "WIN"
                            ? t("fights.outcome.win")
                            : fight.outcome === "LOSS"
                            ? t("fights.outcome.loss")
                            : t("fights.outcome.draw")}
                        </p>
                        {fight.location && (
                          <p className="text-sm text-muted-foreground">{fight.location}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(fight.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Swords className="h-12 w-12 mx-auto text-red-200 mb-3" />
                <p className="text-muted-foreground mb-4">No fight records yet</p>
                <Link href={`/birds/${bird.id}/fights`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    Record First Fight
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "offspring" && (
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              {t("bird.offspring")} ({offspring.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offspring.length > 0 ? (
              <>
                {/* Offspring Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{maleOffspring}</p>
                    <p className="text-xs text-muted-foreground">{t("bird.sex.male")}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-pink-50">
                    <p className="text-2xl font-bold text-pink-600">{femaleOffspring}</p>
                    <p className="text-xs text-muted-foreground">{t("bird.sex.female")}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-2xl font-bold text-gray-600">
                      {offspring.length - maleOffspring - femaleOffspring}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("bird.sex.unknown")}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {offspring.map((child) => (
                    <Link
                      key={child.id}
                      href={`/birds/${child.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getSexColor(child.sex))}>
                          <Bird className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{getDisplayId(child)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {child.sex === "MALE" ? t("bird.sex.male") : child.sex === "FEMALE" ? t("bird.sex.female") : t("bird.sex.unknown")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Bird className="h-12 w-12 mx-auto text-orange-200 mb-3" />
                <p className="text-muted-foreground">No offspring recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
