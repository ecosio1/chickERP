"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Bird,
  ArrowLeft,
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
  Crown,
  AlertTriangle,
  Save,
  Loader2,
  X,
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
  breedComposition: Array<{ breedId: string; percentage: number }> | null
  breedOverride: boolean
  sire: { id: string; name: string | null; identifiers: Array<{ idType: string; idValue: string }>; breedComposition?: Array<{ breedId: string; percentage: number }> | null } | null
  dam: { id: string; name: string | null; identifiers: Array<{ idType: string; idValue: string }>; breedComposition?: Array<{ breedId: string; percentage: number }> | null } | null
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

interface Coop {
  id: string
  name: string
}

interface Breed {
  id: string
  name: string
  code: string
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", labelTl: "Aktibo" },
  { value: "BREEDING", label: "Breeding", labelTl: "Nagpapaanak" },
  { value: "SOLD", label: "Sold", labelTl: "Naibenta" },
  { value: "DECEASED", label: "Deceased", labelTl: "Patay" },
  { value: "CULLED", label: "Culled", labelTl: "Kinatay" },
  { value: "RETIRED", label: "Retired", labelTl: "Retirado" },
]

const SEX_OPTIONS = [
  { value: "MALE", label: "Male", labelTl: "Lalaki" },
  { value: "FEMALE", label: "Female", labelTl: "Babae" },
  { value: "UNKNOWN", label: "Unknown", labelTl: "Hindi Alam" },
]

