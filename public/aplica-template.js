/**
 * Carrega product-data.json e aplica no DOM (título, preço, descrições, checkout, tamanhos).
 * Mantém o layout idêntico; apenas o conteúdo dos campos editáveis é preenchido.
 */
(function () {
  var CONFIG_URL = 'product-data.json';

  function applyData(data) {
    if (!data) {
      console.warn('[aplica-template] Nenhum dado fornecido');
      return;
    }
    console.log('[aplica-template] Aplicando dados:', data);

    // Título - tentar múltiplos seletores
    var titleEl = document.querySelector('.vtex-store-components-3-x-productNameContainer') || 
                  document.querySelector('[data-product-title]') ||
                  document.querySelector('h1') ||
                  document.querySelector('[class*="productName"]');
    if (titleEl && data.title) {
      console.log('[aplica-template] Título encontrado, atualizando:', data.title);
      titleEl.textContent = data.title;
    } else {
      console.warn('[aplica-template] Título não encontrado. Dados:', data.title);
    }

    // Bloco Tamanhos (abaixo do título, não ao lado)
    var sizes = data.sizes;
    if (sizes && sizes.items && sizes.items.length) {
      var titleEl = document.querySelector('.vtex-store-components-3-x-productNameContainer') || document.querySelector('[data-product-title]');
      if (titleEl) {
        var container = document.querySelector('#product-sizes-mount');
        if (!container) {
          container = document.createElement('div');
          container.id = 'product-sizes-mount';
          // Inserir depois da linha inteira (flex row) que contém o título, para ficar abaixo e não ao lado
          var productNameRow = titleEl.closest('[class*="flexRow--container__product-name-and-actions"]') || titleEl.closest('[class*="container__product-name-and-actions"]');
          if (productNameRow && productNameRow.parentNode) {
            productNameRow.parentNode.insertBefore(container, productNameRow.nextSibling);
          } else {
            titleEl.parentNode.insertBefore(container, titleEl.nextSibling);
          }
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
      console.log('[aplica-template] Aplicando preços:', data.price);
      // Parcelas
      var instEl = document.querySelector('.vtex-product-price-1-x-installmentValue--container__installments') || 
                   document.querySelector('[class*="installmentValue--container__installments"]') ||
                   document.querySelector('[class*="installmentValue"]');
      if (instEl && data.price.installments) {
        console.log('[aplica-template] Parcelas encontradas, atualizando:', data.price.installments);
        instEl.textContent = data.price.installments;
      } else {
        console.warn('[aplica-template] Parcelas não encontradas. Dados:', data.price.installments);
      }
      // Preço de (riscado)
      var listEl = document.querySelector('.vtex-product-price-1-x-listPriceValue .vtex-product-price-1-x-currencyContainer') || 
                   document.querySelector('[class*="listPriceValue"] [class*="currencyContainer"]') || 
                   document.querySelector('[class*="listPriceValue"]');
      if (listEl && data.price.listPrice) {
        console.log('[aplica-template] Preço de encontrado, atualizando:', data.price.listPrice);
        listEl.textContent = data.price.listPrice;
      } else {
        console.warn('[aplica-template] Preço de não encontrado. Dados:', data.price.listPrice);
      }
      // Preço à vista
      var spotEl = document.querySelector('.vtex-product-price-1-x-sellingPriceValue .vtex-product-price-1-x-currencyContainer') || 
                   document.querySelector('.vtex-product-price-1-x-spotPriceValue [class*="currencyContainer"]') || 
                   document.querySelector('[class*="sellingPriceValue"] [class*="currencyContainer"]') ||
                   document.querySelector('[class*="spotPriceValue"] [class*="currencyContainer"]');
      if (spotEl && data.price.spotPrice) {
        console.log('[aplica-template] Preço à vista encontrado, atualizando:', data.price.spotPrice);
        spotEl.textContent = data.price.spotPrice;
      } else {
        console.warn('[aplica-template] Preço à vista não encontrado. Dados:', data.price.spotPrice);
      }
    }

    // Descrição curta (meta ou primeiro resumo)
    if (data.shortDescription) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', data.shortDescription);
    }

    // Descrição longa (HTML)
    if (data.longDescription) {
      var descEl = document.querySelector('.vtex-store-components-3-x-productDescriptionText') || 
                   document.querySelector('[class*="productDescriptionText"]') ||
                   document.querySelector('[class*="productDescriptionContainer"]');
      if (descEl) {
        console.log('[aplica-template] Descrição encontrada, atualizando');
        descEl.innerHTML = data.longDescription;
      } else {
        console.warn('[aplica-template] Descrição não encontrada');
      }
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
      var mainImg = document.querySelector('.vtex-store-components-3-x-productImageTag--main') || 
                    document.querySelector('[class*="productImageTag--main"]') ||
                    document.querySelector('[class*="productImageTag"]') ||
                    document.querySelector('.vtex-store-components-3-x-productImagesContainer img');
      if (mainImg) {
        console.log('[aplica-template] Imagem encontrada, atualizando:', data.images[0]);
        mainImg.src = data.images[0];
        if (mainImg.dataset) mainImg.dataset.src = data.images[0];
      } else {
        console.warn('[aplica-template] Imagem não encontrada. Dados:', data.images[0]);
      }
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function run() {
    console.log('[aplica-template] Iniciando aplicação de dados...');
    
    // Se os dados já estão disponíveis via window.PRODUCT_DATA (injetado pelo Next.js), use-os
    if (typeof window !== 'undefined' && window.PRODUCT_DATA) {
      console.log('[aplica-template] Dados encontrados em window.PRODUCT_DATA:', window.PRODUCT_DATA);
      // Aguardar um pouco para garantir que o DOM está pronto
      setTimeout(function() {
        applyData(window.PRODUCT_DATA);
      }, 100);
      return;
    }

    // Caso contrário, tenta carregar do JSON (para uso standalone)
    console.log('[aplica-template] Tentando carregar de:', CONFIG_URL);
    fetch(CONFIG_URL)
      .then(function (r) { 
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json(); 
      })
      .then(function(data) {
        console.log('[aplica-template] Dados carregados do JSON:', data);
        setTimeout(function() {
          applyData(data);
        }, 100);
      })
      .catch(function (err) {
        console.error('[aplica-template] Erro ao carregar dados:', err);
      });
  }

  // Aguardar DOM estar completamente carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(run, 500);
    });
  } else {
    setTimeout(run, 500);
  }
})();
