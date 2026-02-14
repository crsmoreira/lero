import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@loja.com" },
    update: {},
    create: {
      email: "admin@loja.com",
      name: "Admin",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("Admin user:", admin.email);

  // Categories
  const catEspelhos = await prisma.category.upsert({
    where: { slug: "espelhos" },
    update: {},
    create: {
      name: "Espelhos",
      slug: "espelhos",
      description: "Espelhos para banheiro e decoração",
    },
  });

  const catBanheiro = await prisma.category.upsert({
    where: { slug: "banheiro" },
    update: {},
    create: {
      name: "Banheiro",
      slug: "banheiro",
      description: "Produtos para banheiro",
    },
  });

  // Brand
  const brandSmart = await prisma.brand.upsert({
    where: { slug: "smart-norte" },
    update: {},
    create: {
      name: "Smart Norte",
      slug: "smart-norte",
    },
  });

  // Product images - using placeholder images (unsplash)
  const espelhoImages = [
    { url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800", order: 0, isMain: true },
    { url: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800", order: 1, isMain: false },
    { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", order: 2, isMain: false },
    { url: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800", order: 3, isMain: false },
    { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800", order: 4, isMain: false },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", order: 5, isMain: false },
  ];

  const specs = [
    { key: "Altura", value: "60 cm", order: 0 },
    { key: "Largura", value: "40 cm", order: 1 },
    { key: "Formato", value: "Retangular", order: 2 },
    { key: "Material", value: "Vidro temperado com moldura em MDF", order: 3 },
    { key: "Cor", value: "Preto", order: 4 },
    { key: "Peso", value: "2,5 kg", order: 5 },
    { key: "Ambiente indicado", value: "Banheiro, quarto", order: 6 },
    { key: "Tipo de instalação", value: "Parede", order: 7 },
    { key: "Garantia", value: "12 meses", order: 8 },
    { key: "Conteúdo da embalagem", value: "1 espelho, 1 kit de fixação, manual", order: 9 },
  ];

  const description = `
<h3>Destaques</h3>
<ul>
<li>Design orgânico e moderno com moldura elegante</li>
<li>Vidro temperado de alta qualidade</li>
<li>Ideal para banheiros e quartos</li>
<li>Fácil instalação com kit incluso</li>
</ul>

<h3>Como instalar</h3>
<p>1. Escolha o local da parede onde deseja instalar.<br>
2. Use o nivelador para garantir que fique reto.<br>
3. Fure a parede nos pontos indicados.<br>
4. Fixe os suportes e encaixe o espelho.</p>

<h3>Conteúdo da embalagem</h3>
<ul>
<li>1 espelho decorativo</li>
<li>1 kit de fixação</li>
<li>Manual de instalação</li>
</ul>

<h3>Cuidados</h3>
<p>Evite impactos diretos. Limpe com pano seco ou levemente umedecido. Não use produtos abrasivos.</p>
`;

  const espelho = await prisma.product.upsert({
    where: { slug: "espelho-decorativo-organico-60x40cm" },
    update: { template: "magalu-novo" },
    create: {
      name: "Espelho Decorativo Orgânico com Moldura, 60x40 cm",
      slug: "espelho-decorativo-organico-60x40cm",
      shortDescription: "Espelho decorativo com moldura moderna, ideal para banheiro e quarto. Vidro temperado, 60x40 cm.",
      description: description.trim(),
      price: 299.9,
      promotionalPrice: 235.0,
      sku: "ESP-60X40-001",
      stock: 50,
      status: "active",
      tags: ["espelho", "banheiro", "decoracao", "moldura", "vidro"],
      metaTitle: "Espelho Decorativo Orgânico 60x40 cm | Loja",
      metaDescription: "Espelho decorativo com moldura moderna. Preço promocional. Frete grátis acima de R$ 200.",
      checkoutUrl: "https://exemplo.com/checkout/espelho-60x40",
      categoryId: catEspelhos.id,
      brandId: brandSmart.id,
      template: "magalu-novo",
    },
  });

  for (let i = 0; i < espelhoImages.length; i++) {
    const img = espelhoImages[i]!;
    await prisma.productImage.create({
      data: {
        url: img.url,
        order: img.order,
        isMain: img.isMain,
        productId: espelho.id,
      },
    });
  }

  await prisma.productSpecification.createMany({
    data: specs.map((s) => ({
      ...s,
      productId: espelho.id,
    })),
  });

  // Reviews
  const reviewData = [
    { userName: "Maria S.", rating: 5, title: "Perfeito!", comment: "Excelente qualidade. Ficou lindo no banheiro.", approved: true },
    { userName: "João P.", rating: 4, title: "Muito bom", comment: "Bom produto, entrega rápida.", approved: true },
    { userName: "Ana L.", rating: 5, title: "Recomendo", comment: "O espelho é lindo e a moldura é de qualidade. Super recomendo para quem quer dar um upgrade no banheiro.", approved: true },
    { userName: "Carlos R.", rating: 3, title: "Regular", comment: "Bom mas poderia ter instruções mais claras.", approved: true },
    { userName: "Fernanda M.", rating: 5, title: "Adorei!", comment: "Comprei para o quarto e ficou perfeito. A moldura preta combina com tudo.", approved: true },
    { userName: "Roberto K.", rating: 4, title: "Boa compra", comment: "Produto conforme descrito.", approved: true },
    { userName: "Juliana T.", rating: 5, title: "Surpreendente", comment: "A qualidade superou minhas expectativas. O vidro é bem espelhado e a moldura é resistente.", approved: true },
    { userName: "Paulo H.", rating: 4, title: "Ótimo", comment: "Instalação fácil. Recomendo.", approved: true },
    { userName: "Lucia F.", rating: 5, title: "Perfeito para presente", comment: "Comprei de presente e a pessoa amou!", approved: true },
    { userName: "Marcos A.", rating: 4, title: "Bom custo-benefício", comment: "Pelos detalhes e acabamento, o preço está justo.", approved: true },
    { userName: "Carla B.", rating: 5, title: "Excelente", comment: "Chegou bem embalado e sem defeitos. Instalei sozinha.", approved: true },
    { userName: "Ricardo S.", rating: 4, title: "Muito satisfeito", comment: "Atendeu minhas expectativas.", approved: true },
  ];

  for (const r of reviewData) {
    await prisma.review.create({
      data: {
        ...r,
        productId: espelho.id,
      },
    });
  }

  // Questions
  const questions = [
    { question: "Qual a espessura do vidro?", answer: "O vidro tem 4mm de espessura.", status: "answered" as const },
    { question: "Vem com suporte para fixar na parede?", answer: "Sim, o kit inclui suportes e parafusos para fixação em parede.", status: "answered" as const },
    { question: "A moldura é à prova d'água?", answer: "A moldura é em MDF com acabamento que resiste à umidade do banheiro.", status: "answered" as const },
    { question: "Qual o prazo de entrega?", status: "pending" as const },
    { question: "Posso devolver se não gostar?", status: "pending" as const },
    { question: "Tem outras cores disponíveis?", status: "pending" as const },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        answer: q.answer ?? null,
        productId: espelho.id,
      },
    });
  }

  // Create 7 more products for catalog
  const outrosProdutos = [
    { name: "Espelho Redondo LED 50cm", slug: "espelho-redondo-led-50cm", price: 189.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho Quadrado 40x40cm", slug: "espelho-quadrado-40x40cm", price: 99.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho Grande 80x60cm", slug: "espelho-grande-80x60cm", price: 399.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho com Luz 60cm", slug: "espelho-com-luz-60cm", price: 279.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho Minimalista 45cm", slug: "espelho-minimalista-45cm", price: 129.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho Vintage 55cm", slug: "espelho-vintage-55cm", price: 249.9, cat: catEspelhos.id, brand: brandSmart.id },
    { name: "Espelho Duplo 30x40cm", slug: "espelho-duplo-30x40cm", price: 159.9, cat: catEspelhos.id, brand: brandSmart.id },
  ];

  for (const p of outrosProdutos) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        shortDescription: `${p.name} - qualidade premium`,
        price: p.price,
        stock: Math.floor(Math.random() * 50) + 10,
        status: "active",
        tags: ["espelho"],
        categoryId: p.cat,
        brandId: p.brand,
        images: {
          create: {
            url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800",
            order: 0,
            isMain: true,
          },
        },
      },
    });
  }

  console.log("Seed concluído!");
  console.log("- Admin: admin@loja.com / admin123");
  console.log("- Produto principal: Espelho Decorativo Orgânico 60x40 cm");
  console.log("- 8 produtos criados, 12 avaliações, 6 perguntas");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
