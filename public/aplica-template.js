/**
 * Carrega product-data.json e aplica no DOM (título, preço, descrições, checkout, tamanhos).
 * Mantém o layout idêntico; apenas o conteúdo dos campos editáveis é preenchido.
 */
(function () {
  var CONFIG_URL = 'product-data.json';

  function applyData(data) {
    if (!data) return;

    // Título
    var titleEl = document.querySelector('.vtex-store-components-3-x-productNameContainer') || document.querySelector('[data-product-title]');
    if (titleEl && data.title) titleEl.textContent = data.title;

    // Bloco Tamanhos (abaixo do título)
    var sizes = data.sizes;
    if (sizes && sizes.items && sizes.items.length) {
      var afterTitle = document.querySelector('.vtex-store-components-3-x-productNameContainer') || document.querySelector('[data-product-title]');
      if (afterTitle) {
        var container = document.querySelector('#product-sizes-mount');
        if (!container) {
          container = document.createElement('div');
          container.id = 'product-sizes-mount';
          afterTitle.parentNode.insertBefore(container, afterTitle.nextSibling);
        }
        var titleLabel = sizes.title || 'Tamanhos';
        var pillCss = '<style id="product-sizes-pill-style">' +
          '#product-sizes-mount{flex-basis:100%;width:100%;min-width:0;order:99;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-listSize{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:8px 0 0;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-listItemSize{list-style:none;margin:0;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-listItemLinkSize{display:inline-block;padding:10px 20px;border-radius:120px;border:1px solid #e3e4e6;background:#fff;color:#878787;text-decoration:none;font-size:14px;font-family:Alexandria,sans-serif;transition:border-color .15s,color .15s;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-listItemLinkSize:hover{border-color:#c2c3c5;color:#4f4f4f;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-listItemLinkSize--active{border-color:#4f4f4f;color:#3f3f40;font-weight:500;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-titleSize{margin:0 0 4px;font-size:16px;font-weight:400;color:#878787;font-family:Alexandria,sans-serif;}' +
          '#product-sizes-mount .iokarsten-custom-apps-0-x-containerSizes{margin-top:12px;}' +
          '</style>';
        var html = pillCss + '<div class="iokarsten-custom-apps-0-x-containerSizes"><div class="iokarsten-custom-apps-0-x-variationContainerSize iokarsten-custom-apps-0-x-sizesContainerSize">' +
          '<h4 class="iokarsten-custom-apps-0-x-titleSize">' + escapeHtml(titleLabel) + '</h4>' +
          '<ul class="iokarsten-custom-apps-0-x-listSize">';
        sizes.items.forEach(function (item) {
          var activeClass = item.active ? ' iokarsten-custom-apps-0-x-listItemLinkSize--active' : '';
          html += '<li class="iokarsten-custom-apps-0-x-listItemSize">' +
            '<a href="' + escapeHtml(item.link || '#') + '" class="iokarsten-custom-apps-0-x-listItemLinkSize' + activeClass + '">' + escapeHtml(item.name) + '</a></li>';
        });
        html += '</ul></div></div>';
        container.innerHTML = html;
      }
    }

    // Preço (parcelas, list price, à vista)
    if (data.price) {
      var instEl = document.querySelector('.vtex-product-price-1-x-installmentValue--container__installments') || document.querySelector('[class*="installmentValue"]');
      if (instEl && data.price.installments) instEl.textContent = data.price.installments;
      var listEl = document.querySelector('.vtex-product-price-1-x-listPriceValue .vtex-product-price-1-x-currencyContainer') || document.querySelector('[class*="listPriceValue"] [class*="currencyContainer"]') || document.querySelector('[class*="listPriceValue"]');
      if (listEl && data.price.listPrice) listEl.textContent = data.price.listPrice;
      var spotEl = document.querySelector('.vtex-product-price-1-x-sellingPriceValue .vtex-product-price-1-x-currencyContainer') || document.querySelector('.vtex-product-price-1-x-spotPriceValue [class*="currencyContainer"]') || document.querySelector('[class*="sellingPriceValue"]');
      if (spotEl && data.price.spotPrice) spotEl.textContent = data.price.spotPrice;
    }

    // Descrição curta (meta ou primeiro resumo)
    if (data.shortDescription) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', data.shortDescription);
    }

    // Descrição longa (HTML)
    if (data.longDescription) {
      var descEl = document.querySelector('.vtex-store-components-3-x-productDescriptionText') || document.querySelector('[class*="productDescriptionContainer"]');
      if (descEl) descEl.innerHTML = data.longDescription;
    }

    // Link checkout / botão Adicionar
    if (data.checkoutLink) {
      var buyBtn = document.querySelector('.vtex-flex-layout-0-x-flexRow--container__buy-button a') ||
                   document.querySelector('[class*="buy-button"] a') ||
                   document.querySelector('.vtex-add-to-cart-button');
      if (buyBtn) buyBtn.href = data.checkoutLink;
      var buyWrap = document.querySelector('.vtex-flex-layout-0-x-flexRowContent--container__buy-button');
      if (buyWrap && !buyWrap.querySelector('a')) {
        var btn = buyWrap.querySelector('button');
        if (btn) {
          var a = document.createElement('a');
          a.href = data.checkoutLink;
          a.className = btn.className;
          a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:inherit;';
          a.innerHTML = btn.innerHTML;
          btn.parentNode.replaceChild(a, btn);
        }
      }
    }

    // Imagem principal (primeira do carrossel)
    if (data.images && data.images[0]) {
      var mainImg = document.querySelector('.vtex-store-components-3-x-productImageTag--main') || document.querySelector('[class*="productImageTag"]');
      if (mainImg) mainImg.src = data.images[0];
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function run() {
    fetch(CONFIG_URL)
      .then(function (r) { return r.json(); })
      .then(applyData)
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
