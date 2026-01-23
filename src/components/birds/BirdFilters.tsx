"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react"
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

interface BirdFiltersProps {
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

export function BirdFilters({
  filters,
  onFiltersChange,
  breeds,
  sourceFarms,
}: BirdFiltersProps) {
  const { language } = useLanguage()
  const [expanded, setExpanded] = useState(true)

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
    <div className="bg-orange-50 rounded-2xl border border-orange-100">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-gray-700">
            {language === "tl" ? "Mga Filter" : "Filters"}
          </span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearAllFilters()
              }}
              className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 h-7 px-2"
            >
              {language === "tl" ? "I-clear lahat" : "Clear all"}
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Filter Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Status */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              {language === "tl" ? "Status" : "Status"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = filters.status.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleStatus(option.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sex */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              {language === "tl" ? "Kasarian" : "Sex"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SEX_OPTIONS.map((option) => {
                const isSelected = filters.sex.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleSex(option.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              {language === "tl" ? "Edad" : "Age"}
            </p>
            <div className="flex flex-wrap gap-1.5">
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
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {language === "tl" ? option.labelTl : option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Breeds */}
          {breeds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                {language === "tl" ? "Breed" : "Breed"}
              </p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {filters.breedIds.map((breedId) => {
                  const breed = breeds.find((b) => b.id === breedId)
                  return (
                    <span
                      key={breedId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
                    >
                      {breed?.code || breedId}
                      <button
                        onClick={() => removeBreed(breedId)}
                        className="hover:text-purple-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
                <Select onValueChange={addBreed} value="">
                  <SelectTrigger className="w-auto h-7 text-xs border-dashed bg-white">
                    <SelectValue
                      placeholder={language === "tl" ? "+ Breed" : "+ Add Breed"}
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
              </div>
            </div>
          )}

          {/* Colors */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              {language === "tl" ? "Kulay" : "Color"}
            </p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {filters.colors.map((colorId) => (
                <span
                  key={colorId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorHex(colorId) }}
                  />
                  {getColorName(colorId)}
                  <button
                    onClick={() => removeColor(colorId)}
                    className="hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Select onValueChange={addColor} value="">
                <SelectTrigger className="w-auto h-7 text-xs border-dashed bg-white">
                  <SelectValue
                    placeholder={language === "tl" ? "+ Kulay" : "+ Add Color"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CHICKEN_COLORS.filter(
                    (c) => !filters.colors.includes(c.id)
                  ).map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {language === "tl" ? color.nameTl : color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source Farms */}
          {sourceFarms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                {language === "tl" ? "Pinagmulan" : "Source Farm"}
              </p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {filters.sourceFarmIds.map((farmId) => {
                  const farm = sourceFarms.find((f) => f.id === farmId)
                  return (
                    <span
                      key={farmId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full"
                    >
                      {farm?.name || farmId}
                      <button
                        onClick={() => removeSourceFarm(farmId)}
                        className="hover:text-teal-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
                <Select onValueChange={addSourceFarm} value="">
                  <SelectTrigger className="w-auto h-7 text-xs border-dashed bg-white">
                    <SelectValue
                      placeholder={language === "tl" ? "+ Farm" : "+ Add Farm"}
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
