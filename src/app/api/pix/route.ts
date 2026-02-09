import { ApiError, createPixCharge } from "@/lib/centurion-pix";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amountReais = Number(body?.amountReais ?? 0);
    const customer = body?.customer;

    if (!Number.isFinite(amountReais) || amountReais <= 0) {
      return NextResponse.json(
        { error: "Valor inválido. Informe amountReais (número maior que 0)." },
        { status: 400 }
      );
    }

    const { qrcode } = await createPixCharge({
      amountReais,
      customer:
        customer && typeof customer === "object"
          ? {
              name: String(customer.name ?? "").trim() || undefined,
              email: String(customer.email ?? "").trim() || undefined,
              phone: customer.phone != null ? String(customer.phone) : undefined,
              document: customer.document != null ? String(customer.document) : undefined,
            }
          : undefined,
      metadata: { source: "vakinha" },
    });

    return NextResponse.json({ qrcode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar Pix.";
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
