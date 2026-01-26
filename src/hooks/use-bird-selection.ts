"use client"

import { useState, useCallback, useMemo } from "react"

export interface UseBirdSelectionOptions {
  birdIds: string[]
}

export function useBirdSelection({ birdIds }: UseBirdSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Check if a bird is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  // Toggle selection of a single bird
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // Exit selection mode if no birds selected
      if (next.size === 0) {
        setIsSelectionMode(false)
      } else {
        setIsSelectionMode(true)
      }
      return next
    })
  }, [])

  // Select a single bird (used for first selection)
  const selectBird = useCallback((id: string) => {
    setSelectedIds(new Set([id]))
    setIsSelectionMode(true)
  }, [])

  // Select multiple birds
  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
    setIsSelectionMode(ids.length > 0)
  }, [])

  // Select all birds
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(birdIds))
    setIsSelectionMode(birdIds.length > 0)
  }, [birdIds])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [])

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === birdIds.length) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [selectedIds.size, birdIds.length, clearSelection, selectAll])

  // Get selected IDs as array
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  // Check selection state
  const selectionState = useMemo((): "none" | "partial" | "all" => {
    if (selectedIds.size === 0) return "none"
    if (selectedIds.size === birdIds.length && birdIds.length > 0) return "all"
    return "partial"
  }, [selectedIds.size, birdIds.length])

  // Enter selection mode (for mobile long-press)
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true)
  }, [])

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [])

  return {
    selectedIds: selectedArray,
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelection,
    selectBird,
    selectMultiple,
    selectAll,
    clearSelection,
    toggleSelectAll,
    selectionState,
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
  }
}
