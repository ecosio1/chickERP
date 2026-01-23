"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { CHICKEN_COLORS } from "@/lib/chicken-colors"

export interface FilterState {
  status: string[]
  sex: string[]
  breedIds: string[]
  colors: string[]
  sourceFarmIds: string[]
  ageRange: { min?: number; max?: number } | null
}

interface Breed {
  id: string
  name: string
  code: string
}

interface SourceFarm {
  id: string
  name: string
}

interface BirdFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  breeds: Breed[]
  sourceFarms: SourceFarm[]
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", labelTl: "Aktibo" },
  { value: "BREEDING", label: "Breeding", labelTl: "Nag-aanak" },
  { value: "SOLD", label: "Sold", labelTl: "Nabenta" },
  { value: "DECEASED", label: "Deceased", labelTl: "Patay" },
  { value: "CULLED", label: "Culled", labelTl: "Inalis" },
  { value: "LOST", label: "Lost", labelTl: "Nawawala" },
  { value: "RETIRED", label: "Retired", labelTl: "Retirado" },
  { value: "ARCHIVED", label: "Archived", labelTl: "Naka-archive" },
]

const SEX_OPTIONS = [
  { value: "MALE", label: "Stag", labelTl: "Tandang" },
  { value: "FEMALE", label: "Hen", labelTl: "Inahin" },
  { value: "UNKNOWN", label: "Unknown", labelTl: "Hindi Alam" },
]

