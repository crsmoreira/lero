"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuestion } from "@/actions/questions";
import { toast } from "sonner";
import type { Product, Question } from "@prisma/client";

type Props = {
  product: Product & { questions: Question[] };
};

export function QandASection({ product }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    const result = await createQuestion({
      question: question.trim(),
      productId: product.id,
      status: "pending",
    });
    setLoading(false);
    if (result.error) {
      toast.error("Erro ao enviar pergunta");
      return;
    }
    toast.success("Pergunta enviada! Aguarde a resposta do admin.");
    setQuestion("");
  }

  const answered = product.questions.filter((q) => q.status === "answered");
  const pending = product.questions.filter((q) => q.status === "pending");

  return (
    <div id="perguntas" className="bg-white p-6 rounded-lg border scroll-mt-12">
      <h2 className="text-xl font-bold mb-6">Perguntas e Respostas</h2>

      {/* Answered Q&A */}
      <div className="space-y-6 mb-8">
        {answered.map((q) => (
          <div key={q.id} className="border-b border-gray-100 pb-6">
            <div className="flex gap-2 mb-2">
              <span className="font-medium text-sm">P:</span>
              <p className="text-gray-900">{q.question}</p>
            </div>
            {q.answer && (
              <div className="flex gap-2 bg-gray-50 p-4 rounded-lg">
                <span className="font-medium text-sm text-green-700">R:</span>
                <p className="text-gray-700">{q.answer}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        ))}
      </div>

      {/* Form - public can ask */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <Label htmlFor="question">Faça sua pergunta</Label>
        <Input
          id="question"
          placeholder="Digite sua pergunta sobre o produto..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? "Enviando..." : "Enviar pergunta"}
        </Button>
      </form>

      {pending.length > 0 && (
        <div className="text-sm text-gray-500">
          {pending.length} pergunta(s) aguardando resposta.
        </div>
      )}
    </div>
  );
}
