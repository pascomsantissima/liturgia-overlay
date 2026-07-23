import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/rbac";
import { LogoutButton } from "@/components/logout-button";
import { NavLink } from "@/components/nav-link";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  const { profile } = session;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="brand-gradient h-1" />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card/60 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/events" className="flex items-center gap-2.5">
            <Image
              src="/logo.jpg"
              alt="Pascom"
              width={36}
              height={36}
              className="size-9 rounded-lg ring-1 ring-black/5"
            />
            <div className="leading-tight">
              <p className="font-heading text-sm font-semibold tracking-tight">
                Santíssima Virgem
              </p>
              <p className="text-xs text-muted-foreground">Pascom</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/events">Eventos</NavLink>
            {profile.role === "admin" && <NavLink href="/templates">Templates</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{profile.display_name}</p>
          </div>
          <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
            {profile.role === "admin" ? "Admin" : "Operador"}
          </Badge>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col bg-muted/30 p-4 sm:p-6">{children}</main>
    </div>
  );
}
