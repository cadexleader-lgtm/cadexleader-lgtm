"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

// Photos are resized in the browser before upload (longest side 2000 px,
// WebP or JPEG), so large camera or stock photos stay well under the upload
// limit and load fast on the site.
const MAX_SIDE = 2000;
const QUALITY = 0.85;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    let blob = await toBlob(canvas, "image/webp");
    // Some browsers (Safari) cannot encode WebP and silently return PNG.
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);

export function ImageInput({
  name,
  id,
  multiple = false,
  submitLabel,
  compact = false,
}: {
  name: string;
  id?: string;
  multiple?: boolean;
  /** When set, renders a submit button that stays disabled until a photo is ready. */
  submitLabel?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setInfo(null);
      return;
    }
    setBusy(true);
    const ready = await Promise.all(files.map(shrink));
    try {
      const dt = new DataTransfer();
      ready.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    } catch {
      // DataTransfer unavailable: the original files are sent as they are.
    }
    setBusy(false);
    setInfo(ready.length === 1 ? `Prête · ${kb(ready[0].size)}` : `${ready.length} photos prêtes`);
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-1.5"}>
      <input
        id={id}
        name={name}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        required={Boolean(submitLabel)}
        onChange={onChange}
        className={`block w-full text-sm text-stone file:mr-3 file:cursor-pointer file:rounded-[3px] file:border-0 file:bg-forest file:px-3 file:py-2 file:text-xs file:font-medium file:text-cream ${compact ? "text-xs" : ""}`}
      />
      {busy ? (
        <p className="flex items-center gap-1.5 text-xs text-stone"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Préparation de la photo…</p>
      ) : info ? (
        <p className="text-xs text-success">{info}</p>
      ) : (
        !compact && <p className="text-xs text-stone">JPEG, PNG, WebP ou AVIF. Les grandes photos sont réduites automatiquement.</p>
      )}
      {submitLabel && (
        <button
          type="submit"
          disabled={busy || !info}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[3px] bg-wood px-3 text-xs font-semibold text-ink transition-colors hover:bg-ember disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5" /> {submitLabel}
        </button>
      )}
    </div>
  );
}
