# Dotflow — site institucional

Site de uma página da **Dotflow** (web · soluções digitais): apresentação, serviços,
planos com valores, seção institucional e formulário de orçamento.

> Ideias que se tornam presença.

## Estrutura

```
index.html            estrutura e conteúdo da página
css/
  variables.css       tokens de design e as duas paletas de tema
  style.css           layout, componentes e seções
  responsive.css      media queries (900px e 640px)
js/
  theme.js            alternância e persistência do tema
  main.js             menu e navegação
  contact.js          máscara, validação, estados e envio do formulário
  plans.js            seleção, troca e persistência dos planos
assets/
  favicon.svg         marca da Dotflow
  og-dotflow.png      imagem de compartilhamento, 1200x630
robots.txt            indexação
sitemap.xml           mapa do site
```

**Sem build, sem bundler, sem framework, sem dependências de pacote.** São arquivos
estáticos servidos como estão. Os scripts usam `defer` e rodam na ordem em que
aparecem no HTML — ordem que importa, veja abaixo.

### Como os scripts conversam

`plans.js` cuida dos cards e `contact.js` cuida do formulário; eles não se enxergam
diretamente. Quando um plano é escolhido ou removido, `plans.js` dispara o evento
`dotflow:plano` no `document`, com o plano (ou `null`) em `detail`. `contact.js`
escuta e atualiza os campos ocultos e o rótulo do botão. No sentido inverso,
`contact.js` dispara `dotflow:limpar-plano` depois de um envio bem-sucedido.

> **Ordem obrigatória no HTML:** `contact.js` antes de `plans.js`. O ouvinte precisa
> existir quando `plans.js` restaura uma seleção guardada, logo na carga.

Cada arquivo roda dentro de uma IIFE com `'use strict'`: nada vaza para `window`.

## Rodando localmente

Qualquer servidor estático serve. O formulário **não funciona** ao abrir o arquivo
direto pelo `file://` — o FormSubmit recusa requisições sem origem HTTP, e os
arquivos de CSS e JS também podem ser bloqueados.

```bash
python3 -m http.server 4321
```

Depois abra <http://localhost:4321>.

O `.claude/launch.json` tem essa mesma configuração, usada pelo preview do
Claude Code. Pode ser removido sem afetar o site.

## Temas

O escuro é o padrão da marca; o claro é uma paleta desenhada à parte, não uma
inversão. O botão fica no cabeçalho e funciona em qualquer largura.

**Como a escolha é decidida**, nessa ordem:

1. o que estiver em `localStorage` na chave `df-tema` (`claro` ou `escuro`);
2. a preferência do sistema operacional;
3. escuro, se nada for detectável.

Um script inline no `<head>`, sem `defer`, aplica o tema **antes do primeiro pixel**
— é por isso que ele não está em `js/theme.js` e não deve ser movido: tirá-lo dali
faz a página piscar no tema errado. O `theme.js` cuida do resto: o botão, a
persistência e o acompanhamento do sistema enquanto ninguém escolheu nada.

### Editando as cores

Tudo em `css/variables.css`. As duas paletas ficam declaradas lado a lado com os
prefixos `--c-` (claro) e `--e-` (escuro), e o tema apenas aponta os tokens de uso
(`--bg`, `--fg`, `--muted`, …) para uma delas. **Nenhum valor é escrito duas vezes.**

Três decisões que convém manter:

- **Hero, Sobre e CTA seguem o tema** pelos tokens `--faixa-*`: grafite no escuro,
  branco no claro. As ilustrações acompanham pelos tokens `--ui-*`, um por papel
  (superfície, linha, ponto, texto), em vez de cores soltas dentro do SVG.
- **A lavanda `#A78BFA` não serve como texto sobre fundo claro** (2,56:1). Para texto e
  ícones existe `--accent-forte`: `#6D28D9` no claro, `#C4B5FD` no escuro.
- **A seção Planos usa `--secao-alt`**, um tom à parte de `--surface`, senão os cards
  brancos somem no fundo branco do tema claro.

## Planos

Edite só o card do plano na seção `#planos` do `index.html`. O resumo que aparece no
formulário é lido do próprio card em tempo de execução — não existe cópia dos valores
no JavaScript, então preço e descrição não ficam fora de sincronia.

Em `sessionStorage` guarda-se apenas o **nome** do plano (`df-plano`). Ao recarregar,
`plans.js` procura o card com esse nome: se não existir, descarta. Um valor antigo ou
adulterado nunca chega ao formulário.

## Formulário de contato

