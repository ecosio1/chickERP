"use client"

import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { ReportType } from "@/lib/report-columns"

interface SavePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: ReportType
  config: {
    columns: string[]
    filters: Record<string, string[]>
    sortColumn: string | null
    sortDirection: "asc" | "desc" | null
  }
  onSave: (preset: {
    name: string
    description: string
    isDefault: boolean
  }) => Promise<void>
}

export function SavePresetDialog({
  open,
  onOpenChange,
  reportType,
  config,
  onSave,
}: SavePresetDialogProps) {
  const { language } = useLanguage()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      setError(language === "tl" ? "Kinakailangan ang pangalan" : "Name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        isDefault,
      })
      // Reset form
      setName("")
      setDescription("")
      setIsDefault(false)
      onOpenChange(false)
    } catch (err) {
      setError(
        language === "tl"
          ? "Hindi ma-save ang preset. Subukan ulit."
          : "Failed to save preset. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setIsDefault(false)
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "tl" ? "I-save ang Report Preset" : "Save Report Preset"}
          </DialogTitle>
          <DialogDescription>
            {language === "tl"
              ? "I-save ang kasalukuyang configuration para magamit ulit."
              : "Save the current configuration for future use."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">
              {language === "tl" ? "Pangalan" : "Name"}
            </Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                language === "tl"
                  ? "hal., Aktibong Stag Report"
                  : "e.g., Active Stag Report"
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">
              {language === "tl" ? "Paglalarawan (opsyonal)" : "Description (optional)"}
            </Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === "tl"
                  ? "Ilarawan kung ano ang report na ito..."
                  : "Describe what this report is for..."
              }
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="preset-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="preset-default" className="text-sm font-normal">
              {language === "tl"
                ? "Gawing default para sa mga bird report"
                : "Set as default for bird reports"}
            </Label>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">
              {language === "tl" ? "Mga kasama:" : "Includes:"}
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                {config.columns.length}{" "}
                {language === "tl" ? "column" : "column"}
                {config.columns.length !== 1 ? "s" : ""}
              </li>
              <li>
                {Object.keys(config.filters).length}{" "}
                {language === "tl" ? "filter" : "filter"}
                {Object.keys(config.filters).length !== 1 ? "s" : ""}
              </li>
              {config.sortColumn && (
                <li>
                  {language === "tl" ? "Pagkasunod-sunod: " : "Sort: "}
                  {config.sortColumn} ({config.sortDirection})
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {language === "tl" ? "Kanselahin" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving
              ? language === "tl"
                ? "Nag-se-save..."
                : "Saving..."
              : language === "tl"
              ? "I-save ang Preset"
              : "Save Preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
