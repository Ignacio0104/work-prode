import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check for the firebase token/session cookie
  const session = request.cookies.get("__session");
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  // If there's no session and the user is trying to access dashboard
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access login page, send to dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Protect all routes except static files, api, and images
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