Os contatos chegam em **dotflowcriacoes@gmail.com** pelo endpoint AJAX do FormSubmit.

O formulário aguarda a confirmação do serviço por até 75 segundos. Se houver falha
ou demora, preserva os campos e informa que não foi possível confirmar o envio.
Cancelar a espera não garante que o FormSubmit deixou de processar a mensagem.

A opção "enviar por e-mail" funciona independentemente do FormSubmit e abre o
aplicativo de e-mail do visitante com os dados atuais e o plano escolhido. O
visitante ainda precisa enviar a mensagem nesse aplicativo.

Os testes do formulário rodam com `node --test tests/contact.test.cjs`, sem instalar
dependências. O Node é usado somente nos testes, não para servir ou publicar o site.

Campos enviados: `nome`, `email`, `whatsapp`, `mensagem`, `plano` (só quando um plano
foi escolhido), mais `_subject`, `_replyto`, `_template` e `_honey` (campo-armadilha
anti-robô).

### Limites de segurança — leia antes de confiar no formulário

- O endereço de e-mail fica **visível no HTML**, pois faz parte da URL do endpoint.
  É assim que o FormSubmit funciona; para esconder é preciso trocar o endereço pelo
  token alfanumérico que eles fornecem após a ativação.
- A validação dos campos é **só do navegador**. Qualquer pessoa pode enviar um POST
  direto ao endpoint com qualquer conteúdo. O `_honey` barra robôs simples, não
  envios manuais.
- `_captcha` está **desligado** para o envio não sair da página. Se começar a chegar
  spam, ligue o captcha ou troque por um endpoint próprio.
- Não há limite de taxa nem registro dos envios.

### Trocar o destino

Mude o `action` do `<form id="contato-form">`. Nenhuma outra parte do código depende
disso.

## Publicação

Por ser estático, qualquer hospedagem serve: Vercel, GitHub Pages, Netlify,
Cloudflare Pages ou um servidor comum. **Não há build**: sem `package.json`, sem
bundler. No Vercel: framework *Other*, build command vazio, output a raiz do repo.
Nenhuma variável de ambiente é necessária.

### Domínios

O site responde em **dotflowweb.com.br**, que é o domínio marcado como *Production*
na Vercel. O `www.dotflowweb.com.br` redireciona para ele com 308, e o
`dotflowweb.vercel.app` continua ativo.

Se o domínio principal mudar, quatro lugares precisam acompanhar — senão o canonical
e a prévia de compartilhamento apontam para um endereço que não serve o site:

| Arquivo | O quê |
|---|---|
| `index.html` | `canonical` e `og:url` |
| `index.html` | `og:image` e `twitter:image` |
| `robots.txt` | linha `Sitemap:` |
| `sitemap.xml` | `<loc>` e `<lastmod>` |

> **Armadilha ao trocar de domínio:** a ativação do FormSubmit é por **domínio**, não
> só por endpoint. Num endereço novo o formulário volta a responder
> `"This form needs Activation"` e **para de enviar** até alguém clicar no link de
> ativação que chega por e-mail. O visitante só vê a mensagem de erro e vai embora,
> sem avisar ninguém. Por isso, **o primeiro teste depois de apontar qualquer
> domínio novo é enviar o formulário** e confirmar a chegada do e-mail.

## Rodapé

Três colunas no desktop (marca, Site, Contato), duas no tablet com a marca ocupando
a linha inteira, e uma coluna empilhada no celular. A barra de direitos autorais
quebra em linhas separadas abaixo de 640px.

A coluna "Site" é um `<nav>`. Atenção: a regra do menu mobile precisa continuar
escrita como `header nav`, senão esconde também essa coluna.

## Acessibilidade

- Contrastes conferidos no padrão WCAG AA **nos dois temas**, medindo cada elemento
  de texto contra o fundo real.
- `prefers-reduced-motion: reduce` desliga **todas** as animações e transições, e
  também a rolagem suave. A regra é um `*` de rede, não uma lista de classes: assim
  uma animação nova nasce coberta.
- Não há tags `<img>` — toda a arte é SVG embutido. Os decorativos levam
  `aria-hidden="true"`; as duas ilustrações que comunicam algo têm `role="img"` e
  `aria-label`.
- **Menu mobile**: `aria-expanded` e `aria-label` mudam ao abrir e fechar, Esc fecha
  devolvendo o foco ao botão, clique fora fecha, e enquanto está aberto o Tab circula
  dentro do cabeçalho em vez de cair no conteúdo atrás. Voltar para a largura de
  desktop também encerra o estado aberto.
