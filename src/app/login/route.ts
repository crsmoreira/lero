import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const returnUrl = req.nextUrl.searchParams.get("returnUrl") ?? "/";
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("callbackUrl", returnUrl);
  return NextResponse.redirect(url);
}
