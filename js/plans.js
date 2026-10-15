/* Dotflow — seleção, troca e persistência dos planos.
   Não toca no formulário: avisa quem interessa pelo evento
   'dotflow:plano', cujo detail é o plano escolhido ou null.
   Carregue depois de js/contact.js, que registra o ouvinte. */
(function () {
  'use strict';

  var CHAVE = 'df-plano';
  var resumo = document.getElementById('resumo-plano');
  var focoPendente = null;

  // Lê sempre do card: preço e descrição não têm cópia no JavaScript,
  // então mudar um valor na seção Planos já reflete aqui.
  function lerCard(card) {
    var preco = card.querySelector('.preco');
    var prefixo = preco.querySelector('.prefixo');
    var valor = [].filter.call(preco.childNodes, function (n) { return n.nodeType === 3; })
                  .map(function (n) { return n.textContent.trim(); }).join(' ').trim();
    return {
      nome: card.querySelector('h3').textContent.trim(),
      preco: (prefixo ? prefixo.textContent.trim().toLowerCase() + ' ' : '') + valor +
             ' · ' + preco.querySelector('small').textContent.trim().toLowerCase(),
      desc: card.querySelector('li').textContent.trim()
    };
  }

  function acharCard(nome) {
    return [].filter.call(document.querySelectorAll('.plano'), function (c) {
      return c.querySelector('h3').textContent.trim() === nome;
    })[0] || null;
  }

  function selecionar(plano) {
    document.getElementById('resumo-nome').textContent = plano ? plano.nome : '';
    document.getElementById('resumo-preco').textContent = plano ? plano.preco : '';
    document.getElementById('resumo-desc').textContent = plano ? plano.desc : '';
    resumo.hidden = !plano;

    try {
      if (plano) sessionStorage.setItem(CHAVE, plano.nome);
      else sessionStorage.removeItem(CHAVE);
    } catch (e) {}

    document.dispatchEvent(new CustomEvent('dotflow:plano', { detail: plano }));
  }

  document.querySelectorAll('.plano .btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selecionar(lerCard(btn.closest('.plano')));
      // Espera a rolagem até #contato terminar antes de pôr o cursor no primeiro campo.
      clearTimeout(focoPendente);
      focoPendente = setTimeout(function () {
        document.getElementById('nome').focus({ preventScroll: true });
      }, 600);
    });
  });

  // "Trocar plano" é um link para #planos: mantém a seleção e os campos preenchidos.
  // Só cancela o foco pendente, que senão puxaria o cursor no meio da rolagem.
  document.querySelector('.resumo-trocar').addEventListener('click', function () {
    clearTimeout(focoPendente);
  });

  // "Remover" volta ao contato geral sem sair do formulário e sem mexer nos campos.
  // O foco vai para o <form> (tabindex -1) porque o botão some junto com o resumo.
  document.getElementById('limpar-plano').addEventListener('click', function () {
    clearTimeout(focoPendente);
    selecionar(null);
    document.getElementById('contato-form').focus({ preventScroll: true });
  });

  // Outros módulos pedem a limpeza por evento, sem simular clique no botão.
  document.addEventListener('dotflow:limpar-plano', function () { selecionar(null); });

  // Restaura só pelo nome e confere contra os cards: nome desconhecido é descartado,
  // então um sessionStorage antigo ou adulterado nunca entra no formulário.
  try {
    var salvo = sessionStorage.getItem(CHAVE);
    var card = salvo && acharCard(salvo);
    if (card) selecionar(lerCard(card));
    else if (salvo) sessionStorage.removeItem(CHAVE);
  } catch (e) {}
})();
