"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
  Bird,
} from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface ParsedRow {
  rowNumber: number
  name: string
  sex: string
  hatchDate: string
  status: string
  coopName: string
  sireName: string
  damName: string
  bandNumber: string
  breedName?: string
  breedCode?: string
  color?: string
  notes?: string
  error?: string
}

interface ImportResult {
  success: number
  failed: number
  errors: { row: number; error: string }[]
  autoCreated?: {
    coops: string[]
    breeds: string[]
    sires: string[]
    dams: string[]
  }
}

export default function ImportBirdsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState("")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const parseCSV = (content: string): ParsedRow[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error("CSV file must have a header row and at least one data row")
    }

    const headerLine = lines[0].toLowerCase()
    const headers = headerLine.split(",").map((h) => h.trim())

    // Map expected columns
    const nameIdx = headers.findIndex((h) => h === "name" || h === "pangalan")
    const sexIdx = headers.findIndex((h) => h === "sex" || h === "kasarian")
    const hatchDateIdx = headers.findIndex(
      (h) => h === "hatch_date" || h === "hatchdate" || h === "petsa_ng_pagpisa"
    )
    const statusIdx = headers.findIndex((h) => h === "status" || h === "estado")
    const coopIdx = headers.findIndex((h) => h === "coop" || h === "kulungan")
    const sireIdx = headers.findIndex(
      (h) => h === "sire" || h === "father" || h === "ama"
    )
    const damIdx = headers.findIndex(
      (h) => h === "dam" || h === "mother" || h === "ina"
    )
    const bandIdx = headers.findIndex(
      (h) => h === "band" || h === "band_number" || h === "tatak"
    )
    const breedNameIdx = headers.findIndex(
      (h) => h === "breed" || h === "breed_name" || h === "lahi"
    )
    const breedCodeIdx = headers.findIndex(
      (h) => h === "breed_code" || h === "breedcode"
    )
    const colorIdx = headers.findIndex((h) => h === "color" || h === "kulay")
    const notesIdx = headers.findIndex((h) => h === "notes" || h === "tala")

    if (sexIdx === -1) {
      throw new Error("CSV must have a 'sex' column (MALE, FEMALE, or UNKNOWN)")
    }
    if (hatchDateIdx === -1) {
      throw new Error("CSV must have a 'hatch_date' column (YYYY-MM-DD format)")
    }

    const rows: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())

      const row: ParsedRow = {
        rowNumber: i + 1,
        name: nameIdx >= 0 ? values[nameIdx] || "" : "",
        sex: sexIdx >= 0 ? values[sexIdx]?.toUpperCase() || "" : "",
        hatchDate: hatchDateIdx >= 0 ? values[hatchDateIdx] || "" : "",
        status: statusIdx >= 0 ? values[statusIdx]?.toUpperCase() || "ACTIVE" : "ACTIVE",
        coopName: coopIdx >= 0 ? values[coopIdx] || "" : "",
        sireName: sireIdx >= 0 ? values[sireIdx] || "" : "",
        damName: damIdx >= 0 ? values[damIdx] || "" : "",
        bandNumber: bandIdx >= 0 ? values[bandIdx] || "" : "",
        breedName: breedNameIdx >= 0 ? values[breedNameIdx] || "" : "",
        breedCode: breedCodeIdx >= 0 ? values[breedCodeIdx]?.toUpperCase() || "" : "",
        color: colorIdx >= 0 ? values[colorIdx] || "" : "",
        notes: notesIdx >= 0 ? values[notesIdx] || "" : "",
      }

      // Validate sex
      if (!["MALE", "FEMALE", "UNKNOWN"].includes(row.sex)) {
        row.error = `Invalid sex: "${row.sex}". Must be MALE, FEMALE, or UNKNOWN`
      }

      // Validate date
      if (row.hatchDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.hatchDate)) {
        row.error = `Invalid date format: "${row.hatchDate}". Use YYYY-MM-DD`
      }

      // Validate status
      const validStatuses = ["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED"]
      if (row.status && !validStatuses.includes(row.status)) {
        row.error = `Invalid status: "${row.status}"`
      }

      rows.push(row)
    }

    return rows
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      setParseError("Please select a CSV file")
      return
    }

    setFile(selectedFile)
    setParseError("")
    setImportResult(null)
    setParsing(true)

    try {
      const content = await selectedFile.text()
      const parsed = parseCSV(content)
      setParsedData(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse CSV")
      setParsedData([])
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    const validRows = parsedData.filter((row) => !row.error)
    if (validRows.length === 0) {
      setParseError("No valid rows to import")
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch("/api/birds/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birds: validRows }),
      })

      const result = await res.json()

      if (res.ok) {
        setImportResult(result)
        if (result.success > 0 && result.failed === 0) {
          // All successful - redirect after delay
          setTimeout(() => {
            router.push("/birds")
          }, 2000)
        }
      } else {
        setParseError(result.error || "Import failed")
      }
    } catch (err) {
      setParseError("Failed to import birds")
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `name,sex,hatch_date,status,coop,breed,breed_code,color,sire,dam,band_number,notes
Rooster 1,MALE,2024-01-15,ACTIVE,Coop A,Rhode Island Red,RIR,Red,Father Bird,Mother Bird,BAND001,Imported bird
Hen 1,FEMALE,2024-02-20,ACTIVE,Coop B,Aseel,ASEL,Black,,,BAND002,`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "birds_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFile = () => {
    setFile(null)
    setParsedData([])
    setParseError("")
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validCount = parsedData.filter((r) => !r.error).length
  const errorCount = parsedData.filter((r) => r.error).length

  return (
    <div className="p-4 lg:p-8 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/birds">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            {language === "tl" ? "Mag-import ng mga Ibon" : "Import Birds"}
          </h1>
          <p className="text-muted-foreground">
            {language === "tl"
              ? "Mag-upload ng CSV file para mag-import ng maraming ibon"
              : "Upload a CSV file to import multiple birds at once"}
          </p>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card className={`card-warm border-2 ${importResult.failed > 0 ? "border-amber-200" : "border-green-200"}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {importResult.failed === 0
                    ? language === "tl"
                      ? "Matagumpay ang Pag-import!"
                      : "Import Successful!"
                    : language === "tl"
                    ? "Tapos na ang Pag-import"
                    : "Import Complete"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {importResult.success} {language === "tl" ? "ibon ang na-import" : "birds imported successfully"}
                  {importResult.failed > 0 &&
                    `, ${importResult.failed} ${language === "tl" ? "nabigo" : "failed"}`}
                </p>
                {importResult.autoCreated && (
                  importResult.autoCreated.coops.length > 0 ||
                  importResult.autoCreated.breeds.length > 0 ||
                  importResult.autoCreated.sires?.length > 0 ||
                  importResult.autoCreated.dams?.length > 0
                ) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">
                      {language === "tl" ? "Awtomatikong Nalikha:" : "Auto-Created:"}
                    </p>
                    {importResult.autoCreated.coops.length > 0 && (
                      <p className="text-sm text-blue-600">
                        {language === "tl" ? "Mga Kulungan: " : "Coops: "}
                        {importResult.autoCreated.coops.join(", ")}
                      </p>
                    )}
                    {importResult.autoCreated.breeds.length > 0 && (
                      <p className="text-sm text-blue-600">
                        {language === "tl" ? "Mga Lahi: " : "Breeds: "}
                        {importResult.autoCreated.breeds.join(", ")}
                      </p>
                    )}
                    {importResult.autoCreated.sires && importResult.autoCreated.sires.length > 0 && (
                      <p className="text-sm text-blue-600">
                        {language === "tl" ? "Mga Ama (Sire): " : "Sires: "}
                        {importResult.autoCreated.sires.join(", ")}
                      </p>
                    )}
                    {importResult.autoCreated.dams && importResult.autoCreated.dams.length > 0 && (
                      <p className="text-sm text-blue-600">
                        {language === "tl" ? "Mga Ina (Dam): " : "Dams: "}
                        {importResult.autoCreated.dams.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-sm text-red-600">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        ...and {importResult.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                )}
                {importResult.success > 0 && importResult.failed === 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {language === "tl"
                      ? "Ire-redirect sa listahan ng ibon..."
                      : "Redirecting to birds list..."}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Download */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            {language === "tl" ? "Template ng CSV" : "CSV Template"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "tl"
              ? "I-download ang template na ito at punan ng data ng iyong mga ibon."
              : "Download this template and fill it with your bird data."}
          </p>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="rounded-xl border-2 border-orange-100"
          >
            <Download className="h-4 w-4 mr-2" />
            {language === "tl" ? "I-download ang Template" : "Download Template"}
          </Button>

          <div className="mt-4 p-4 bg-orange-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {language === "tl" ? "Mga Kinakailangang Column:" : "Required Columns:"}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-orange-100 px-1 rounded">sex</code> - MALE, FEMALE, or UNKNOWN
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">hatch_date</code> - YYYY-MM-DD format
              </li>
            </ul>
            <p className="text-sm font-medium text-gray-700 mt-3 mb-2">
              {language === "tl" ? "Mga Opsyonal na Column:" : "Optional Columns:"}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-orange-100 px-1 rounded">name</code> - Bird nickname
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">status</code> - ACTIVE, SOLD, DECEASED, CULLED, LOST, BREEDING, RETIRED
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">coop</code> - Coop name (auto-created if not exists)
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">breed</code> - Breed name (auto-created if not exists)
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">breed_code</code> - Breed code (optional, auto-generated)
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">color</code> - Bird color
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">sire</code> - Father bird name (auto-created if not exists)
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">dam</code> - Mother bird name (auto-created if not exists)
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">band_number</code> - Band/ring identifier
              </li>
              <li>
                <code className="bg-orange-100 px-1 rounded">notes</code> - Additional notes
              </li>
            </ul>
            <p className="text-xs text-green-600 mt-3">
              {language === "tl"
                ? "* Awtomatikong nalilikha ang mga coop, breed, sire, at dam na hindi pa umiiral"
                : "* Coops, breeds, sires, and dams that don't exist will be automatically created"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            {language === "tl" ? "Mag-upload ng CSV" : "Upload CSV"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-orange-200 rounded-2xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-orange-400" />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">
                    {language === "tl" ? "Mag-click para mag-upload" : "Click to upload"}
                  </span>{" "}
                  {language === "tl" ? "o i-drag at i-drop" : "or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">CSV files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {parseError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {parseError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card className="card-warm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Bird className="h-5 w-5 text-orange-500" />
                {language === "tl" ? "Preview ng Data" : "Data Preview"}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {validCount} {language === "tl" ? "valid" : "valid"}
                </span>
                {errorCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {errorCount} {language === "tl" ? "may error" : "errors"}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-100">
                    <th className="text-left p-3 font-medium text-gray-600">Row</th>
                    <th className="text-left p-3 font-medium text-gray-600">Name</th>
                    <th className="text-left p-3 font-medium text-gray-600">Sex</th>
                    <th className="text-left p-3 font-medium text-gray-600">Hatch Date</th>
                    <th className="text-left p-3 font-medium text-gray-600">Coop</th>
                    <th className="text-left p-3 font-medium text-gray-600">Breed</th>
                    <th className="text-left p-3 font-medium text-gray-600">Color</th>
                    <th className="text-left p-3 font-medium text-gray-600">Band</th>
                    <th className="text-left p-3 font-medium text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 20).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-orange-50 ${
                        row.error ? "bg-red-50" : "hover:bg-orange-50"
                      }`}
                    >
                      <td className="p-3 text-gray-600">{row.rowNumber}</td>
                      <td className="p-3">{row.name || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.sex === "MALE"
                              ? "bg-blue-100 text-blue-700"
                              : row.sex === "FEMALE"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {row.sex}
                        </span>
                      </td>
                      <td className="p-3">{row.hatchDate}</td>
                      <td className="p-3">{row.coopName || "-"}</td>
                      <td className="p-3">{row.breedName || "-"}</td>
                      <td className="p-3">{row.color || "-"}</td>
                      <td className="p-3">{row.bandNumber || "-"}</td>
                      <td className="p-3">
                        {row.error ? (
                          <span className="text-red-600 text-xs">{row.error}</span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 20 && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {language === "tl"
                    ? `Ipinapakita ang unang 20 row mula sa ${parsedData.length} total`
                    : `Showing first 20 rows of ${parsedData.length} total`}
                </p>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={clearFile}
                className="flex-1 h-12 rounded-xl border-2 border-orange-100"
              >
                {t("action.cancel")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                {importing
                  ? language === "tl"
                    ? "Nag-i-import..."
                    : "Importing..."
                  : language === "tl"
                  ? `Mag-import ng ${validCount} Ibon`
                  : `Import ${validCount} Birds`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
