"use client"

import { useState } from "react"
import { X, Home, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/hooks/use-language"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Coop {
  id: string
  name: string
}

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: string[]
  coops: Coop[]
  onClearSelection: () => void
  onActionComplete: () => void
  className?: string
}

const STATUSES = [
  { value: "ACTIVE", labelKey: "bird.status.active" },
  { value: "SOLD", labelKey: "bird.status.sold" },
  { value: "DECEASED", labelKey: "bird.status.deceased" },
  { value: "ARCHIVED", labelKey: "bird.status.archived" },
]

export function BulkActionBar({
  selectedCount,
  selectedIds,
  coops,
  onClearSelection,
  onActionComplete,
  className,
}: BulkActionBarProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const executeBulkAction = async (
    action: "move" | "status" | "delete",
    value?: string
  ) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/birds/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          birdIds: selectedIds,
          value,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute bulk action")
      }

      const result = await response.json()

      toast({
        title: t("common.success"),
        description: t("bulk.success").replace("{count}", String(result.updated || selectedCount)),
      })

      onClearSelection()
      onActionComplete()
    } catch (error) {
      console.error("Bulk action error:", error)
      toast({
        title: t("common.error"),
        description: t("bulk.error"),
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setDeleteDialogOpen(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-3",
          "bg-white rounded-2xl shadow-lg border-2 border-orange-200",
          "animate-in slide-in-from-bottom-4 duration-200",
          className
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} {t("inventory.selected")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Move to Coop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-orange-50"
              disabled={isProcessing || coops.length === 0}
            >
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t("bulk.moveToCoop")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            {coops.map((coop) => (
              <DropdownMenuItem
                key={coop.id}
                onClick={() => executeBulkAction("move", coop.id)}
              >
                {coop.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => executeBulkAction("move", "")}
              className="text-gray-500"
            >
              {t("common.none")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Change Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-orange-50"
              disabled={isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t("bulk.changeStatus")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40">
            {STATUSES.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => executeBulkAction("status", status.value)}
              >
                {t(status.labelKey as any)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isProcessing}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t("bulk.delete")}</span>
        </Button>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-orange-600">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t("bulk.processing")}</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulk.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulk.confirmDeleteMsg").replace("{count}", String(selectedCount))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeBulkAction("delete")}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? t("bulk.processing") : t("bulk.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
