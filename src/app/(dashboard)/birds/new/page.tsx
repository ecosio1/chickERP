"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Bird,
  ArrowLeft,
  Plus,
  X,
  Search,
  Palette,
  Crown,
  AlertTriangle,
  Dna,
} from "lucide-react"
import { BreedCompositionEditor } from "@/components/birds/BreedCompositionEditor"
import { calculateChildBreedComposition, type BreedComposition } from "@/lib/breed-utils"
import { useLanguage } from "@/hooks/use-language"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ParentSearchResult {
  id: string
  name: string | null
  sex: string
  identifiers: Array<{ idType: string; idValue: string }>
  breedComposition?: BreedComposition[] | null
}

interface Breed {
  id: string
  name: string
  code: string
}

interface BirdColor {
  id: string
  name: string
  nameTl: string | null
  hexCode: string | null
}

const COMB_TYPES = [
  { value: "SINGLE", label: "Single (Straight)", labelTl: "Single (Tuwid)" },
  { value: "PEA", label: "Pea Comb", labelTl: "Pea Comb" },
  { value: "ROSE", label: "Rose Comb", labelTl: "Rose Comb" },
  { value: "WALNUT", label: "Walnut Comb", labelTl: "Walnut Comb" },
  { value: "BUTTERCUP", label: "Buttercup Comb", labelTl: "Buttercup Comb" },
  { value: "V_SHAPED", label: "V-Shaped Comb", labelTl: "V-Shaped Comb" },
  { value: "CUSHION", label: "Cushion Comb", labelTl: "Cushion Comb" },
]

