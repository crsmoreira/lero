// centurion-pix.ts
// API de Pix via Centurion (proxy Centurion) — pronta para reuso
// Requisitos: fetch disponível (browser ou Node 18+).

export type RetryPolicy = {
  retries?: number;
  backoffMs?: number;
  retryOn?: number[];
};

export class ApiError extends Error {
  status: number;
  raw: unknown;
  url: string;
  constructor(message: string, status: number, raw: unknown, url: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.raw = raw;
    this.url = url;
  }
}

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: RetryPolicy;
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const onlyDigits = (s?: string) => (s ?? "").replace(/\D+/g, "");

async function httpJson<T = unknown>(url: string, opts: HttpOptions = {}): Promise<T> {
  const {
    method = "GET",
    headers,
    body,
    timeoutMs = 15000,
    retry = {
      retries: 0,
      backoffMs: 300,
      retryOn: [408, 429, 500, 502, 503, 504],
    },
  } = opts;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });

      const raw = await res.text();
      let json: unknown = raw;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        // mantém raw se não for JSON
      }

      const jsonObj = json as Record<string, unknown> | null;
      if (!res.ok) {
        const msg = String(
          (jsonObj && (jsonObj.error ?? jsonObj.message)) ?? raw ?? res.statusText ?? "HTTP error"
        );

        const canRetry =
          (retry.retryOn || []).includes(res.status) && attempt < (retry.retries || 0);

        if (canRetry) {
          attempt++;
          clearTimeout(timer);
          await sleep((retry.backoffMs || 300) * Math.pow(2, attempt - 1));
          continue;
        }

        throw new ApiError(msg, res.status, json, url);
      }

      clearTimeout(timer);
      return json as T;
    } catch (err: unknown) {
      clearTimeout(timer);

      const aborted = (err as { name?: string })?.name === "AbortError";
      const canRetry = attempt < (retry.retries || 0);

      if ((aborted || canRetry) && canRetry) {
        attempt++;
        await sleep((retry.backoffMs || 300) * Math.pow(2, attempt - 1));
        continue;
      }

      throw err;
    }
  }
}

export type CenturionPixClientOptions = {
  endpoint?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  retry?: RetryPolicy;
};

export type CenturionCustomer = {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
};

export type CreatePixInput = {
  amountReais: number;
  customer?: CenturionCustomer;
  installments?: number;
  paymentMethod?: "PIX";
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    tangible?: boolean;
  }>;
  shipping?: {
    street: string;
    streetNumber: string;
    complement?: string;
    zipCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
  metadata?: unknown;
};

export type CreatePixResponse = { qrcode: string; raw: unknown };

export class CenturionPixClient {
  private endpoint: string;
  private timeoutMs: number;
  private headers: Record<string, string>;
  private retry: RetryPolicy;

  constructor(opts: CenturionPixClientOptions = {}) {
    this.endpoint =
      opts.endpoint ||
      "https://centurion-proxy.vercel.app/api/centurion/transactions";
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.headers = { ...(opts.headers || {}) };
    this.retry = opts.retry || {
      retries: 0,
      backoffMs: 300,
      retryOn: [408, 429, 500, 502, 503, 504],
    };
  }

  async createPixCharge(input: CreatePixInput): Promise<CreatePixResponse> {
    const {
      amountReais,
      customer = {},
      installments = 1,
      paymentMethod = "PIX",
      items,
      shipping,
      metadata,
    } = input;

    if (!Number.isFinite(amountReais) || amountReais <= 0) {
      throw new Error("Valor inválido para pagamento.");
    }

    const name = (customer.name || "").trim() || "Cliente";
    const email = (customer.email || "").trim() || "cliente@example.com";
    const phone = `55${onlyDigits(customer.phone) || "11999999999"}`;
    const document = onlyDigits(customer.document) || "02612550020";

    const amount = Math.round(amountReais * 100);

    const payload = {
      amount,
      paymentMethod,
      installments,
      customer: { name, email, phone, document },
      items:
        items?.length ?
          items
        : [
            {
              title: "Produto",
              quantity: 1,
              unit_price: amount,
              tangible: false,
            },
          ],
      shipping:
        shipping || {
          street: "Rua Exemplo",
          streetNumber: "123",
          complement: "Sala 1",
          zipCode: "11050100",
          neighborhood: "Centro",
          city: "Santos",
          state: "SP",
          country: "BR",
        },
      ...(metadata ? { metadata } : {}),
    };

    const json = await httpJson<{ pix?: { qrcode?: string } }>(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: payload,
      timeoutMs: this.timeoutMs,
      retry: this.retry,
    });

    const qrcode = json?.pix?.qrcode;
    if (!qrcode) {
      throw new ApiError(
        "Resposta inválida da API de Pix (sem pix.qrcode).",
        502,
        json,
        this.endpoint
      );
    }

    return { qrcode, raw: json };
  }
}

export async function createPixCharge(
  input: CreatePixInput,
  opts?: CenturionPixClientOptions
) {
  const c = new CenturionPixClient(opts);
  return c.createPixCharge(input);
}
