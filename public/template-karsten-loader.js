/**
 * Carregador de dados para template-karsten.html
 * Carrega product-data.json e preenche todos os campos editáveis
 */
(function () {
  var CONFIG_URL = 'product-data.json';

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function applyData(data) {
    if (!data) return;

    // Título
    var titleEl = document.querySelector('[data-editable="title"]');
    if (titleEl && data.title) {
      titleEl.textContent = data.title;
      if (titleEl.tagName === 'TITLE') {
        document.title = data.title;
      }
    }

    // Meta description
    var metaDesc = document.querySelector('meta[name="description"][data-editable="shortDescription"]');
    if (metaDesc && data.shortDescription) {
      metaDesc.setAttribute('content', data.shortDescription);
    }

    // Imagem principal
    var mainImg = document.querySelector('[data-editable="mainImage"]');
    if (mainImg && data.images && data.images[0]) {
      mainImg.src = data.images[0];
      mainImg.alt = data.title || 'Produto';
    }

    // Tamanhos
    var sizes = data.sizes;
    if (sizes) {
      var sizesTitleEl = document.querySelector('[data-editable="sizesTitle"]');
      if (sizesTitleEl && sizes.title) {
        sizesTitleEl.textContent = sizes.title;
      }

      var sizesList = document.getElementById('product-sizes-list');
      if (sizesList && sizes.items && sizes.items.length) {
        sizesList.innerHTML = '';
        sizes.items.forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'product-sizes-item';
          var a = document.createElement('a');
          a.href = item.link || '#';
          a.className = 'product-sizes-link' + (item.active ? ' active' : '');
          a.textContent = item.name;
          li.appendChild(a);
          sizesList.appendChild(li);
        });
      }
    }

    // Preço
    if (data.price) {
      var instEl = document.querySelector('[data-editable="priceInstallments"]');
      if (instEl && data.price.installments) {
        var label = data.price.installmentsLabel ? ' ' + data.price.installmentsLabel : '';
        instEl.textContent = data.price.installments + label;
      }

      var listEl = document.querySelector('[data-editable="priceList"]');
      if (listEl && data.price.listPrice) {
        listEl.textContent = data.price.listPrice;
      }

      var spotEl = document.querySelector('[data-editable="priceSpot"]');
      if (spotEl && data.price.spotPrice) {
        var spotText = 'R$ ' + data.price.spotPrice + ' à vista';
        if (data.price.pixPrice) {
          spotText += ' ou R$ ' + data.price.pixPrice + ' no Pix';
        }
        spotEl.textContent = spotText;
      }
    }

    // Descrição longa
    var descEl = document.querySelector('[data-editable="longDescription"]');
    if (descEl && data.longDescription) {
      descEl.innerHTML = data.longDescription;
    }

    // Link checkout
    var checkoutEl = document.querySelector('[data-editable="checkoutLink"]');
    if (checkoutEl && data.checkoutLink) {
      checkoutEl.href = data.checkoutLink;
    }
  }

  function run() {
    fetch(CONFIG_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('Não foi possível carregar ' + CONFIG_URL);
        return r.json();
      })
      .then(applyData)
      .catch(function (err) {
        console.warn('Erro ao carregar dados do produto:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
