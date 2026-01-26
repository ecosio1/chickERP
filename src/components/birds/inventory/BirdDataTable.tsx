"use client"

import { useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Bird, FileText, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import {
  BIRD_COLUMNS,
  BirdColumnDef,
  BirdInventoryRecord,
  SortState,
  getDisplayId,
  calculateAgeInDays,
} from "@/lib/bird-columns"
import { SortableHeader } from "./SortableHeader"

interface Breed {
  id: string
  name: string
  code: string
}

interface BirdDataTableProps {
  birds: BirdInventoryRecord[]
  breeds: Breed[]
  visibleColumns: string[]
  selectedIds: string[]
  selectionState: "none" | "partial" | "all"
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
  sortState: SortState
  onSort: (column: string) => void
}

export function BirdDataTable({
  birds,
  breeds,
  visibleColumns,
  selectedIds,
  selectionState,
  onToggleSelection,
  onToggleSelectAll,
  sortState,
  onSort,
}: BirdDataTableProps) {
  const { t, formatAge } = useLanguage()

  // Get visible column definitions in order
  const columns = useMemo(() => {
    return BIRD_COLUMNS.filter((col) => visibleColumns.includes(col.id))
  }, [visibleColumns])

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

  // Render cell content based on column
  const renderCell = useCallback(
    (bird: BirdInventoryRecord, column: BirdColumnDef) => {
      const ageInDays = calculateAgeInDays(bird.hatchDate)

      switch (column.id) {
        case "select":
          return (
            <Checkbox
              checked={selectedIds.includes(bird.id)}
              onCheckedChange={() => onToggleSelection(bird.id)}
              onClick={(e) => e.stopPropagation()}
              className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
          )

        case "photo":
          return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-50 flex items-center justify-center">
              {bird.photos?.[0]?.url ? (
                <img
                  src={bird.photos[0].url}
                  alt={getDisplayId(bird)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Bird className={cn("h-5 w-5", getSexBadge(bird.sex).replace("bg-", "text-").split(" ")[1])} />
              )}
            </div>
          )

        case "identifier":
          return (
            <span className="font-semibold text-gray-800">
              {getDisplayId(bird)}
            </span>
          )

        case "name":
          return (
            <span className="text-gray-700">{bird.name || "-"}</span>
          )

        case "sex":
          return (
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                getSexBadge(bird.sex)
              )}
            >
              {bird.sex === "MALE"
                ? t("bird.sex.male")
                : bird.sex === "FEMALE"
                ? t("bird.sex.female")
                : t("bird.sex.unknown")}
            </span>
          )

        case "status":
          return (
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                getStatusBadge(bird.status)
              )}
            >
              {bird.status === "ACTIVE"
                ? t("bird.status.active")
                : bird.status === "SOLD"
                ? t("bird.status.sold")
                : bird.status === "DECEASED"
                ? t("bird.status.deceased")
                : bird.status === "ARCHIVED"
                ? t("bird.status.archived")
                : bird.status}
            </span>
          )

        case "age":
          return (
            <span className="text-gray-600 text-sm">{formatAge(ageInDays)}</span>
          )

        case "coop":
          return (
            <span className="text-gray-600">{bird.coop?.name || "-"}</span>
          )

        case "breed":
          if (!bird.breedComposition || bird.breedComposition.length === 0) {
            return <span className="text-gray-400">-</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {bird.breedComposition.slice(0, 2).map((comp) => {
                const breed = breeds.find((b) => b.id === comp.breedId)
                return (
                  <span
                    key={comp.breedId}
                    className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded"
                  >
                    {breed?.code || comp.breedId.slice(-4)} {comp.percentage}%
                  </span>
                )
              })}
              {bird.breedComposition.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{bird.breedComposition.length - 2}
                </span>
              )}
            </div>
          )

        case "color":
          return (
            <span className="text-gray-600">{bird.color || "-"}</span>
          )

        case "sire":
          return bird.sire ? (
            <Link
              href={`/birds/${bird.sire.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {bird.sire.identifiers?.[0]?.idValue || bird.sire.id.slice(-6)}
            </Link>
          ) : (
            <span className="text-gray-400">-</span>
          )

        case "dam":
          return bird.dam ? (
            <Link
              href={`/birds/${bird.dam.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-pink-600 hover:text-pink-700 hover:underline"
            >
              {bird.dam.identifiers?.[0]?.idValue || bird.dam.id.slice(-6)}
            </Link>
          ) : (
            <span className="text-gray-400">-</span>
          )

        case "fightRecord":
          if (!bird.fightRecord) {
            return <span className="text-gray-400">-</span>
          }
          const { wins, losses } = bird.fightRecord
          return (
            <span className="text-sm font-medium">
              <span className="text-green-600">{wins}</span>
              <span className="text-gray-400">-</span>
              <span className="text-red-600">{losses}</span>
            </span>
          )

        case "offspringCount":
          return (
            <span className="text-gray-600">
              {bird.offspringCount !== undefined ? bird.offspringCount : "-"}
            </span>
          )

        case "notes":
          return bird.notes ? (
            <StickyNote className="h-4 w-4 text-orange-400" />
          ) : (
            <span className="text-gray-300">-</span>
          )

        default:
          return null
      }
    },
    [selectedIds, onToggleSelection, t, formatAge, breeds]
  )

  // Calculate sticky column offsets
  const getStickyLeft = (colIndex: number) => {
    let left = 0
    for (let i = 0; i < colIndex; i++) {
      if (columns[i].sticky) {
        left += columns[i].width
      }
    }
    return left
  }

  return (
    <div className="relative overflow-x-auto border border-orange-100 rounded-xl bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
            {columns.map((column, index) => {
              const isSticky = column.sticky
              const stickyLeft = isSticky ? getStickyLeft(index) : 0
              const isLastSticky = isSticky && !columns[index + 1]?.sticky

              return (
                <TableHead
                  key={column.id}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || column.width,
                    ...(isSticky && {
                      position: "sticky",
                      left: stickyLeft,
                      zIndex: 20,
                    }),
                  }}
                  className={cn(
                    "h-11 px-3",
                    isSticky && "bg-orange-50/50",
                    isLastSticky && "border-r border-orange-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                  )}
                >
                  {column.id === "select" ? (
                    <Checkbox
                      checked={selectionState === "all" ? true : selectionState === "partial" ? "indeterminate" : false}
                      onCheckedChange={onToggleSelectAll}
                      className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=indeterminate]:bg-orange-500 data-[state=indeterminate]:border-orange-500"
                    />
                  ) : (
                    <SortableHeader
                      label={t(column.labelKey as any) || column.labelKey}
                      sortable={column.sortable}
                      sorted={sortState.column === column.id ? sortState.direction : null}
                      onSort={() => onSort(column.id)}
                      align={column.align}
                    />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {birds.map((bird) => {
            const isSelected = selectedIds.includes(bird.id)
            return (
              <TableRow
                key={bird.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected
                    ? "bg-orange-100 hover:bg-orange-100"
                    : "hover:bg-orange-50"
                )}
                data-state={isSelected ? "selected" : undefined}
              >
                {columns.map((column, index) => {
                  const isSticky = column.sticky
                  const stickyLeft = isSticky ? getStickyLeft(index) : 0
                  const isLastSticky = isSticky && !columns[index + 1]?.sticky

                  return (
                    <TableCell
                      key={column.id}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth || column.width,
                        ...(isSticky && {
                          position: "sticky",
                          left: stickyLeft,
                          zIndex: 10,
                        }),
                      }}
                      className={cn(
                        "px-3 py-2",
                        isSticky && (isSelected ? "bg-orange-100" : "bg-white"),
                        isLastSticky && "border-r border-orange-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                      onClick={
                        column.id === "select"
                          ? undefined
                          : () => {
                              window.location.href = `/birds/${bird.id}`
                            }
                      }
                    >
                      {renderCell(bird, column)}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {birds.length === 0 && (
        <div className="p-8 text-center">
          <Bird className="h-12 w-12 mx-auto text-orange-200 mb-3" />
          <p className="text-gray-500">{t("common.noData")}</p>
        </div>
      )}
    </div>
  )
}
