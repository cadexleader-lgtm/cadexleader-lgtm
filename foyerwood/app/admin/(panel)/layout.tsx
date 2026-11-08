import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin-auth";
import { query } from "@/lib/db/client";
import { isDemoDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [b] = await query<{ orders: number; reviews: number; messages: number }>(
    `select (select count(*)::int from orders where status = 'new') as orders,
            (select count(*)::int from reviews where status = 'pending') as reviews,
            (select count(*)::int from contact_messages where status = 'new') as messages`,
  );
  return (
    <div className="flex min-h-dvh flex-col bg-cream lg:flex-row">
      <AdminNav user={{ name: user.name, email: user.email }} badges={b} demo={isDemoDatabase()} />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</div>
    </div>
  );
}
