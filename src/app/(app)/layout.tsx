import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/rbac";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  const { profile } = session;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/events" className="font-semibold">
            Liturgia Overlay
          </Link>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">
            Eventos
          </Link>
          {profile.role === "admin" && (
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
              Templates
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile.display_name}</span>
          <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
            {profile.role === "admin" ? "Admin" : "Operador"}
          </Badge>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
