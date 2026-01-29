import { NextResponse } from "next/server"
import { requireAuth, handleApiError, successResponse } from "@/lib/api-utils"
import {
  REPORT_TYPES,
  getReportColumns,
  getFilterableColumns,
  DEFAULT_COLUMNS,
  type ReportType
} from "@/lib/report-columns"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const reportType = (searchParams.get("type") || "birds") as ReportType

    const config = REPORT_TYPES.find((rt) => rt.id === reportType)
    if (!config) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    const columns = getReportColumns(reportType)
    const filterableColumns = getFilterableColumns(reportType)
    const defaultColumns = DEFAULT_COLUMNS[reportType] || []

    return successResponse({
      reportType,
      columns,
      filterableColumns,
      defaultColumns,
      availableReportTypes: REPORT_TYPES.map((rt) => ({
        id: rt.id,
        label: rt.label,
        labelTl: rt.labelTl,
      })),
    })
  } catch (error) {
    return handleApiError(error, "GET /api/reports/columns")
  }
}
