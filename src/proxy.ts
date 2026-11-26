import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_REDIRECTS: Array<{ prefix: string; loginPath: string }> = [
  { prefix: "/student", loginPath: "/login/student" },
  { prefix: "/teacher", loginPath: "/login/teacher" },
  { prefix: "/administration", loginPath: "/login/administration" },
  { prefix: "/organization", loginPath: "/login/organization" },
  { prefix: "/admin", loginPath: "/login/admin" },
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid Origin header." }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const matchedPortal = PORTAL_REDIRECTS.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`)
  );
  if (!matchedPortal) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("campusmate_session")?.value;
  if (!sessionCookie) {
    const loginUrl = new URL(matchedPortal.loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/administration/:path*",
    "/organization/:path*",
    "/admin/:path*",
  ],
};
