import { auth } from "@/lib/auth";

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
