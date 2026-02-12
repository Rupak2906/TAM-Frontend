import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeUsername, parseCsvCookie } from "@/lib/auth/cookie-utils";

const publicPaths = ["/welcome", "/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthed = request.cookies.get("tam_auth")?.value === "1";
  const user = normalizeUsername(request.cookies.get("tam_user")?.value ?? "");
  const onboardedUsers = parseCsvCookie(request.cookies.get("tam_onboarded_users")?.value);
  const isFirstLogin = user ? !onboardedUsers.has(user) : false;

  if (!isAuthed && !isPublic) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (!isAuthed && pathname === "/") {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (isAuthed && (pathname === "/welcome" || pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    return NextResponse.redirect(new URL(isFirstLogin ? "/onboarding" : "/dashboard", request.url));
  }

  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  if (isAuthed && isFirstLogin && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
