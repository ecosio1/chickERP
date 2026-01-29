"use client"

import { useState, useEffect } from "react"
import { Trash2, Star, Clock } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import type { ReportType } from "@/lib/report-columns"

interface SavedPreset {
  id: string
  name: string
  description: string | null
  reportType: string
  config: {
    columns: string[]
    filters: Record<string, string[]>
    sortColumn: string | null
    sortDirection: "asc" | "desc" | null
  }
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface LoadPresetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: ReportType
  onLoad: (preset: SavedPreset) => void
}

export function LoadPresetSheet({
  open,
  onOpenChange,
  reportType,
  onLoad,
}: LoadPresetSheetProps) {
  const { language } = useLanguage()
  const [presets, setPresets] = useState<SavedPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPresets()
    }
  }, [open, reportType])

  const fetchPresets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/presets?type=${reportType}`)
      if (res.ok) {
        const data = await res.json()
        setPresets(data.presets || [])
      }
    } catch (error) {
      console.error("Failed to fetch presets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (deleting) return

    setDeleting(presetId)
    try {
      const res = await fetch(`/api/reports/presets/${presetId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPresets(presets.filter((p) => p.id !== presetId))
      }
    } catch (error) {
      console.error("Failed to delete preset:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleLoad = (preset: SavedPreset) => {
    onLoad(preset)
    onOpenChange(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === "tl" ? "fil-PH" : "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {language === "tl" ? "I-load ang Preset" : "Load Preset"}
          </SheetTitle>
          <SheetDescription>
            {language === "tl"
              ? "Pumili ng naka-save na report configuration."
              : "Select a saved report configuration."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">
                {language === "tl" ? "Naglo-load..." : "Loading..."}
              </p>
            </div>
          ) : presets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {language === "tl"
                  ? "Wala pang naka-save na preset."
                  : "No saved presets yet."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "tl"
                  ? "I-save ang iyong kasalukuyang configuration para gumawa ng isa."
                  : "Save your current configuration to create one."}
              </p>
            </div>
          ) : (
            presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoad(preset)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {preset.name}
                      </h3>
                      {preset.isDefault && (
                        <Star className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(preset.updatedAt)}
                      </span>
                      <span>
                        {preset.config.columns.length}{" "}
                        {language === "tl" ? "column" : "column"}
                        {preset.config.columns.length !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {Object.keys(preset.config.filters || {}).length}{" "}
                        {language === "tl" ? "filter" : "filter"}
                        {Object.keys(preset.config.filters || {}).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(preset.id, e)}
                    disabled={deleting === preset.id}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    {deleting === preset.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
