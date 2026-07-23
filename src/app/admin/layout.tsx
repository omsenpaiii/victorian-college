import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  if (!isSupabaseAuthConfigured()) {
    redirect("/");
  }

  const [user, admin] = await Promise.all([getCurrentUser(), getCurrentAdmin()]);

  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }

  if (!admin) {
    redirect("/");
  }

  return children;
}
