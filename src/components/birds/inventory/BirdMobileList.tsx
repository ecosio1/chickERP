"use client"

import { Bird, CheckSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import { BirdInventoryRecord } from "@/lib/bird-columns"
import { BirdMobileCard } from "./BirdMobileCard"

interface Breed {
  id: string
  name: string
  code: string
}

interface BirdMobileListProps {
  birds: BirdInventoryRecord[]
  breeds: Breed[]
  selectedIds: string[]
  selectionState: "none" | "partial" | "all"
  isSelectionMode: boolean
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
  onEnterSelectionMode: () => void
  onExitSelectionMode: () => void
}

export function BirdMobileList({
  birds,
  breeds,
  selectedIds,
  selectionState,
  isSelectionMode,
  onToggleSelection,
  onToggleSelectAll,
  onEnterSelectionMode,
  onExitSelectionMode,
}: BirdMobileListProps) {
  const { t } = useLanguage()

  const handleLongPress = (id: string) => {
    onEnterSelectionMode()
    onToggleSelection(id)
  }

  if (birds.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bird className="h-12 w-12 mx-auto text-orange-200 mb-3" />
        <p className="text-gray-500">{t("common.noData")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Selection mode header */}
      {isSelectionMode && (
        <div className="flex items-center justify-between px-2 py-2 bg-orange-50 rounded-xl border-2 border-orange-200 mb-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectionState === "all" ? true : selectionState === "partial" ? "indeterminate" : false}
              onCheckedChange={onToggleSelectAll}
              className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=indeterminate]:bg-orange-500 data-[state=indeterminate]:border-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.length} {t("inventory.selected")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitSelectionMode}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            {t("action.cancel")}
          </Button>
        </div>
      )}

      {/* Bird cards */}
      <div className="space-y-2">
        {birds.map((bird) => (
          <BirdMobileCard
            key={bird.id}
            bird={bird}
            breeds={breeds}
            isSelected={selectedIds.includes(bird.id)}
            isSelectionMode={isSelectionMode}
            onSelect={onToggleSelection}
            onLongPress={handleLongPress}
          />
        ))}
      </div>

      {/* Long-press hint (shown when not in selection mode) */}
      {!isSelectionMode && birds.length > 0 && (
        <p className="text-center text-xs text-gray-400 pt-2">
          {t("mobile.longPressToSelect")}
        </p>
      )}
    </div>
  )
}
