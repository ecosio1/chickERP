import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()

    const { data: photos, error } = await supabase
      .from('bird_photos')
      .select('*')
      .eq('bird_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching bird photos:", error)
      return errorResponse("Failed to fetch photos", 500)
    }

    return successResponse(photos || [])
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
    const supabase = await createClient()

    // Check bird exists
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', id)
      .single()

    if (birdError || !bird) {
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
      await supabase
        .from('bird_photos')
        .update({ is_primary: false })
        .eq('bird_id', id)
        .eq('is_primary', true)
    }

    // Check if this is the first photo (auto-set as primary)
    const { count } = await supabase
      .from('bird_photos')
      .select('*', { count: 'exact', head: true })
      .eq('bird_id', id)

    const isPrimary = setAsPrimary || count === 0

    // Create database record
    const { data: photo, error: createError } = await supabase
      .from('bird_photos')
      .insert({
        bird_id: id,
        filename,
        url: `/uploads/birds/${filename}`,
        is_primary: isPrimary,
        caption,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating photo record:", createError)
      return errorResponse("Failed to upload photo", 500)
    }

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
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get("photoId")

    if (!photoId) {
      return errorResponse("Photo ID required", 400)
    }

    const { data: photo, error: fetchError } = await supabase
      .from('bird_photos')
      .select('*')
      .eq('id', photoId)
      .eq('bird_id', id)
      .single()

    if (fetchError || !photo) {
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
    const { error: deleteError } = await supabase
      .from('bird_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error("Error deleting photo:", deleteError)
      return errorResponse("Failed to delete photo", 500)
    }

    // If deleted photo was primary, set another as primary
    if (photo.is_primary) {
      const { data: nextPhoto } = await supabase
        .from('bird_photos')
        .select('id')
        .eq('bird_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (nextPhoto) {
        await supabase
          .from('bird_photos')
          .update({ is_primary: true })
          .eq('id', nextPhoto.id)
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
    const supabase = await createClient()

    const body = await req.json()
    const { photoId, isPrimary, caption } = body

    if (!photoId) {
      return errorResponse("Photo ID required", 400)
    }

    const { data: photo, error: fetchError } = await supabase
      .from('bird_photos')
      .select('*')
      .eq('id', photoId)
      .eq('bird_id', id)
      .single()

    if (fetchError || !photo) {
      return errorResponse("Photo not found", 404)
    }

    // If setting as primary, unset existing
    if (isPrimary) {
      await supabase
        .from('bird_photos')
        .update({ is_primary: false })
        .eq('bird_id', id)
        .eq('is_primary', true)
    }

    const updateData: Record<string, unknown> = {}
    if (isPrimary !== undefined) updateData.is_primary = isPrimary
    if (caption !== undefined) updateData.caption = caption

    const { data: updated, error: updateError } = await supabase
      .from('bird_photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating photo:", updateError)
      return errorResponse("Failed to update photo", 500)
    }

    return successResponse(updated)
  } catch (error) {
    console.error("Error updating photo:", error)
    return errorResponse("Failed to update photo", 500)
  }
}
