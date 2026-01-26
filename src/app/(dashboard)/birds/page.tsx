"use client"

import { Suspense } from "react"
import { BirdInventoryTable } from "@/components/birds/inventory"

function LoadingFallback() {
  return (
    <div className="p-4 lg:p-8">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-orange-50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-orange-50 rounded animate-pulse mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-orange-50 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-orange-50 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-orange-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Search skeleton */}
        <div className="flex gap-2">
          <div className="flex-1 h-12 lg:h-14 bg-orange-50 rounded-2xl animate-pulse" />
          <div className="h-12 lg:h-14 w-14 bg-orange-50 rounded-2xl animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-orange-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BirdsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BirdInventoryTable />
    </Suspense>
  )
}
