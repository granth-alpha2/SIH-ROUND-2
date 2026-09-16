import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifyJWT } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static files, Next.js internal assets, auth APIs, public assets, and public reference data
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/assistant") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/markets") ||
    pathname === "/markets" ||
    pathname === "/crops" ||
    pathname.startsWith("/api/crops") ||
    pathname === "/schemes" ||
    pathname === "/knowledge" ||
    pathname === "/soil" ||
    pathname.startsWith("/soil") ||
    pathname === "/favicon.ico" ||

    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }


  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyJWT(token) : null;
  const isAuthenticated = !!user;

  // 2. If authenticated user visits /login, redirect to dashboard /
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 3. For protected API routes, return 401 JSON if unauthenticated
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      // Check for Bearer token in header as well
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const headerUser = await verifyJWT(authHeader.slice(7).trim());
        if (headerUser) {
          return NextResponse.next();
        }
      }
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required." } },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. For protected dashboard pages, redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
