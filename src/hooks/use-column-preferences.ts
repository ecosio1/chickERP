"use client"

import { useState, useEffect, useCallback } from "react"
import { DEFAULT_VISIBLE_COLUMNS } from "@/lib/bird-columns"

const STORAGE_KEY = "chickErp-bird-inventory-columns"

export function useColumnPreferences() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Always include select column
          const columns = parsed.includes("select") ? parsed : ["select", ...parsed]
          setVisibleColumns(columns)
        }
      }
    } catch (e) {
      console.error("Failed to load column preferences:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save preferences to localStorage
  const savePreferences = useCallback((columns: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
    } catch (e) {
      console.error("Failed to save column preferences:", e)
    }
  }, [])

  // Toggle a single column
  const toggleColumn = useCallback((columnId: string) => {
    // Don't allow toggling the select column
    if (columnId === "select") return

    setVisibleColumns((prev) => {
      const newColumns = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
      savePreferences(newColumns)
      return newColumns
    })
  }, [savePreferences])

  // Set multiple columns at once
  const setColumns = useCallback((columns: string[]) => {
    // Always include select column
    const newColumns = columns.includes("select") ? columns : ["select", ...columns]
    setVisibleColumns(newColumns)
    savePreferences(newColumns)
  }, [savePreferences])

  // Check if a column is visible
  const isColumnVisible = useCallback((columnId: string) => {
    return visibleColumns.includes(columnId)
  }, [visibleColumns])

  // Reset to default columns
  const resetToDefault = useCallback(() => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
    savePreferences(DEFAULT_VISIBLE_COLUMNS)
  }, [savePreferences])

  return {
    visibleColumns,
    isLoaded,
    toggleColumn,
    setColumns,
    isColumnVisible,
    resetToDefault,
  }
}
