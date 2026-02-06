import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Usa config mínimo (sem Prisma) para rodar no Edge Runtime
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isLogin = req.nextUrl.pathname.startsWith("/admin/login");

  if (isAdmin && !isLogin && !req.auth) {
    return Response.redirect(new URL("/admin/login", req.url));
  }

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*"],
};
