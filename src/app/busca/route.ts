import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("term") ?? "";
  const url = new URL("/produtos", req.url);
  if (term.trim()) {
    url.searchParams.set("busca", term.trim());
  }
  return NextResponse.redirect(url);
}
