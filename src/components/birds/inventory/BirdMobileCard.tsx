"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Bird, ChevronDown, ChevronRight, Edit2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import {
  BirdInventoryRecord,
  getDisplayId,
  calculateAgeInDays,
} from "@/lib/bird-columns"

interface Breed {
  id: string
  name: string
  code: string
}

interface BirdMobileCardProps {
  bird: BirdInventoryRecord
  breeds: Breed[]
  isSelected: boolean
  isSelectionMode: boolean
  onSelect: (id: string) => void
  onLongPress: (id: string) => void
}

export function BirdMobileCard({
  bird,
  breeds,
  isSelected,
  isSelectionMode,
  onSelect,
  onLongPress,
}: BirdMobileCardProps) {
  const { t, formatAge } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  const ageInDays = calculateAgeInDays(bird.hatchDate)

  // Get sex badge style
  const getSexBadge = (sex: string) => {
    switch (sex) {
      case "MALE":
        return "bg-blue-100 text-blue-600"
      case "FEMALE":
        return "bg-pink-100 text-pink-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700"
      case "SOLD":
        return "bg-yellow-100 text-yellow-700"
      case "DECEASED":
        return "bg-red-100 text-red-700"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Long press handling for mobile selection mode
  const handleTouchStart = useCallback(() => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress(bird.id)
    }, 500)
  }, [bird.id, onLongPress])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (isLongPress.current) {
      isLongPress.current = false
      return
    }

    if (isSelectionMode) {
      onSelect(bird.id)
    } else {
      setIsExpanded(!isExpanded)
    }
  }, [isSelectionMode, onSelect, bird.id, isExpanded])

  // Get breed display
  const getBreedDisplay = () => {
    if (!bird.breedComposition || bird.breedComposition.length === 0) {
      return "-"
    }
    return bird.breedComposition
      .slice(0, 2)
      .map((comp) => {
        const breed = breeds.find((b) => b.id === comp.breedId)
        return `${breed?.code || "?"} ${comp.percentage}%`
      })
      .join(", ")
  }

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 transition-all",
        isSelected
          ? "border-orange-400 bg-orange-50"
          : "border-orange-100 hover:border-orange-200"
      )}
    >
      {/* Compact header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Checkbox (shown in selection mode) */}
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(bird.id)}
            onClick={(e) => e.stopPropagation()}
            className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
          />
        )}

        {/* Photo */}
        <div
          className={cn(
            "w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center",
            getSexBadge(bird.sex).replace("text-", "bg-").split(" ")[0]
          )}
        >
          {bird.photos?.[0]?.url ? (
            <img
              src={bird.photos[0].url}
              alt={getDisplayId(bird)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Bird
              className={cn(
                "h-6 w-6",
                getSexBadge(bird.sex).split(" ")[1]
              )}
            />
          )}
        </div>

        {/* ID and basic info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate">
              {getDisplayId(bird)}
            </span>
            {bird.name && (
              <span className="text-sm text-gray-500 truncate">
                ({bird.name})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                getSexBadge(bird.sex)
              )}
            >
              {bird.sex === "MALE"
                ? t("bird.sex.male")
                : bird.sex === "FEMALE"
                ? t("bird.sex.female")
                : "?"}
            </span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                getStatusBadge(bird.status)
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
          </div>
        </div>

        {/* Expand indicator */}
        {!isSelectionMode && (
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && !isSelectionMode && (
        <div className="px-3 pb-3 border-t border-orange-100 pt-3 space-y-3">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">{t("bird.age")}:</span>
              <span className="ml-1 text-gray-800">{formatAge(ageInDays)}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("bird.coop")}:</span>
              <span className="ml-1 text-gray-800">{bird.coop?.name || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("bird.breed")}:</span>
              <span className="ml-1 text-gray-800">{getBreedDisplay()}</span>
            </div>
            {bird.color && (
              <div>
                <span className="text-gray-500">{t("inventory.color")}:</span>
                <span className="ml-1 text-gray-800">{bird.color}</span>
              </div>
            )}
          </div>

          {/* Parents */}
          {(bird.sire || bird.dam) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">{t("bird.father")}:</span>
                {bird.sire ? (
                  <Link
                    href={`/birds/${bird.sire.id}`}
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    {bird.sire.identifiers?.[0]?.idValue || bird.sire.id.slice(-6)}
                  </Link>
                ) : (
                  <span className="ml-1 text-gray-400">-</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">{t("bird.mother")}:</span>
                {bird.dam ? (
                  <Link
                    href={`/birds/${bird.dam.id}`}
                    className="ml-1 text-pink-600 hover:underline"
                  >
                    {bird.dam.identifiers?.[0]?.idValue || bird.dam.id.slice(-6)}
                  </Link>
                ) : (
                  <span className="ml-1 text-gray-400">-</span>
                )}
              </div>
            </div>
          )}

          {/* Fight record */}
          {bird.fightRecord && (
            <div className="text-sm">
              <span className="text-gray-500">{t("fights.winRecord")}:</span>
              <span className="ml-1 font-medium">
                <span className="text-green-600">{bird.fightRecord.wins}</span>
                <span className="text-gray-400">-</span>
                <span className="text-red-600">{bird.fightRecord.losses}</span>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Link href={`/birds/${bird.id}`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-lg border-orange-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("mobile.viewDetails")}
              </Button>
            </Link>
            <Link href={`/birds/${bird.id}/edit`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-lg border-orange-200"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t("action.edit")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
