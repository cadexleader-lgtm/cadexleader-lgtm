// Product and article photos. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
// otherwise Supabase Storage when configured
// (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, public bucket
// SUPABASE_STORAGE_BUCKET, default "media"); otherwise writes to public/uploads
// (local development only — serverless hosts have a read-only filesystem).

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new UploadError("Format non pris en charge (JPEG, PNG, WebP ou AVIF uniquement).");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image trop lourde (4 Mo maximum après réduction).");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(bytes, file.type)) throw new UploadError("Le fichier n'est pas une image valide.");
  const name = `${folder.replace(/[^a-z0-9-]/gi, "")}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  // Vercel Blob (Vercel → Storage → Blob): BLOB_READ_WRITE_TOKEN is injected automatically.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    try {
      const blob = await put(name, bytes, { access: "public", contentType: file.type });
      return blob.url;
    } catch {
      throw new UploadError("Échec de l'envoi vers Vercel Blob.");
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  if (url && key) {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": file.type, "x-upsert": "false" },
      body: bytes,
    });
    if (!res.ok) throw new UploadError(`Échec de l'envoi vers Supabase Storage (${res.status}).`);
    return `${url}/storage/v1/object/public/${bucket}/${name}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(name));
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(process.cwd(), "public", "uploads", name), bytes);
  } catch {
    throw new UploadError("Stockage des photos non connecté : sur Vercel, ouvrez Storage → Blob et connectez-le au projet, puis redéployez.");
  }
  return `/uploads/${name}`;
}

function looksLikeImage(b: Buffer, type: string): boolean {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8;
  if (type === "image/png") return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP";
  if (type === "image/avif") return b.subarray(4, 12).toString().startsWith("ftypavi");
  return false;
}
