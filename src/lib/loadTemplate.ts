import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Carrega template HTML do public/.
 * Tenta readFile (local), fallback fetch (Vercel serverless, onde public não está no filesystem).
 */
export async function loadTemplate(templateFile: string, baseUrl: string): Promise<string> {
  try {
    const path = join(process.cwd(), "public", templateFile);
    return await readFile(path, "utf-8");
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT") {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${templateFile}`);
      if (!res.ok) throw new Error(`Template ${templateFile} não encontrado (${res.status})`);
      return res.text();
    }
    throw err;
  }
}