export default function NewBirdPage() {
  const { t, language } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    sex: "UNKNOWN",
    hatchDate: new Date().toISOString().split("T")[0],
    sireId: "",
    damId: "",
    coopId: "",
    colorId: "",
    combType: "",
    earlyLifeNotes: "",
    notes: "",
  })
  const [colors, setColors] = useState<BirdColor[]>([])
  const [identifiers, setIdentifiers] = useState<Array<{ idType: string; idValue: string }>>([
    { idType: "BAND", idValue: "" },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Parent search state
  const [sireSearch, setSireSearch] = useState("")
  const [damSearch, setDamSearch] = useState("")
  const [sireResults, setSireResults] = useState<ParentSearchResult[]>([])
  const [damResults, setDamResults] = useState<ParentSearchResult[]>([])
  const [selectedSire, setSelectedSire] = useState<ParentSearchResult | null>(null)
  const [selectedDam, setSelectedDam] = useState<ParentSearchResult | null>(null)
  const [showSireSearch, setShowSireSearch] = useState(false)
  const [showDamSearch, setShowDamSearch] = useState(false)

  // Breed state
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [breedComposition, setBreedComposition] = useState<BreedComposition[]>([])
  const [breedOverride, setBreedOverride] = useState(false)
  const [calculatedBreeds, setCalculatedBreeds] = useState<BreedComposition[] | null>(null)

  // Fetch colors and breeds on mount
  useEffect(() => {
    async function fetchColors() {
      try {
        const res = await fetch("/api/settings/bird-colors")
        if (res.ok) {
          const json = await res.json()
          setColors(json.colors || [])
        }
      } catch (error) {
        console.error("Failed to fetch colors:", error)
      }
    }
    async function fetchBreeds() {
      try {
        const res = await fetch("/api/breeds")
        if (res.ok) {
          const data = await res.json()
          setBreeds(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch breeds:", error)
      }
    }
    fetchColors()
    fetchBreeds()
  }, [])

  const handleIdentifierChange = (index: number, field: "idType" | "idValue", value: string) => {
    const newIdentifiers = [...identifiers]
    newIdentifiers[index][field] = value
    setIdentifiers(newIdentifiers)
  }

  const addIdentifier = () => {
    setIdentifiers([...identifiers, { idType: "BAND", idValue: "" }])
  }

  const removeIdentifier = (index: number) => {
    if (identifiers.length > 1) {
      setIdentifiers(identifiers.filter((_, i) => i !== index))
    }
  }

  const searchParent = async (query: string, sex: "MALE" | "FEMALE") => {
    if (query.length < 2) {
      if (sex === "MALE") setSireResults([])
      else setDamResults([])
      return
    }

    try {
      const res = await fetch(`/api/birds/search?q=${encodeURIComponent(query)}&sex=${sex}`)
      if (res.ok) {
        const json = await res.json()
        if (sex === "MALE") setSireResults(json.results || [])
        else setDamResults(json.results || [])
      }
    } catch (error) {
      console.error("Parent search failed:", error)
    }
  }

  const recalculateBreeds = (sire: ParentSearchResult | null, dam: ParentSearchResult | null) => {
    const calculated = calculateChildBreedComposition(
      sire?.breedComposition || null,
      dam?.breedComposition || null
    )
    setCalculatedBreeds(calculated.length > 0 ? calculated : null)
    if (!breedOverride && calculated.length > 0) {
      setBreedComposition(calculated)
    }
  }

  const selectSire = (bird: ParentSearchResult) => {
    setSelectedSire(bird)
    setFormData({ ...formData, sireId: bird.id })
    setSireSearch("")
    setSireResults([])
    setShowSireSearch(false)
    recalculateBreeds(bird, selectedDam)
  }

  const selectDam = (bird: ParentSearchResult) => {
    setSelectedDam(bird)
    setFormData({ ...formData, damId: bird.id })
    setDamSearch("")
    setDamResults([])
    setShowDamSearch(false)
    recalculateBreeds(selectedSire, bird)
  }

  const clearSire = () => {
    setSelectedSire(null)
    setFormData({ ...formData, sireId: "" })
    recalculateBreeds(null, selectedDam)
  }

  const clearDam = () => {
    setSelectedDam(null)
    setFormData({ ...formData, damId: "" })
    recalculateBreeds(selectedSire, null)
  }

  const getDisplayId = (b: ParentSearchResult) => {
    return b.identifiers[0]?.idValue || b.name || b.id.slice(-6)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const validIdentifiers = identifiers.filter((id) => id.idValue.trim())

      const res = await fetch("/api/birds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sireId: formData.sireId || null,
          damId: formData.damId || null,
          coopId: formData.coopId || null,
          colorId: formData.colorId || null,
          combType: formData.combType || null,
          earlyLifeNotes: formData.earlyLifeNotes || null,
          identifiers: validIdentifiers,
          breedComposition: breedComposition.length > 0 ? breedComposition : null,
          breedOverride: breedOverride,
        }),
      })

      if (res.ok) {
        const bird = await res.json()
        router.push(`/birds/${bird.id}`)
      } else {
        const json = await res.json()
        setError(json.error || "Failed to create bird")
      }
    } catch (err) {
      setError("Failed to create bird")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto page-transition">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/birds">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("bird.addNew")}
          </h1>
          <p className="text-muted-foreground">
            Enter the details of your new bird
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Bird className="h-5 w-5 text-orange-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-base">{t("bird.name")} (Optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Give your bird a name"
                className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sex" className="text-base">{t("bird.sex")}</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) => setFormData({ ...formData, sex: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">{t("bird.sex.male")}</SelectItem>
                    <SelectItem value="FEMALE">{t("bird.sex.female")}</SelectItem>
                    <SelectItem value="UNKNOWN">{t("bird.sex.unknown")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hatchDate" className="text-base">{t("bird.hatchDate")}</Label>
                <Input
                  id="hatchDate"
                  type="date"
                  value={formData.hatchDate}
                  onChange={(e) => setFormData({ ...formData, hatchDate: e.target.value })}
                  className="mt-2 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Characteristics */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Palette className="h-5 w-5 text-orange-500" />
              {language === "tl" ? "Mga Pisikal na Katangian" : "Physical Characteristics"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base">{language === "tl" ? "Kulay" : "Color"}</Label>
                <Select
                  value={formData.colorId}
                  onValueChange={(value) => setFormData({ ...formData, colorId: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder={language === "tl" ? "Pumili ng kulay" : "Select color"} />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          {color.hexCode && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.hexCode }}
                            />
                          )}
                          {language === "tl" && color.nameTl ? color.nameTl : color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {colors.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link href="/settings/bird-colors" className="text-orange-500 hover:underline">
                      {language === "tl" ? "Magdagdag ng mga kulay sa Settings" : "Add colors in Settings"}
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <Label className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  {language === "tl" ? "Uri ng Palong" : "Comb Type"}
                </Label>
                <Select
                  value={formData.combType}
                  onValueChange={(value) => setFormData({ ...formData, combType: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder={language === "tl" ? "Pumili ng uri ng palong" : "Select comb type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {COMB_TYPES.map((comb) => (
                      <SelectItem key={comb.value} value={comb.value}>
                        {language === "tl" ? comb.labelTl : comb.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {language === "tl" ? "Mga Tala sa Maagang Buhay (Mga Abnormalidad)" : "Early Life Notes (Abnormalities)"}
              </Label>
              <Textarea
                value={formData.earlyLifeNotes}
                onChange={(e) => setFormData({ ...formData, earlyLifeNotes: e.target.value })}
                placeholder={language === "tl"
                  ? "Itala ang anumang obserbasyon sa maagang yugto ng buhay, mga abnormalidad, o espesyal na kondisyon..."
                  : "Record any early stage observations, abnormalities, or special conditions..."}
                className="mt-2 min-h-20 rounded-xl border-2 border-orange-100 focus:border-orange-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Identifiers */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              {t("bird.bandNumber")} / IDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {identifiers.map((id, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={id.idType}
                  onValueChange={(value) => handleIdentifierChange(index, "idType", value)}
                >
                  <SelectTrigger className="w-32 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAND">Band</SelectItem>
                    <SelectItem value="WING_BAND">{t("bird.wingBand")}</SelectItem>
                    <SelectItem value="RING">Ring</SelectItem>
                    <SelectItem value="TAG">Tag</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={id.idValue}
                  onChange={(e) => handleIdentifierChange(index, "idValue", e.target.value)}
                  placeholder="Enter ID value"
                  className="flex-1 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                />
                {identifiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIdentifier(index)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addIdentifier}
              className="w-full h-12 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-300 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another ID
            </Button>
          </CardContent>
        </Card>

        {/* Parents */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Parents (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Father/Sire */}
            <div>
              <Label className="text-base">{t("bird.father")}</Label>
              {selectedSire ? (
                <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(selectedSire)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSire}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={sireSearch}
                    onChange={(e) => {
                      setSireSearch(e.target.value)
                      searchParent(e.target.value, "MALE")
                    }}
                    onFocus={() => setShowSireSearch(true)}
                    placeholder="Search for father..."
                    className="pl-10 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                  />
                  {showSireSearch && sireResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
                      <CardContent className="p-2 max-h-48 overflow-y-auto">
                        {sireResults.map((bird) => (
                          <button
                            key={bird.id}
                            type="button"
                            onClick={() => selectSire(bird)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Bird className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{getDisplayId(bird)}</span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Mother/Dam */}
            <div>
              <Label className="text-base">{t("bird.mother")}</Label>
              {selectedDam ? (
                <div className="mt-2 flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Bird className="h-5 w-5 text-pink-600" />
                    </div>
                    <span className="font-medium">{getDisplayId(selectedDam)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDam}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={damSearch}
                    onChange={(e) => {
                      setDamSearch(e.target.value)
                      searchParent(e.target.value, "FEMALE")
                    }}
                    onFocus={() => setShowDamSearch(true)}
                    placeholder="Search for mother..."
                    className="pl-10 h-12 rounded-xl border-2 border-orange-100 focus:border-orange-300"
                  />
                  {showDamSearch && damResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl">
                      <CardContent className="p-2 max-h-48 overflow-y-auto">
                        {damResults.map((bird) => (
                          <button
                            key={bird.id}
                            type="button"
                            onClick={() => selectDam(bird)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                              <Bird className="h-4 w-4 text-pink-600" />
                            </div>
                            <span className="font-medium">{getDisplayId(bird)}</span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breed Composition */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Dna className="h-5 w-5 text-purple-500" />
              Breed Composition (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BreedCompositionEditor
              value={breedComposition}
              onChange={setBreedComposition}
              breeds={breeds}
              calculatedFromParents={calculatedBreeds}
              isOverride={breedOverride}
              onOverrideChange={setBreedOverride}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              {t("bird.notes")} (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this bird..."
              className="min-h-24 rounded-xl border-2 border-orange-100 focus:border-orange-300"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/birds" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl border-2 border-orange-100 text-lg"
            >
              {t("action.cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-lg"
          >
            {saving ? t("common.loading") : t("action.save")}
          </Button>
        </div>
      </form>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
