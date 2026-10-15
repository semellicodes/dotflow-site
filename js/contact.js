/* Dotflow — formulário de contato: máscara, estados e envio ao FormSubmit.
   Ouve 'dotflow:plano' (disparado por js/plans.js) para refletir o plano
   escolhido nos campos ocultos e no rótulo do botão.
   Carregue ANTES de js/plans.js, que dispara o evento ao restaurar a seleção. */
(function () {
  'use strict';

  var form = document.getElementById('contato-form');
  var botao = form.querySelector('button[type=submit]');
  var aviso = form.querySelector('.status');
  var campoPlano = document.getElementById('campo-plano');
  var campoReplyTo = document.getElementById('campo-replyto');
  var campoEmail = document.getElementById('email');
  var assunto = document.getElementById('assunto');
  var tel = document.getElementById('whatsapp');
  var selecao = null;
  var enviando = false;

  function rotulo() { return selecao ? 'Solicitar orçamento' : 'Enviar mensagem'; }

  /* ---- plano escolhido ---- */
  document.addEventListener('dotflow:plano', function (e) {
    selecao = e.detail;
    // Campo desabilitado não entra no FormData: contato geral não manda plano.
    campoPlano.disabled = !selecao;
    campoPlano.value = selecao ? selecao.nome + ' — ' + selecao.preco : '';
    assunto.value = selecao
      ? 'Orçamento — plano ' + selecao.nome
      : 'Novo contato pelo site Dotflow';
    botao.textContent = rotulo();
  });

  /* ---- whatsapp: aceita fixo (10 dígitos) e celular (11) ---- */
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = !d ? ''
      : d.length < 3 ? '(' + d
      : d.length < 7 ? '(' + d.slice(0, 2) + ') ' + d.slice(2)
      : d.length < 11 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6)
      : '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    tel.setCustomValidity('');
  });
  tel.addEventListener('invalid', function () {
    tel.setCustomValidity('Informe o WhatsApp com DDD, por exemplo (11) 98765-4321.');
  });

  /* ---- envio ----
     O e-mail visível vai como "email" para o FormSubmit mostrar um rótulo
     legível; _replyto é o espelho oculto que faz o Responder voltar ao cliente. */
  campoEmail.addEventListener('input', function () {
    campoReplyTo.value = campoEmail.value;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;           // trava o envio duplo por Enter durante o envio
    enviando = true;
    campoReplyTo.value = campoEmail.value;
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    aviso.className = 'status';
    aviso.textContent = '';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        // O FormSubmit responde 200 mesmo em falha: quem decide é o campo success.
        if (String(dados.success) !== 'true') throw new Error(dados.message || 'falhou');
        form.reset();
        campoReplyTo.value = '';
        document.dispatchEvent(new CustomEvent('dotflow:limpar-plano'));
        aviso.textContent = 'Mensagem enviada! Respondemos em até 24 horas.';
      })
      .catch(function () {
        // Em falha os campos ficam como estão: ninguém perde o que escreveu.
        aviso.className = 'status erro';
        aviso.innerHTML = 'Não foi possível enviar agora. Chame no WhatsApp ou escreva para ' +
          '<a href="mailto:dotflowcriacoes@gmail.com">dotflowcriacoes@gmail.com</a>.';
      })
      .finally(function () {
        enviando = false;
        botao.disabled = false;
        botao.textContent = rotulo();
      });
  });
})();
