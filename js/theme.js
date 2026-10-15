/* Dotflow — alternância de tema.
   O tema já foi aplicado pelo script antiflash no <head>; aqui só ficam
   o botão, a persistência e o acompanhamento da preferência do sistema. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var botao = document.getElementById('tema');
  var metaCor = document.querySelector('meta[name="theme-color"]');
  var CHAVE = 'df-tema';
  var CORES = { escuro: '#131317', claro: '#F8F8F6' };

  function atual() {
    return raiz.getAttribute('data-tema') === 'escuro' ? 'escuro' : 'claro';
  }

  function aplicar(tema, guardar) {
    raiz.setAttribute('data-tema', tema);
    if (metaCor) metaCor.setAttribute('content', CORES[tema]);
    botao.setAttribute('aria-pressed', String(tema === 'escuro'));
    botao.setAttribute('aria-label',
      tema === 'escuro' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
    if (guardar) {
      try { localStorage.setItem(CHAVE, tema); } catch (e) {}
    }
  }

  aplicar(atual(), false);

  botao.addEventListener('click', function () {
    aplicar(atual() === 'escuro' ? 'claro' : 'escuro', true);
  });

  // Enquanto a pessoa não escolher nada, segue o sistema em tempo real.
  var consulta = window.matchMedia('(prefers-color-scheme: dark)');
  var ouvir = function (e) {
    var escolhido = null;
    try { escolhido = localStorage.getItem(CHAVE); } catch (err) {}
    if (!escolhido) aplicar(e.matches ? 'escuro' : 'claro', false);
  };
  if (consulta.addEventListener) consulta.addEventListener('change', ouvir);
  else if (consulta.addListener) consulta.addListener(ouvir);
})();
