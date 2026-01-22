import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

// GET /api/birds/[id]/photos - Get all photos for a bird
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const photos = await prisma.birdPhoto.findMany({
      where: { birdId: id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    })

    return successResponse(photos)
  } catch (error) {
    console.error("Error fetching bird photos:", error)
    return errorResponse("Failed to fetch photos", 500)
  }
}

// POST /api/birds/[id]/photos - Upload a new photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    // Check bird exists
    const bird = await prisma.bird.findUnique({ where: { id } })
    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const caption = formData.get("caption") as string | null
    const setAsPrimary = formData.get("isPrimary") === "true"

    if (!file) {
      return errorResponse("No file provided", 400)
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", 400)
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return errorResponse("File too large. Maximum size is 5MB", 400)
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${id}-${Date.now()}.${ext}`

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "birds")
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // If setting as primary, unset existing primary
    if (setAsPrimary) {
      await prisma.birdPhoto.updateMany({
        where: { birdId: id, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    // Check if this is the first photo (auto-set as primary)
    const existingPhotos = await prisma.birdPhoto.count({ where: { birdId: id } })
    const isPrimary = setAsPrimary || existingPhotos === 0

    // Create database record
    const photo = await prisma.birdPhoto.create({
      data: {
        birdId: id,
        filename,
        url: `/uploads/birds/${filename}`,
        isPrimary,
        caption,
      },
    })

    return successResponse(photo, 201)
  } catch (error) {
    console.error("Error uploading photo:", error)
    return errorResponse("Failed to upload photo", 500)
  }
}

// DELETE /api/birds/[id]/photos - Delete a photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get("photoId")

    if (!photoId) {
      return errorResponse("Photo ID required", 400)
    }

    const photo = await prisma.birdPhoto.findFirst({
      where: { id: photoId, birdId: id },
    })

    if (!photo) {
      return errorResponse("Photo not found", 404)
    }

    // Delete file from disk
    const filePath = join(process.cwd(), "public", photo.url)
    try {
      await unlink(filePath)
    } catch {
      // File may not exist, continue with DB deletion
    }

    // Delete from database
    await prisma.birdPhoto.delete({ where: { id: photoId } })

    // If deleted photo was primary, set another as primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.birdPhoto.findFirst({
        where: { birdId: id },
        orderBy: { createdAt: "desc" },
      })
      if (nextPhoto) {
        await prisma.birdPhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        })
      }
    }

    return successResponse({ message: "Photo deleted" })
  } catch (error) {
    console.error("Error deleting photo:", error)
    return errorResponse("Failed to delete photo", 500)
  }
}

// PATCH /api/birds/[id]/photos - Update photo (set as primary)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const body = await req.json()
    const { photoId, isPrimary, caption } = body

    if (!photoId) {
      return errorResponse("Photo ID required", 400)
    }

    const photo = await prisma.birdPhoto.findFirst({
      where: { id: photoId, birdId: id },
    })

    if (!photo) {
      return errorResponse("Photo not found", 404)
    }

    // If setting as primary, unset existing
    if (isPrimary) {
      await prisma.birdPhoto.updateMany({
        where: { birdId: id, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const updated = await prisma.birdPhoto.update({
      where: { id: photoId },
      data: {
        ...(isPrimary !== undefined && { isPrimary }),
        ...(caption !== undefined && { caption }),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("Error updating photo:", error)
    return errorResponse("Failed to update photo", 500)
  }
}
