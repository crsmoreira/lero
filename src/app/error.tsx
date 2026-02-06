"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-gray-600 text-center max-w-md">
        Ocorreu um erro inesperado. Tente novamente.
      </p>
      <Button onClick={() => reset()} variant="default">
        Tentar novamente
      </Button>
    </div>
  );
}
