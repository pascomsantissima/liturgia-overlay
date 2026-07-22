import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

const ADMIN_ONLY_PREFIXES = ["/templates"];
const PROTECTED_PREFIXES = ["/", "/templates", "/events"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Overlay público (OBS Browser Source) não precisa de sessão.
  if (pathname.startsWith("/overlay")) {
    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);

  if (!user) {
    if (pathname === "/login") return response;
    if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/events";
    return NextResponse.redirect(url);
  }

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/events";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
