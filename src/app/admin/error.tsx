"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Ocorreu um erro ao carregar o admin. Verifique o console do servidor.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
      <a href="/admin/login" className="mt-4 text-sm text-blue-600 hover:underline">
        Ir para login
      </a>
    </div>
  );
}
