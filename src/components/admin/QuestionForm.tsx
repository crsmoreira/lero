"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateQuestion } from "@/actions/questions";
import { toast } from "sonner";
import type { Question } from "@prisma/client";

export function QuestionForm({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateQuestion(question.id, {
      answer,
      status: answer ? "answered" : "pending",
    });
    setLoading(false);
    if (!result.data) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success("Resposta salva");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Responder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Responder pergunta</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-4">{question.question}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="answer">Resposta</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Escreva a resposta..."
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
