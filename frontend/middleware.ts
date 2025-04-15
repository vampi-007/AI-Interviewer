// middleware.ts

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value || "";

    const isAuthenticated = !!token;
    const currentPath = request.nextUrl.pathname;

    const isPublic = PUBLIC_ROUTES.includes(currentPath);

    if (!isAuthenticated && !isPublic) {
        // Not logged in trying to access a protected route
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (isAuthenticated && isPublic) {
        // Logged in trying to access login or register
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next(); // Allow through
}

export const config = {
    matcher: ["/((?!_next|api|static|favicon.ico).*)"], // apply to all routes except Next.js internals
};
