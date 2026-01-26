"use client"

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SortDirection } from "@/lib/bird-columns"

interface SortableHeaderProps {
  label: string
  sortable?: boolean
  sorted?: SortDirection
  onSort?: () => void
  align?: "left" | "center" | "right"
  className?: string
}

export function SortableHeader({
  label,
  sortable = false,
  sorted = null,
  onSort,
  align = "left",
  className,
}: SortableHeaderProps) {
  const alignClass = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[align]

  if (!sortable) {
    return (
      <div className={cn("flex items-center gap-1", alignClass, className)}>
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={onSort}
      className={cn(
        "flex items-center gap-1 hover:text-orange-600 transition-colors w-full group",
        alignClass,
        className
      )}
    >
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide group-hover:text-orange-600">
        {label}
      </span>
      <span className="text-gray-400 group-hover:text-orange-500">
        {sorted === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
        ) : sorted === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5 text-orange-500" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  )
}