export default function BirdDetailPage() {
  const { t, formatAge, language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const [bird, setBird] = useState<BirdDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [fights, setFights] = useState<FightRecord[]>([])
  const [exercises, setExercises] = useState<ExerciseRecord[]>([])
  const [loadingFights, setLoadingFights] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [coops, setCoops] = useState<Coop[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])

  // Editable fields
  const [editName, setEditName] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editSex, setEditSex] = useState("")
  const [editCoopId, setEditCoopId] = useState<string | null>(null)
  const [editColor, setEditColor] = useState("")
  const [editBreedComposition, setEditBreedComposition] = useState<Array<{ breedId: string; percentage: number }>>([])
  const [sireBreed, setSireBreed] = useState<Array<{ breedId: string; percentage: number }>>([])
  const [damBreed, setDamBreed] = useState<Array<{ breedId: string; percentage: number }>>([])
  const [breedSelectKey, setBreedSelectKey] = useState(0)
  const [sireSelectKey, setSireSelectKey] = useState(0)
  const [damSelectKey, setDamSelectKey] = useState(0)
  const [originalValues, setOriginalValues] = useState<{
    name: string
    status: string
    sex: string
    coopId: string | null
    color: string
    breedComposition: Array<{ breedId: string; percentage: number }>
  } | null>(null)

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!originalValues) return false
    const breedChanged = JSON.stringify(editBreedComposition) !== JSON.stringify(originalValues.breedComposition)
    return (
      editName !== originalValues.name ||
      editStatus !== originalValues.status ||
      editSex !== originalValues.sex ||
      editCoopId !== originalValues.coopId ||
      editColor !== originalValues.color ||
      breedChanged
    )
  }, [editName, editStatus, editSex, editCoopId, editColor, editBreedComposition, originalValues])

  useEffect(() => {
    async function fetchData() {
      try {
        const [birdRes, coopsRes, breedsRes] = await Promise.all([
          fetch(`/api/birds/${params.id}`),
          fetch("/api/coops"),
          fetch("/api/breeds"),
        ])

        if (birdRes.ok) {
          const json = await birdRes.json()
          setBird(json)
          // Initialize editable fields
          setEditName(json.name || "")
          setEditStatus(json.status || "ACTIVE")
          setEditSex(json.sex || "UNKNOWN")
          setEditCoopId(json.coopId || null)
          setEditColor(json.color || "")
          setEditBreedComposition(json.breedComposition || [])
          // Load parent breed compositions if available
          if (json.sire?.breedComposition?.length > 0) {
            setSireBreed(json.sire.breedComposition)
          }
          if (json.dam?.breedComposition?.length > 0) {
            setDamBreed(json.dam.breedComposition)
          }
          setOriginalValues({
            name: json.name || "",
            status: json.status || "ACTIVE",
            sex: json.sex || "UNKNOWN",
            coopId: json.coopId || null,
            color: json.color || "",
            breedComposition: json.breedComposition || [],
          })
        } else {
          router.push("/birds")
        }

        if (coopsRes.ok) {
          const coopsData = await coopsRes.json()
          setCoops(coopsData.coops || [])
        }

        if (breedsRes.ok) {
          const breedsData = await breedsRes.json()
          setBreeds(breedsData || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/birds")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchData()
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

  const handleSave = async () => {
    if (!bird || !hasChanges) return
    setSaving(true)
    try {
      const res = await fetch(`/api/birds/${bird.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName || null,
          status: editStatus,
          sex: editSex,
          coopId: editCoopId,
          color: editColor || null,
          breedComposition: editBreedComposition,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setBird({ ...bird, ...updated, name: editName, status: editStatus, sex: editSex, coopId: editCoopId, color: editColor, breedComposition: editBreedComposition })
        setOriginalValues({
          name: editName,
          status: editStatus,
          sex: editSex,
          coopId: editCoopId,
          color: editColor,
          breedComposition: editBreedComposition,
        })
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setSaving(false)
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

  // Format breed composition for display (uses editBreedComposition for live editing)
  const getBreedDisplay = () => {
    if (!editBreedComposition || editBreedComposition.length === 0) return null

    // Create breed lookup map
    const breedMap = new Map(breeds.map((b) => [b.id, b]))

    // Sort by percentage descending
    const sorted = [...editBreedComposition].sort((a, b) => b.percentage - a.percentage)

    return sorted.map((bc) => {
      const breed = breedMap.get(bc.breedId)
      return {
        name: breed?.name || breed?.code || bc.breedId.slice(0, 8),
        code: breed?.code || "",
        percentage: bc.percentage,
        breedId: bc.breedId,
      }
    })
  }
  const breedDisplay = getBreedDisplay()

  // Add a breed to composition
  const addBreed = (breedId: string) => {
    if (editBreedComposition.some((bc) => bc.breedId === breedId)) return
    // Default first breed to 100%, otherwise redistribute evenly
    const newComp = [...editBreedComposition, { breedId, percentage: editBreedComposition.length === 0 ? 100 : 0 }]
    if (newComp.length > 1) {
      const evenPct = Math.floor(100 / newComp.length)
      const remainder = 100 - (evenPct * newComp.length)
      setEditBreedComposition(newComp.map((bc, i) => ({ ...bc, percentage: evenPct + (i === 0 ? remainder : 0) })))
    } else {
      setEditBreedComposition(newComp)
    }
    // Reset the select dropdown
    setBreedSelectKey((k) => k + 1)
  }

  // Remove a breed from composition
  const removeBreed = (breedId: string) => {
    const newComp = editBreedComposition.filter((bc) => bc.breedId !== breedId)
    if (newComp.length === 0) {
      setEditBreedComposition([])
      return
    }
    // Redistribute percentages
    const evenPct = Math.floor(100 / newComp.length)
    const remainder = 100 - (evenPct * newComp.length)
    setEditBreedComposition(newComp.map((bc, i) => ({ ...bc, percentage: evenPct + (i === 0 ? remainder : 0) })))
  }

  // Update breed percentage
  const updateBreedPercentage = (breedId: string, percentage: number) => {
    setEditBreedComposition(editBreedComposition.map((bc) =>
      bc.breedId === breedId ? { ...bc, percentage: Math.max(0, Math.min(100, percentage)) } : bc
    ))
  }

  // Parent breed input functions (for calculating child's breed)
  const addParentBreed = (parent: "sire" | "dam", breedId: string) => {
    const setFn = parent === "sire" ? setSireBreed : setDamBreed
    const current = parent === "sire" ? sireBreed : damBreed
    if (current.some((bc) => bc.breedId === breedId)) return
    const newComp = [...current, { breedId, percentage: current.length === 0 ? 100 : 0 }]
    if (newComp.length > 1) {
      const evenPct = Math.floor(100 / newComp.length)
      const remainder = 100 - (evenPct * newComp.length)
      setFn(newComp.map((bc, i) => ({ ...bc, percentage: evenPct + (i === 0 ? remainder : 0) })))
    } else {
      setFn(newComp)
    }
    if (parent === "sire") setSireSelectKey((k) => k + 1)
    else setDamSelectKey((k) => k + 1)
  }

  const removeParentBreed = (parent: "sire" | "dam", breedId: string) => {
    const setFn = parent === "sire" ? setSireBreed : setDamBreed
    const current = parent === "sire" ? sireBreed : damBreed
    const newComp = current.filter((bc) => bc.breedId !== breedId)
    if (newComp.length === 0) {
      setFn([])
      return
    }
    const evenPct = Math.floor(100 / newComp.length)
    const remainder = 100 - (evenPct * newComp.length)
    setFn(newComp.map((bc, i) => ({ ...bc, percentage: evenPct + (i === 0 ? remainder : 0) })))
  }

  const updateParentBreedPercentage = (parent: "sire" | "dam", breedId: string, percentage: number) => {
    const setFn = parent === "sire" ? setSireBreed : setDamBreed
    const current = parent === "sire" ? sireBreed : damBreed
    setFn(current.map((bc) =>
      bc.breedId === breedId ? { ...bc, percentage: Math.max(0, Math.min(100, percentage)) } : bc
    ))
  }

  // Calculate breed from parent inputs (50% from each) - regular function since it's after early returns
  const getCalculatedBreed = () => {
    if (sireBreed.length === 0 && damBreed.length === 0) return []
    const breedMap = new Map<string, number>()
    sireBreed.forEach((bc) => {
      const current = breedMap.get(bc.breedId) || 0
      breedMap.set(bc.breedId, current + (bc.percentage / 2))
    })
    damBreed.forEach((bc) => {
      const current = breedMap.get(bc.breedId) || 0
      breedMap.set(bc.breedId, current + (bc.percentage / 2))
    })
    return Array.from(breedMap.entries())
      .map(([breedId, percentage]) => ({ breedId, percentage: Math.round(percentage) }))
      .filter((bc) => bc.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
  }
  const calculatedBreed = getCalculatedBreed()

  // Helper to format any bird's breed composition for display
  const formatBreedComposition = (composition: Array<{ breedId: string; percentage: number }> | null | undefined) => {
    if (!composition || composition.length === 0) return null
    const breedMap = new Map(breeds.map((b) => [b.id, b]))
    const sorted = [...composition].sort((a, b) => b.percentage - a.percentage)
    return sorted.map((bc) => {
      const breed = breedMap.get(bc.breedId)
      const name = breed?.code || breed?.name || bc.breedId.slice(0, 6)
      if (bc.percentage === 100) return name
      return `${name} ${bc.percentage}%`
    }).join(" / ")
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
              {editSex === "MALE" ? t("bird.sex.male") : editSex === "FEMALE" ? t("bird.sex.female") : t("bird.sex.unknown")}
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
                setBird({
                  ...bird,
                  identifiers: bird.identifiers?.filter((id) => id.idType !== "RFID") || [],
                })
              }
            }}
          />
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

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg px-6 h-12"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {t("action.save")}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Main Info Card - Inline Editable */}
      <Card className="card-warm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <PhotoGallery
              birdId={bird.id}
              photos={bird.photos}
              sexColor={getSexColor(editSex)}
              onPhotosChange={(newPhotos) => setBird({ ...bird, photos: newPhotos })}
            />
            <div className="flex-1 w-full space-y-4">
              {/* Editable Fields Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("bird.name")}</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter name..."
                    className="h-10 rounded-xl border-orange-100 focus:border-orange-300"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("bird.status")}</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-10 rounded-xl border-orange-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {language === "tl" ? opt.labelTl : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sex */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("bird.sex")}</Label>
                  <Select value={editSex} onValueChange={setEditSex}>
                    <SelectTrigger className="h-10 rounded-xl border-orange-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEX_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {language === "tl" ? opt.labelTl : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coop */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("bird.coop")}</Label>
                  <Select value={editCoopId || "none"} onValueChange={(v) => setEditCoopId(v === "none" ? null : v)}>
                    <SelectTrigger className="h-10 rounded-xl border-orange-100">
                      <SelectValue placeholder="Select coop..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("common.none")}</SelectItem>
                      {coops.map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{language === "tl" ? "Kulay" : "Color"}</Label>
                  <Input
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="Enter color..."
                    className="h-10 rounded-xl border-orange-100 focus:border-orange-300"
                  />
                </div>

                {/* Hatch Date (Read-only) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("bird.hatchDate")}</Label>
                  <div className="h-10 px-3 flex items-center rounded-xl bg-gray-50 text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(bird.hatchDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Breed Composition - Display */}
              <div className="pt-3 border-t border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "tl" ? "Lahi" : "Breed"}
                  </Label>
                  {/* Apply calculated breed button */}
                  {calculatedBreed.length > 0 && JSON.stringify(calculatedBreed) !== JSON.stringify(editBreedComposition) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditBreedComposition(calculatedBreed)}
                      className="h-6 text-xs px-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      Apply Calculated
                    </Button>
                  )}
                </div>

                {/* Show calculated breed or manual breed */}
                {(calculatedBreed.length > 0 || editBreedComposition.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {(calculatedBreed.length > 0 ? calculatedBreed : editBreedComposition).map((bc) => {
                      const breed = breeds.find((b) => b.id === bc.breedId)
                      return (
                        <span
                          key={bc.breedId}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border-2 text-sm font-medium",
                            bc.percentage >= 50 ? "bg-purple-100 border-purple-300 text-purple-800" : "bg-gray-50 border-gray-200 text-gray-700"
                          )}
                        >
                          {breed?.name} {bc.percentage}%
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Set parent breeds below to calculate</p>
                )}
              </div>

              {/* Identifiers - Read only badges */}
              {bird.identifiers?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
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

              {/* Fight Stats - if male with fights */}
              {editSex === "MALE" && fights.length > 0 && (
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    {wins}W-{losses}L-{draws}D ({winRate}%)
                  </span>
                </div>
              )}

              {/* Comb Type - Read only if set */}
              {bird.combType && (
                <div className="flex items-center gap-2 text-sm pt-2">
                  <Crown className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">{language === "tl" ? "Palong" : "Comb"}:</span>
                  <span className="font-medium">
                    {COMB_TYPE_LABELS[bird.combType]?.[language] || bird.combType}
                  </span>
                </div>
              )}
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
          {/* Parents with Breed Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Father/Sire Card */}
            <Card className="card-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("bird.father")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bird.sire && (
                  <Link
                    href={`/birds/${bird.sire.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(bird.sire)}</span>
                  </Link>
                )}

                {/* Sire Breed Input */}
                <div className="space-y-2">
                  <Label className="text-xs text-blue-600 font-medium">Sire Breed</Label>
                  {sireBreed.length > 0 && (
                    <div className="space-y-1">
                      {sireBreed.map((bc) => {
                        const breed = breeds.find((b) => b.id === bc.breedId)
                        return (
                          <div key={bc.breedId} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm flex-1 text-blue-800">{breed?.name}</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={bc.percentage}
                              onChange={(e) => updateParentBreedPercentage("sire", bc.breedId, parseInt(e.target.value) || 0)}
                              className="w-14 h-7 px-1 text-sm text-center rounded border border-blue-300 bg-white"
                            />
                            <span className="text-sm">%</span>
                            <button onClick={() => removeParentBreed("sire", bc.breedId)} className="text-red-400 hover:text-red-600">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Select key={sireSelectKey} onValueChange={(v) => addParentBreed("sire", v)}>
                    <SelectTrigger className="h-8 text-sm rounded-lg border-blue-200">
                      <SelectValue placeholder="+ Add breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.filter((b) => !sireBreed.some((bc) => bc.breedId === b.id)).map((breed) => (
                        <SelectItem key={breed.id} value={breed.id}>{breed.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Mother/Dam Card */}
            <Card className="card-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("bird.mother")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bird.dam && (
                  <Link
                    href={`/birds/${bird.dam.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-pink-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-pink-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(bird.dam)}</span>
                  </Link>
                )}

                {/* Dam Breed Input */}
                <div className="space-y-2">
                  <Label className="text-xs text-pink-600 font-medium">Dam Breed</Label>
                  {damBreed.length > 0 && (
                    <div className="space-y-1">
                      {damBreed.map((bc) => {
                        const breed = breeds.find((b) => b.id === bc.breedId)
                        return (
                          <div key={bc.breedId} className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                            <span className="text-sm flex-1 text-pink-800">{breed?.name}</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={bc.percentage}
                              onChange={(e) => updateParentBreedPercentage("dam", bc.breedId, parseInt(e.target.value) || 0)}
                              className="w-14 h-7 px-1 text-sm text-center rounded border border-pink-300 bg-white"
                            />
                            <span className="text-sm">%</span>
                            <button onClick={() => removeParentBreed("dam", bc.breedId)} className="text-red-400 hover:text-red-600">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Select key={damSelectKey} onValueChange={(v) => addParentBreed("dam", v)}>
                    <SelectTrigger className="h-8 text-sm rounded-lg border-pink-200">
                      <SelectValue placeholder="+ Add breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.filter((b) => !damBreed.some((bc) => bc.breedId === b.id)).map((breed) => (
                        <SelectItem key={breed.id} value={breed.id}>{breed.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
