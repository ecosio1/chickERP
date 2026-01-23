"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Bird, Loader2, AlertCircle, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface LookupResult {
  id: string
  name: string | null
  sex: string
  status: string
  displayId: string
}

export default function ScanPage() {
  const params = useParams()
  const router = useRouter()
  const tagId = params.tagId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bird, setBird] = useState<LookupResult | null>(null)

  useEffect(() => {
    async function lookupBird() {
      try {
        const res = await fetch(`/api/birds/lookup?rfid=${encodeURIComponent(tagId)}`)
        const data = await res.json()

        if (res.ok && data.data?.id) {
          // Found the bird - redirect to detail page
          router.replace(`/birds/${data.data.id}`)
        } else {
          // Bird not found
          setError(data.error || "Bird not found for this tag")
          setLoading(false)
        }
      } catch (err) {
        setError("Failed to look up bird")
        setLoading(false)
      }
    }

    if (tagId) {
      lookupBird()
    }
  }, [tagId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Looking up bird...
            </h1>
            <p className="text-muted-foreground">
              Tag ID: {tagId}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Tag Not Linked
            </h1>
            <p className="text-muted-foreground mb-6">
              This NFC tag (ID: {tagId}) is not linked to any bird yet.
            </p>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Log in to Link Tag
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left">
              <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                How to link this tag
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Log in to ChickERP</li>
                <li>2. Go to the bird you want to tag</li>
                <li>3. Click "Link NFC Tag"</li>
                <li>4. Enter tag ID: <code className="bg-gray-200 px-1 rounded">{tagId}</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
