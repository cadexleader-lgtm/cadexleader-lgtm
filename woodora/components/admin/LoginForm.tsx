"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state.error && (
        <p className="flex items-center gap-2 rounded-xl bg-[#f6e3df] p-3 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pine font-medium text-cream hover:bg-forest disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Se connecter
      </button>
    </form>
  );
}
