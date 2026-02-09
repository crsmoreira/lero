import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "paguemenos-static.html");
  try {
    const html = fs.readFileSync(filePath, "utf8");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Failed to serve paguemenos-static.html:", err);
    return new NextResponse("Page not found", { status: 404 });
  }
}