const AGE_RANGE_OPTIONS = [
  { value: "0-6", label: "Under 6 months", labelTl: "Wala pang 6 buwan", min: 0, max: 6 },
  { value: "6-12", label: "6-12 months", labelTl: "6-12 buwan", min: 6, max: 12 },
  { value: "12-24", label: "1-2 years", labelTl: "1-2 taon", min: 12, max: 24 },
  { value: "24+", label: "Over 2 years", labelTl: "Higit sa 2 taon", min: 24, max: undefined },
]

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-700">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function BirdFilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  breeds,
  sourceFarms,
}: BirdFilterSheetProps) {
  const { language } = useLanguage()

  const activeFilterCount =
    filters.status.length +
    filters.sex.length +
    filters.breedIds.length +
    filters.colors.length +
    filters.sourceFarmIds.length +
    (filters.ageRange ? 1 : 0)

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatus })
  }

  const toggleSex = (sex: string) => {
    const newSex = filters.sex.includes(sex)
      ? filters.sex.filter((s) => s !== sex)
      : [...filters.sex, sex]
    onFiltersChange({ ...filters, sex: newSex })
  }

  const addBreed = (breedId: string) => {
    if (!filters.breedIds.includes(breedId)) {
      onFiltersChange({ ...filters, breedIds: [...filters.breedIds, breedId] })
    }
  }

  const removeBreed = (breedId: string) => {
    onFiltersChange({
      ...filters,
      breedIds: filters.breedIds.filter((id) => id !== breedId),
    })
  }

  const addColor = (colorId: string) => {
    if (!filters.colors.includes(colorId)) {
      onFiltersChange({ ...filters, colors: [...filters.colors, colorId] })
    }
  }

  const removeColor = (colorId: string) => {
    onFiltersChange({
      ...filters,
      colors: filters.colors.filter((id) => id !== colorId),
    })
  }

  const addSourceFarm = (farmId: string) => {
    if (!filters.sourceFarmIds.includes(farmId)) {
      onFiltersChange({
        ...filters,
        sourceFarmIds: [...filters.sourceFarmIds, farmId],
      })
    }
  }

  const removeSourceFarm = (farmId: string) => {
    onFiltersChange({
      ...filters,
      sourceFarmIds: filters.sourceFarmIds.filter((id) => id !== farmId),
    })
  }

  const setAgeRange = (range: { min?: number; max?: number } | null) => {
    onFiltersChange({ ...filters, ageRange: range })
  }

  const getAgeRangeKey = () => {
    if (!filters.ageRange) return null
    const { min, max } = filters.ageRange
    if (min === 0 && max === 6) return "0-6"
    if (min === 6 && max === 12) return "6-12"
    if (min === 12 && max === 24) return "12-24"
    if (min === 24 && !max) return "24+"
    return null
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      sex: [],
      breedIds: [],
      colors: [],
      sourceFarmIds: [],
      ageRange: null,
    })
  }

  const getColorName = (colorId: string) => {
    const color = CHICKEN_COLORS.find((c) => c.id === colorId)
    return color ? (language === "tl" ? color.nameTl : color.name) : colorId
  }

  const getColorHex = (colorId: string) => {
    const color = CHICKEN_COLORS.find((c) => c.id === colorId)
    return color?.hexCode || "#888888"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-500" />
              {language === "tl" ? "Mga Filter" : "Filters"}
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                {language === "tl" ? "I-clear lahat" : "Clear all"}
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-4">
          {/* Status */}
          <FilterSection title={language === "tl" ? "Status" : "Status"}>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = filters.status.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleStatus(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Sex */}
          <FilterSection title={language === "tl" ? "Kasarian" : "Sex"}>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map((option) => {
                const isSelected = filters.sex.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleSex(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Age Range */}
          <FilterSection title={language === "tl" ? "Edad" : "Age"}>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGE_OPTIONS.map((option) => {
                const isSelected = getAgeRangeKey() === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setAgeRange(
                        isSelected
                          ? null
                          : { min: option.min, max: option.max }
                      )
                    }
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Breeds */}
          {breeds.length > 0 && (
            <FilterSection title={language === "tl" ? "Breed" : "Breed"} defaultOpen={false}>
              {filters.breedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.breedIds.map((breedId) => {
                    const breed = breeds.find((b) => b.id === breedId)
                    return (
                      <span
                        key={breedId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                      >
                        {breed?.name || breed?.code || breedId}
                        <button
                          onClick={() => removeBreed(breedId)}
                          className="hover:text-purple-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <Select onValueChange={addBreed} value="">
                <SelectTrigger className="w-full h-10 bg-gray-50 border-gray-200">
                  <SelectValue
                    placeholder={language === "tl" ? "Pumili ng breed..." : "Select breed..."}
                  />
                </SelectTrigger>
                <SelectContent>
                  {breeds
                    .filter((b) => !filters.breedIds.includes(b.id))
                    .map((breed) => (
                      <SelectItem key={breed.id} value={breed.id}>
                        {breed.name} ({breed.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FilterSection>
          )}

          {/* Colors */}
          <FilterSection title={language === "tl" ? "Kulay" : "Color"} defaultOpen={false}>
            {filters.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.colors.map((colorId) => (
                  <span
                    key={colorId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-gray-300"
                      style={{ backgroundColor: getColorHex(colorId) }}
                    />
                    {getColorName(colorId)}
                    <button
                      onClick={() => removeColor(colorId)}
                      className="hover:text-gray-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Select onValueChange={addColor} value="">
              <SelectTrigger className="w-full h-10 bg-gray-50 border-gray-200">
                <SelectValue
                  placeholder={language === "tl" ? "Pumili ng kulay..." : "Select color..."}
                />
              </SelectTrigger>
              <SelectContent>
                {CHICKEN_COLORS.filter(
                  (c) => !filters.colors.includes(c.id)
                ).map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      {language === "tl" ? color.nameTl : color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          {/* Source Farms */}
          {sourceFarms.length > 0 && (
            <FilterSection title={language === "tl" ? "Pinagmulan" : "Source Farm"} defaultOpen={false}>
              {filters.sourceFarmIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.sourceFarmIds.map((farmId) => {
                    const farm = sourceFarms.find((f) => f.id === farmId)
                    return (
                      <span
                        key={farmId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 text-sm font-medium rounded-full"
                      >
                        {farm?.name || farmId}
                        <button
                          onClick={() => removeSourceFarm(farmId)}
                          className="hover:text-teal-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <Select onValueChange={addSourceFarm} value="">
                <SelectTrigger className="w-full h-10 bg-gray-50 border-gray-200">
                  <SelectValue
                    placeholder={language === "tl" ? "Pumili ng farm..." : "Select farm..."}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sourceFarms
                    .filter((f) => !filters.sourceFarmIds.includes(f.id))
                    .map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FilterSection>
          )}
        </div>

        <SheetFooter className="flex-shrink-0">
          <SheetClose asChild>
            <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              {language === "tl" ? "Ipakita ang mga Resulta" : "Show Results"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
