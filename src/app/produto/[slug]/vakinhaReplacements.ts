type ProductLike = { checkoutUrl: string | null; promotionalPrice: number | string | null; price: number | string; name: string; sku: string | null; createdAt: Date | string };

function formatPriceBr(value: number): string {
  const [intPart, decPart = "00"] = value.toFixed(2).split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots},${decPart}`;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildVakinhaDoarModal(
  product: ProductLike,
  specMap: Record<string, string>,
  escapeHtmlFn: (t: string) => string
): string {
  const checkoutUrl = (product.checkoutUrl ?? "").trim() || "#";
  const pixKey = specMap["pix_chave"] ?? specMap["pix"] ?? "";
  const modalHtml = `<div id="vakinha-modal-doar" style="display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,.5);font-family:'Montserrat','Lato',arial,sans-serif" data-checkout-url="${escapeHtmlFn(checkoutUrl)}" data-pix-key="${escapeHtmlFn(pixKey)}"><div style="background:#fff;border-radius:12px;max-width:400px;width:90%;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0;font-size:20px;font-weight:700;color:#282828">Escolha o valor da doação</h3><button type="button" id="vakinha-modal-fechar" style="background:none;border:none;cursor:pointer;font-size:24px;color:#8a8a8a;line-height:1">&times;</button></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px"><button type="button" class="vakinha-valor-btn" data-valor="30" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 30</button><button type="button" class="vakinha-valor-btn" data-valor="50" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 50</button><button type="button" class="vakinha-valor-btn" data-valor="100" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 100</button><button type="button" class="vakinha-valor-btn" data-valor="150" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 150</button><button type="button" class="vakinha-valor-btn" data-valor="200" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 200</button><button type="button" class="vakinha-valor-btn" data-valor="300" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 300</button><button type="button" class="vakinha-valor-btn" data-valor="500" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 500</button><button type="button" class="vakinha-valor-btn" data-valor="1000" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 1.000</button></div><button type="button" id="vakinha-btn-doar-agora" style="width:100%;padding:14px 24px;background:#24CA68;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:16px;cursor:pointer;font-family:inherit">Doar agora</button></div></div>`;
  const scriptTag = "<scr" + "ipt>";
  const scriptEnd = "</scr" + "ipt>";
  const modalScript = "(function(){var m=document.getElementById(\"vakinha-modal-doar\");var fechar=document.getElementById(\"vakinha-modal-fechar\");var doarAgora=document.getElementById(\"vakinha-btn-doar-agora\");var selected=null;function openModal(){m.style.display=\"flex\";selected=null;document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(b){b.style.borderColor=\"#e0e0e0\";b.style.background=\"#fff\"});}function closeModal(){m.style.display=\"none\";}document.querySelectorAll(\".vakinha-btn-doar\").forEach(function(btn){btn.addEventListener(\"click\",function(e){e.preventDefault();openModal();});});if(fechar){fechar.addEventListener(\"click\",closeModal);}m.addEventListener(\"click\",function(e){if(e.target===m)closeModal();});document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(b){b.addEventListener(\"click\",function(){selected=parseInt(this.getAttribute(\"data-valor\"),10);document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(x){x.style.borderColor=\"#e0e0e0\";x.style.background=\"#fff\";});this.style.borderColor=\"#24CA68\";this.style.background=\"#EEFFE6\";});});if(doarAgora){doarAgora.addEventListener(\"click\",function(){if(!selected){alert(\"Selecione um valor para doar.\");return;}var url=m.getAttribute(\"data-checkout-url\");var pix=m.getAttribute(\"data-pix-key\");var sep=url.indexOf(\"?\")>=0?\"&\":\"?\";if(url&&url!==\"#\"){window.location.href=url+sep+\"valor=\"+selected;}else{window.dispatchEvent(new CustomEvent(\"vakinha-doar\",{detail:{valor:selected,pixKey:pix}}));closeModal();}});}})();";
  return modalHtml + scriptTag + modalScript + scriptEnd;
}

