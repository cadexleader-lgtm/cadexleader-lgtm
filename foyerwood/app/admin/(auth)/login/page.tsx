import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/art/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/admin-auth";
import { isDemoDatabase } from "@/lib/db/client";
import { adminFromEnv } from "@/lib/db/seed";
import { countActiveAdmins } from "@/lib/data/misc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion — Administration", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  // Setup problems are shown here so they can be fixed without reading server logs.
  const production = process.env.NODE_ENV === "production";
  const demoDb = isDemoDatabase();
  const env = adminFromEnv();
  const issues: string[] = [];
  if (production && demoDb) {
    issues.push("La base de données n'est pas connectée : sur Vercel, ouvrez Storage, connectez la base Neon au projet, puis redéployez. Sans elle, les commandes et les comptes sont effacés à chaque redémarrage.");
  }
  if (!env) {
    if (production) issues.push("ADMIN_EMAIL et ADMIN_PASSWORD ne sont pas définis : ajoutez-les dans Vercel (Settings → Environment Variables, environnement Production), puis redéployez.");
  } else if (env.password.length < 10 && !demoDb) {
    issues.push("ADMIN_PASSWORD doit contenir au moins 10 caractères : corrigez-le dans Vercel, puis redéployez.");
  }
  if (!issues.length && (await countActiveAdmins()) === 0) {
    issues.push("Aucun compte administrateur n'existe encore : vérifiez ADMIN_EMAIL et ADMIN_PASSWORD dans Vercel, puis redéployez.");
  }
  return (
    <main className="flex min-h-dvh items-center justify-center bg-forest px-4">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-2xl sm:p-10">
        <Logo />
        <h1 className="mt-8 text-3xl text-forest">Administration</h1>
        <p className="mb-8 mt-1 text-sm text-stone">Accès réservé à l'équipe Foyerwood.</p>
        {issues.length > 0 && (
          <div className="mb-6 space-y-2 rounded-xl bg-wood-100 p-4 text-sm leading-relaxed text-wood-600">
            <p className="font-semibold">Configuration à terminer</p>
            {issues.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
        )}
        <LoginForm />
        <p className="mt-6 text-xs leading-relaxed text-stone">
          Utilisez exactement l&apos;e-mail et le mot de passe saisis dans Vercel (ADMIN_EMAIL et ADMIN_PASSWORD). Après les avoir modifiés, redéployez : le compte est mis à jour automatiquement.
        </p>
        {isDemoDatabase() && process.env.NODE_ENV !== "production" && (
          <p className="mt-6 rounded-xl bg-wood-100 p-3 text-xs text-wood-600">
            Base locale de démonstration : admin@foyerwood.local / foyerwood-demo (si ADMIN_EMAIL et ADMIN_PASSWORD ne sont pas définis).
          </p>
        )}
      </div>
    </main>
  );
}
