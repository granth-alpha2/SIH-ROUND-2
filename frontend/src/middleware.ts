import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifyJWT } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static files, Next.js internal assets, auth APIs, public assets, and public reference data
  if (
    pathname === "/" ||
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

  // 2. Allow visiting /login so users can switch accounts or re-authenticate
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // 3. Grant complete application access across all pages and APIs for evaluation & hackathon
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
