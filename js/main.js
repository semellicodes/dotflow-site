/* Dotflow — navegação e comportamentos gerais. */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var toggle = document.querySelector('.menu-toggle');

  function aberto() { return nav.classList.contains('open'); }

  // O ciclo é o cabeçalho inteiro, em ordem de DOM: links do menu, botão de tema
  // e o próprio hambúrguer. Prender só os links deixava o botão de tema entrar
  // fora de ordem e o hambúrguer inalcançável pelo teclado.
  function focaveisDoCabecalho() {
    var cabecalho = toggle.closest('header');
    return [].filter.call(
      cabecalho.querySelectorAll('a[href], button:not([disabled])'),
      function (e) { return e.offsetParent !== null; }
    );
  }

  function abrir() {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu');
    var primeiroLink = nav.querySelector('a[href]');
    if (primeiroLink) primeiroLink.focus();
  }

  function fechar(devolverFoco) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    if (devolverFoco) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    if (aberto()) fechar(true); else abrir();
  });

  // Escolher um destino fecha o menu, senão ele cobre a seção de chegada.
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') fechar(false);
  });

  // Esc fecha e devolve o foco ao botão, de onde a pessoa veio.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aberto()) {
      e.preventDefault();
      fechar(true);
    }
  });

  // Enquanto o menu está aberto o Tab circula entre os links e o próprio botão:
  // sem isso o foco entra no conteúdo que está atrás do painel.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !aberto()) return;
    var ciclo = focaveisDoCabecalho();
    if (!ciclo.length) return;
    var primeiro = ciclo[0], ultimo = ciclo[ciclo.length - 1];
    var atual = document.activeElement;
    if (ciclo.indexOf(atual) === -1) {           // foco escapou: traz de volta
      e.preventDefault();
      (e.shiftKey ? ultimo : primeiro).focus();
    } else if (e.shiftKey && atual === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && atual === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  // Tocar fora do painel também fecha, sem roubar o foco de onde a pessoa tocou.
  document.addEventListener('click', function (e) {
    if (aberto() && !nav.contains(e.target) && !toggle.contains(e.target)) fechar(false);
  });

  // Ao voltar para a largura de desktop o menu some do caminho: o estado "aberto"
  // não faz mais sentido e deixaria o aria-expanded mentindo.
  var larguraMobile = window.matchMedia('(max-width: 640px)');
  var aoMudarLargura = function (e) { if (!e.matches && aberto()) fechar(false); };
  if (larguraMobile.addEventListener) larguraMobile.addEventListener('change', aoMudarLargura);
  else if (larguraMobile.addListener) larguraMobile.addListener(aoMudarLargura);
})();
