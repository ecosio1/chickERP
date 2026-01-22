"use client"

import { useState, useRef } from "react"
import { Camera, X, Star, Trash2, Upload, Bird, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Photo {
  id: string
  url: string
  isPrimary: boolean
  caption?: string | null
}

interface PhotoGalleryProps {
  birdId: string
  photos: Photo[]
  sexColor: string
  onPhotosChange: (photos: Photo[]) => void
}

export function PhotoGallery({ birdId, photos, sexColor, onPhotosChange }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("isPrimary", photos.length === 0 ? "true" : "false")

      const res = await fetch(`/api/birds/${birdId}/photos`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const newPhoto = await res.json()
        onPhotosChange([...photos, newPhoto])
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ""
      }
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    try {
      const res = await fetch(`/api/birds/${birdId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, isPrimary: true }),
      })

      if (res.ok) {
        onPhotosChange(
          photos.map((p) => ({
            ...p,
            isPrimary: p.id === photoId,
          }))
        )
      }
    } catch (error) {
      console.error("Failed to set primary:", error)
    }
  }

  const handleDelete = async (photoId: string) => {
    try {
      const res = await fetch(`/api/birds/${birdId}/photos?photoId=${photoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        const remaining = photos.filter((p) => p.id !== photoId)
        onPhotosChange(remaining)
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null)
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  return (
    <>
      {/* Avatar with photo or icon */}
      <div className="relative group">
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden cursor-pointer",
            sexColor
          )}
          onClick={() => setIsOpen(true)}
        >
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt="Bird"
              className="w-full h-full object-cover"
            />
          ) : (
            <Bird className="h-10 w-10" />
          )}
        </div>

        {/* Camera button overlay with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4 mr-2" />
              Choose from Gallery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photo Gallery Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected/Primary photo large view */}
            {(selectedPhoto || primaryPhoto) && (
              <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={(selectedPhoto || primaryPhoto)?.url}
                  alt="Bird"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {!(selectedPhoto || primaryPhoto)?.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary((selectedPhoto || primaryPhoto)!.id)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set as Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete((selectedPhoto || primaryPhoto)!.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {(selectedPhoto || primaryPhoto)?.isPrimary && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail grid */}
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                    (selectedPhoto?.id || primaryPhoto?.id) === photo.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-orange-300"
                  )}
                >
                  <img
                    src={photo.url}
                    alt="Bird"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              {/* Upload button with dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-orange-200 hover:border-orange-400 flex items-center justify-center text-orange-400 hover:text-orange-500 transition-colors"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Choose from Gallery
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {photos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No photos yet</p>
                <p className="text-sm">Click the upload button to add photos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
