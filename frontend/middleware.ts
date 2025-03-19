// import { NextResponse } from "next/server"
// import type { NextRequest } from "next/server"
// import jwt from "jsonwebtoken";
// import { NextURL } from "next/dist/server/web/next-url";


// export function middleware(request: NextRequest) {
//   // Skip middleware processing for Next.js internal requests
//   if (
//     request.nextUrl.pathname.includes('_next') || 
//     request.nextUrl.pathname.includes('api') ||
//     request.nextUrl.search.includes('_rsc=')
//   ) {
//     return NextResponse.next();
//   }

//   const authToken = request.cookies.get("auth_token")?.value || ""
//   const { pathname, origin } = request.nextUrl;

//   const isTokenValid = decodeToken(authToken);
//   console.log("is token valid ", isTokenValid)

//   // List of public pages that don't require authentication
//   const publicPages = ["/auth/login", "/auth/register"];
//   const isPublicPage = publicPages.includes(pathname);

//   // If token is NOT valid
//   if (!isTokenValid) {
//     // Only redirect to login if not already on a public page
//     if (!isPublicPage) {
//       return NextResponse.redirect(new URL("/auth/login", origin));
//     }
//     return NextResponse.next();
//   } 
//   // If token IS valid
//   else {
//     // Redirect to dashboard if user tries to access login or register page
//     if (isPublicPage) {
//       return NextResponse.redirect(new URL("/dashboard", origin));
//     }
//     return NextResponse.next();
//   }
// }

// // Update matcher to exclude _next and api routes and include register
// export const config = {
//   matcher: ["/", "/interview-prep/:path*", "/interview/:path*", "/dashboard/:path*", "/profile", "/auth/login", "/auth/register", "/interview-type/:path*", "/prompts",
//     "/prompts/:path*",],
// }

// // function to decode token validity
// function decodeToken(token: string): boolean {
//   try {
//     const decodedToken = jwt.decode(token) as jwt.JwtPayload;

//     if (!decodedToken || !decodedToken.exp) {
//       return false;
//     }

//     const currentTime = Math.floor(Date.now() / 1000);
//     return decodedToken.exp > currentTime;
//   } catch (err) {
//     console.error("Token decoding error:", err);
//     return false;
//   }
// }



import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken";
import { NextURL } from "next/dist/server/web/next-url";

// Interface for decoded token payload
interface DecodedToken extends jwt.JwtPayload {
  sub: string;
  role: string;
  username: string;
  exp: number;
}

export function middleware(request: NextRequest) {
  // Skip middleware processing for Next.js internal requests
  if (
    request.nextUrl.pathname.includes('_next') || 
    request.nextUrl.pathname.includes('api') ||
    request.nextUrl.search.includes('_rsc=')
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value || ""
  const { pathname, origin } = request.nextUrl;

  // List of public pages that don't require authentication
  const publicPages = ["/auth/login", "/auth/register"];
  const isPublicPage = publicPages.includes(pathname);

  // Admin-only pages
  const adminOnlyPages = ["/prompts", "/prompts/create", "/prompts/edit"];
  const isAdminPage = adminOnlyPages.some(page => pathname.startsWith(page));

  // Decode and verify token
  const tokenResult = verifyToken(authToken);

  // If token is NOT valid
  if (!tokenResult.isValid) {
    // Only redirect to login if not already on a public page
    if (!isPublicPage) {
      return NextResponse.redirect(new URL("/auth/login", origin));
    }
    return NextResponse.next();
  } 
  // If token IS valid
  else {
    // Redirect to dashboard if user tries to access login or register page
    if (isPublicPage) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    // Check role-based access for admin pages
    if (isAdminPage && tokenResult.role !== "ADMIN") {
      // Redirect non-admin users to dashboard if they try to access admin pages
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    return NextResponse.next();
  }
}

// Update matcher to exclude _next and api routes and include register
export const config = {
  matcher: ["/", "/interview-prep/:path*", "/interview/:path*", "/dashboard/:path*", "/profile", "/auth/login", "/auth/register", "/interview-type/:path*", "/prompts",
    "/prompts/:path*",],
}

// Function to decode and verify token
function verifyToken(token: string): { isValid: boolean; role?: string } {
  if (!token) {
    return { isValid: false };
  }

  try {
    const decodedToken = jwt.decode(token) as DecodedToken;

    if (!decodedToken || !decodedToken.exp) {
      return { isValid: false };
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp <= currentTime) {
      return { isValid: false };
    }

    // Token is valid, return role information as well
    return { 
      isValid: true, 
      role: decodedToken.role 
    };
  } catch (err) {
    console.error("Token verification error:", err);
    return { isValid: false };
  }
}