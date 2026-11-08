import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/art/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/admin-auth";
import { isDemoDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion — Administration", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-forest px-4">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-2xl sm:p-10">
        <Logo />
        <h1 className="mt-8 text-3xl text-forest">Administration</h1>
        <p className="mb-8 mt-1 text-sm text-stone">Accès réservé à l'équipe Foyerwood.</p>
        <LoginForm />
        {isDemoDatabase() && process.env.NODE_ENV !== "production" && (
          <p className="mt-6 rounded-xl bg-wood-100 p-3 text-xs text-wood-600">
            Base locale de démonstration : admin@foyerwood.local / foyerwood-demo (si ADMIN_EMAIL et ADMIN_PASSWORD ne sont pas définis).
          </p>
        )}
      </div>
    </main>
  );
}
