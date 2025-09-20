import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate type and size (max ~10MB)
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Ensure bucket exists and is public
    const bucketName = "post-images"
    const { data: existing } = await supabase.storage.getBucket(bucketName)
    if (!existing) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: `${MAX_SIZE}`,
      })
    }

    // Generate path
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const id = (globalThis.crypto as any)?.randomUUID?.() || `${Date.now()}`
    const cleanName = sanitizeFileName(file.name || "image")
    const path = `posts/${yyyy}/${mm}/${id}-${cleanName}`

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path,
    })
  } catch (err: any) {
    console.error("Upload route error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
