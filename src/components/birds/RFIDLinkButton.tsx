"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Smartphone, Link2, Unlink, Copy, Check, ExternalLink } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface RFIDLinkButtonProps {
  birdId: string
  currentRfid: string | null
  onRfidChange: (newRfid: string | null) => void
}

export function RFIDLinkButton({ birdId, currentRfid, onRfidChange }: RFIDLinkButtonProps) {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [tagId, setTagId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleLink = async () => {
    if (!tagId.trim()) {
      setError(language === "tl" ? "Kailangan ang Tag ID" : "Tag ID is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/birds/${birdId}/identifiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idType: "RFID",
          idValue: tagId.trim().toUpperCase(),
        }),
      })

      if (res.ok) {
        onRfidChange(tagId.trim().toUpperCase())
        setOpen(false)
        setTagId("")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to link tag")
      }
    } catch (err) {
      setError("Failed to link tag")
    } finally {
      setSaving(false)
    }
  }

  const handleUnlink = async () => {
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/birds/${birdId}/identifiers?idType=RFID`, {
        method: "DELETE",
      })

      if (res.ok) {
        onRfidChange(null)
        setOpen(false)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to unlink tag")
      }
    } catch (err) {
      setError("Failed to unlink tag")
    } finally {
      setSaving(false)
    }
  }

  const getScanUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/scan/${currentRfid}`
  }

  const copyUrl = async () => {
    const url = getScanUrl()
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (currentRfid) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            {language === "tl" ? "NFC Na-link" : "NFC Linked"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-500" />
              {language === "tl" ? "NFC Tag Na-link" : "NFC Tag Linked"}
            </DialogTitle>
            <DialogDescription>
              {language === "tl"
                ? "Ang manok na ito ay naka-link sa isang NFC tag."
                : "This bird is linked to an NFC tag."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <Label className="text-sm text-muted-foreground">Tag ID</Label>
              <p className="text-lg font-mono font-semibold text-green-700">{currentRfid}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {language === "tl" ? "URL para sa Tag" : "URL for Tag"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={getScanUrl()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "tl"
                  ? "I-program ang URL na ito sa iyong NFC tag"
                  : "Program this URL into your NFC tag"}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={saving}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Unlink className="h-4 w-4 mr-2" />
              {language === "tl" ? "I-unlink" : "Unlink Tag"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === "tl" ? "Isara" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-2 border-orange-200 hover:bg-orange-50"
        >
          <Link2 className="h-4 w-4 mr-2" />
          {language === "tl" ? "I-link ang NFC Tag" : "Link NFC Tag"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-orange-500" />
            {language === "tl" ? "I-link ang NFC Tag" : "Link NFC Tag"}
          </DialogTitle>
          <DialogDescription>
            {language === "tl"
              ? "I-enter ang Tag ID mula sa iyong pre-printed NFC tag."
              : "Enter the Tag ID from your pre-printed NFC tag."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tagId">Tag ID</Label>
            <Input
              id="tagId"
              value={tagId}
              onChange={(e) => setTagId(e.target.value.toUpperCase())}
              placeholder="e.g., 0019C2E4"
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              {language === "tl"
                ? "Karaniwan itong naka-print sa NFC tag o sa packaging nito"
                : "This is usually printed on the NFC tag or its packaging"}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {language === "tl" ? "Kanselahin" : "Cancel"}
          </Button>
          <Button
            onClick={handleLink}
            disabled={saving || !tagId.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              language === "tl" ? "Nag-li-link..." : "Linking..."
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                {language === "tl" ? "I-link ang Tag" : "Link Tag"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
