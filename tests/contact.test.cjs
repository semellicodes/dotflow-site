const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

function iniciar(fetch) {
  const elementos = {};
  function elemento(id, value = '') {
    return elementos[id] = { value, textContent: '', disabled: false,
      eventos: {}, addEventListener(tipo, callback) { this.eventos[tipo] = callback; } };
  }
  const botao = elemento('botao');
  const aviso = elemento('aviso');
  const form = elemento('contato-form');
  form.action = 'https://formsubmit.co/ajax/teste';
  form.querySelector = seletor => seletor === '.status' ? aviso : botao;
  form.reset = () => { form.limpo = true; };
  for (const id of ['campo-plano', 'campo-replyto', 'email', 'whatsapp', 'nome', 'msg']) elemento(id);
  elemento('assunto', 'Novo contato pelo site Dotflow');
  elemento('contato-email').href = 'mailto:dotflowcriacoes@gmail.com';
  elementos['campo-plano'].disabled = true;
  const eventos = {};
  const temporizador = {};
  const document = { getElementById: id => elementos[id],
    addEventListener: (tipo, callback) => { eventos[tipo] = callback; },
    dispatchEvent: evento => { if (eventos[evento.type]) eventos[evento.type](evento); } };
  class FormData extends Map {
    constructor() {
      super(['nome', 'email', 'whatsapp', '_replyto', '_subject', 'mensagem', 'plano']
        .map((nome, i) => [nome, elementos[['nome', 'email', 'whatsapp', 'campo-replyto',
          'assunto', 'msg', 'campo-plano'][i]]])
        .filter(([, campo]) => !campo.disabled).map(([nome, campo]) => [nome, campo.value]));
    }
  }
  runInNewContext(readFileSync(require.resolve('../js/contact.js'), 'utf8'), {
    document, FormData, fetch, AbortController,
    CustomEvent: class { constructor(type) { this.type = type; } },
    setTimeout(callback, duracao) { Object.assign(temporizador, { callback, duracao }); return 1; },
    clearTimeout() { temporizador.limpo = true; }
  });
  return { elementos, botao, aviso, form, eventos, temporizador,
    enviar: async () => { form.eventos.submit({ preventDefault() {} });
      await new Promise(resolve => setImmediate(resolve)); } };
}

test('a demora encerra a espera sem limpar campos ou deixar o botão preso', async () => {
  let sinal;
  const app = iniciar((url, opcoes) => new Promise((resolve, reject) => {
    sinal = opcoes.signal;
    sinal.addEventListener('abort', () => reject(new Error('abortado')));
  }));
  app.elementos.msg.value = 'Projeto com detalhes';
  await app.enviar();
  assert.equal(app.temporizador.duracao, 75000);
  assert.equal(app.botao.disabled, true);
  app.temporizador.callback();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sinal.aborted, true);
  assert.equal(app.botao.disabled, false);
  assert.equal(app.elementos.msg.value, 'Projeto com detalhes');
  assert.equal(app.form.limpo, undefined);
  assert.match(app.aviso.textContent, /Não conseguimos confirmar/);
  assert.equal(app.temporizador.limpo, true);
});

test('o e-mail preserva caracteres especiais e inclui somente o plano selecionado', () => {
  const app = iniciar();
  app.elementos.nome.value = 'Ana & João';
  app.elementos.msg.value = 'Orçamento?\nAção & café #1';
  const link = app.elementos['contato-email'];
  link.eventos.click();
  let url = new URL(link.href);
  assert.equal(url.pathname, 'dotflowcriacoes@gmail.com');
  assert.match(url.searchParams.get('body'), /Ana & João/);
  assert.match(url.searchParams.get('body'), /Orçamento\?\nAção & café #1/);
  assert.doesNotMatch(url.searchParams.get('body'), /Plano /);
  app.eventos['dotflow:plano']({ detail: { nome: 'Essencial', preco: 'R$ 600' } });
  link.eventos.click();
  url = new URL(link.href);
  assert.match(url.searchParams.get('body'), /Plano Essencial/);
  assert.match(url.searchParams.get('subject'), /Essencial/);
  assert.equal((link.href.match(/\?subject=/g) || []).length, 1);
});

test('somente a confirmação bem-sucedida limpa o formulário', async () => {
  for (const resposta of [{ ok: false, success: true }, { ok: true, success: false },
    { ok: true, success: true }]) {
    const app = iniciar(async () => ({ ok: resposta.ok, json: async () => resposta }));
    await app.enviar();
    assert.equal(!!app.form.limpo, resposta.ok && resposta.success);
    assert.equal(app.botao.disabled, false);
    assert.equal(app.temporizador.limpo, true);
  }
});
