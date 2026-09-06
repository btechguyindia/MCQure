import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Route protection. Page routes are gated here; every API route additionally
// verifies the session itself (never rely on proxy alone).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtected =
    pathname.startsWith("/practice") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/study") ||
    pathname.startsWith("/pyq") ||
    pathname.startsWith("/preparation") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/mock") ||
    pathname.startsWith("/motivation") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/bookmarks") ||
    pathname.startsWith("/admin");

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/practice/:path*", "/analytics", "/study/:path*", "/pyq", "/preparation/:path*", "/questions", "/bookmarks", "/mock", "/motivation", "/reports", "/admin/:path*", "/login", "/register"],
};
