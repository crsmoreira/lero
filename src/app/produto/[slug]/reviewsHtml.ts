function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return diffDays <= 1 ? "há 1 dia" : `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return diffMonths === 1 ? "há 1 mês" : `há ${diffMonths} meses`;
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? "há um ano" : `há ${diffYears} anos`;
}

// Star SVG igual ao Leroy Merlin - laranja #EA7315 (estrela preenchida)
const STAR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 13 13" aria-hidden="true" class="w-4" style="color:#EA7315"><path d="M3.813 12.135a1.29 1.29 0 0 1-.7-.22 1.22 1.22 0 0 1-.45-1.38l1-2.94-2.36-1.33a1.16 1.16 0 0 1-.56-1.35 1.19 1.19 0 0 1 1.17-.86h2.74l.87-3a1.27 1.27 0 0 1 1.21-.92 1.22 1.22 0 0 1 1.23.91l.89 2.93h2.65a1.19 1.19 0 0 1 1.115 1.617 1.19 1.19 0 0 1-.485.583l-2.17 1.35 1 2.81a1.3 1.3 0 0 1-.48 1.48 1.29 1.29 0 0 1-1.55 0l-2.19-1.66-2.13 1.68a1.19 1.19 0 0 1-.8.3Z"></path></svg>';

function starsHtml(count: number): string {
  return Array(count).fill(STAR_SVG).join("");
}

const CHECK_SVG =
  '<svg viewBox="0 0 14 12" fill="currentColor" aria-hidden="true" class="w-4 h-4 shrink-0 text-green-600"><path d="M5.73 11.27l8.05-8.468a.626.626 0 00.22-.507.62.62 0 00-.22-.507L12.818.73a.676.676 0 00-.504-.23.676.676 0 00-.502.23L5.25 7.633l-3.061-3.22a.68.68 0 00-.504-.23.68.68 0 00-.504.23L.218 5.47A.625.625 0 000 5.977c0 .214.073.383.218.505l4.55 4.788c.117.153.278.23.481.23a.57.57 0 00.482-.23"></path></svg>';

const DROPDOWN_CHEVRON_SVG =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="w-2.5 h-2.5 shrink-0"><path d="M1.20889 5.45047L9.55333 11.4167C9.82 11.6076 10.1811 11.6087 10.4478 11.4188L18.7933 5.49629C19.2967 5.13847 20 5.49192 20 6.10174V9.38974C20 9.62974 19.8833 9.85447 19.6844 9.9952L10.4456 16.5527C10.18 16.7414 9.82111 16.7414 9.55444 16.5527L0.315556 9.9952C0.117778 9.85447 0 9.62974 0 9.38974V6.05483C0 5.44283 0.705556 5.09047 1.20889 5.45047"></path></svg>';

export type ReviewInput = {
  userName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  images?: string[];
};

function formatDateDrogasil(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Estrelas amarelas estilo Drogasil (5 estrelas)
const STAR_DROGASIL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.71 27.305" fill="#ffc107" width="14" height="14"><path fill-rule="evenodd" d="m14.034 17.793 7.207 4.579-2.142-8.361 6.607-5.479-8.532-.513L14.034 0l-3.156 8.019-8.657.513 6.6 5.479L6.675 22.4Z"/></svg>';

function starsHtmlDrogasil(count: number): string {
  return Array(count).fill(STAR_DROGASIL_SVG).join("");
}

/** Gera HTML de avaliações no estilo Drogasil (cards "Avaliação em produto relacionado") */
export function buildReviewsHtmlDrogasil(
  reviews: ReviewInput[],
  productName: string,
  productImage: string,
  escapeHtml: (s: string) => string
): string {
  const emptyStateHtml = `
