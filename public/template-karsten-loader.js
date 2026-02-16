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

    // Título (atualiza todos os elementos com data-editable="title")
    if (data.title) {
      document.querySelectorAll('[data-editable="title"]').forEach(function (el) {
        if (el.tagName === 'TITLE') {
          document.title = data.title;
        } else {
          el.textContent = data.title;
        }
      });
    }

    // Meta description
    if (data.shortDescription) {
      document.querySelectorAll('meta[name="description"][data-editable="shortDescription"]').forEach(function (el) {
        el.setAttribute('content', data.shortDescription);
      });
    }

    // Imagem principal
    if (data.images && data.images[0]) {
      document.querySelectorAll('[data-editable="mainImage"]').forEach(function (img) {
        img.src = data.images[0];
        img.alt = data.title || 'Produto';
      });
    }

    // Tamanhos
    var sizes = data.sizes;
    if (sizes) {
      if (sizes.title) {
        document.querySelectorAll('[data-editable="sizesTitle"]').forEach(function (el) {
          el.textContent = sizes.title;
        });
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
      if (data.price.installments) {
        var label = data.price.installmentsLabel ? ' ' + data.price.installmentsLabel : '';
        document.querySelectorAll('[data-editable="priceInstallments"]').forEach(function (el) {
          el.textContent = data.price.installments + label;
        });
      }

      if (data.price.listPrice) {
        document.querySelectorAll('[data-editable="priceList"]').forEach(function (el) {
          el.textContent = data.price.listPrice;
        });
      }

      if (data.price.spotPrice) {
        var spotText = 'R$ ' + data.price.spotPrice + ' à vista';
        if (data.price.pixPrice) {
          spotText += ' ou R$ ' + data.price.pixPrice + ' no Pix';
        }
        document.querySelectorAll('[data-editable="priceSpot"]').forEach(function (el) {
          el.textContent = spotText;
        });
      }
    }

    // Descrição longa
    if (data.longDescription) {
      document.querySelectorAll('[data-editable="longDescription"]').forEach(function (el) {
        el.innerHTML = data.longDescription;
      });
    }

    // Link checkout
    if (data.checkoutLink) {
      document.querySelectorAll('[data-editable="checkoutLink"]').forEach(function (el) {
        el.href = data.checkoutLink;
      });
    }
  }

  function run() {
    // Se os dados já estão disponíveis via window.PRODUCT_DATA (injetado pelo Next.js), use-os
    if (typeof window !== 'undefined' && window.PRODUCT_DATA) {
      console.log('Dados carregados de window.PRODUCT_DATA:', window.PRODUCT_DATA);
      applyData(window.PRODUCT_DATA);
      console.log('Dados aplicados com sucesso');
      return;
    }

    // Caso contrário, tenta carregar do JSON (para uso standalone)
    console.log('Carregando dados de:', CONFIG_URL);
    fetch(CONFIG_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('Não foi possível carregar ' + CONFIG_URL + ' (status: ' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        console.log('Dados carregados:', data);
        applyData(data);
        console.log('Dados aplicados com sucesso');
      })
      .catch(function (err) {
        console.error('Erro ao carregar dados do produto:', err);
        console.error('Certifique-se de que product-data.json está na mesma pasta que template-karsten.html');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
