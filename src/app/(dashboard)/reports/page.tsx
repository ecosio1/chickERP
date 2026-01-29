"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Download,
  Printer,
  Save,
  FolderOpen,
  Play,
  RotateCcw,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { ColumnSelector } from "@/components/reports/ColumnSelector"
import { FilterBuilder } from "@/components/reports/FilterBuilder"
import { ReportResultsTable } from "@/components/reports/ReportResultsTable"
import { SavePresetDialog } from "@/components/reports/SavePresetDialog"
import { LoadPresetSheet } from "@/components/reports/LoadPresetSheet"
import {
  REPORT_TYPES,
  getReportColumns,
  DEFAULT_COLUMNS,
  type ReportType,
  type ReportColumn,
} from "@/lib/report-columns"

type ReportMode = "summary" | "detail"

interface ReportState {
  reportType: ReportType
  reportMode: ReportMode
  selectedColumns: string[]
  filters: Record<string, string[]>
  sortColumn: string | null
  sortDirection: "asc" | "desc" | null
  results: Record<string, unknown>[]
  totalCount: number
  loading: boolean
  hasRun: boolean
}

export default function ReportsPage() {
  const { language } = useLanguage()

  const [state, setState] = useState<ReportState>({
    reportType: "birds",
    reportMode: "summary",
    selectedColumns: ["status", "sex", "breed"],
    filters: {},
    sortColumn: null,
    sortDirection: null,
    results: [],
    totalCount: 0,
    loading: false,
    hasRun: false,
  })

  const [columns, setColumns] = useState<ReportColumn[]>(() => getReportColumns("birds"))
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadSheetOpen, setLoadSheetOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Load columns when report type changes
  useEffect(() => {
    const cols = getReportColumns(state.reportType)
    setColumns(cols)
  }, [state.reportType])

  const handleReportTypeChange = (type: ReportType) => {
    setState({
      reportType: type,
      reportMode: state.reportMode,
      selectedColumns: state.reportMode === "summary" ? ["status", "sex", "breed"] : DEFAULT_COLUMNS[type],
      filters: {},
      sortColumn: null,
      sortDirection: null,
      results: [],
      totalCount: 0,
      loading: false,
      hasRun: false,
    })
  }

  const handleModeChange = (mode: ReportMode) => {
    setState({
      ...state,
      reportMode: mode,
      selectedColumns: mode === "summary" ? ["status", "sex", "breed"] : DEFAULT_COLUMNS[state.reportType],
      results: [],
      totalCount: 0,
      hasRun: false,
    })
  }

  const handleColumnsChange = (newColumns: string[]) => {
    setState((prev) => ({ ...prev, selectedColumns: newColumns }))
  }

  const handleColumnReorder = (newOrder: string[]) => {
    setState((prev) => ({ ...prev, selectedColumns: newOrder }))
  }

  const handleFiltersChange = (newFilters: Record<string, string[]>) => {
    setState((prev) => ({ ...prev, filters: newFilters }))
  }

  const handleSort = (columnId: string) => {
    setState((prev) => {
      if (prev.sortColumn === columnId) {
        // Cycle through: asc -> desc -> null
        if (prev.sortDirection === "asc") {
          return { ...prev, sortDirection: "desc" }
        } else if (prev.sortDirection === "desc") {
          return { ...prev, sortColumn: null, sortDirection: null }
        }
      }
      return { ...prev, sortColumn: columnId, sortDirection: "asc" }
    })
  }

  const runReport = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const endpoint = state.reportMode === "summary" ? "/api/reports/summary" : "/api/reports/execute"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: state.reportType,
          columns: state.selectedColumns,
          filters: state.filters,
          sortColumn: state.sortColumn,
          sortDirection: state.sortDirection,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setState((prev) => ({
          ...prev,
          results: data.results || [],
          totalCount: data.totalCount || 0,
          loading: false,
          hasRun: true,
        }))
      } else {
        setState((prev) => ({ ...prev, loading: false, hasRun: true }))
      }
    } catch (error) {
      console.error("Failed to run report:", error)
      setState((prev) => ({ ...prev, loading: false, hasRun: true }))
    }
  }, [state.reportType, state.reportMode, state.selectedColumns, state.filters, state.sortColumn, state.sortDirection])

  // Re-run report when sort changes (if report has been run)
  useEffect(() => {
    if (state.hasRun && !state.loading) {
      runReport()
    }
  }, [state.sortColumn, state.sortDirection])

  const handleExport = async () => {
    setExporting(true)

    try {
      const endpoint = state.reportMode === "summary" ? "/api/reports/summary/export" : "/api/reports/export"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: state.reportType,
          columns: state.selectedColumns,
          filters: state.filters,
          sortColumn: state.sortColumn,
          sortDirection: state.sortDirection,
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const modeLabel = state.reportMode === "summary" ? "summary" : "detail"
        a.download = `${state.reportType}-${modeLabel}-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export:", error)
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSavePreset = async (preset: {
    name: string
    description: string
    isDefault: boolean
  }) => {
    const res = await fetch("/api/reports/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: preset.name,
        description: preset.description,
        reportType: state.reportType,
        config: {
          columns: state.selectedColumns,
          filters: state.filters,
          sortColumn: state.sortColumn,
          sortDirection: state.sortDirection,
        },
        isDefault: preset.isDefault,
      }),
    })

    if (!res.ok) {
      throw new Error("Failed to save preset")
    }
  }

  const handleLoadPreset = (preset: {
    config: {
      columns: string[]
      filters: Record<string, string[]>
      sortColumn: string | null
      sortDirection: "asc" | "desc" | null
    }
  }) => {
    setState((prev) => ({
      ...prev,
      selectedColumns: preset.config.columns,
      filters: preset.config.filters || {},
      sortColumn: preset.config.sortColumn,
      sortDirection: preset.config.sortDirection,
      hasRun: false,
    }))
  }

  const handleReset = () => {
    setState({
      reportType: state.reportType,
      reportMode: "summary",
      selectedColumns: ["status", "sex", "breed"],
      filters: {},
      sortColumn: null,
      sortDirection: null,
      results: [],
      totalCount: 0,
      loading: false,
      hasRun: false,
    })
  }

  const getReportTypeLabel = (type: ReportType) => {
    const config = REPORT_TYPES.find((rt) => rt.id === type)
    return language === "tl" ? config?.labelTl : config?.label
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header - Hidden when printing */}
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {language === "tl" ? "Tagabuo ng Ulat" : "Report Builder"}
            </h1>
            <p className="text-muted-foreground">
              {language === "tl"
                ? "Gumawa ng custom na mga ulat gamit ang mga filter at column"
                : "Create custom reports with filters and columns"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setLoadSheetOpen(true)}
              className="h-10"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {language === "tl" ? "I-load" : "Load Preset"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {language === "tl" ? "I-reset" : "Reset"}
            </Button>
          </div>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="print-only print-header hidden">
        <h1 className="text-xl font-bold">
          {getReportTypeLabel(state.reportType)}{" "}
          {language === "tl" ? "Ulat" : "Report"}
        </h1>
        <p className="text-sm text-gray-600">
          {language === "tl" ? "Petsa:" : "Date:"}{" "}
          {new Date().toLocaleDateString()}
        </p>
        {state.totalCount > 0 && (
          <p className="text-sm text-gray-600">
            {language === "tl" ? "Kabuuang Bilang:" : "Total Count:"}{" "}
            {state.totalCount}
          </p>
        )}
      </div>

      {/* Report Type Selector */}
      <Card className="card-warm no-print">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-gray-700">
              {language === "tl" ? "Uri ng Ulat:" : "Report Type:"}
            </span>
            <div className="flex flex-wrap gap-2 ml-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleReportTypeChange(type.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    state.reportType === type.id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {language === "tl" ? type.labelTl : type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">
              {language === "tl" ? "Mode:" : "Mode:"}
            </span>
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => handleModeChange("summary")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  state.reportMode === "summary"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "tl" ? "Buod (Mga Bilang)" : "Summary (Counts)"}
              </button>
              <button
                onClick={() => handleModeChange("detail")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  state.reportMode === "detail"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {language === "tl" ? "Detalye (Mga Hilera)" : "Detail (Individual Rows)"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columns Section */}
      <Card className="card-warm no-print">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                {state.reportMode === "summary"
                  ? (language === "tl" ? "I-group Ayon Sa:" : "Group By:")
                  : (language === "tl" ? "Mga Column:" : "Columns:")}
              </span>
              {state.reportMode === "summary" && (
                <span className="text-sm text-muted-foreground">
                  {language === "tl"
                    ? "(Bilangin ang mga ibon ayon sa mga napiling field)"
                    : "(Count birds by selected fields)"}
                </span>
              )}
            </div>
            <ColumnSelector
              columns={columns}
              selected={state.selectedColumns}
              onChange={handleColumnsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="card-warm no-print">
        <CardContent className="p-4">
          <FilterBuilder
            reportType={state.reportType}
            columns={columns}
            filters={state.filters}
            onChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <Button
          onClick={runReport}
          disabled={state.loading}
          className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
        >
          <Play className="h-5 w-5 mr-2" />
          {state.loading
            ? language === "tl"
              ? "Nag-lload..."
              : "Loading..."
            : language === "tl"
            ? "Patakbuhin ang Ulat"
            : "Run Report"}
        </Button>

        {state.hasRun && state.results.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(true)}
              className="h-12 rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              {language === "tl" ? "I-save" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="h-12 rounded-xl"
            >
              <Download className="h-5 w-5 mr-2" />
              {exporting
                ? language === "tl"
                  ? "Nag-e-export..."
                  : "Exporting..."
                : language === "tl"
                ? "I-export"
                : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-12 rounded-xl"
            >
              <Printer className="h-5 w-5 mr-2" />
              {language === "tl" ? "I-print" : "Print"}
            </Button>
          </>
        )}
      </div>

      {/* Results */}
      {(state.hasRun || state.loading) && (
        <div className="space-y-2">
          {state.hasRun && !state.loading && state.results.length > 0 && (
            <p className="text-sm text-muted-foreground no-print">
              {state.reportMode === "summary"
                ? (language === "tl"
                    ? `${state.results.length} grupo, ${state.results.reduce((sum, r) => sum + (typeof r.count === "number" ? r.count : 0), 0)} kabuuang ibon`
                    : `${state.results.length} groups, ${state.results.reduce((sum, r) => sum + (typeof r.count === "number" ? r.count : 0), 0)} total birds`)
                : (language === "tl"
                    ? `Nagpapakita ng ${state.results.length} sa ${state.totalCount} resulta`
                    : `Showing ${state.results.length} of ${state.totalCount} results`)}
            </p>
          )}
          <ReportResultsTable
            columns={columns}
            selectedColumns={state.selectedColumns}
            results={state.results}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={handleSort}
            onColumnReorder={handleColumnReorder}
            loading={state.loading}
            summaryMode={state.reportMode === "summary"}
          />
        </div>
      )}

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden no-print" />

      {/* Dialogs */}
      <SavePresetDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        reportType={state.reportType}
        config={{
          columns: state.selectedColumns,
          filters: state.filters,
          sortColumn: state.sortColumn,
          sortDirection: state.sortDirection,
        }}
        onSave={handleSavePreset}
      />

      <LoadPresetSheet
        open={loadSheetOpen}
        onOpenChange={setLoadSheetOpen}
        reportType={state.reportType}
        onLoad={handleLoadPreset}
      />
    </div>
  )
}
