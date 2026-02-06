"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewsSection } from "./ReviewsSection";
import { QandASection } from "./QandASection";
import type { Product } from "@prisma/client";
import type {
  ProductImage,
  ProductSpecification,
  Review,
  Question,
  Category,
  Brand,
} from "@prisma/client";

type ProductWithRelations = Product & {
  images: ProductImage[];
  specifications: ProductSpecification[];
  reviews: Review[];
  questions: Question[];
  category: Category | null;
  brand: Brand | null;
};

type Props = {
  product: ProductWithRelations;
  avgRating: number | null;
  reviewsCount: number;
};

export function ProductTabs({
  product,
  avgRating,
  reviewsCount,
}: Props) {
  return (
    <Tabs defaultValue="descricao" className="w-full">
      <TabsList className="w-full justify-start flex-wrap h-auto gap-2">
        <TabsTrigger value="descricao">Descrição</TabsTrigger>
        <TabsTrigger value="especificacoes">Especificações</TabsTrigger>
        <TabsTrigger value="avaliacoes" id="avaliacoes">
          Avaliações ({reviewsCount})
        </TabsTrigger>
        <TabsTrigger value="perguntas" id="perguntas">
          Perguntas ({product.questions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="descricao" className="mt-6">
        <div
          id="descricao"
          className="scroll-mt-12 prose prose-sm max-w-none bg-white p-6 rounded-lg border shadow-sm"
          dangerouslySetInnerHTML={{
            __html: product.description || "<p>Sem descrição.</p>",
          }}
        />
      </TabsContent>

      <TabsContent value="especificacoes" className="mt-6">
        <div id="caracteristicas-tecnicas" className="scroll-mt-12 bg-white p-6 rounded-lg border shadow-sm">
          {product.specifications.length === 0 ? (
            <p className="text-gray-500">Sem especificações.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especificação</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.specifications.map((spec) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium">{spec.key}</TableCell>
                    <TableCell>{spec.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="avaliacoes" className="mt-6">
        <div id="avaliacoes" className="scroll-mt-12">
          <ReviewsSection product={product} avgRating={avgRating} />
        </div>
      </TabsContent>

      <TabsContent value="perguntas" className="mt-6">
        <div id="perguntas" className="scroll-mt-12">
          <QandASection product={product} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
