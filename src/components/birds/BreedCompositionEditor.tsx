"use client"

import { Plus, X, AlertTriangle, Calculator } from "lucide-react"
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
import { getTotalPercentage, type BreedComposition } from "@/lib/breed-utils"

interface Breed {
  id: string
  name: string
  code: string
}

interface BreedCompositionEditorProps {
  value: BreedComposition[]
  onChange: (composition: BreedComposition[]) => void
  breeds: Breed[]
  calculatedFromParents?: BreedComposition[] | null
  isOverride: boolean
  onOverrideChange: (isOverride: boolean) => void
  disabled?: boolean
}

export function BreedCompositionEditor({
  value,
  onChange,
  breeds,
  calculatedFromParents,
  isOverride,
  onOverrideChange,
  disabled = false,
}: BreedCompositionEditorProps) {
  const total = getTotalPercentage(value)
  const hasCalculated = calculatedFromParents && calculatedFromParents.length > 0

  const handleBreedChange = (index: number, breedId: string) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], breedId }
    onChange(newValue)
  }

  const handlePercentageChange = (index: number, percentage: string) => {
    const newValue = [...value]
    const num = parseFloat(percentage) || 0
    newValue[index] = { ...newValue[index], percentage: Math.min(100, Math.max(0, num)) }
    onChange(newValue)
  }

  const addBreed = () => {
    // Find a breed not already selected
    const usedBreedIds = new Set(value.map((b) => b.breedId))
    const availableBreed = breeds.find((b) => !usedBreedIds.has(b.id))
    if (availableBreed) {
      onChange([...value, { breedId: availableBreed.id, percentage: 0 }])
    } else if (breeds.length > 0) {
      onChange([...value, { breedId: breeds[0].id, percentage: 0 }])
    }
  }

  const removeBreed = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const useCalculated = () => {
    if (calculatedFromParents) {
      onChange(calculatedFromParents)
      onOverrideChange(false)
    }
  }

  const getBreedName = (breedId: string) => {
    const breed = breeds.find((b) => b.id === breedId)
    return breed ? `${breed.name} (${breed.code})` : breedId
  }

  return (
    <div className="space-y-4">
      {/* Auto-calculated notice */}
      {hasCalculated && (
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-2">
            <Calculator className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">
                Calculated from parents
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {calculatedFromParents.map((b) => (
                  `${getBreedName(b.breedId)}: ${b.percentage}%`
                )).join(", ")}
              </p>
              {isOverride && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={useCalculated}
                  className="text-blue-600 p-0 h-auto mt-1"
                >
                  Use calculated values
                </Button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isOverride}
                onChange={(e) => onOverrideChange(e.target.checked)}
                className="rounded border-blue-300"
                disabled={disabled}
              />
              <span className="text-blue-700">Override</span>
            </label>
          </div>
        </div>
      )}

      {/* Breed list */}
      {(isOverride || !hasCalculated) && (
        <>
          <div className="space-y-3">
            {value.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={item.breedId}
                  onValueChange={(v) => handleBreedChange(index, v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="flex-1 h-12 rounded-xl border-2 border-orange-100">
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map((breed) => (
                      <SelectItem key={breed.id} value={breed.id}>
                        {breed.name} ({breed.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={item.percentage}
                    onChange={(e) => handlePercentageChange(index, e.target.value)}
                    className="h-12 rounded-xl border-2 border-orange-100 pr-8"
                    disabled={disabled}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBreed(index)}
                  className="text-red-500 hover:bg-red-50"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add breed button */}
          <Button
            type="button"
            variant="outline"
            onClick={addBreed}
            disabled={disabled || breeds.length === 0}
            className="w-full h-12 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-300 hover:bg-orange-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Breed
          </Button>

          {/* Total percentage indicator */}
          {value.length > 0 && (
            <div className={`flex items-center gap-2 text-sm ${
              Math.abs(total - 100) < 0.1 ? "text-green-600" : "text-amber-600"
            }`}>
              {Math.abs(total - 100) >= 0.1 && (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>
                Total: {total.toFixed(1)}%
                {Math.abs(total - 100) >= 0.1 && " (should be 100%)"}
              </span>
            </div>
          )}
        </>
      )}

      {/* Show current values when using calculated (not override) */}
      {hasCalculated && !isOverride && value.length > 0 && (
        <div className="text-sm text-gray-500">
          Current: {value.map((b) => `${getBreedName(b.breedId)}: ${b.percentage}%`).join(", ")}
        </div>
      )}

      {/* Empty state */}
      {breeds.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No breeds defined yet. Add breeds in Settings first.
        </p>
      )}
    </div>
  )
}
