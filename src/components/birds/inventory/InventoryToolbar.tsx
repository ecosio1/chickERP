"use client"

import { useRef } from "react"
import Link from "next/link"
import { Search, X, Plus, Upload, Download, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/hooks/use-language"
import { cn, formatNumber } from "@/lib/utils"
import { ColumnCustomizer } from "./ColumnCustomizer"

interface InventoryToolbarProps {
  totalCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearSearch: () => void
  isSearching: boolean
  activeFilterCount: number
  onOpenFilters: () => void
  visibleColumns: string[]
  onToggleColumn: (columnId: string) => void
  onResetColumns: () => void
  autoFocusSearch?: boolean
  isMobile?: boolean
}

export function InventoryToolbar({
  totalCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
  activeFilterCount,
  onOpenFilters,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  autoFocusSearch,
  isMobile = false,
}: InventoryToolbarProps) {
  const { t } = useLanguage()
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {t("bird.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {formatNumber(totalCount)} {t("bird.title").toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/birds/export">
            <Button
              variant="outline"
              className="rounded-xl h-10 lg:h-12 px-3 lg:px-4 border-2 border-orange-100"
            >
              <Download className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-2" />
              <span className="hidden lg:inline">{t("action.export")}</span>
            </Button>
          </Link>
          <Link href="/birds/import">
            <Button
              variant="outline"
              className="rounded-xl h-10 lg:h-12 px-3 lg:px-4 border-2 border-orange-100"
            >
              <Upload className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-2" />
              <span className="hidden lg:inline">{t("action.import")}</span>
            </Button>
          </Link>
          <Link href="/birds/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 lg:h-12 px-4 lg:px-6">
              <Plus className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-2" />
              <span className="hidden sm:inline">{t("bird.addNew")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and filters row */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={t("bird.search")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus={autoFocusSearch}
            className="pl-12 pr-12 h-12 lg:h-14 text-base lg:text-lg rounded-2xl border-2 border-orange-100 focus:border-orange-300 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onClearSearch()
                searchInputRef.current?.focus()
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filter button */}
        <Button
          variant="outline"
          onClick={onOpenFilters}
          className={cn(
            "h-12 lg:h-14 px-3 lg:px-4 rounded-2xl border-2 flex-shrink-0",
            activeFilterCount > 0
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-100 text-gray-600"
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Column customizer (desktop only) */}
        {!isMobile && (
          <ColumnCustomizer
            visibleColumns={visibleColumns}
            onToggleColumn={onToggleColumn}
            onResetToDefault={onResetColumns}
            isMobile={false}
          />
        )}
      </div>
    </div>
  )
}
