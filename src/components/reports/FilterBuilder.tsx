"use client"

import { useState, useEffect } from "react"
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { MultiSelectCombobox, type MultiSelectOption } from "@/components/ui/multi-select-combobox"
import type { ReportColumn, ReportType } from "@/lib/report-columns"
import {
  SEX_LABELS,
  STATUS_LABELS,
  SHELL_QUALITY_LABELS,
  HEALTH_OUTCOME_LABELS,
  COMB_TYPE_LABELS,
} from "@/lib/report-columns"

interface FilterBuilderProps {
  reportType: ReportType
  columns: ReportColumn[]
  filters: Record<string, string[]>
  onChange: (filters: Record<string, string[]>) => void
  className?: string
}

export function FilterBuilder({
  reportType,
  columns,
  filters,
  onChange,
  className,
}: FilterBuilderProps) {
  const { language } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(true)
  const [columnOptions, setColumnOptions] = useState<Record<string, MultiSelectOption[]>>({})

  const filterableColumns = columns.filter((col) => col.filterable)

  // Fetch options from database for all filterable columns
  useEffect(() => {
    const fetchOptions = async () => {
      const newOptions: Record<string, MultiSelectOption[]> = {}

      for (const column of filterableColumns) {
        // Skip date columns - they use date pickers, not dropdowns
        if (column.type === "date") continue

        // Always fetch from API to get actual database values
        try {
          const res = await fetch(
            `/api/reports/values?type=${reportType}&column=${column.id}`
          )
          if (res.ok) {
            const data = await res.json()
            newOptions[column.id] = (data.values || []).map((val: string) => ({
              value: val,
              label: getOptionLabel(column.id, val),
            }))
          }
        } catch (error) {
          console.error(`Failed to fetch values for ${column.id}:`, error)
          newOptions[column.id] = []
        }
      }

      setColumnOptions(newOptions)
    }

    fetchOptions()
  }, [reportType, filterableColumns.map((c) => c.id).join(",")])

  const getOptionLabel = (columnId: string, value: string): string => {
    const lang = language === "tl" ? "tl" : "en"

    switch (columnId) {
      case "sex":
        return SEX_LABELS[value]?.[lang] || value
      case "status":
        return STATUS_LABELS[value]?.[lang] || value
      case "shell_quality":
        return SHELL_QUALITY_LABELS[value]?.[lang] || value
      case "outcome":
        return HEALTH_OUTCOME_LABELS[value]?.[lang] || value
      case "comb_type":
        return COMB_TYPE_LABELS[value]?.[lang] || value
      default:
        return value
    }
  }

  const getLabel = (column: ReportColumn) => {
    return language === "tl" ? column.labelTl : column.label
  }

  const updateFilter = (columnId: string, values: string[]) => {
    const newFilters = { ...filters }
    if (values.length === 0) {
      delete newFilters[columnId]
    } else {
      newFilters[columnId] = values
    }
    onChange(newFilters)
  }

  const clearAllFilters = () => {
    onChange({})
  }

  const activeFilterCount = Object.values(filters).reduce(
    (count, values) => count + values.length,
    0
  )

  // Get columns that have active filters
  const activeFilterColumns = Object.keys(filters).filter(
    (key) => filters[key]?.length > 0
  )

  // Get columns available to add as filters
  const availableFilterColumns = filterableColumns.filter(
    (col) => !activeFilterColumns.includes(col.id) && columnOptions[col.id]?.length > 0
  )

  const [addingFilter, setAddingFilter] = useState<string | null>(null)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {language === "tl" ? "Mga Filter" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8"
          >
            {language === "tl" ? "I-clear lahat" : "Clear all"}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Active filters */}
          {activeFilterColumns.map((columnId) => {
            const column = filterableColumns.find((c) => c.id === columnId)
            if (!column) return null

            return (
              <div key={columnId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600">
                    {getLabel(column)}
                  </label>
                  <button
                    onClick={() => updateFilter(columnId, [])}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <MultiSelectCombobox
                  options={columnOptions[columnId] || []}
                  selected={filters[columnId] || []}
                  onChange={(values) => updateFilter(columnId, values)}
                  placeholder={
                    language === "tl" ? `Pumili ng ${getLabel(column).toLowerCase()}...` : `Select ${getLabel(column).toLowerCase()}...`
                  }
                  searchPlaceholder={language === "tl" ? "Maghanap..." : "Search..."}
                  emptyMessage={language === "tl" ? "Walang nahanap." : "No results found."}
                />
              </div>
            )
          })}

          {/* Add filter button or dropdown */}
          {availableFilterColumns.length > 0 && (
            <div className="pt-2">
              {addingFilter ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      {getLabel(
                        filterableColumns.find((c) => c.id === addingFilter)!
                      )}
                    </label>
                    <button
                      onClick={() => setAddingFilter(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <MultiSelectCombobox
                    options={columnOptions[addingFilter] || []}
                    selected={filters[addingFilter] || []}
                    onChange={(values) => {
                      updateFilter(addingFilter, values)
                      if (values.length > 0) {
                        setAddingFilter(null)
                      }
                    }}
                    placeholder={language === "tl" ? "Pumili..." : "Select..."}
                    searchPlaceholder={language === "tl" ? "Maghanap..." : "Search..."}
                    emptyMessage={language === "tl" ? "Walang nahanap." : "No results found."}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableFilterColumns.slice(0, 4).map((column) => (
                    <Button
                      key={column.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingFilter(column.id)}
                      className="rounded-full px-3 py-1.5 h-auto border-dashed border-gray-300 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {getLabel(column)}
                    </Button>
                  ))}
                  {availableFilterColumns.length > 4 && (
                    <span className="text-sm text-muted-foreground self-center">
                      +{availableFilterColumns.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {activeFilterCount === 0 && availableFilterColumns.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              {language === "tl"
                ? "Walang available na filter para sa report type na ito."
                : "No filters available for this report type."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
