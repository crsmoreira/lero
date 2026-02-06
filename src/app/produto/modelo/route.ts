import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

/**
 * Serve o index.html idêntico em /produto/modelo
 * Abra: http://localhost:3000/produto/modelo
 */
export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "produto-modelo.html");
    const html = await readFile(filePath, "utf-8");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error(err);
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }
}
