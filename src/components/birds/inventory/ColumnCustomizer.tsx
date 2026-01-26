"use client"

import { useState } from "react"
import { Columns3, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"
import { TOGGLEABLE_COLUMNS, BirdColumnDef } from "@/lib/bird-columns"

interface ColumnCustomizerProps {
  visibleColumns: string[]
  onToggleColumn: (columnId: string) => void
  onResetToDefault: () => void
  isMobile?: boolean
}

function ColumnItem({
  column,
  isVisible,
  onToggle,
  t,
}: {
  column: BirdColumnDef
  isVisible: boolean
  onToggle: () => void
  t: (key: any) => string
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 rounded-lg cursor-pointer"
      onClick={onToggle}
    >
      <Checkbox
        checked={isVisible}
        onCheckedChange={onToggle}
        className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
      />
      <span className="text-sm text-gray-700">
        {t(column.labelKey as any) || column.labelKey}
      </span>
    </div>
  )
}

export function ColumnCustomizer({
  visibleColumns,
  onToggleColumn,
  onResetToDefault,
  isMobile = false,
}: ColumnCustomizerProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId)

  // Group columns: always visible (sticky) vs toggleable
  const stickyColumns = TOGGLEABLE_COLUMNS.filter((col) => col.sticky)
  const regularColumns = TOGGLEABLE_COLUMNS.filter((col) => !col.sticky)

  const content = (
    <div className="space-y-4">
      {/* Sticky columns (always shown but can be toggled) */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-2 px-3">
          {t("common.all")}
        </p>
        <div className="space-y-1">
          {stickyColumns.map((column) => (
            <ColumnItem
              key={column.id}
              column={column}
              isVisible={isColumnVisible(column.id)}
              onToggle={() => onToggleColumn(column.id)}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Regular columns */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-2 px-3">
          {t("inventory.columns")}
        </p>
        <div className="space-y-1">
          {regularColumns.map((column) => (
            <ColumnItem
              key={column.id}
              column={column}
              isVisible={isColumnVisible(column.id)}
              onToggle={() => onToggleColumn(column.id)}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-10 w-10 rounded-xl border-orange-100"
        >
          <Columns3 className="h-5 w-5 text-gray-600" />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[70vh]">
            <SheetHeader>
              <SheetTitle>{t("inventory.customizeColumns")}</SheetTitle>
            </SheetHeader>
            <div className="py-4 overflow-y-auto max-h-[50vh]">{content}</div>
            <SheetFooter>
              <Button
                variant="outline"
                onClick={onResetToDefault}
                className="flex-1 rounded-xl"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("inventory.resetColumns")}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Check className="h-4 w-4 mr-2" />
                {t("action.save")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop dropdown
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-orange-100 px-3"
        >
          <Columns3 className="h-4 w-4 mr-2 text-gray-600" />
          <span className="hidden sm:inline">{t("inventory.columns")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        {content}
        <DropdownMenuSeparator className="my-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetToDefault}
          className="w-full justify-start text-gray-600 hover:text-gray-800"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("inventory.resetColumns")}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
