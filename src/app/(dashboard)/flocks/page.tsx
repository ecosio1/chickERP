"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Eye } from "lucide-react"
import { formatDate, formatNumber, calculateAge } from "@/lib/utils"

interface Flock {
  id: string
  batchNumber: string
  breed: string | null
  birdType: string
  currentCount: number
  initialCount: number
  stage: string
  status: string
  arrivalDate: string
  coop: { name: string } | null
}

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlocks() {
      try {
        const res = await fetch("/api/flocks")
        if (res.ok) {
          const data = await res.json()
          setFlocks(data)
        }
      } catch (error) {
        console.error("Failed to fetch flocks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFlocks()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>
      case "SOLD":
        return <Badge variant="secondary">Sold</Badge>
      case "CULLED":
        return <Badge variant="destructive">Culled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Flocks</h1>
          <p className="text-muted-foreground">Manage your bird flocks</p>
        </div>
        <Link href="/flocks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Flock
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Flocks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : flocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No flocks found</p>
              <Link href="/flocks/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Flock
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead className="hidden sm:table-cell">Breed</TableHead>
                    <TableHead>Birds</TableHead>
                    <TableHead className="hidden md:table-cell">Age</TableHead>
                    <TableHead className="hidden lg:table-cell">Coop</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flocks.map((flock) => {
                    const age = calculateAge(flock.arrivalDate)
                    return (
                      <TableRow key={flock.id}>
                        <TableCell className="font-medium">{flock.batchNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {flock.breed || "-"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{formatNumber(flock.currentCount)}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              / {formatNumber(flock.initialCount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {age.weeks}w {age.days % 7}d
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {flock.coop?.name || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(flock.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/flocks/${flock.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