export function getVakinhaReplacements(
  product: ProductLike,
  specMap: Record<string, string>,
  brandName: string
): [string | RegExp, string][] {
  const vakinhaValorArrecadado = (() => {
    const spec = specMap["valor_arrecadado"];
    if (spec) return spec;
    const v = product.promotionalPrice != null ? Number(product.promotionalPrice) : Number(product.price);
    return "R$ " + formatPriceBr(v);
  })();

  const vakinhaDeMeta = (() => {
    const spec = specMap["meta"];
    if (spec) return spec.startsWith("de ") ? spec : "de " + spec;
    return "de R$ " + formatPriceBr(Number(product.price));
  })();

  const pix = specMap["pix_chave"] ?? specMap["pix"] ?? "";
  const pixEsc = escapeHtml(pix);

  const vakinhaPixBlock = `<div class="sc-f294cd4b-0 iSEAiO"><div class="sc-jXbUNg gAOWep"><div class="sc-fqkvVR cYzlCi">Você pode ajudar via Pix usando a chave:</div></div><span title="" class="" data-clipboard-text="${pixEsc}"><div class="sc-jXbUNg drUFBp"><span class="sc-fqkvVR bNAxkZ">${pixEsc}</span><svg class="sc-6a91f545-21 bkMRVd" viewBox="350 0 766 758" width="25" height="25"><title>Copiar link</title><path class="cls-2" d="M806.32,188.44H597.7a34.87,34.87,0,0,0-34.84,34.73V466.71H597.7V223.17H806.32Z"></path><path class="cls-2" d="M858.56,258v0H667.25a35,35,0,0,0-34.84,34.83V536.28a35,35,0,0,0,34.84,34.83H858.56a34.9,34.9,0,0,0,34.72-34.83V292.8A34.9,34.9,0,0,0,858.56,258Zm0,278.29H667.25V292.8H858.56Z"></path></svg></div></span></div>`;

  const vakinhaPixFaqSection = `<div class="sc-jXbUNg eeOnwx"><div class="sc-jXbUNg eVozhJ"><div class="sc-fqkvVR dpfife">Tudo o que você precisa saber sobre o Vakinha</div></div><div></div></div><div class="sc-jXbUNg hAomzl"><div class="sc-c9fdcb0d-0 dlKrXY"><div class="sc-c9fdcb0d-2 fdWmOt"><div class="sc-jXbUNg ebhQDB"><div class="sc-jXbUNg eHPxQe"><div class="sc-jXbUNg gVykMh"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25.403 25.403"><defs><clipPath id="clip-path"><rect id="Retângulo_767" data-name="Retângulo 767" width="25.403" height="25.403" fill="#000"></rect></clipPath></defs><g id="Grupo_1383" data-name="Grupo 1383" clip-path="url(#clip-path)"><path id="Caminho_3622" data-name="Caminho 3622" d="M78.682,183.135a3.708,3.708,0,0,1-2.638-1.089l-3.811-3.813a.724.724,0,0,0-1,0l-3.824,3.824a3.709,3.709,0,0,1-2.638,1.092h-.746l4.829,4.829a3.863,3.863,0,0,0,5.458,0l4.839-4.84Z" transform="translate(-58.87 -163.703)" fill="#000"></path><path id="Caminho_3623" data-name="Caminho 3623" d="M64.77,5.955a3.709,3.709,0,0,1,2.638,1.092l3.824,3.825a.709.709,0,0,0,1,0l3.81-3.81a3.7,3.7,0,0,1,2.638-1.093h.459L74.3,1.13a3.858,3.858,0,0,0-5.457,0h0L64.023,5.955Z" transform="translate(-58.87 0.001)" fill="#000"></path><path id="Caminho_3624" data-name="Caminho 3624" d="M24.273,90.354,21.349,87.43a.564.564,0,0,1-.208.042h-1.33a2.626,2.626,0,0,0-1.846.765l-3.81,3.808a1.83,1.83,0,0,1-2.586,0L7.745,88.222A2.625,2.625,0,0,0,5.9,87.456H4.268a.574.574,0,0,1-.2-.039L1.129,90.354a3.863,3.863,0,0,0,0,5.458l2.936,2.936a.552.552,0,0,1,.2-.039H5.9a2.626,2.626,0,0,0,1.846-.765l3.824-3.824a1.874,1.874,0,0,1,2.587,0l3.81,3.809a2.626,2.626,0,0,0,1.846.765h1.33a.555.555,0,0,1,.208.042l2.924-2.924a3.858,3.858,0,0,0,0-5.457h0" transform="translate(0 -80.381)" fill="#000"></path></g></svg></div>{{VAKINHA_PIX_LINE}}</div>{{VAKINHA_PIX_COPY_BUTTON}}</div></div></div></div></div>`;

  const vakinhaPixLine = `<div class="sc-fqkvVR grIjCO">Você também pode <strong>contribuir via Pix usando a chave:</strong> ${pixEsc}</div>`;

  const vakinhaPixCopyButton = `<div class="sc-jXbUNg dwWNmN sc-2c67c63e-7 gNyJwm"><button title="" type="button" class="" data-clipboard-text="${pixEsc}" data-cy="copy-pix-key-bottom"><div class="sc-fqkvVR fDRDCh">Copiar</div><svg class="sc-6a91f545-21 bkMRVd" viewBox="350 0 766 758" width="25" height="25"><title>Copiar link</title><path class="cls-2" d="M806.32,188.44H597.7a34.87,34.87,0,0,0-34.84,34.73V466.71H597.7V223.17H806.32Z"></path><path class="cls-2" d="M858.56,258v0H667.25a35,35,0,0,0-34.84,34.83V536.28a35,35,0,0,0,34.84,34.83H858.56a34.9,34.9,0,0,0,34.72-34.83V292.8A34.9,34.9,0,0,0,858.56,258Zm0,278.29H667.25V292.8H858.56Z"></path></svg></button></div>`;

  const vakinhaDataCriacao = (() => {
    const spec = specMap["data_criacao"];
    if (spec) return spec;
    const d = product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  })();

  const modal = buildVakinhaDoarModal(product, specMap, escapeHtml);

  return [
    ["{{VAKINHA_VALOR_ARRECADADO}}", vakinhaValorArrecadado],
    ["{{VAKINHA_DE_META}}", vakinhaDeMeta],
    ["{{VAKINHA_CORACOES}}", specMap["coracoes_recebidos"] ?? specMap["coracoes"] ?? "0"],
    ["{{VAKINHA_APOIADORES}}", specMap["num_doadores"] ?? specMap["apoiadores"] ?? "0"],
    ["{{VAKINHA_PIX}}", pix],
    ["{{VAKINHA_PIX_BLOCK}}", vakinhaPixBlock],
    ["{{VAKINHA_PIX_FAQ_SECTION}}", vakinhaPixFaqSection],
    ["{{VAKINHA_PIX_LINE}}", vakinhaPixLine],
    ["{{VAKINHA_PIX_COPY_BUTTON}}", vakinhaPixCopyButton],
    ["{{VAKINHA_DATA_CRIACAO}}", vakinhaDataCriacao],
    ["{{VAKINHA_NOME_CRIADOR}}", specMap["nome_criador"] ?? brandName ?? ""],
    ["{{VAKINHA_BENEFICIARIO}}", specMap["beneficiario"] ?? product.name],
    ["{{VAKINHA_CATEGORIA}}", specMap["categoria"] ?? "Vaquinha"],
    ["{{VAKINHA_ID}}", product.sku ? "ID: " + product.sku : ""],
    ["{{VAKINHA_DOAR_MODAL}}", modal],
  ];
}