<div class="avaliacoes-empty">
  <div class="avaliacoes-empty-icon">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.056 51.344" width="40" height="31"><path fill="#999" d="M8.225 23.898l4.224 2.678-1.253-4.893 3.87-3.215-5-.3-1.845-4.7-1.845 4.7-5.078.3 3.868 3.213-1.258 4.913z"/><path fill="#999" d="M24.223 23.898l4.224 2.678-1.253-4.893 3.87-3.215-5-.3-1.845-4.7-1.845 4.7-5.078.3 3.868 3.213-1.258 4.913z"/></svg>
  </div>
  <span class="avaliacoes-empty-text">Não temos avaliações para este produto ainda, mas buscamos algumas em produtos relacionados que podem ser úteis.</span>
  <div class="avaliacoes-empty-cta">
    <button type="button" class="avaliacoes-btn-secondary" aria-label="Quero avaliar">Quero avaliar</button>
  </div>
</div>`;

  if (reviews.length === 0) {
    return emptyStateHtml;
  }

  const cardHtml = (r: ReviewInput) => {
    const pills = extractPills(r);
    const pillsHtml = pills
      .map((p) => `<span class="avaliacoes-pill">${escapeHtml(p)}</span>`)
      .join("");
    return `
<div class="avaliacoes-card">
  <div class="avaliacoes-card-label">Avaliação em um <strong>produto relacionado</strong></div>
  <div class="avaliacoes-card-product">
    <div class="avaliacoes-card-product-img">
      <img src="${escapeHtml(productImage)}" alt="imagem do produto" loading="lazy"/>
    </div>
    <span class="avaliacoes-card-product-name">${escapeHtml(productName)}</span>
  </div>
  <div class="avaliacoes-card-body">
    <div class="avaliacoes-card-meta">
      <div class="avaliacoes-card-location">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7.2 9.611" width="10" height="10"><path d="M3.6 9.611a1 1 0 01-.8-.4C1.521 7.535 0 5.235 0 3.746A3.68 3.68 0 013.6 0a3.68 3.68 0 013.6 3.746c0 1.484-1.521 3.79-2.8 5.462a1 1 0 01-.8.403z"/></svg>
        <span>${escapeHtml(r.userName)}</span>
      </div>
      <span class="avaliacoes-card-badge">Cliente da Marca</span>
    </div>
    <div class="avaliacoes-card-rating">
      <div class="avaliacoes-stars">${starsHtmlDrogasil(r.rating)}</div>
      <span class="avaliacoes-card-date">${formatDateDrogasil(new Date(r.createdAt))}</span>
      <div class="avaliacoes-verified">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 20 20"><path fill="#40aa60" d="M10 0a10 10 0 110 10A10.03 10.03 0 0010 0M8.75 14.25 4.5 10l1.75-1.75 2.5 2.5 5-5L15.5 7.5z"/></svg>
        <span>Compra Verificada</span>
      </div>
    </div>
    <div class="avaliacoes-pills">${pillsHtml}</div>
    <div class="avaliacoes-helpful">
      <button type="button" class="avaliacoes-helpful-btn" aria-label=" útil">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.056 19.772" width="16" height="16"><path fill="none" d="M20.053 8.086a2.75 2.75 0 00-1.783-.667h-4.327V4.295A3.27 3.27 0 0012.8 1.479c-1.2-.881-1.461-.21-1.531-.186-.203.066-4.859 8.075-4.859 8.075s-2.8.014-4.372.016A1.04 1.04 0 001 10.424v8.346c0-.005 14.3 0 14.3 0 1.89 0 3.973-.188 4.6-1.179l1.107-6.871a2.9 2.9 0 00-.959-2.635z"/><path d="M1 10.026h6v9H1z"/></svg>
        <span>0</span>
      </button>
    </div>
  </div>
