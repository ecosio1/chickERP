"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ReportColumn } from "@/lib/report-columns"
import {
  SEX_LABELS,
  STATUS_LABELS,
  SHELL_QUALITY_LABELS,
  HEALTH_OUTCOME_LABELS,
  COMB_TYPE_LABELS,
} from "@/lib/report-columns"

interface ReportResultsTableProps {
  columns: ReportColumn[]
  selectedColumns: string[]
  results: Record<string, unknown>[]
  sortColumn: string | null
  sortDirection: "asc" | "desc" | null
  onSort: (column: string) => void
  onColumnReorder?: (newOrder: string[]) => void
  loading?: boolean
  className?: string
  summaryMode?: boolean
}

export function ReportResultsTable({
  columns,
  selectedColumns,
  results,
  sortColumn,
  sortDirection,
  onSort,
  onColumnReorder,
  loading = false,
  className,
  summaryMode = false,
}: ReportResultsTableProps) {
  const { language } = useLanguage()
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getLabel = (column: ReportColumn) => {
    return language === "tl" ? column.labelTl : column.label
  }

  const formatValue = (column: ReportColumn, value: unknown): string => {
    if (value === null || value === undefined || value === "-") {
      return "-"
    }

    const lang = language === "tl" ? "tl" : "en"
    const strValue = String(value)

    // Format based on column type or specific column
    switch (column.id) {
      case "sex":
        return SEX_LABELS[strValue]?.[lang] || strValue
      case "status":
        return STATUS_LABELS[strValue]?.[lang] || strValue
      case "shell_quality":
        return SHELL_QUALITY_LABELS[strValue]?.[lang] || strValue
      case "outcome":
        return HEALTH_OUTCOME_LABELS[strValue]?.[lang] || strValue
      case "comb_type":
        return COMB_TYPE_LABELS[strValue]?.[lang] || strValue
      case "age":
        if (typeof value === "number") {
          if (value < 12) {
            return language === "tl"
              ? `${value} buwan`
              : `${value} month${value !== 1 ? "s" : ""}`
          } else {
            const years = Math.floor(value / 12)
            const months = value % 12
            if (months === 0) {
              return language === "tl"
                ? `${years} taon`
                : `${years} year${years !== 1 ? "s" : ""}`
            }
            return language === "tl"
              ? `${years} taon, ${months} buwan`
              : `${years}y ${months}m`
          }
        }
        return strValue
      default:
        if (column.format === "date" && strValue) {
          try {
            return new Date(strValue).toLocaleDateString(
              language === "tl" ? "fil-PH" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )
          } catch {
            return strValue
          }
        }
        if (column.format === "number" && typeof value === "number") {
          return value.toLocaleString()
        }
        return strValue
    }
  }

  const visibleColumns = selectedColumns
    .map((id) => columns.find((c) => c.id === id))
    .filter(Boolean) as ReportColumn[]

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", columnId)
    // Add a slight delay to show the drag effect
    const target = e.target as HTMLElement
    setTimeout(() => {
      target.style.opacity = "0.5"
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.style.opacity = "1"
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedColumn && columnId !== draggedColumn) {
      setDragOverColumn(columnId)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const sourceColumnId = e.dataTransfer.getData("text/plain")

    if (sourceColumnId && sourceColumnId !== targetColumnId && onColumnReorder) {
      const newOrder = [...selectedColumns]
      const sourceIndex = newOrder.indexOf(sourceColumnId)
      const targetIndex = newOrder.indexOf(targetColumnId)

      if (sourceIndex !== -1 && targetIndex !== -1) {
        // Remove from source position
        newOrder.splice(sourceIndex, 1)
        // Insert at target position
        newOrder.splice(targetIndex, 0, sourceColumnId)
        onColumnReorder(newOrder)
      }
    }

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  if (loading) {
    return (
      <div className={cn("rounded-lg border bg-white", className)}>
        <div className="p-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">
            {language === "tl" ? "Naglo-load..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={cn("rounded-lg border bg-white", className)}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            {language === "tl"
              ? "Walang resulta. Subukang baguhin ang mga filter."
              : "No results found. Try adjusting your filters."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-white overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  draggable={!!onColumnReorder}
                  onDragStart={(e) => handleDragStart(e, column.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={cn(
                    "whitespace-nowrap transition-all",
                    column.sortable && "cursor-pointer select-none",
                    onColumnReorder && "cursor-grab active:cursor-grabbing",
                    draggedColumn === column.id && "opacity-50",
                    dragOverColumn === column.id && "bg-orange-100 border-l-2 border-orange-500"
                  )}
                  onClick={() => column.sortable && onSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    {onColumnReorder && (
                      <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="flex-1">{getLabel(column)}</span>
                    {column.sortable && (
                      <span className="text-muted-foreground">
                        {sortColumn === column.id ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {summaryMode && (
                <TableHead className="whitespace-nowrap text-right font-bold bg-orange-50">
                  {language === "tl" ? "Bilang" : "Count"}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((row, index) => (
              <TableRow key={(row.id as string) || index}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} className="whitespace-nowrap">
                    {formatValue(column, row[column.id])}
                  </TableCell>
                ))}
                {summaryMode && (
                  <TableCell className="whitespace-nowrap text-right font-semibold bg-orange-50/50">
                    {typeof row.count === "number" ? row.count.toLocaleString() : String(row.count ?? 0)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {summaryMode && results.length > 0 && (
              <TableRow className="bg-orange-100 font-bold">
                {visibleColumns.map((column, idx) => (
                  <TableCell key={column.id} className="whitespace-nowrap">
                    {idx === 0 ? (language === "tl" ? "Kabuuan" : "Total") : ""}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap text-right">
                  {results.reduce((sum, row) => sum + (typeof row.count === "number" ? row.count : 0), 0).toLocaleString()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
