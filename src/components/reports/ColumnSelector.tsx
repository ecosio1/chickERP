"use client"

import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import type { ReportColumn } from "@/lib/report-columns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ColumnSelectorProps {
  columns: ReportColumn[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export function ColumnSelector({
  columns,
  selected,
  onChange,
  className,
}: ColumnSelectorProps) {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)

  const toggleColumn = (columnId: string) => {
    if (selected.includes(columnId)) {
      // Don't allow removing the last column
      if (selected.length > 1) {
        onChange(selected.filter((id) => id !== columnId))
      }
    } else {
      onChange([...selected, columnId])
    }
  }

  const getLabel = (column: ReportColumn) => {
    return language === "tl" ? column.labelTl : column.label
  }

  const availableColumns = columns.filter((col) => !selected.includes(col.id))

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {selected.map((columnId) => {
        const column = columns.find((c) => c.id === columnId)
        if (!column) return null

        return (
          <button
            key={columnId}
            onClick={() => toggleColumn(columnId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
          >
            {getLabel(column)}
            {selected.length > 1 && <X className="h-3.5 w-3.5" />}
          </button>
        )
      })}

      {availableColumns.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-3 py-1.5 h-auto border-dashed border-gray-300 text-gray-600 hover:border-orange-300 hover:text-orange-600"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {language === "tl" ? "Magdagdag" : "Add Column"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-1 bg-white border rounded-lg shadow-lg z-50"
            align="start"
          >
            <div className="max-h-60 overflow-y-auto">
              {availableColumns.map((column) => (
                <button
                  key={column.id}
                  onClick={() => {
                    toggleColumn(column.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100 transition-colors"
                >
                  {getLabel(column)}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