</div>`;
  };

  const cardsHtml = reviews.slice(0, 10).map((r) => cardHtml(r)).join("");
  return `<div class="avaliacoes-cards">${cardsHtml}</div>`;
}

function extractPills(r: ReviewInput): string[] {
  const pills: string[] = [];
  if (r.title && r.title.length >= 5) pills.push(r.title.trim());
  if (r.comment) {
    const phrase = r.comment.split(/[.!?]/)[0]?.trim();
    if (phrase && phrase.length >= 8 && phrase !== r.title) {
      pills.push(phrase.length > 40 ? phrase.slice(0, 37) + "..." : phrase);
    }
  }
  return pills.slice(0, 3);
}

export function buildReviewsHtml(
  reviews: ReviewInput[],
  escapeHtml: (s: string) => string
): string {
  if (reviews.length === 0) {
    return '<div class="flex flex-col gap-4"><h2 class="font-bold text-black text-xl md:text-2xl block">Avaliações</h2><p class="text-gray-600 text-lg">Nenhuma avaliação ainda.</p></div>';
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const avgRounded = Math.round(avg * 10) / 10;

  // Barra de progresso (estilo Leroy Merlin - laranja #EA7315)
  const progressBar = (pct: number) => {
    const width = Math.min(100, Math.max(0, pct));
    return `<div style="overflow:hidden;border-radius:9999px;background:#e5e7eb;height:20px;width:100%;max-width:256px"><div style="height:100%;border-radius:9999px;background-color:#EA7315;width:${width}%"></div></div>`;
  };

  const distRows = distribution
    .map(
      (d) =>
        `<div class="flex items-center gap-2">
          <span class="text-black font-bold text-2xl md:text-3xl block w-4 text-center">${d.star}</span>
          ${STAR_SVG}
          ${progressBar(total ? (d.count / total) * 100 : 0)}
          <span class="text-gray-600 text-lg block w-4 text-center">${d.count}</span>
        </div>`
    )
    .join("");

  const avgSection = `
    <div class="flex flex-col gap-4 items-center justify-center text-center">
      <p class="text-gray-600 text-lg block">Nota média do produto</p>
      <div class="flex items-center gap-4">
        <span class="text-black font-bold text-2xl md:text-6xl block">${avgRounded}</span>
        <div class="flex gap-0.5" role="img" aria-label="Avaliação: ${avgRounded} de 5 estrelas">${starsHtml(5)}</div>
      </div>
    </div>`;

  const reviewImagesHtml = (imgs: string[]) =>
    imgs.length > 0
      ? `<div class="flex flex-wrap gap-2 mt-2">${imgs
          .slice(0, 5)
          .map((url) => `<img src="${escapeHtml(url)}" alt="Foto da avaliação" class="w-16 h-16 object-cover rounded border" loading="lazy" />`)
          .join("")}</div>`
      : "";

  const helpfulButtons = (yesCount: number, noCount: number) => `
    <div class="flex flex-col gap-2 md:flex-row md:items-center gap-4">
      <p class="text-black text-lg block">Útil?</p>
      <div class="flex gap-4 flex-wrap">
        <button type="button" class="inline-flex items-center justify-center h-7 px-3 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-100">Sim • ${yesCount}</button>
        <button type="button" class="inline-flex items-center justify-center h-7 px-3 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-100">Não • ${noCount}</button>
        <button type="button" class="inline-flex items-center justify-center h-7 px-3 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-100"><span class="md:hidden">Inapropriado</span><span class="hidden md:inline">Conteúdo inapropriado</span></button>
      </div>
    </div>`;

  const reviewCard = (r: ReviewInput, index: number, yesCount: number, noCount: number) => `
    <div class="flex flex-col gap-4" style="padding-bottom:1.5rem;margin-bottom:1.5rem">
      <div class="flex flex-col gap-1">
        <div class="flex gap-0.5">${starsHtml(r.rating)}</div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-bold text-black text-base font-bold block">${escapeHtml(r.userName)}</span>
          <span class="text-gray-600 text-lg block">${formatRelativeDate(new Date(r.createdAt))}</span>
        </div>
      </div>
      <div class="flex flex-col gap-0.5">
        <h3 class="font-bold text-black text-lg md:text-xl block">${escapeHtml(r.title ?? "Avaliação")}</h3>
        <p class="text-black text-lg block">${escapeHtml(r.comment ?? "")}</p>
      </div>
      ${reviewImagesHtml(r.images ?? [])}
      <div class="flex items-center gap-2 text-black text-lg">
        <span>Recomenda esse produto</span>
        <span class="w-3"></span>
        ${CHECK_SVG}
        <span class="w-2"></span>
        <span>Sim</span>
      </div>
      ${helpfulButtons(yesCount, noCount)}
    </div>`;

  // Simula contagem de "útil" - primeiro review pode ter 1, resto 0
  const reviewsList = reviews
    .map((r, i) => reviewCard(r, i, i === 0 ? 1 : 0, 0))
    .join("");

  const sortDropdown = `
    <button type="button" role="combobox" class="inline-flex w-full md:w-auto h-10 px-4 items-center justify-between rounded-lg border border-gray-300 bg-white text-lg hover:border-gray-400" aria-label="Classificar avaliações">
      <span>Mais útil</span>
      ${DROPDOWN_CHEVRON_SVG}
    </button>`;

  const paginationPrev =
    '<button type="button" aria-label="Ir para a página anterior" class="inline-flex items-center justify-center h-7 px-1.5 text-sm font-semibold rounded-full border-2 border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled><svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path d="M15.8553 1.20889L9.88913 9.55333C9.69823 9.82 9.69713 10.1811 9.88695 10.4478L15.8095 18.7933C16.1673 19.2967 15.8139 20 15.204 20H11.916C11.676 20 11.4513 19.8833 11.3106 19.6844L4.75313 10.4456C4.56441 10.18 4.56441 9.82111 4.75313 9.55444L11.3106 0.315556C11.4513 0.117778 11.676 0 11.916 0L15.251 0C15.863 0 16.2153 0.705556 15.8553 1.20889"></path></svg></button>';
  const paginationNext =
    '<button type="button" aria-label="Ir para a próxima página" class="inline-flex items-center justify-center h-7 px-1.5 text-sm font-semibold rounded-full border-2 border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled><svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path d="M4.14468 18.7911L10.1109 10.4467C10.3018 10.18 10.3029 9.81889 10.113 9.55222L4.1905 1.20667C3.83268 0.703334 4.18614 0 4.79596 0H8.08396C8.32396 0 8.54868 0.116667 8.68941 0.315556L15.2469 9.55444C15.4356 9.82 15.4356 10.1789 15.2469 10.4456L8.68941 19.6844C8.54868 19.8822 8.32396 20 8.08396 20H4.74905C4.13705 20 3.78468 19.2944 4.14468 18.7911"></path></svg></button>';

  return `
<div class="flex flex-col gap-6" style="--stack-spacing: 1rem;">
  <h2 class="font-bold text-black text-xl md:text-2xl block">Avaliações</h2>

  <div class="grid w-full grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-10">
    <div class="flex flex-col gap-2">${distRows}</div>
    <div class="flex flex-col gap-4">${avgSection}</div>
  </div>

  <div class="flex flex-col gap-10">
    <div class="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
      <span class="text-black text-lg block">1-${reviews.length} de ${reviews.length} avaliações</span>
      <span class="hidden md:block flex-1 h-px bg-black"></span>
      <div class="w-full md:w-auto">${sortDropdown}</div>
    </div>

    <div class="flex flex-col mt-8">${reviewsList}</div>

    <div class="flex items-center justify-between md:justify-start gap-4 pt-4 mt-4">
      <span class="text-black text-lg block">1-${reviews.length} de ${reviews.length} avaliações</span>
      <div class="flex gap-2.5">${paginationPrev}${paginationNext}</div>
    </div>
  </div>
</div>`;
}
