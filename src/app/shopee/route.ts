import { loadTemplate } from "@/lib/loadTemplate";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Serve a página estática Shopee (produto) em /shopee.
 * Funciona em desktop e mobile com viewport responsivo.
 */
export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin);

  try {
    const html = await loadTemplate("shopee.html", baseUrl);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("shopee route:", e);
    return new NextResponse("Página Shopee não encontrada.", { status: 404 });
  }
}
