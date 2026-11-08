// Lists the product photos of public/images/products into a JSON manifest, so
// the app never needs filesystem access at runtime (Vercel, Cloudflare…).
// Runs automatically before `npm run dev` and `npm run build`.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "images", "products");
const out = path.join(process.cwd(), "lib", "product-photos.manifest.json");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f)).sort() : [];
const manifest = {};
for (const f of files) {
  const key = f.replace(/\.[^.]+$/, "");
  if (!manifest[key]) manifest[key] = `/images/products/${f}`;
}
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[woodora] ${files.length} product photo(s) in the manifest.`);
