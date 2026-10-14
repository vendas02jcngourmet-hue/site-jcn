'use strict';
/* =====================================================================
   PORTAIS (login, CMS, vendas internas, e-commerce)
   Autenticação simulada no protótipo; os perfis e permissões abaixo
   espelham as políticas RLS do schema.sql.
   ===================================================================== */
// Representante entra por Vendas internas como o vendedor, mas só faz pedidos: não cria contas nem altera nada.
const PAPEIS = { admin: 'Administrador', vendedor: 'Vendedor', representante: 'Representante', ecommerce: 'E-commerce' };
const GRELHAS = { ferro: 'Ferro fundido', aco: 'Aço carbono' };
// o que distingue o item dentro do modelo, e o nome que vai para o pedido
const detalhe = p => p.grelha ? 'Grelha ' + GRELHAS[p.grelha].toLowerCase() : p.cor;
const rotulo = p => p.grelha ? `${p.nome}, grelha ${GRELHAS[p.grelha].toLowerCase()}` : p.cat === 'colors' ? `${p.nome} (${p.cor})` : p.nome;
// Fogão com as duas grelhas = dois produtos (código e preço próprios) do mesmo grupo: nas vitrines viram um cartão só.
// Aceita produtos ou pares { p, preco } (catálogo de uma loja).
function modelos(lista) { const m = new Map(); lista.forEach(x => { const p = x.p || x, k = p.grupo || p.id; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return [...m.values()]; }
// Forno é opcional e é outro produto: aqui saem os fornos avulsos que servem no fogão e que a pessoa pode comprar
// (na loja, só os que o administrador liberou, pelo valor da conta).
function fornosDe(p, ctx, u) {
  const lib = ctx === 'loja' ? ((u || {}).liberados || {}) : null;
  return (p.fornos || []).map(prod).filter(f => f && f.ativo && (cat(f.cat) || {}).ativa && (lib ? lib[f.id] > 0 : ctx === 'site' ? precoSite(f) > 0 : f.preco > 0)).map(f => ({ p: f, preco: lib ? lib[f.id] : ctx === 'site' ? precoSite(f) : f.preco }));
}
const nomeForno = (f, curto) => f.nome.replace(/^Forno avulso\s+/i, '').replace(curto ? /\s*\(Perfil \d\)$/ : /^$/, '').replace(/^./, c => c.toUpperCase());   // na ficha do fogão o Perfil já está no título
const rotuloOpcoes = (varias, forno) => varias ? (forno ? 'Escolher grelha e forno' : 'Escolher a grelha') : 'Adicionar, com ou sem forno';
// Todo fogão mostra os dois blocos na ficha: grelha (obrigatória) e forno (opcional), mesmo quando só há uma grelha
// ou quando o forno já vem no fogão. A ficha fica igual em todos, e a pessoa vê por que não há o que escolher.
const specDe = (p, k) => { const s = (p.specs || []).find(x => String(x[0]).trim().toLowerCase() === k); return s ? s[1] : ''; };
const grelhaDe = p => p.grelha ? GRELHAS[p.grelha] : specDe(p, 'grelha');
const ehFogao = p => !!grelhaDe(p);
const ONDE = { loja: ['Adicionar ao carrinho', 'no carrinho'], site: ['Adicionar à sacola', 'na sacola'], venda: ['Adicionar ao pedido', 'no pedido'] };
const NAV = {
  admin: [['produtos', 'Produtos'], ['categorias', 'Categorias'], ['conteudo', 'Site e galeria'], ['catalogo', 'Tabela de preços'], ['lojas', 'Contas e-commerce'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Pedidos'], ['financeiro', 'Financeiro'], ['usuarios', 'Usuários']],
  vendedor: [['catalogo', 'Catálogo e preços'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Pedidos'], ['lojas', 'Contas e-commerce']],
  representante: [['catalogo', 'Catálogo e preços'], ['novo-pedido', 'Lançar pedido'], ['pedidos', 'Meus pedidos']],
  ecommerce: [['loja', 'Produtos'], ['carrinho', 'Carrinho'], ['pedidos', 'Meus pedidos']]
};
const PIX = { sem: ['Sem comprovante', 'warn'], analise: ['Comprovante em análise', 'info'], verificado: ['PIX verificado', 'ok'], recusado: ['Comprovante recusado', 'bad'] };
const ENVIO = { aguardando: ['Aguardando pagamento', ''], expedicao: ['Em expedição', 'info'], enviado: ['Enviado', 'ok'] };
// Pagamento: PIX (comprovante conferido) ou, nos pedidos lançados pelo vendedor, boleto parcelado.
// O boleto só vale depois de aprovado pelo financeiro (administração); até lá o pedido não segue para a expedição.
const BOLETO_DIAS = [1, 2, 3, 4, 5, 15, 28, 30, 45, 60, 75, 90];
const BOLETO = { pendente: ['Boleto aguardando o financeiro', 'warn'], aprovado: ['Boleto aprovado', 'ok'], recusado: ['Boleto recusado', 'bad'] };
const ehBoleto = p => !!(p.pagamento && p.pagamento.forma === 'boleto');
const pagoOk = p => ehBoleto(p) ? p.pagamento.status === 'aprovado' : p.pix.status === 'verificado';
const paraConferir = p => ehBoleto(p) ? p.pagamento.status === 'pendente' : p.pix.status === 'analise';
const chipPag = p => chip(ehBoleto(p) ? BOLETO[p.pagamento.status] : PIX[p.pix.status]);
const somaDias = (iso, d) => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const hojeISO = () => { const t = new Date(); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
// parcelas iguais, em centavos; a diferença do arredondamento vai na última. O prazo conta da data do pedido.
function planoBoleto(total, dias, base) {
  const c = Math.round(total * 100), n = dias.length, cada = Math.floor(c / n);
  return dias.map((d, i) => ({ n: i + 1, de: n, dias: d, vence: somaDias(base, d), valor: (i === n - 1 ? c - cada * (n - 1) : cada) / 100 }));
}
const parcelasDe = p => planoBoleto(totalPedido(p), p.pagamento.dias, p.criado).map(x => ({ ...x, recebida: (p.pagamento.recebidas || []).includes(x.dias) }));
const prazosTxt = dias => dias.length + (dias.length > 1 ? ' parcelas: ' : ' parcela: ') + dias.join(', ') + (dias.length === 1 && dias[0] === 1 ? ' dia' : ' dias');
// loja de e-commerce -> vendedor responsável por ela
const vendedores = () => state.usuarios.filter(u => u.papel === 'vendedor');
const respDe = p => p.origem === 'ecommerce' ? ((user(p.vendedor) || {}).vendedorResp || null) : null;
let sessao = null, scrollSite = 0;
const eu = () => state.usuarios.find(u => u.id === sessao && u.ativo) || null;
const user = id => state.usuarios.find(u => u.id === id);
const chip = ([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`;
const kb = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const precoTxt = v => v > 0 ? brl(v) : 'A definir';   // o catálogo não traz preços: zero é "ainda sem preço"
const totalPedido = p => p.itens.reduce((s, i) => s + i.qtd * i.preco, 0);
const novoPedidoVazio = () => ({ cliente: { nome: '', doc: '', cidade: '' }, itens: [{ produto: '', qtd: 1 }], obs: '', comprovante: null, forma: 'pix', dias: [] });

function abrirApp(portal) {
  if (portal) ui.portal = portal;
  scrollSite = scrollY; $('#site').hidden = true; $('#app').hidden = false; scrollTo(0, 0); renderApp();
  try { sessionStorage.setItem('jcn-area', '1'); } catch (e) { }
  const v = $('#vitrine'); if (v) v.innerHTML = '';                    // a loja do site só existe na tela enquanto o site está aberto
}
function voltarSite() {
  fecharDrawer(); $('#app').hidden = true; $('#site').hidden = false; renderSite(); scrollTo(0, scrollSite); quadro();
  try { sessionStorage.removeItem('jcn-area'); } catch (e) { }
}
function entrarComo(u) {
  sessao = u.id;
  ui.erro = ''; ui.view = NAV[u.papel][0][0]; ui.pedido = null; ui.carrinho = null; ui.checkout = null; ui.acesso = null; renderApp(); scrollTo(0, 0);
}

function renderApp() {
  const u = eu(), app = $('#app');
  if (!u) { app.innerHTML = vLogin(); $('.login-art').style.backgroundImage = `url(${IMG.cover})`; return; }
  const nav = NAV[u.papel] || NAV.vendedor; if (!nav.find(n => n[0] === ui.view)) ui.view = nav[0][0];
  const views = { produtos: vProdutos, categorias: vCategorias, conteudo: vConteudo, catalogo: vCatalogo, lojas: vLojas, loja: vLoja, carrinho: vCarrinho, 'novo-pedido': vNovoPedido, pedidos: vPedidos, financeiro: vFinanceiro, usuarios: vUsuarios };
  const selo = id => { const n = id === 'carrinho' ? qtdCarrinho() : (id === 'pedidos' || id === 'financeiro') && u.papel === 'admin' ? state.pedidos.filter(p => id === 'financeiro' ? ehBoleto(p) && paraConferir(p) : paraConferir(p)).length : 0; return n ? `<span class="badge" aria-label="${n} ${id === 'carrinho' ? 'no carrinho' : id === 'financeiro' ? 'boletos para aprovar' : 'com pagamento para conferir'}">${n}</span>` : ''; };
  app.innerHTML = `<div class="shell">
    <aside class="side">
      <span class="logo on-dark"><b>JCN</b><i>GOURMET</i></span>
      <div class="who"><b>${esc(u.nome)}</b>${esc(PAPEIS[u.papel])}, ${esc(u.empresa)}</div>
      <nav aria-label="Portal">${nav.map(([id, t]) => `<button data-act="nav" data-view="${id}" ${id === ui.view ? 'aria-current="page"' : ''}>${t}${selo(id)}</button>`).join('')}</nav>
      <div class="bottom"><button data-act="voltar-site">Ver o site</button><button data-act="minha-senha">Trocar senha</button><button data-act="sair">Sair</button></div>
    </aside>
    <section class="main">${views[ui.view](u)}</section></div>`;
}

/* ---------- login ---------- */
const PORTAIS = {
  vendas: ['Vendas internas', 'Para a equipe JCN, vendedores e representantes: tabela de preços, pedidos, comprovantes de PIX e etiquetas de envio.', 'Entrar no Portal de Vendas'],
  ecommerce: ['E-commerce', 'Para lojas online cadastradas pela JCN: produtos e valores liberados para a sua conta, carrinho, pagamento por PIX e envio das etiquetas.', 'Entrar na Área do E-commerce']
};
const portalDe = u => u.papel === 'ecommerce' ? 'ecommerce' : 'vendas';
function vLogin() {
  if (!PORTAIS[ui.portal]) ui.portal = 'vendas';
  const pt = ui.portal, loja = pt === 'ecommerce';
  return `<div class="login">
    <div class="login-art">
      <span class="logo on-dark"><b>JCN</b><i>GOURMET</i></span>
      <div><h1>Colors</h1><p>Área de login da JCN Gourmet: vendas internas e lojas de e-commerce, cada uma com o seu acesso.</p></div>
    </div>
    <div class="login-form">
      <button class="btn ghost sm" style="align-self:flex-start" data-act="voltar-site">Voltar ao site</button>
      <h2>Entrar</h2>
      <div class="tabs" role="tablist">
        ${Object.entries(PORTAIS).map(([k, v]) => `<button role="tab" aria-selected="${k === pt}" data-act="portal" data-portal="${k}">${v[0]}</button>`).join('')}
      </div>
      <p class="note" style="margin:0">${PORTAIS[pt][1]}</p>
      <label class="field"><span>${loja ? 'Login' : 'E-mail'}</span><input id="lgEmail" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
      <label class="field"><span>Senha</span><input id="lgSenha" type="password" autocomplete="current-password"></label>
      ${ui.erro ? `<p class="err" role="alert" style="margin:0">${esc(ui.erro)}</p>` : ''}
      <button class="btn" data-act="entrar">${PORTAIS[pt][2]}</button>
      <p class="note" style="margin:0">${loja ? 'O login e a senha de cada loja são criados pela JCN Gourmet. Se você esqueceu a senha, peça uma nova ao seu vendedor.' : 'Use o e-mail e a senha que a administração da JCN cadastrou para você.'}</p>
    </div></div>`;
}

/* ---------- CMS: produtos ---------- */
function vProdutos() {
  const f = ui.filtroCat || '', q = (ui.buscaProd || '').trim().toLowerCase(), todos = state.catalogo.produtos;
  const semPreco = p => !(p.preco > 0);
  const lista = todos.filter(p => (!f || p.cat === f) && (!ui.soSemPreco || semPreco(p)) && (!q || (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q)));
  const nSem = todos.filter(semPreco).length;
  return `<h1>Produtos</h1><p class="sub">Edite fotos, preços e especificações. O que estiver ativo aparece no site e nas tabelas de preço, sem mexer em código.</p>
  <div class="bar"><label class="sr" for="fc">Categoria</label><select id="fc" class="inp" style="width:auto" data-chg="filtro-cat"><option value="">Todas as categorias</option>${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === f ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
    <label class="sr" for="bp">Buscar produto</label><input id="bp" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-prod" value="${esc(ui.buscaProd || '')}">
    <label class="check" style="font-weight:600"><input type="checkbox" id="sp" data-act="so-sem-preco" ${ui.soSemPreco ? 'checked' : ''}>Só sem preço</label>
    <span class="grow"></span><button class="btn" data-act="novo-produto">Adicionar produto</button></div>
  <p class="note" style="margin:-4px 0 12px">${lista.length} de ${todos.length} produtos.${nSem ? ` ${nSem} ainda sem preço: enquanto o preço estiver "A definir", o item não entra em pedidos.` : ''}</p>
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Produto</th><th>Código</th><th>Categoria</th><th class="num">Preço</th><th>Ativo</th><th></th></tr></thead><tbody>
  ${lista.map(p => `<tr><td><div class="thumb">${p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="">` : ''}</div></td>
    <td><b>${esc(p.nome)}</b><br><span class="note">${p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`}${esc(detalhe(p))}${p.grupo ? ' · faz par com ' + esc(state.catalogo.produtos.filter(x => x.grupo === p.grupo && x.id !== p.id).map(x => x.codigo || x.nome).join(', ')) : ''}</span></td>
    <td>${esc(p.codigo) || '<span class="note">sem código</span>'}</td><td>${esc((cat(p.cat) || {}).nome || '')}</td><td class="num">${semPreco(p) ? '<span class="chip warn">A definir</span>' : brl(p.preco)}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-prod" data-id="${esc(p.id)}" ${p.ativo ? 'checked' : ''} aria-label="${esc(p.nome)} ativo"></td>
    <td><button class="btn ghost sm" data-act="editar-produto" data-id="${esc(p.id)}">Editar</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty">Nenhum produto com este filtro.</div>`}
  <p class="note">Cadastro conforme o Catálogo JCN 2026 e a Tabela de preços JCN de julho de 2026.</p>`;
}
function dProduto(d) {
  const novo = !prod(d.id);
  return `<h2 class="dt">${novo ? 'Novo produto' : 'Editar ' + esc(d.nome)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Nome</span><input data-f="nome" value="${esc(d.nome)}"></label><label class="field"><span>Código do modelo</span><input data-f="codigo" value="${esc(d.codigo)}"></label></div>
    <div class="grid2"><label class="field"><span>Categoria</span><select data-f="cat">${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === d.cat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
      <label class="field"><span>Nome da cor</span><input data-f="cor" value="${esc(d.cor)}"></label></div>
    <div class="grid2"><label class="field"><span>Amostra da cor</span><input type="color" data-f="hex" value="${esc(d.hex)}"></label><label class="field"><span>Frase de destaque</span><input data-f="slogan" value="${esc(d.slogan)}"></label></div>
    <label class="field"><span>História ou descrição</span><textarea data-f="historia">${esc(d.historia)}</textarea></label>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Especificações técnicas</h2><div class="rows">
    ${d.specs.map((s, i) => `<div class="row-line" style="grid-template-columns:1fr 1.4fr auto"><input class="inp" aria-label="Item" data-f="specs.${i}.0" value="${esc(s[0])}"><input class="inp" aria-label="Valor" data-f="specs.${i}.1" value="${esc(s[1])}"><button class="btn ghost sm" data-act="spec-rem" data-i="${i}" aria-label="Remover linha">×</button></div>`).join('')}
    <button class="btn ghost sm" style="justify-self:start" data-act="spec-add">Adicionar linha</button></div></div>
  <div class="panel"><h2>Preço</h2><div class="grid2">
    <label class="field"><span>Tabela JCN (R$)</span><input id="pdPreco" type="number" min="0" step="0.01" inputmode="decimal" data-f="preco" data-num value="${esc(d.preco)}"></label></div>
    <p class="note" style="margin:8px 0 0">Zero deixa o produto "A definir": ele não entra em pedidos até ter preço.</p>
    <label class="check" style="margin-top:10px"><input type="checkbox" data-f="mostrar_preco" ${d.mostrar_preco ? 'checked' : ''}>Mostrar o preço no site</label></div>
  <div class="panel"><h2>Opção de grelha</h2><div class="grid2">
    <label class="field"><span>Grelha deste código</span><select id="pdGrelha" data-f="grelha"><option value="">Não se aplica</option>${Object.entries(GRELHAS).map(([k, t]) => `<option value="${k}" ${k === d.grelha ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span>Mesmo fogão com a outra grelha</span><select id="pdPar" data-f="par"><option value="">Nenhum</option>${state.catalogo.produtos.filter(x => x.id !== d.id && x.cat === d.cat && x.grelha).map(x => `<option value="${esc(x.id)}" ${x.id === d.par ? 'selected' : ''}>${esc(x.codigo || 'sem código')} · ${esc(rotulo(x))}</option>`).join('')}</select></label></div>
    <p class="note" style="margin:8px 0 0">Dois códigos ligados aqui aparecem como um fogão só para o vendedor e para a loja, que escolhem a grelha ao abrir o produto.</p></div>
  ${d.cat === 'fornosavulsos' ? '' : (() => { const fs = state.catalogo.produtos.filter(x => x.cat === 'fornosavulsos' && x.id !== d.id), n = (d.fornos || []).length;
    return fs.length ? `<details class="panel dobra" ${n ? 'open' : ''}><summary><h2>Forno opcional</h2><span class="note" id="pdFornosN">${n ? n + (n > 1 ? ' fornos' : ' forno') : 'nenhum'}</span></summary>
    <p class="note" style="margin:0 0 10px">Marque os fornos avulsos que servem neste fogão. Na ficha, depois da grelha, a pessoa pode levar um deles ou ficar sem forno. O forno entra no pedido como item separado, pelo preço dele.${d.grelha ? ' Vale também para o código da outra grelha.' : ''}</p>
    <div class="marcas">${fs.map(f => `<label class="check"><input type="checkbox" data-act="forno-serve" data-id="${esc(f.id)}" ${(d.fornos || []).includes(f.id) ? 'checked' : ''}>${esc(nomeForno(f))} <span class="note">${esc(f.codigo)} · ${precoTxt(f.preco)}</span></label>`).join('')}</div></details>` : ''; })()}
  <div class="panel"><h2>Fotos</h2><div class="photos">
    ${d.fotos.map((r, i) => `<div class="ph"><img src="${src(r)}" alt=""><button data-act="foto-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    <label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-produto"></label></div>
    <p class="note" style="margin:8px 0 0">A primeira foto é a principal. As imagens são reduzidas antes de salvar.</p></div>
  <label class="check"><input type="checkbox" data-f="ativo" ${d.ativo ? 'checked' : ''}>Ativo no site e nas tabelas de preço</label>
  <div class="foot"><button class="btn" data-act="salvar-produto">Salvar produto</button><button class="btn ghost" data-act="fechar">Cancelar</button>
    ${novo ? '' : `<span style="flex:1"></span><button class="btn danger" data-act="remover-produto" data-confirm="Confirmar remoção">Remover produto</button>`}</div>`;
}

/* ---------- CMS: categorias e conteúdo ---------- */
function vCategorias() {
  return `<h1>Categorias</h1><p class="sub">Organize o catálogo. Categorias inativas somem do site, junto com seus produtos.</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th class="num">Produtos</th><th>Ativa</th><th></th></tr></thead><tbody>
  ${state.catalogo.categorias.map(c => { const n = state.catalogo.produtos.filter(p => p.cat === c.id).length; return `<tr>
    <td><input class="inp" aria-label="Nome da categoria" data-chg="cat-nome" data-id="${esc(c.id)}" value="${esc(c.nome)}"></td><td class="num">${n}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-cat" data-id="${esc(c.id)}" ${c.ativa ? 'checked' : ''} aria-label="${esc(c.nome)} ativa"></td>
    <td><button class="btn danger sm" data-act="cat-rem" data-id="${esc(c.id)}" data-confirm="Confirmar" ${n || c.id === 'colors' ? 'disabled title="Mova ou remova os produtos antes"' : ''}>Remover</button></td></tr>`; }).join('')}
  </tbody></table></div>
  <div class="bar" style="margin-top:14px"><label class="sr" for="novaCat">Nova categoria</label><input id="novaCat" class="inp" style="max-width:20rem" placeholder="Nome da nova categoria"><button class="btn" data-act="cat-add">Criar categoria</button></div>`;
}
function vConteudo() {
  const c = state.conteudo;
  const campo = (k, t, area) => `<label class="field"><span>${t}</span>${area ? `<textarea data-chg="conteudo" data-k="${k}">${esc(c[k])}</textarea>` : `<input data-chg="conteudo" data-k="${k}" value="${esc(c[k])}">`}</label>`;
  return `<h1>Site e galeria</h1><p class="sub">Textos da abertura e das cenas, e as fotos da seção "De perto". As mudanças valem assim que você sai do campo.</p>
  <div class="panel"><h2>Abertura</h2><div class="rows">${campo('heroTitulo', 'Título')}${campo('heroTexto', 'Texto de apoio', 1)}</div></div>
  <div class="panel"><h2>Legendas das cozinhas</h2><div class="rows">${campo('txtG', 'Cozinha gourmet', 1)}${campo('txtR', 'Cozinha residencial', 1)}</div></div>
  <div class="panel"><h2>Galeria</h2><div class="photos">
    ${c.galeria.map((r, i) => `<div class="ph"><img src="${src(r)}" alt=""><button data-act="gal-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    <label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-galeria"></label></div></div>
  <div class="panel"><h2>Loja do site (consumidor final)</h2>
    <p class="note" style="margin:0 0 10px">Fica no fim da página inicial, depois das outras linhas. Mostra os produtos ativos que têm preço, pelo valor da tabela JCN mais o acréscimo abaixo. Os pedidos chegam em Pedidos, com a origem "Loja do site".</p>
    <div class="grid2"><label class="field"><span>Acréscimo sobre a tabela (%)</span><input id="ljAcr" type="number" min="0" max="500" step="0.5" inputmode="decimal" data-chg="loja-site" data-k="acrescimo" value="${esc(c.loja.acrescimo)}"></label>
      <p class="note" id="ljExemplo" style="align-self:end;margin:0 0 8px">${(() => { const z = state.catalogo.produtos.find(p => p.preco > 0); return z ? `Exemplo: ${esc(z.nome)} sai de ${brl(z.preco)} na tabela para ${brl(precoSite(z))} no site.` : ''; })()}</p></div>
    <label class="check" style="margin-top:10px"><input type="checkbox" id="ljAtiva" data-chg="loja-site" data-k="ativa" ${c.loja.ativa ? 'checked' : ''}>Loja aberta na página inicial</label></div>
  <div class="panel"><h2>Outras linhas (esteira da página inicial)</h2>
    <p class="note" style="margin:0 0 10px">Depois da Linha Colors, a página passa por estas linhas na ordem abaixo, conforme a pessoa rola. Use fotos com fundo branco: o fundo some sobre o papel.</p>
    <div class="tbl-wrap"><table class="tbl" style="min-width:520px"><thead><tr><th></th><th>Linha</th><th>Categoria</th><th>Ativa</th><th></th></tr></thead><tbody>
    ${c.linhas.map((l, i) => `<tr><td><div class="thumb" style="background:#fff">${l.fotos[0] ? `<img src="${src(l.fotos[0])}" alt="">` : ''}</div></td>
      <td><b>${esc(l.titulo)}</b><br><span class="note">${i + 1}º na esteira</span></td><td>${esc((cat(l.cat) || {}).nome || '')}</td>
      <td><input type="checkbox" class="toggle" data-act="toggle-linha" data-id="${esc(l.id)}" ${l.ativo ? 'checked' : ''} aria-label="${esc(l.titulo)} ativa"></td>
      <td style="white-space:nowrap"><button class="btn ghost sm" data-act="linha-sobe" data-id="${esc(l.id)}" ${i ? '' : 'disabled'} aria-label="Mover ${esc(l.titulo)} para cima">↑</button>
        <button class="btn ghost sm" data-act="linha-desce" data-id="${esc(l.id)}" ${i < c.linhas.length - 1 ? '' : 'disabled'} aria-label="Mover ${esc(l.titulo)} para baixo">↓</button>
        <button class="btn ghost sm" data-act="editar-linha" data-id="${esc(l.id)}">Editar</button></td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn sm" style="margin-top:10px" data-act="nova-linha">Adicionar linha</button></div>
  <button class="btn ghost" data-act="voltar-site">Ver no site</button>`;
}
function dLinha(d) {
  const nova = !state.conteudo.linhas.find(l => l.id === d.id);
  return `<h2 class="dt">${nova ? 'Nova linha' : 'Editar ' + esc(d.titulo)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Título</span><input data-f="titulo" value="${esc(d.titulo)}"></label><label class="field"><span>Nome curto (índice)</span><input data-f="curto" value="${esc(d.curto)}"></label></div>
    <label class="field"><span>Categoria</span><select data-f="cat">${state.catalogo.categorias.map(c => `<option value="${esc(c.id)}" ${c.id === d.cat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
    <label class="field"><span>Texto</span><textarea data-f="texto">${esc(d.texto)}</textarea></label>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Três destaques</h2><div class="rows">
    ${d.fatos.map((f, i) => `<div class="row-line" style="grid-template-columns:1fr 1.6fr"><input class="inp" aria-label="Rótulo ${i + 1}" placeholder="Rótulo" data-f="fatos.${i}.0" value="${esc(f[0])}"><input class="inp" aria-label="Valor ${i + 1}" placeholder="Valor" data-f="fatos.${i}.1" value="${esc(f[1])}"></div>`).join('')}</div></div>
  <div class="panel"><h2>Fotos (até duas)</h2><div class="photos">
    ${d.fotos.map((r, i) => `<div class="ph" style="background:#fff"><img src="${src(r)}" alt=""><button data-act="lfoto-rem" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}
    ${d.fotos.length < 2 ? `<label tabindex="0" class="btn ghost sm" style="align-self:center">Adicionar foto<input type="file" accept="image/*" hidden data-file="foto-linha"></label>` : ''}</div></div>
  <label class="check"><input type="checkbox" data-f="bancada" ${d.bancada ? 'checked' : ''}>Produto de bancada (aparece sobre uma mesa desenhada)</label>
  <label class="check" style="margin-top:8px"><input type="checkbox" data-f="ativo" ${d.ativo ? 'checked' : ''}>Ativa na página inicial</label>
  <div class="foot"><button class="btn" data-act="salvar-linha">Salvar linha</button><button class="btn ghost" data-act="fechar">Cancelar</button>
    ${nova ? '' : `<span style="flex:1"></span><button class="btn danger" data-act="remover-linha" data-confirm="Confirmar remoção">Remover linha</button>`}</div>`;
}

/* ---------- vendas: catálogo pela tabela única, com a ficha do produto ---------- */
const fotoDe = (p, alt = '') => p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="${esc(alt)}">` : '<span class="note">Sem foto</span>';
function vCatalogo(u) {
  const todos = state.catalogo.produtos.filter(p => p.ativo && (cat(p.cat) || {}).ativa), cats = state.catalogo.categorias.filter(c => todos.some(p => p.cat === c.id));
  if (!cats.some(c => c.id === ui.catVenda)) ui.catVenda = '';
  const q = (ui.buscaVenda || '').trim().toLowerCase();
  const achados = todos.filter(p => (!ui.catVenda || p.cat === ui.catVenda) && (!q || (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q)));
  const gs = new Set(achados.map(p => p.grupo).filter(Boolean)), lista = todos.filter(p => achados.includes(p) || gs.has(p.grupo));   // achou uma grelha, mostra o fogão com as duas
  const ms = modelos(lista); let sub = '';
  return `<h1>${u.papel === 'admin' ? 'Tabela de preços' : 'Catálogo e preços'}</h1><p class="sub">Tabela de preços JCN de julho de 2026. Abra um produto para ver a ficha; nos fogões com duas grelhas, a escolha entre ferro fundido e aço carbono aparece ali, junto com o forno, que é opcional.</p>
  <div class="bar"><label class="sr" for="fv">Categoria</label><select id="fv" class="inp" style="width:auto" data-chg="filtro-venda"><option value="">Todas as categorias</option>${cats.map(c => `<option value="${esc(c.id)}" ${c.id === ui.catVenda ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
    <label class="sr" for="bv">Buscar</label><input id="bv" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-venda" value="${esc(ui.buscaVenda || '')}"></div>
  <p class="note" style="margin:-4px 0 12px">${ms.length} ${ms.length === 1 ? 'produto' : 'produtos'}, ${lista.length} ${lista.length === 1 ? 'código' : 'códigos'}.</p>
  ${ms.length ? `<div class="cards">${ms.map(g => { const p = g[0], varias = g.length > 1, ids = g.map(x => x.id).join(','), com = g.map(x => x.preco).filter(v => v > 0), fo = com.length && fornosDe(p, 'venda', u).length;
    let titulo = '';                                                   // com a categoria filtrada, os subgrupos da tabela viram títulos
    if (ui.catVenda && !q && (p.sub || '') !== sub) { sub = p.sub || ''; if (sub) titulo = `<h2 class="subh">${esc(sub)}</h2>`; }
    return titulo + `<div class="card"><button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="venda" aria-label="Abrir ${esc(p.nome)}">${fotoDe(p)}</button>
    <h3>${esc(p.nome)}</h3><span class="note">${varias ? g.map(x => `${esc(GRELHAS[x.grelha])} ${esc(x.codigo)}`).join(' · ') : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p)) + (p.codigo ? ', ' + esc(p.codigo) : '')}</span>
    <span class="price${com.length ? '' : ' nd'}">${varias && com.length ? 'A partir de ' + brl(Math.min(...com)) : precoTxt(com[0] || 0)}</span>
    ${fo ? '<span class="chip">Forno opcional</span>' : ''}
    ${varias || fo ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="venda">${rotuloOpcoes(varias, fo)}</button>`
             : `<button class="btn ghost sm" data-act="add-ao-pedido" data-id="${esc(p.id)}" ${p.preco > 0 ? '' : 'disabled'}>${p.preco > 0 ? 'Adicionar ao pedido' : 'Sem preço na tabela'}</button>`}</div>`; }).join('')}</div>`
  : `<div class="empty">Nenhum produto com este filtro.</div>`}`;
}
/* Ficha do produto: aparece ao abrir um cartão. Se o fogão tem as duas grelhas, é aqui que se escolhe. */
function fichaOpcoes(dr, u) {                                          // variantes que quem abriu pode comprar, pelo preço que vale para essa pessoa
  const lib = dr.ctx === 'loja' ? (u.liberados || {}) : null, site = dr.ctx === 'site';      // no site: só o que tem preço, pela tabela + acréscimo
  return dr.ids.map(prod).filter(p => p && p.ativo && (!lib || lib[p.id] > 0) && (!site || (precoSite(p) > 0 && (cat(p.cat) || {}).ativa))).map(p => ({ p, preco: lib ? lib[p.id] : site ? precoSite(p) : p.preco }));
}
function dFicha(dr, u) {
  const ops = fichaOpcoes(dr, u);
  if (!ops.length) return `<h2 class="dt">Produto indisponível</h2><p class="note">Este produto não está mais disponível.</p><div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
  if (!ops.some(o => o.p.id === dr.sel)) dr.sel = ops.length === 1 ? ops[0].p.id : null;       // com duas grelhas, nada vem marcado: a pessoa escolhe
  const at = ops.find(o => o.p.id === dr.sel) || null, p = (at || ops[0]).p, loja = dr.ctx === 'loja', varias = ops.length > 1;
  const semPreco = at && !(at.preco > 0);
  const fs = fornosDe(p, dr.ctx, u); if (!fs.some(f => f.p.id === dr.forno)) dr.forno = '';
  const fa = fs.find(f => f.p.id === dr.forno);
  return `<h2 class="dt">${esc(p.nome)}</h2>
  <div class="ficha"><div class="ph">${fotoDe(p, p.nome)}</div>
    <div class="ficha-lado">
    ${varias ? `<fieldset class="opts grelhas"><legend>Escolha a grelha <span class="opc obr">obrigatória</span></legend>${ops.map(o => `<label class="opt${o.p.id === dr.sel ? ' sel' : ''}"><input type="radio" name="fx" id="fx-${esc(o.p.id)}" value="${esc(o.p.id)}" data-act="ficha-sel" ${o.p.id === dr.sel ? 'checked' : ''}>
        <span class="on"><b>${esc(GRELHAS[o.p.grelha] || detalhe(o.p))}</b><small>${esc(o.p.codigo || 'sem código')}</small></span><span class="pv">${precoTxt(o.preco)}</span></label>`).join('')}</fieldset>`
      : `<p class="um"><span><b>${esc(detalhe(p))}</b><small>${esc(p.codigo || 'sem código')}</small></span><span class="pv">${precoTxt(at.preco)}</span></p>
        ${grelhaDe(p) ? `<div class="opts grelha-unica"><p class="leg">Grelha <span class="opc obr">obrigatória</span></p>
          <p class="opt sel fixa"><span class="bola" aria-hidden="true"></span><span class="on"><b>${esc(grelhaDe(p))}</b><small>Única grelha deste modelo, já escolhida</small></span></p></div>` : ''}`}
    </div></div>
  <div class="ficha-mais">
    ${fs.length ? `<fieldset class="opts fornos"><legend>Forno <span class="opc">opcional</span></legend>
      <label class="opt${fa ? '' : ' sel'}"><input type="radio" name="ff" id="ff-nenhum" value="" data-act="ficha-forno" ${fa ? '' : 'checked'}><span class="on"><b>Sem forno</b></span></label>
      ${fs.map(f => `<label class="opt${f === fa ? ' sel' : ''}"><input type="radio" name="ff" id="ff-${esc(f.p.id)}" value="${esc(f.p.id)}" data-act="ficha-forno" ${f === fa ? 'checked' : ''}>
        <span class="on"><b>${esc(nomeForno(f.p, true))}</b><small>${esc(f.p.codigo || 'sem código')}</small></span><span class="pv mais">+ ${brl(f.preco)}</span></label>`).join('')}</fieldset>`
    : ehFogao(p) ? `<div class="opts forno-info"><p class="leg">Forno <span class="opc">opcional</span></p>
      <p class="opt fixa"><span class="on">${specDe(p, 'forno interno') || specDe(p, 'forno') ? '<b>Este fogão já vem com forno</b><small>Não há forno avulso para escolher.</small>'
        : dr.ctx === 'loja' && (p.fornos || []).length ? '<b>Nenhum forno liberado para a sua conta</b><small>Peça a liberação ao seu contato comercial na JCN.</small>'
        : '<b>Este modelo não leva forno avulso</b><small>Os fornos avulsos servem nos fogões de piso de 2 a 6 bocas, Perfil 5 e Perfil 7.</small>'}</span></p></div>` : ''}
    ${at && !semPreco && fa ? `<p class="soma">Fogão ${brl(at.preco)} + forno ${brl(fa.preco)} = <b>${brl(at.preco + fa.preco)}</b> o conjunto. O forno entra como item separado, com o código dele.</p>` : ''}
    <div class="buyrow"><div class="qty"><button data-act="fq" data-d="-1" aria-label="Diminuir">−</button><input id="fq" type="number" min="1" max="999" step="1" inputmode="numeric" aria-label="Quantidade" data-chg="ficha-qtd" value="${dr.qtd || 1}"><button data-act="fq" data-d="1" aria-label="Aumentar">+</button></div>
      <button class="btn" data-act="ficha-add" ${at && !semPreco ? '' : 'disabled'}>${!at ? 'Escolha a grelha' : (ONDE[dr.ctx] || ONDE.venda)[0] + (fa ? ' com forno' : '')}</button></div>
    ${semPreco ? '<p class="note" style="margin:8px 0 0">Este código ainda não tem preço na tabela.</p>' : ''}
    ${at ? '' : '<p class="note" style="margin:8px 0 0">Cada grelha tem código e preço próprios. Marque uma das duas para continuar.</p>'}
  </div>
  ${at && p.historia ? `<p class="ficha-txt">${esc(p.historia)}</p>` : ''}
  ${at && p.specs.length ? `<table class="specs"><caption class="sr">Especificações de ${esc(rotulo(p))}</caption><tbody>${p.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

/* ---------- vendas: lançar pedido ---------- */
function vNovoPedido(u) {
  const d = ui.pedido || (ui.pedido = novoPedidoVazio());
  const ativos = state.catalogo.produtos.filter(p => p.ativo);
  let total = 0;
  const linhas = d.itens.map((it, i) => { const p = prod(it.produto); const pr = p ? p.preco : 0; total += pr * (it.qtd || 0);
    return `<div class="row-line" style="grid-template-columns:minmax(0,2.2fr) 76px minmax(0,1fr) auto">
      <select class="inp" aria-label="Produto" data-chg="item-prod" data-i="${i}"><option value="">Escolha o produto</option>${state.catalogo.categorias.map(c => { const g = ativos.filter(a => a.cat === c.id); return g.length ? `<optgroup label="${esc(c.nome)}">${g.map(a => `<option value="${esc(a.id)}" ${a.id === it.produto ? 'selected' : ''}>${esc(rotulo(a))}${a.codigo ? ' · ' + esc(a.codigo) : ''}${a.preco > 0 ? '' : ' (sem preço)'}</option>`).join('')}</optgroup>` : ''; }).join('')}</select>
      <input class="inp" type="number" min="1" step="1" aria-label="Quantidade" data-chg="item-qtd" data-i="${i}" value="${esc(it.qtd)}">
      <span class="num" style="text-align:right;font-weight:600">${p ? (pr > 0 ? brl(pr * it.qtd) : 'A definir') : ''}</span>
      <button class="btn ghost sm" data-act="item-rem" data-i="${i}" aria-label="Remover item">×</button></div>`; }).join('');
  const comp = d.comprovante && state.arquivos[d.comprovante];
  return `<h1>Lançar pedido</h1><p class="sub">Registre a venda, escolha PIX ou boleto parcelado e acompanhe a expedição em Pedidos.</p>
  <div class="panel"><h2>Cliente</h2><div class="rows"><div class="grid2">
    <label class="field"><span>Nome ou razão social</span><input data-p="cliente.nome" value="${esc(d.cliente.nome)}"></label>
    <label class="field"><span>CPF ou CNPJ</span><input data-p="cliente.doc" inputmode="numeric" value="${esc(d.cliente.doc)}"></label></div>
    <label class="field"><span>Cidade e UF</span><input data-p="cliente.cidade" value="${esc(d.cliente.cidade)}"></label></div></div>
  <div class="panel"><h2>Itens</h2>
    <div class="rows">${linhas}<button class="btn ghost sm" style="justify-self:start" data-act="item-add">Adicionar item</button></div>
    <p style="text-align:right;margin:12px 0 0;font:italic 800 1.5rem/1 var(--f-ui)">Total ${brl(total)}</p></div>
  <div class="panel"><h2>Pagamento</h2>
    <div class="opts formas" role="radiogroup" aria-label="Forma de pagamento">
      <label class="opt${d.forma !== 'boleto' ? ' sel' : ''}"><input type="radio" name="fpag" id="fpPix" value="pix" data-act="forma-pag" ${d.forma !== 'boleto' ? 'checked' : ''}><span class="on"><b>PIX</b><small>O cliente paga e você anexa o comprovante.</small></span></label>
      <label class="opt${d.forma === 'boleto' ? ' sel' : ''}"><input type="radio" name="fpag" id="fpBoleto" value="boleto" data-act="forma-pag" ${d.forma === 'boleto' ? 'checked' : ''}><span class="on"><b>Boleto parcelado</b><small>Precisa da aprovação do financeiro antes de seguir para a expedição.</small></span></label>
    </div>
    ${d.forma === 'boleto' ? `<h3 class="sub3">Vencimento das parcelas, em dias depois do pedido</h3>
      <div class="dias" role="group" aria-label="Dias de vencimento">${BOLETO_DIAS.map(x => `<label class="dia${d.dias.includes(x) ? ' on' : ''}"><input type="checkbox" id="bd-${x}" data-act="boleto-dia" data-d="${x}" ${d.dias.includes(x) ? 'checked' : ''}>${x}</label>`).join('')}</div>
      ${d.dias.length ? `<div class="tbl-wrap" style="margin-top:10px"><table class="tbl" id="planoBoleto" style="min-width:0"><thead><tr><th>Parcela</th><th>Prazo</th><th>Vencimento</th><th class="num">Valor</th></tr></thead><tbody>
        ${planoBoleto(total, d.dias, hojeISO()).map(x => `<tr><td>${x.n} de ${x.de}</td><td>${x.dias} ${x.dias === 1 ? 'dia' : 'dias'}</td><td>${dataBR(x.vence)}</td><td class="num">${brl(x.valor)}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="note" style="margin:10px 0 0">Marque um dia para cada parcela. Exemplo: 30, 60 e 90 para três boletos.</p>'}`
    : comp ? `<ul class="files" style="margin-top:10px">${arqLi(comp.id, 'comp-rem')}</ul>` : `<p class="note" style="margin:10px 0 8px">Se o cliente já pagou, anexe o comprovante (imagem ou PDF). Também dá para anexar depois, no pedido.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-novo"></label>`}</div>
  <label class="field"><span>Observações</span><textarea data-p="obs">${esc(d.obs)}</textarea></label>
  <div class="bar" style="margin-top:14px"><button class="btn" data-act="lancar-pedido">Lançar pedido</button><button class="btn ghost" data-act="limpar-pedido">Limpar</button></div>`;
}

/* ---------- vendas: pedidos, PIX e etiquetas ---------- */
function arqLi(id, remAct, extra = '') {
  const m = state.arquivos[id]; if (!m) return '';
  return `<li><span class="nm">${esc(m.nome)}</span><span class="mt">${kb(m.tamanho)}, ${dataBR(m.em)}${m.local ? ', será enviado ao gravar' : ''}</span>${extra}
    <button class="btn ghost sm" data-act="ver-arq" data-id="${esc(id)}">Ver</button><button class="btn ghost sm" data-act="baixar-arq" data-id="${esc(id)}">Baixar</button>
    ${remAct ? `<button class="btn danger sm" data-act="${remAct}" data-id="${esc(id)}" data-confirm="Confirmar">Remover</button>` : ''}</li>`;
}
function vPedidos(u) {
  const lj = u.papel === 'ecommerce', f = u.papel === 'admin' ? (ui.filtroPed || '') : '';
  const meus = state.pedidos.filter(p => u.papel === 'admin' || p.vendedor === u.id || (u.papel === 'vendedor' && respDe(p) === u.id));   // o vendedor acompanha os pedidos das lojas dele
  const lista = meus.filter(p => !f || (f === 'ecommerce' || f === 'site' ? p.origem === f : f === 'analise' ? paraConferir(p) : f === 'boleto' ? ehBoleto(p) : p.origem !== 'ecommerce' && p.origem !== 'site')).sort((a, b) => b.numero - a.numero);
  const vazio = lj ? 'Nenhum pedido ainda. Escolha os produtos, monte o carrinho e envie o comprovante do PIX.' : f ? 'Nenhum pedido neste filtro.' : 'Nenhum pedido ainda. Use "Lançar pedido" para registrar a primeira venda.';
  return `<h1>${lj || u.papel === 'representante' ? 'Meus pedidos' : 'Pedidos'}</h1><p class="sub">${u.papel === 'admin' ? 'Confira os comprovantes de PIX, aprove os boletos, baixe as etiquetas enviadas pelas lojas e libere a expedição.' : lj ? 'Acompanhe a conferência do PIX e a expedição. Abra um pedido para anexar mais etiquetas ou trocar o comprovante.' : u.papel === 'representante' ? 'Os pedidos que você lançou. Abra um pedido para acompanhar o pagamento e o envio.' : 'Seus pedidos e os das lojas de e-commerce que você atende. Abra um pedido para anexar o comprovante do PIX, ver a aprovação do boleto ou baixar a etiqueta.'}</p>
  ${u.papel === 'admin' ? `<div class="bar"><label class="sr" for="fp">Filtrar pedidos</label><select id="fp" class="inp" style="width:auto" data-chg="filtro-ped">${[['', 'Todos os pedidos'], ['analise', 'Pagamentos para conferir'], ['boleto', 'Boleto parcelado'], ['site', 'Loja do site (consumidor final)'], ['ecommerce', 'Vindos do e-commerce'], ['interno', 'Lançados por vendedores']].map(([k, t]) => `<option value="${k}" ${k === f ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th>${lj ? '<th>Itens</th>' : '<th>Cliente</th>'}${u.papel === 'admin' ? '<th>Origem</th>' : ''}<th class="num">Total</th><th>Pagamento</th><th>Envio</th><th>Etiquetas</th><th></th></tr></thead><tbody>
  ${lista.map(p => `<tr><td><b>${p.numero}</b></td><td>${dataBR(p.criado)}</td>${lj ? `<td>${p.itens.map(i => `${i.qtd} × ${esc(i.nome)}`).join('<br>')}</td>` : `<td>${esc(p.cliente.nome)}<br><span class="note">${esc(p.cliente.cidade)}</span>${u.papel === 'vendedor' && p.vendedor !== u.id ? '<br>' + chip(['E-commerce', 'info']) : ''}</td>`}
    ${u.papel === 'admin' ? `<td>${p.origem === 'ecommerce' ? chip(['E-commerce', 'info']) : p.origem === 'site' ? chip(['Loja do site', 'ok']) : esc((user(p.vendedor) || {}).nome || '')}</td>` : ''}<td class="num">${brl(totalPedido(p))}</td>
    <td>${chipPag(p)}</td><td>${chip(ENVIO[p.envio])}</td><td>${p.etiquetas.length || '<span class="note">nenhuma</span>'}</td>
    <td><button class="btn ghost sm" data-act="abrir-pedido" data-id="${esc(p.id)}">Abrir</button></td></tr>`).join('')}
  </tbody></table></div>` : `<div class="empty">${vazio}</div>`}`;
}
function dPedido(p, u) {
  const adm = u.papel === 'admin', lj = p.origem === 'ecommerce', dono = p.vendedor === u.id, comp = p.pix.arquivo && state.arquivos[p.pix.arquivo];
  const et = ['aguardando', 'expedicao', 'enviado'], ix = et.indexOf(p.envio), unidades = p.itens.reduce((s, i) => s + i.qtd, 0);
  const pode = adm || dono, bol = ehBoleto(p), pg = p.pagamento || {};          // o vendedor responsável por uma loja só acompanha
  const repr = u.papel === 'representante';                                       // representante só faz o pedido: depois, só envia o comprovante que faltar
  const trocaComp = pode && (adm || (repr ? ['sem', 'recusado'].includes(p.pix.status) : p.pix.status !== 'verificado')), maisEtq = pode && !repr && (adm || p.envio !== 'enviado'), tiraEtq = adm || (dono && !repr && p.envio === 'aguardando');
  return `<h2 class="dt">Pedido nº ${p.numero}</h2>
  <p style="margin:0 0 14px"><b>${esc(p.cliente.nome)}</b>${p.cliente.doc ? ', ' + esc(p.cliente.doc) : ''}<br><span class="note">${esc(p.cliente.cidade)}${p.cliente.cidade ? '. ' : ''}${lj ? `Enviado pela Área do E-commerce em ${dataBR(p.criado)}, com os valores liberados para a loja.${respDe(p) ? ' Vendedor responsável: ' + esc((user(respDe(p)) || {}).nome || '') + '.' : ''}` : p.origem === 'site' ? `Comprado na loja do site em ${dataBR(p.criado)}, pela tabela + ${p.acrescimo == null ? 20 : p.acrescimo}%.` : `Lançado em ${dataBR(p.criado)} por ${esc((user(p.vendedor) || {}).nome || '')}.`}</span></p>
  ${p.origem === 'site' ? `<div class="panel"><h2>Entrega e contato</h2><p style="margin:0">${esc(enderecoTxt(p.cliente.endereco))}</p>
    <p class="note" style="margin:6px 0 0">${esc([p.cliente.fone, p.cliente.email].filter(Boolean).join(' · '))}</p>
    <p class="note" style="margin:6px 0 0">O frete não entra no total: combine com o cliente antes de enviar.</p></div>` : ''}
  <div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl" style="min-width:0"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Subtotal</th></tr></thead><tbody>
    ${p.itens.map(i => `<tr><td>${esc(i.nome)}${i.codigo ? `<br><span class="note">${esc(i.codigo)}</span>` : ''}</td><td class="num">${i.qtd}</td><td class="num">${brl(i.preco)}</td><td class="num">${brl(i.qtd * i.preco)}</td></tr>`).join('')}
    <tr><td colspan="3" class="num"><b>Total</b></td><td class="num"><b>${brl(totalPedido(p))}</b></td></tr></tbody></table></div>
  ${p.obs ? `<p class="note">Observações: ${esc(p.obs)}</p>` : ''}
  ${bol ? `<div class="panel" id="painelBoleto"><h2>Boleto parcelado ${chip(BOLETO[pg.status])}</h2>
    <div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Parcela</th><th>Prazo</th><th>Vencimento</th><th class="num">Valor</th><th>${pg.status === 'aprovado' ? 'Recebida' : ''}</th></tr></thead><tbody>
      ${parcelasDe(p).map(x => `<tr><td>${x.n} de ${x.de}</td><td>${x.dias} ${x.dias === 1 ? 'dia' : 'dias'}</td><td>${dataBR(x.vence)}</td><td class="num">${brl(x.valor)}</td>
        <td>${pg.status !== 'aprovado' ? '' : adm ? `<input type="checkbox" class="toggle" data-act="parc-rec" data-id="${esc(p.id)}" data-d="${x.dias}" ${x.recebida ? 'checked' : ''} aria-label="Parcela ${x.n} recebida">` : chip(x.recebida ? ['Recebida', 'ok'] : ['Em aberto', ''])}</td></tr>`).join('')}</tbody></table></div>
    <p class="note" style="margin:8px 0 0">${pg.status === 'pendente' ? 'Aguardando a análise do financeiro. O pedido só segue para a expedição depois da aprovação.' : pg.status === 'aprovado' ? `Aprovado por ${esc((user(pg.por) || {}).nome || 'financeiro')} em ${dataBR(pg.em)}.` : `Recusado por ${esc((user(pg.por) || {}).nome || 'financeiro')} em ${dataBR(pg.em)}.${pg.motivo ? ' Motivo: ' + esc(pg.motivo) : ''}`}</p>
    ${adm ? `<label class="field" style="margin-top:10px"><span>Motivo, se for recusar (opcional)</span><input id="blMotivo" value=""></label>
      <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="boleto-ok" ${pg.status === 'aprovado' ? 'disabled' : ''}>Aprovar boleto</button>
      <button class="btn danger sm" data-act="boleto-nao" ${pg.status === 'recusado' || p.envio !== 'aguardando' ? 'disabled' : ''}>Recusar boleto</button></div>`
    : dono && !repr && pg.status === 'recusado' ? `<div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="boleto-reabrir">Pedir nova análise</button><button class="btn ghost sm" data-act="boleto-para-pix">Trocar para PIX</button></div>` : ''}</div>`
  : `<div class="panel"><h2>Comprovante do PIX ${chip(PIX[p.pix.status])}</h2>
    ${comp ? `<ul class="files">${arqLi(comp.id)}</ul>` : `<p class="note" style="margin:0 0 8px">${p.pix.status === 'verificado' ? 'Pagamento conferido sem arquivo anexado.' : 'Nenhum comprovante enviado. Anexe a imagem ou o PDF do PIX deste pedido.'}</p>`}
    ${p.pix.status === 'recusado' && !adm ? '<p class="err" style="margin:8px 0 0">O comprovante foi recusado. Envie um novo para o pedido voltar à conferência.</p>' : ''}
    <div class="bar" style="margin:10px 0 0">${trocaComp ? `<label tabindex="0" class="btn ghost sm">${comp ? 'Substituir comprovante' : 'Anexar comprovante'}<input type="file" accept="image/*,application/pdf" hidden data-file="comp-pedido"></label>` : ''}
    ${adm ? `<button class="btn sm" data-act="pix-ok" ${p.pix.status === 'verificado' ? 'disabled' : ''}>Marcar como verificado</button><button class="btn danger sm" data-act="pix-nao" ${p.pix.status === 'sem' || p.pix.status === 'recusado' ? 'disabled' : ''}>Recusar comprovante</button>` : ''}</div>
    ${adm ? '' : '<p class="note" style="margin:8px 0 0">A conferência do PIX é feita pela administração da JCN.</p>'}</div>`}
  <div class="panel"><h2>Etiquetas de envio (PDF) ${p.etiquetas.length ? chip([p.etiquetas.length + (p.etiquetas.length > 1 ? ' arquivos' : ' arquivo'), 'ok']) : chip(['Faltam as etiquetas', 'warn'])}</h2>
    ${p.etiquetas.length ? `<ul class="files">${p.etiquetas.map(id => arqLi(id, tiraEtq ? 'etq-rem' : '')).join('')}</ul>` : `<p class="note" style="margin:0 0 8px">${lj && adm ? 'A loja ainda não enviou as etiquetas deste pedido.' : 'Nenhuma etiqueta anexada. Envie o PDF de cada volume.'}</p>`}
    <p class="note" style="margin:8px 0 0">Este pedido tem ${unidades} ${unidades > 1 ? 'unidades' : 'unidade'}.</p>
    ${maisEtq ? `<div class="bar" style="margin:10px 0 0"><label tabindex="0" class="btn ghost sm">Anexar etiquetas em PDF<input type="file" accept="application/pdf" multiple hidden data-file="etq-pedido"></label></div>` : ''}</div>
  <div class="panel"><h2>Expedição</h2><ol class="steps">${et.map((s, i) => `<li class="${i < ix ? 'done' : i === ix ? 'now' : ''}">${ENVIO[s][0]}</li>`).join('')}</ol>
    ${adm ? `<div class="bar" style="margin:0"><button class="btn sm" data-act="envio" data-s="expedicao" ${pagoOk(p) && p.envio === 'aguardando' ? '' : 'disabled'}>Liberar para expedição</button>
      <button class="btn sm" data-act="envio" data-s="enviado" ${p.envio === 'expedicao' && p.etiquetas.length ? '' : 'disabled'}>Marcar como enviado</button></div>
      <p class="note" style="margin:8px 0 0">A expedição só é liberada com o ${bol ? 'boleto aprovado' : 'PIX verificado'}, e o envio só é marcado com uma etiqueta anexada.</p>` : ''}</div>
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

/* ---------- usuários ---------- */
function vUsuarios() {
  return `<h1>Usuários</h1><p class="sub">Quem entra em cada portal. O perfil define o que a pessoa vê: administradores gerenciam tudo; vendedores lançam pedidos e cuidam das contas de e-commerce deles; representantes só lançam pedidos; lojas veem só os próprios pedidos.</p>
  ${ui.acesso && ui.acesso.usuario ? `<div class="acesso" role="status"><h2>Acesso de ${esc(ui.acesso.nome)}</h2>
    <p>Envie estes dados para a pessoa e peça que ela troque a senha no primeiro acesso (botão "Trocar senha"). A senha não aparece de novo depois que você sair desta tela.</p>
    <dl id="acDados"><div><dt>E-mail ou login</dt><dd>${esc(ui.acesso.login)}</dd></div><div><dt>Senha</dt><dd>${esc(ui.acesso.senha)}</dd></div></dl></div>` : ''}
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>E-mail ou login</th><th>Perfil</th><th>Empresa</th><th>Ativo</th><th></th></tr></thead><tbody>
  ${state.usuarios.map(u => `<tr><td><b>${esc(u.nome)}</b></td><td>${esc(u.papel === 'ecommerce' ? u.login : u.email || '')}</td><td>${chip([PAPEIS[u.papel], u.papel === 'admin' ? 'info' : ''])}</td><td>${esc(u.empresa)}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-user" data-id="${esc(u.id)}" ${u.ativo ? 'checked' : ''} ${u.id === sessao ? 'disabled' : ''} aria-label="${esc(u.nome)} ativo"></td>
    <td>${u.id === sessao ? '' : `<button class="btn ghost sm" data-act="user-senha" data-id="${esc(u.id)}" data-confirm="Confirmar: gerar senha nova">Nova senha</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="panel" style="margin-top:16px"><h2>Novo usuário</h2><div class="grid2">
    <label class="field"><span>Nome</span><input id="nuNome"></label><label class="field"><span>E-mail</span><input id="nuEmail" type="email"></label>
    <label class="field"><span>Perfil</span><select id="nuPapel">${Object.entries(PAPEIS).filter(([k]) => k !== 'ecommerce').map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
    <label class="field"><span>Empresa</span><input id="nuEmp" value="JCN Gourmet"></label>
    <label class="field"><span>Senha inicial</span><input id="nuSenha" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="mínimo de 8 caracteres"></label></div>
    <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="user-add">Criar usuário</button><button class="btn ghost sm" data-act="user-gerar">Gerar senha</button></div>
    <p class="note" style="margin:8px 0 0">Você define a senha inicial e passa para a pessoa, que troca no primeiro acesso. As lojas de e-commerce são criadas em Contas e-commerce, com login, senha e produtos liberados.</p></div>`;
}

/* ---------- gaveta lateral e visualizador ---------- */
function renderDrawer() {
  const o = $('#overlay'), dr = ui.drawer, u = eu();
  if (!dr || (!u && !dr.pub)) { o.innerHTML = ''; return; }
  let html = '';
  if (dr.tipo === 'produto') html = dProduto(dr.draft);
  if (dr.tipo === 'pedido') { const p = state.pedidos.find(x => x.id === dr.id); if (!p) return fecharDrawer(); html = dPedido(p, u); }
  if (dr.tipo === 'linha') html = dLinha(dr.draft);
  if (dr.tipo === 'conta') html = dConta(dr.draft);
  if (dr.tipo === 'ficha') html = dFicha(dr, u);
  if (dr.tipo === 'sacola') html = dSacola();
  if (dr.tipo === 'senha') html = `<h2 class="dt">Trocar a minha senha</h2><div class="rows">
    <label class="field"><span>Senha nova</span><input id="msNova" type="password" autocomplete="new-password"></label>
    <label class="field"><span>Repita a senha nova</span><input id="msDeNovo" type="password" autocomplete="new-password"></label></div>
    <p class="err" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
    <div class="foot"><button class="btn" data-act="salvar-minha-senha">Trocar senha</button><button class="btn ghost" data-act="fechar">Cancelar</button></div>`;
  if (dr.tipo === 'pedido-site') { const p = (state.daqui || []).find(x => x.id === dr.id); if (!p) return fecharDrawer(); html = dPedidoSite(p, dr); }
  if (dr.tipo === 'meus-site') html = dMeusSite(dr);
  const sc = $('.drawer') ? $('.drawer').scrollTop : 0;
  o.innerHTML = `<div class="drawer-bg" data-act="fundo"><div class="drawer" role="dialog" aria-modal="true"><button class="x" data-act="fechar" aria-label="Fechar">×</button>${html}</div></div>`;
  $('.drawer').scrollTop = sc;
}
function fecharDrawer() { ui.drawer = null; $('#overlay').innerHTML = ''; }
function refresh() { renderApp(); renderDrawer(); }
function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]]; t[ks[ks.length - 1]] = v; }
async function verArquivo(id) {
  const m = state.arquivos[id], f = await Files.get(id);
  if (!m || !f) return toast('Não foi possível abrir o arquivo agora. Tente de novo.');
  const v = document.createElement('div'); v.className = 'viewer';
  v.innerHTML = `<div class="vb"><b>${esc(m.nome)}</b><button class="btn sm" data-act="baixar-arq" data-id="${esc(id)}">Baixar</button><button class="btn ghost sm" style="color:#fff;border-color:#fff" data-act="fechar-viewer">Fechar</button></div>
    <div class="vc">${m.tipo.startsWith('image/') ? `<img src="${f.url}" alt="${esc(m.nome)}">` : `<iframe title="${esc(m.nome)}" src="${f.url}"></iframe>`}</div>`;
  document.body.appendChild(v);
}
async function baixarArquivo(id) {
  const m = state.arquivos[id], f = await Files.get(id);
  if (!m || !f) return toast('Não foi possível baixar o arquivo agora. Tente de novo.');
  { const a = document.createElement('a'); a.href = f.url; a.download = m.nome; document.body.appendChild(a); a.click(); a.remove(); }
}

/* ---------- ações ---------- */
function porNoPedido(id, q) {
  const d = ui.pedido || (ui.pedido = novoPedidoVazio()), vazio = d.itens.find(i => !i.produto), ja = d.itens.find(i => i.produto === id);
  if (ja) ja.qtd = Math.min(999, (+ja.qtd || 0) + q); else if (vazio) { vazio.produto = id; vazio.qtd = q; } else d.itens.push({ produto: id, qtd: q });
}
const pedidoAberto = () => ui.drawer && state.pedidos.find(p => p.id === ui.drawer.id);
const acts = {
  'abrir-login': e => abrirApp(e.dataset.portal),
  'voltar-site': voltarSite,
  'portal': e => { ui.portal = e.dataset.portal; ui.erro = ''; renderApp(); },
  'entrar': async e => {
    const ident = $('#lgEmail').value.trim().toLowerCase(), senha = $('#lgSenha').value, pt = ui.portal, loja = pt === 'ecommerce';
    if (!ident) ui.erro = loja ? 'Informe o login da sua loja.' : 'Informe o e-mail da sua conta.';
    else if (!senha) ui.erro = 'Informe a senha.';
    else {
      const b = $('[data-act=entrar]'); if (b) { b.disabled = true; b.textContent = 'Entrando…'; }
      try { const u = await API.entrar(ident, senha, pt); ligarRelogio(); return entrarComo(u); }
      catch (err) { ui.erro = err.rede ? err.message : /Invalid login|invalid_credentials|invalid_grant/i.test(err.message + ' ' + err.code) ? (loja ? 'Login' : 'E-mail') + ' ou senha incorretos. Se você esqueceu a senha, peça uma nova à JCN.' : /confirm/i.test(err.message) ? 'Este acesso ainda não foi confirmado. Fale com a administração da JCN.' : err.message; }
    }
    renderApp(); const i = $('#lgEmail'); if (i) i.value = ident;
  },
  'sair': async () => { ui.carrinho = null; ui.checkout = null; ui.acesso = null; ui.pedido = null; fecharDrawer(); try { await API.sair(); } catch (e) { sessao = null; } renderApp(); },
  'minha-senha': () => { ui.drawer = { tipo: 'senha', erro: '' }; renderDrawer(); },
  'salvar-minha-senha': async () => {
    const a = $('#msNova').value, b = $('#msDeNovo').value;
    if (a.length < 8) { ui.drawer.erro = 'Use pelo menos 8 caracteres.'; return renderDrawer(); }
    if (a !== b) { ui.drawer.erro = 'As duas senhas não estão iguais.'; return renderDrawer(); }
    try { await SB.trocarSenha(a); fecharDrawer(); toast('Senha trocada.'); } catch (err) { ui.drawer.erro = msgErro(err); renderDrawer(); }
  },
  'nav': e => { ui.view = e.dataset.view; ui.acesso = null; try { sessionStorage.setItem('jcn-tela', ui.view); } catch (err) { } renderApp(); scrollTo(0, 0); },
  'fechar': fecharDrawer,
  'fundo': (e, ev) => { if (ev.target === e) fecharDrawer(); },
  'fechar-viewer': () => { const v = $('.viewer'); if (v) v.remove(); },
  'ver-arq': e => verArquivo(e.dataset.id),
  'baixar-arq': e => baixarArquivo(e.dataset.id),
  // site
  'ver-modelo': e => irParaModelo(e.dataset.id),
  // produtos
  'so-sem-preco': e => { ui.soSemPreco = e.checked; renderApp(); },
  'toggle-prod': e => { prod(e.dataset.id).ativo = e.checked; salvar('catalogo'); },
  'novo-produto': () => { ui.drawer = { tipo: 'produto', draft: { id: 'p-' + uid(), cat: ui.filtroCat || 'colors', nome: '', codigo: '', cor: '', hex: '#233B72', slogan: '', historia: '', specs: (ui.filtroCat || 'colors') === 'colors' ? Object.entries(SPEC_COLORS) : [['', '']], mostrar_preco: false, ativo: true, fotos: [], preco: 0, grupo: '', grelha: '', sub: '', fornos: [], par: '' } }; renderDrawer(); },
  'editar-produto': e => { const p = prod(e.dataset.id), par = p.grupo ? state.catalogo.produtos.find(x => x.grupo === p.grupo && x.id !== p.id) : null; ui.drawer = { tipo: 'produto', draft: { ...JSON.parse(JSON.stringify(p)), par: par ? par.id : '' } }; renderDrawer(); },
  'forno-serve': e => { const d = ui.drawer.draft, l = new Set(d.fornos || []); if (e.checked) l.add(e.dataset.id); else l.delete(e.dataset.id);
    d.fornos = state.catalogo.produtos.filter(x => l.has(x.id)).map(x => x.id); const n = d.fornos.length; $('#pdFornosN').textContent = n ? n + (n > 1 ? ' fornos' : ' forno') : 'nenhum'; },
  'spec-add': () => { ui.drawer.draft.specs.push(['', '']); renderDrawer(); },
  'spec-rem': e => { ui.drawer.draft.specs.splice(+e.dataset.i, 1); renderDrawer(); },
  'foto-rem': e => { ui.drawer.draft.fotos.splice(+e.dataset.i, 1); renderDrawer(); },
  'salvar-produto': () => {
    const d = ui.drawer.draft; d.nome = d.nome.trim();
    if (!d.nome) return toast('Dê um nome ao produto antes de salvar.');
    d.specs = d.specs.filter(s => s[0].trim() || s[1].trim());
    const par = d.grelha && d.par ? prod(d.par) : null;
    if (par && par.grelha === d.grelha) return toast('Os dois códigos estão com a mesma grelha. O par precisa ser um de ferro fundido e um de aço carbono.');
    delete d.par;
    d.grupo = '';
    if (par) {                                                          // par novo: quem fazia par com um dos dois fica sozinho
      const g = 'g-' + (d.grelha === 'ferro' ? d.id : par.id), velho = par.grupo;
      state.catalogo.produtos.forEach(p => { if (p.grupo && (p.grupo === g || p.grupo === velho)) p.grupo = ''; });
      d.grupo = par.grupo = g;
    }
    d.fornos = d.cat === 'fornosavulsos' ? [] : (d.fornos || []);
    const i = state.catalogo.produtos.findIndex(p => p.id === d.id);
    if (i >= 0) state.catalogo.produtos[i] = d; else state.catalogo.produtos.push(d);
    if (d.grupo) state.catalogo.produtos.forEach(p => { if (p.grupo === d.grupo && p.id !== d.id) p.fornos = d.fornos.slice(); });   // as duas grelhas são o mesmo fogão: mesmos fornos
    const n = {}; state.catalogo.produtos.forEach(p => { if (p.grupo) n[p.grupo] = (n[p.grupo] || 0) + 1; });
    state.catalogo.produtos.forEach(p => { if (p.grupo && n[p.grupo] !== 2) p.grupo = ''; });        // grupo é sempre um par
    salvar('catalogo'); fecharDrawer(); renderApp(); toast('Produto salvo.');
  },
  'remover-produto': () => { const id = ui.drawer.draft.id; state.catalogo.produtos = state.catalogo.produtos.filter(p => p.id !== id);
    state.catalogo.produtos.forEach(p => { if ((p.fornos || []).includes(id)) p.fornos = p.fornos.filter(x => x !== id); }); salvar('catalogo'); fecharDrawer(); renderApp(); toast('Produto removido.'); },
  // categorias e conteúdo
  'toggle-cat': e => { cat(e.dataset.id).ativa = e.checked; salvar('catalogo'); },
  'cat-rem': e => { state.catalogo.categorias = state.catalogo.categorias.filter(c => c.id !== e.dataset.id); salvar('catalogo'); renderApp(); },
  'cat-add': () => { const n = $('#novaCat').value.trim(); if (!n) return toast('Escreva o nome da categoria.'); state.catalogo.categorias.push({ id: 'c-' + uid(), nome: n, ativa: true }); salvar('catalogo'); renderApp(); },
  'linha': e => irParaLinha(+e.dataset.i),
  'toggle-linha': e => { state.conteudo.linhas.find(l => l.id === e.dataset.id).ativo = e.checked; salvar('conteudo'); },
  'linha-sobe': e => { const a = state.conteudo.linhas, i = a.findIndex(l => l.id === e.dataset.id); if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; salvar('conteudo'); renderApp(); } },
  'linha-desce': e => { const a = state.conteudo.linhas, i = a.findIndex(l => l.id === e.dataset.id); if (i >= 0 && i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; salvar('conteudo'); renderApp(); } },
  'editar-linha': e => { ui.drawer = { tipo: 'linha', draft: JSON.parse(JSON.stringify(state.conteudo.linhas.find(l => l.id === e.dataset.id))) }; renderDrawer(); },
  'nova-linha': () => { ui.drawer = { tipo: 'linha', draft: { id: 'l-' + uid(), cat: state.catalogo.categorias[0].id, curto: '', titulo: '', texto: '', fatos: [['', ''], ['', ''], ['', '']], fotos: [], bancada: false, ativo: true } }; renderDrawer(); },
  'lfoto-rem': e => { ui.drawer.draft.fotos.splice(+e.dataset.i, 1); renderDrawer(); },
  'salvar-linha': () => {
    const d = ui.drawer.draft, a = state.conteudo.linhas; d.titulo = d.titulo.trim(); d.curto = d.curto.trim() || d.titulo;
    if (!d.titulo) return toast('Dê um título à linha antes de salvar.');
    while (d.fatos.length < 3) d.fatos.push(['', '']);
    const i = a.findIndex(l => l.id === d.id); if (i >= 0) a[i] = d; else a.push(d);
    salvar('conteudo'); fecharDrawer(); renderApp(); toast('Linha salva.');
  },
  'remover-linha': () => { const id = ui.drawer.draft.id; state.conteudo.linhas = state.conteudo.linhas.filter(l => l.id !== id); salvar('conteudo'); fecharDrawer(); renderApp(); toast('Linha removida.'); },
  'gal-rem': e => { state.conteudo.galeria.splice(+e.dataset.i, 1); salvar('conteudo'); renderApp(); },
  // catálogo e pedido
  'add-ao-pedido': e => {
    if (!(prod(e.dataset.id).preco > 0)) return toast('Este produto ainda não tem preço na tabela.');
    porNoPedido(e.dataset.id, 1); toast(prod(e.dataset.id).nome + ' adicionado ao pedido.');
  },
  // ficha do produto e escolha da grelha
  'ficha': e => { ui.drawer = { tipo: 'ficha', ids: e.dataset.ids.split(','), ctx: e.dataset.ctx, pub: e.dataset.ctx === 'site', sel: null, forno: '', qtd: 1 }; renderDrawer(); },
  'ficha-forno': e => { ui.drawer.forno = e.value; renderDrawer(); const r = $('#ff-' + CSS.escape(e.value || 'nenhum')); if (r) r.focus(); },
  'ficha-sel': e => { ui.drawer.sel = e.value; renderDrawer(); const r = $('#fx-' + CSS.escape(e.value)); if (r) r.focus(); },
  'fq': e => { const d = ui.drawer; d.qtd = Math.min(999, Math.max(1, (d.qtd || 1) + (+e.dataset.d))); $('#fq').value = d.qtd; },
  'ficha-add': () => {
    const d = ui.drawer, u = eu(), o = fichaOpcoes(d, u).find(x => x.p.id === d.sel); if (!o || !(o.preco > 0)) return;
    const q = d.qtd || 1, nome = rotulo(o.p);
    const fo = d.forno ? fornosDe(o.p, d.ctx, u).find(f => f.p.id === d.forno) : null;       // um forno para cada fogão
    const itens = fo ? [o.p.id, fo.p.id] : [o.p.id];
    if (d.ctx === 'loja') { const c = carrinho(); itens.forEach(id => { c[id] = Math.min(999, (c[id] || 0) + q); }); guardarCarrinho(); }
    else if (d.ctx === 'site') { const c = sacola(); itens.forEach(id => { c[id] = Math.min(999, (c[id] || 0) + q); }); guardarSacola(); }
    else itens.forEach(id => porNoPedido(id, q));
    fecharDrawer(); if (d.ctx === 'site') renderVitrine(); else renderApp();
    toast(`${q} × ${nome}${fo ? ` + ${q} × ${fo.p.nome}` : ''} ${(ONDE[d.ctx] || ONDE.venda)[1]}.`);
  },
  'item-add': () => { ui.pedido.itens.push({ produto: '', qtd: 1 }); renderApp(); },
  'item-rem': e => { ui.pedido.itens.splice(+e.dataset.i, 1); if (!ui.pedido.itens.length) ui.pedido.itens.push({ produto: '', qtd: 1 }); renderApp(); },
  'comp-rem': () => { Files.remove(ui.pedido.comprovante); ui.pedido.comprovante = null; renderApp(); },
  'limpar-pedido': () => { ui.pedido = novoPedidoVazio(); renderApp(); },
  'lancar-pedido': async () => {
    const d = ui.pedido, u = eu(), itens = d.itens.filter(i => i.produto && i.qtd > 0);
    if (!d.cliente.nome.trim()) return toast('Informe o nome do cliente.');
    if (!itens.length) return toast('Escolha pelo menos um produto.');
    const sem = itens.map(i => prod(i.produto)).find(p => !(p.preco > 0));
    if (sem) return toast(`${rotulo(sem)} ainda não tem preço na tabela. Cadastre o preço em Produtos ou tire o item do pedido.`);
    const boleto = d.forma === 'boleto', dias = BOLETO_DIAS.filter(x => (d.dias || []).includes(x));
    if (boleto && !dias.length) return toast('Marque o vencimento de pelo menos uma parcela do boleto.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=lancar-pedido]'); if (bt) { bt.disabled = true; bt.textContent = 'Gravando…'; }
    try {
      const r = await API.lancarPedido({ origem: 'interno', cliente: { nome: d.cliente.nome.trim(), doc: d.cliente.doc.trim(), cidade: d.cliente.cidade.trim() }, obs: d.obs.trim(), forma: boleto ? 'boleto' : 'pix', dias,
        itens: itens.map(i => ({ produto: i.produto, qtd: +i.qtd, preco: prod(i.produto).preco })), comprovante: boleto ? null : d.comprovante });
      if (boleto && d.comprovante) Files.remove(d.comprovante);
      ui.pedido = null; ui.view = 'pedidos'; renderApp(); scrollTo(0, 0);
      toast('Pedido nº ' + r.numero + (boleto ? ' lançado. O boleto aguarda a aprovação do financeiro.' : r.falhas.length ? ' lançado, mas o comprovante não subiu. Abra o pedido e anexe de novo.' : ' lançado.'));
    } catch (err) { toast(msgErro(err)); if (bt) { bt.disabled = false; bt.textContent = 'Lançar pedido'; } }
    finally { ui.ocupado = false; }
  },
  'abrir-pedido': e => { ui.drawer = { tipo: 'pedido', id: e.dataset.id }; renderDrawer(); },
  // boleto parcelado
  'forma-pag': e => { ui.pedido.forma = e.value; renderApp(); const r = $(e.value === 'boleto' ? '#fpBoleto' : '#fpPix'); if (r) r.focus(); },
  'boleto-dia': e => { const d = ui.pedido, x = +e.dataset.d; d.dias = BOLETO_DIAS.filter(k => k === x ? e.checked : d.dias.includes(k)); renderApp(); const c = $('#bd-' + x); if (c) c.focus(); },
  'boleto-ok': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || eu().papel !== 'admin') return; Object.assign(p.pagamento, { status: 'aprovado', por: sessao, em: hojeISO(), motivo: '' }); salvar('pedidos'); refresh(); toast('Boleto aprovado. O pedido já pode seguir para a expedição.'); },
  'boleto-nao': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || eu().papel !== 'admin' || p.envio !== 'aguardando') return; Object.assign(p.pagamento, { status: 'recusado', por: sessao, em: hojeISO(), motivo: ($('#blMotivo') || {}).value || '', recebidas: [] }); salvar('pedidos'); refresh(); toast('Boleto recusado. O vendedor vê o motivo no pedido.'); },
  'boleto-reabrir': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || p.pagamento.status !== 'recusado' || eu().papel === 'representante') return; p.pagamento.status = 'pendente'; salvar('pedidos'); refresh(); toast('Pedido enviado de novo para o financeiro.'); },
  'boleto-para-pix': () => { const p = pedidoAberto(); if (!p || !ehBoleto(p) || p.pagamento.status === 'aprovado' || eu().papel === 'representante') return; p.pagamento = { forma: 'pix' }; p.pix = { status: 'sem', arquivo: null }; salvar('pedidos'); refresh(); toast('Pagamento trocado para PIX. Anexe o comprovante.'); },
  'parc-rec': e => { const p = state.pedidos.find(x => x.id === e.dataset.id); if (!p || !ehBoleto(p) || p.pagamento.status !== 'aprovado' || eu().papel !== 'admin') return; const d = +e.dataset.d, r = new Set(p.pagamento.recebidas || []); if (e.checked) r.add(d); else r.delete(d); p.pagamento.recebidas = [...r]; salvar('pedidos'); refresh(); toast(e.checked ? `Parcela de ${d} ${d === 1 ? 'dia' : 'dias'} do pedido nº ${p.numero} marcada como recebida. Para desfazer, abra o pedido.` : 'Parcela voltou para em aberto.'); },
  'pix-ok': () => { const p = pedidoAberto(); p.pix.status = 'verificado'; p.pix.por = sessao; salvar('pedidos'); refresh(); toast('PIX marcado como verificado.'); },
  'pix-nao': () => { const p = pedidoAberto(); p.pix.status = 'recusado'; p.pix.por = sessao; if (p.envio === 'expedicao') p.envio = 'aguardando'; salvar('pedidos'); refresh(); toast('Comprovante recusado.'); },
  'etq-rem': e => { const p = pedidoAberto(); p.etiquetas = p.etiquetas.filter(x => x !== e.dataset.id); Files.remove(e.dataset.id); salvar('pedidos'); refresh(); },
  'envio': e => { const p = pedidoAberto(); p.envio = e.dataset.s; salvar('pedidos'); refresh(); toast(e.dataset.s === 'enviado' ? 'Pedido marcado como enviado.' : 'Pedido liberado para expedição.'); },
  // usuários
  'toggle-user': e => { const eux = eu(), x = user(e.dataset.id); if (!x || !(eux.papel === 'admin' || (eux.papel === 'vendedor' && x.papel === 'ecommerce' && x.vendedorResp === eux.id))) { e.checked = !e.checked; return; } x.ativo = e.checked; salvar('usuarios'); },
  'user-gerar': () => { $('#nuSenha').value = gerarSenha(); },
  'user-add': async () => {
    if (eu().papel !== 'admin' || ui.ocupado) return;
    const nome = $('#nuNome').value.trim(), email = $('#nuEmail').value.trim().toLowerCase(), papel = $('#nuPapel').value, senha = $('#nuSenha').value, empresa = $('#nuEmp').value.trim();
    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) return toast('Informe nome e um e-mail válido.');
    if (senha.length < 8) return toast('Defina uma senha inicial com pelo menos 8 caracteres, ou use "Gerar senha".');
    if (state.usuarios.some(u => (u.email || '').toLowerCase() === email)) return toast('Já existe um usuário com este e-mail.');
    ui.ocupado = true;
    try { await API.criarAcesso({ email, senha, perfil: { nome, papel, empresa: empresa || null, ativo: true } }); ui.acesso = { nome, login: email, senha, usuario: true }; renderApp(); toast('Usuário criado. Envie o e-mail e a senha para a pessoa.'); }
    catch (err) { toast(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'user-senha': async e => {
    const id = e.dataset.id, s = gerarSenha(), u = user(id); if (eu().papel !== 'admin' || !u) return;
    try { await API.definirSenha(id, s); ui.acesso = { nome: u.nome, login: u.papel === 'ecommerce' ? u.login : u.email, senha: s, usuario: true }; renderApp(); scrollTo(0, 0); toast('Senha nova definida.'); } catch (err) { toast(msgErro(err)); }
  }
};
const chgs = {
  'filtro-cat': e => { ui.filtroCat = e.value; renderApp(); },
  'filtro-ped': e => { ui.filtroPed = e.value; renderApp(); },
  'filtro-venda': e => { ui.catVenda = e.value; renderApp(); },
  'busca-prod': e => { ui.buscaProd = e.value; renderApp(); },
  'cat-nome': e => { const c = cat(e.dataset.id), v = e.value.trim(); if (v) { c.nome = v; salvar('catalogo'); } else e.value = c.nome; },
  'conteudo': e => { state.conteudo[e.dataset.k] = e.value; salvar('conteudo'); },
  'item-prod': e => { ui.pedido.itens[+e.dataset.i].produto = e.value; renderApp(); },
  'item-qtd': e => { ui.pedido.itens[+e.dataset.i].qtd = Math.max(1, parseInt(e.value, 10) || 1); renderApp(); },
  'busca-venda': e => { ui.buscaVenda = e.value; renderApp(); },
  'ficha-qtd': e => { ui.drawer.qtd = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); e.value = ui.drawer.qtd; }
};
const ehPDF = f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
const PDF_IMG = f => ehPDF(f) || f.type.startsWith('image/');
const uploads = {
  'foto-produto': async f => { const m = await Files.put(f, { imagem: true }); ui.drawer.draft.fotos.push('file:' + m.id); renderDrawer(); },
  'foto-linha': async f => { const m = await Files.put(f, { imagem: true }); ui.drawer.draft.fotos.push('file:' + m.id); renderDrawer(); },
  'foto-galeria': async f => { const m = await Files.put(f, { imagem: true }); state.conteudo.galeria.push('file:' + m.id); salvar('conteudo'); renderApp(); },
  'comp-novo': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f); ui.pedido.comprovante = m.id; renderApp(); },
  'comp-pedido': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f), p = pedidoAberto(); if (!p) return; if (p.pix.arquivo) Files.remove(p.pix.arquivo); p.pix = { status: 'analise', arquivo: m.id }; salvar('pedidos'); refresh(); toast('Comprovante enviado para conferência.'); },
  'etq-pedido': async f => { if (eu().papel === 'representante') return; if (!ehPDF(f)) return toast('A etiqueta precisa ser um arquivo PDF.'); const m = await Files.put(f), p = pedidoAberto(); if (!p) return; p.etiquetas.push(m.id); salvar('pedidos'); refresh(); toast('Etiqueta anexada.'); }
};

document.addEventListener('click', ev => {
  const j = ev.target.closest('a[data-jump]');
  if (j) { ev.preventDefault(); const st = $('.stage'); scrollTo({ top: st.offsetTop + (st.offsetHeight - innerHeight) * parseFloat(j.dataset.jump), behavior: 'auto' }); return; }
  const h = ev.target.closest('a[href^="#"]');
  if (h && h.getAttribute('href').length > 1) { const alvoEl = document.getElementById(h.getAttribute('href').slice(1)); if (alvoEl) { ev.preventDefault(); alvoEl.scrollIntoView(); } return; }
  const e = ev.target.closest('[data-act]'); if (!e || e.disabled) return;
  if (e.dataset.act === 'fundo' && ev.target !== e) return;
  if (e.dataset.confirm && !e.dataset.armado) { e.dataset.armado = '1'; e.textContent = e.dataset.confirm; return; }
  const fn = acts[e.dataset.act]; if (!fn) return;
  const rodar = () => { const r = fn(e, ev); if (r && r.catch) r.catch(() => toast('Não foi possível concluir. Tente de novo.')); };
  if (ocupados) quandoLivre().then(rodar); else rodar();          // se uma gravação está em curso, o clique espera por ela
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.matches('[data-file]')) {                                    // um arquivo por vez, em ordem (etiquetas aceitam vários)
    const fs = [...(t.files || [])], fn = uploads[t.dataset.file]; t.value = '';
    if (fs.length && fn) (async () => { for (const f of fs) { await quandoLivre(); await fn(f, t); } })().catch(err => toast(err && /imagem|10 MB/.test(err.message || '') ? err.message : 'Não foi possível ler o arquivo. Tente outro.'));
    return;
  }
  if (t.dataset.chg && chgs[t.dataset.chg]) { if (ocupados) quandoLivre().then(() => chgs[t.dataset.chg](t)); else chgs[t.dataset.chg](t); }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.f && ui.drawer && ui.drawer.draft) setPath(ui.drawer.draft, t.dataset.f, t.type === 'checkbox' ? t.checked : 'num' in t.dataset ? (parseFloat(t.value) || 0) : t.value);
  if (t.dataset.p && ui.pedido) setPath(ui.pedido, t.dataset.p, t.value);
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if ($('.viewer')) $('.viewer').remove(); else if (ui.drawer) fecharDrawer(); }
  if (ev.key === 'Enter' && ev.target.matches('#lgEmail,#lgSenha')) acts.entrar();
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('label.btn')) { ev.preventDefault(); const i = $('input[type=file]', ev.target); if (i) i.click(); }
});

