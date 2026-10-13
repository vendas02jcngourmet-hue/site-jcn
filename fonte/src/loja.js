/* =====================================================================
   E-COMMERCE
   O administrador cria o login e a senha de cada loja e libera produtos
   e valores. A loja entra, monta o carrinho, paga por PIX e envia o
   comprovante e as etiquetas em PDF. O pedido cai em Pedidos do admin.
   A senha fica só no servidor de login (Supabase Auth), nunca no navegador. Em produção
   o login é do Supabase Auth e as regras estão no schema.sql.
   ===================================================================== */
const ALFA = 'abcdefghjkmnpqrstuvwxyz23456789';                       // sem 0/o, 1/l/i: fácil de ditar
function gerarSenha(n = 10) {
  const a = new Uint32Array(n);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
  return [...a].map(x => ALFA[x % ALFA.length]).join('');
}
const lojas = () => state.usuarios.filter(u => u.papel === 'ecommerce');
const dinheiro = n => Math.round(+((Number(n) || 0) * 100).toFixed(4)) / 100;   // 676,90 × 0,95 dá 643,0549999 na conta do computador: arredonda como no papel (643,06)
const vendaveis = () => state.catalogo.produtos.filter(p => p.ativo && (cat(p.cat) || {}).ativa);
/* o que a loja enxerga: só o que o administrador liberou, pelo valor que ele definiu */
function liberadosDe(u) { const l = u.liberados || {}; return vendaveis().filter(p => l[p.id] > 0).map(p => ({ p, preco: l[p.id] })); }
function carrinho() {
  const u = eu(); if (!u) return {};
  if (!ui.carrinho) { ui.carrinho = {}; try { ui.carrinho = JSON.parse(localStorage.getItem('jcn-carrinho-' + u.id)) || {}; } catch (e) { ui.carrinho = {}; } }
  return ui.carrinho;
}
function guardarCarrinho() { const u = eu(); try { localStorage.setItem('jcn-carrinho-' + u.id, JSON.stringify(ui.carrinho || {})); } catch (e) { } }
function itensCarrinho(u) { const c = carrinho(); return liberadosDe(u).filter(x => c[x.p.id] > 0).map(x => ({ ...x, qtd: c[x.p.id] })); }
function qtdCarrinho() { const u = eu(); return u && u.papel === 'ecommerce' ? itensCarrinho(u).reduce((s, i) => s + i.qtd, 0) : 0; }
const checkout = () => ui.checkout || (ui.checkout = { comprovante: null, etiquetas: [], obs: '' });
const fotoProd = (p, alt = '') => p.fotos[0] ? `<img loading="lazy" src="${src(p.fotos[0])}" alt="${esc(alt)}">` : '';

/* ---------- administrador: contas e-commerce ---------- */
// administrador cuida de todas as contas; o vendedor, só das lojas dele. Representante não mexe em contas.
const podeConta = (u, loja) => !!u && (u.papel === 'admin' || (u.papel === 'vendedor' && (!loja || loja.vendedorResp === u.id)));
function vLojas(eux) {
  const adm = eux.papel === 'admin', ls = lojas().filter(l => adm || l.vendedorResp === eux.id), px = state.conteudo.pix, ac = ui.acesso;
  return `<h1>${adm ? 'Contas e-commerce' : 'Minhas contas e-commerce'}</h1><p class="sub">${adm ? 'Crie o login e a senha de cada loja, diga de qual vendedor ela é e escolha quais produtos ela enxerga e por quanto.' : 'Crie o login e a senha das suas lojas e escolha quais produtos cada uma enxerga e por quanto. As lojas que você cria ficam no seu nome.'} A loja entra pela aba E-commerce, monta o carrinho e envia o comprovante do PIX e as etiquetas em PDF.</p>
  ${ac ? `<div class="acesso" role="status"><h2>Acesso de ${esc(ac.nome)}</h2>
    <p>Envie estes dados para a loja. A senha não aparece de novo depois que você sair desta tela; se precisar, defina outra em Editar.</p>
    <dl id="acDados"><div><dt>Login</dt><dd>${esc(ac.login)}</dd></div><div><dt>Senha</dt><dd>${esc(ac.senha)}</dd></div></dl>
    <button class="btn sm" data-act="copiar-acesso">Copiar login e senha</button></div>` : ''}
  <div class="bar"><span class="grow"></span><button class="btn" data-act="nova-conta">Criar conta</button></div>
  ${ls.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Loja</th><th>Login</th>${adm ? '<th>Vendedor</th>' : ''}<th class="num">Produtos liberados</th><th class="num">Pedidos</th><th>Ativa</th><th></th></tr></thead><tbody>
  ${ls.map(u => { const n = liberadosDe(u).length, np = state.pedidos.filter(p => p.vendedor === u.id).length; return `<tr>
    <td><b>${esc(u.nome)}</b><br><span class="note">${esc([u.cidade, u.contato].filter(Boolean).join(' · ')) || 'sem contato cadastrado'}</span></td>
    <td>${esc(u.login)}${u.senha ? '' : '<br><span class="note">demonstração, entra sem senha</span>'}</td>
    ${adm ? `<td>${u.vendedorResp && user(u.vendedorResp) ? esc(user(u.vendedorResp).nome) : '<span class="chip warn">definir</span>'}</td>` : ''}
    <td class="num">${n ? n : '<span class="chip warn">nenhum</span>'}</td><td class="num">${np}</td>
    <td><input type="checkbox" class="toggle" data-act="toggle-user" data-id="${esc(u.id)}" ${u.ativo ? 'checked' : ''} aria-label="${esc(u.nome)} ativa"></td>
    <td><button class="btn ghost sm" data-act="editar-conta" data-id="${esc(u.id)}">Editar</button></td></tr>`; }).join('')}
  </tbody></table></div>` : `<div class="empty">${adm ? 'Nenhuma conta de e-commerce.' : 'Você ainda não tem contas de e-commerce.'} Crie a primeira para liberar produtos e valores a uma loja.</div>`}
  ${!adm ? '' : `<div class="panel" style="margin-top:16px"><h2>PIX para recebimento</h2>
    <p class="note" style="margin:0 0 10px">Esta chave aparece no carrinho de todas as lojas, na hora de pagar.</p>
    <div class="grid3"><label class="field"><span>Chave PIX</span><input id="pxChave" data-chg="pix-cfg" data-k="chave" value="${esc(px.chave)}" placeholder="CNPJ, e-mail, telefone ou chave aleatória"></label>
      <label class="field"><span>Favorecido</span><input id="pxFav" data-chg="pix-cfg" data-k="favorecido" value="${esc(px.favorecido)}"></label>
      <label class="field"><span>Banco</span><input id="pxBanco" data-chg="pix-cfg" data-k="banco" value="${esc(px.banco)}"></label></div></div>`}`;
}
function precoBase(p) { return dinheiro((p.preco || 0) * (1 - (ui.drawer.desc || 0) / 100)); }   // tabela JCN menos o desconto da loja
// "liberar" em lote só alcança o que já tem preço na tabela; o resto fica para definir à mão
function liberarLista(lista) {
  const d = ui.drawer.draft; let fora = 0;
  lista.forEach(p => { const v = precoBase(p); if (v > 0) d.liberados[p.id] = v; else if (d.liberados[p.id] == null) fora++; });
  renderDrawer();
  if (fora) toast(`${fora} ${fora > 1 ? 'produtos ficaram' : 'produto ficou'} de fora por não ter preço na tabela. Marque e digite o valor, ou cadastre o preço em Produtos.`);
}
function dConta(d) {
  const nova = !user(d.id), dr = ui.drawer, ps = vendaveis(), n = ps.filter(p => d.liberados[p.id] != null).length;
  const porCat = state.catalogo.categorias.map(c => [c, ps.filter(p => p.cat === c.id)]).filter(x => x[1].length);
  return `<h2 class="dt">${nova ? 'Nova conta e-commerce' : 'Editar ' + esc(d.nome)}</h2>
  <div class="rows">
    <div class="grid2"><label class="field"><span>Nome da loja</span><input id="ctNome" data-f="nome" value="${esc(d.nome)}"></label><label class="field"><span>CNPJ ou CPF</span><input id="ctDoc" data-f="doc" inputmode="numeric" value="${esc(d.doc)}"></label></div>
    <div class="grid2"><label class="field"><span>Cidade e UF</span><input id="ctCidade" data-f="cidade" value="${esc(d.cidade)}"></label><label class="field"><span>Contato (responsável e telefone)</span><input id="ctContato" data-f="contato" value="${esc(d.contato)}"></label></div>
    ${eu().papel === 'vendedor' ? `<p class="note" id="ctVendFixo" style="margin:0">Vendedor desta loja: <b>${esc(eu().nome)}</b> (você). Os pedidos dela aparecem em Pedidos, e as vendas entram para você no Financeiro da JCN.</p>` : `<label class="field"><span>De qual vendedor é este e-commerce?</span><select id="ctVend" data-f="vendedorResp"><option value="">Escolha o vendedor</option>${vendedores().filter(v => v.ativo || v.id === d.vendedorResp).map(v => `<option value="${esc(v.id)}" ${v.id === d.vendedorResp ? 'selected' : ''}>${esc(v.nome)}${v.ativo ? '' : ' (inativo)'}</option>`).join('')}</select></label>
    <p class="note" style="margin:-2px 0 0">${vendedores().some(v => v.ativo) ? 'O vendedor acompanha os pedidos desta loja, e as vendas dela entram para ele no Financeiro.' : 'Ainda não há vendedor ativo. Cadastre um em Usuários antes de criar a conta.'}</p>`}
  </div>
  <div class="panel" style="margin-top:16px"><h2>Acesso</h2>
    <div class="grid2"><label class="field"><span>Login</span><input id="ctLogin" data-f="login" autocapitalize="none" spellcheck="false" value="${esc(d.login)}" placeholder="ex.: lojadaana"></label>
      <label class="field"><span>${nova || !d.senha ? 'Senha' : 'Nova senha'}</span><input id="ctSenha" data-f="senhaNova" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(d.senhaNova)}" placeholder="${nova || !d.senha ? 'mínimo de 8 caracteres' : 'em branco mantém a atual'}"></label></div>
    <div class="bar" style="margin:10px 0 0"><button class="btn ghost sm" data-act="conta-gerar">Gerar senha</button>
      <span class="note">${!nova && !d.senha ? 'Conta de demonstração: sem senha ela entra direto. Ao definir uma senha, passa a exigi-la.' : 'Depois de salvar, a tela mostra o login e a senha para você enviar à loja.'}</span></div></div>
  <div class="panel"><h2>Produtos e valores <span class="chip ${n ? 'ok' : 'warn'}">${n} de ${ps.length} liberados</span></h2>
    <p class="note" style="margin:0 0 10px">Marque o que a loja pode comprar e defina o valor de cada item. O que não estiver marcado não aparece para ela. Nos fogões com duas grelhas, cada grelha é um código: libere uma ou as duas.</p>
    <div class="bar"><label class="field inl"><span>Desconto sobre a tabela JCN, em %</span><input id="ctDesc" class="inp" style="width:5.2rem" type="number" min="0" max="90" step="0.5" inputmode="decimal" data-chg="conta-desc" value="${esc(dr.desc)}"></label></div>
    <div class="bar"><button class="btn ghost sm" data-act="lib-todos">Liberar todos pela tabela</button><button class="btn ghost sm" data-act="lib-colors">Só a Linha Colors</button><button class="btn ghost sm" data-act="lib-limpar">Limpar</button></div>
    ${(() => { const fg = ps.filter(p => d.liberados[p.id] != null && (p.fornos || []).length); return fg.length && !fg.some(p => p.fornos.some(id => d.liberados[id] != null))
      ? `<p class="note" id="avisoForno" style="margin:0 0 10px">Esta loja tem fogões que aceitam forno, mas nenhum forno avulso liberado, então ela não verá a opção de forno. Para oferecer, libere a categoria Fornos avulsos.</p>` : ''; })()}
    <div class="tbl-wrap"><table class="tbl lib" style="min-width:0"><thead><tr><th><span class="sr">Liberar</span></th><th>Produto</th><th class="num">Tabela JCN</th><th class="num">Valor para a loja (R$)</th></tr></thead><tbody>
    ${porCat.map(([c, lista]) => `<tr class="grp"><th colspan="4" scope="colgroup"><span>${esc(c.nome)}</span><button class="btn ghost sm" data-act="lib-cat" data-id="${esc(c.id)}">Liberar a categoria</button></th></tr>` + lista.map(p => { const on = d.liberados[p.id] != null; return `<tr>
      <td><input type="checkbox" id="lb-${esc(p.id)}" data-act="lib" data-id="${esc(p.id)}" ${on ? 'checked' : ''} aria-label="Liberar ${esc(rotulo(p))}"></td>
      <td><label for="lb-${esc(p.id)}"><b>${esc(p.nome)}</b><br><span class="note">${p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`}${esc(detalhe(p))}${p.codigo ? ' · ' + esc(p.codigo) : ''}</span></label></td>
      <td class="num note">${precoTxt(p.preco)}</td>
      <td class="num"><input class="inp preco" id="pv-${esc(p.id)}" type="number" min="0" step="0.01" inputmode="decimal" aria-label="Valor de ${esc(rotulo(p))} para a loja" data-f="liberados.${esc(p.id)}" data-num value="${on ? esc(d.liberados[p.id]) : ''}" ${on ? '' : 'disabled'}></td></tr>`; }).join('')).join('')}
    </tbody></table></div></div>
  <label class="check"><input type="checkbox" id="ctAtivo" data-f="ativo" ${d.ativo ? 'checked' : ''}>Conta ativa (pode entrar e fazer pedidos)</label>
  <div class="foot"><button class="btn" data-act="salvar-conta">Salvar conta</button><button class="btn ghost" data-act="fechar">Cancelar</button></div>`;
}

/* ---------- loja: produtos liberados ---------- */
function vLoja(u) {
  const todos = liberadosDe(u), c = carrinho(), cats = [...new Set(todos.map(x => x.p.cat))], q = (ui.buscaLoja || '').trim().toLowerCase();
  if (!cats.includes(ui.catLoja)) ui.catLoja = '';
  const achados = todos.filter(x => (!ui.catLoja || x.p.cat === ui.catLoja) && (!q || (x.p.nome + ' ' + x.p.codigo + ' ' + detalhe(x.p)).toLowerCase().includes(q))), n = qtdCarrinho();
  const gs = new Set(achados.map(x => x.p.grupo).filter(Boolean)), lista = todos.filter(x => achados.includes(x) || gs.has(x.p.grupo));
  return `<h1>Produtos</h1><p class="sub">Produtos e valores liberados pela JCN Gourmet para ${esc(u.nome)}. Abra um produto para ver a ficha; nos fogões com duas grelhas, você escolhe entre ferro fundido e aço carbono, e pode incluir o forno, que é opcional.</p>
  ${todos.length ? `<div class="bar">${cats.length > 1 ? `<label class="sr" for="fl">Categoria</label><select id="fl" class="inp" style="width:auto" data-chg="filtro-loja"><option value="">Todas as categorias</option>${cats.map(k => `<option value="${esc(k)}" ${k === ui.catLoja ? 'selected' : ''}>${esc((cat(k) || {}).nome || '')}</option>`).join('')}</select>` : ''}
    ${todos.length > 12 ? `<label class="sr" for="bl">Buscar</label><input id="bl" class="inp" style="width:min(16rem,100%)" type="search" placeholder="Buscar por nome ou código" data-chg="busca-loja" value="${esc(ui.buscaLoja || '')}">` : ''}
    <span class="grow"></span><button class="btn" data-act="nav" data-view="carrinho">${n ? `Ver carrinho (${n})` : 'Carrinho vazio'}</button></div>
  ${lista.length ? `<div class="cards shop">${modelos(lista).map(g => { const { p, preco } = g[0], varias = g.length > 1, ids = g.map(x => x.p.id).join(','), no = g.reduce((s, x) => s + (c[x.p.id] || 0), 0), fo = fornosDe(p, 'loja', u).length;
    return `<div class="card">
    <button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="loja" aria-label="Abrir ${esc(p.nome)}">${fotoDe(p, `${p.nome}, ${detalhe(p)}`)}</button>
    <h3>${esc(p.nome)}</h3><span class="note">${varias ? g.map(x => `${esc(GRELHAS[x.p.grelha])} ${esc(x.p.codigo)}`).join(' · ') : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p)) + (p.codigo ? ', ' + esc(p.codigo) : '')}</span>
    <span class="price">${varias ? 'A partir de ' + brl(Math.min(...g.map(x => x.preco))) : brl(preco)}</span>
    ${fo ? '<span class="chip">Forno opcional</span>' : ''}
    ${varias || fo ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="loja">${rotuloOpcoes(varias, fo)}</button>`
      : `<div class="buyrow"><div class="qty"><button data-act="q-menos" data-id="${esc(p.id)}" aria-label="Diminuir">−</button><input id="q-${esc(p.id)}" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" aria-label="Quantidade de ${esc(p.nome)}"><button data-act="q-mais" data-id="${esc(p.id)}" aria-label="Aumentar">+</button></div>
      <button class="btn sm" data-act="add-carrinho" data-id="${esc(p.id)}">Adicionar</button></div>`}
    ${no ? `<span class="chip info">${no} no carrinho</span>` : ''}</div>`; }).join('')}</div>` : `<div class="empty">Nenhum produto com este filtro.</div>`}`
  : `<div class="empty">A JCN ainda não liberou produtos para esta conta. Fale com o seu contato comercial.</div>`}`;
}

/* ---------- loja: carrinho, PIX e etiquetas ---------- */
function vCarrinho(u) {
  const itens = itensCarrinho(u), co = checkout(), px = state.conteudo.pix;
  if (!itens.length) return `<h1>Carrinho</h1><p class="sub">Seu carrinho está vazio.</p>
    <div class="empty">Escolha os produtos liberados para a sua loja e adicione ao carrinho.<br><button class="btn" style="margin-top:12px" data-act="nav" data-view="loja">Ver produtos</button></div>`;
  const total = itens.reduce((s, i) => s + i.qtd * i.preco, 0), un = itens.reduce((s, i) => s + i.qtd, 0);
  const comp = co.comprovante && state.arquivos[co.comprovante], etq = co.etiquetas.filter(id => state.arquivos[id]);
  return `<h1>Carrinho</h1><p class="sub">Confira os itens, pague por PIX, anexe o comprovante e as etiquetas e envie o pedido para a JCN.</p>
  <div class="panel"><h2>Itens</h2>
    <ul class="cart">
    ${itens.map(({ p, preco, qtd }) => `<li><div class="thumb">${fotoProd(p)}</div>
      <div class="ci"><b>${esc(p.nome)}</b><span class="note">${esc(detalhe(p))}${p.codigo ? ', ' + esc(p.codigo) : ''}</span><span class="note">${brl(preco)} cada</span></div>
      <label class="cq"><span class="sr">Quantidade de ${esc(p.nome)}</span><input class="inp qtd" id="cq-${esc(p.id)}" type="number" min="1" max="999" step="1" inputmode="numeric" data-chg="cart-qtd" data-id="${esc(p.id)}" value="${qtd}"></label>
      <b class="cs">${brl(preco * qtd)}</b>
      <button class="btn ghost sm cx" data-act="cart-rem" data-id="${esc(p.id)}" aria-label="Tirar ${esc(p.nome)} do carrinho">×</button></li>`).join('')}
    </ul>
    <p class="cart-total">${un} ${un > 1 ? 'unidades' : 'unidade'} <b>Total ${brl(total)}</b></p>
    <button class="btn ghost sm" data-act="nav" data-view="loja">Adicionar mais produtos</button></div>
  <div class="panel"><h2>Pagamento por PIX</h2>
    ${px.chave ? `<dl class="pixbox"><div><dt>Chave PIX</dt><dd id="pixChave">${esc(px.chave)}</dd></div>${px.favorecido ? `<div><dt>Favorecido</dt><dd>${esc(px.favorecido)}</dd></div>` : ''}${px.banco ? `<div><dt>Banco</dt><dd>${esc(px.banco)}</dd></div>` : ''}<div><dt>Valor</dt><dd>${brl(total)}</dd></div></dl>
      <button class="btn ghost sm" data-act="copiar-pix">Copiar chave</button>`
    : `<p class="note" style="margin:0">A JCN ainda não cadastrou a chave PIX aqui. Peça a chave ao seu contato comercial, pague ${brl(total)} e anexe o comprovante abaixo.</p>`}
    <h3 class="sub3">Comprovante</h3>
    ${comp ? `<ul class="files">${arqLi(comp.id, 'comp-loja-rem')}</ul>` : `<p class="note" style="margin:0 0 8px">Imagem ou PDF do comprovante do PIX. Sem ele o pedido não é enviado.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-loja"></label>`}</div>
  <div class="panel"><h2>Etiquetas de envio (PDF) ${etq.length ? chip([etq.length + (etq.length > 1 ? ' arquivos' : ' arquivo'), 'ok']) : ''}</h2>
    <p class="note" style="margin:0 0 8px">Envie o PDF da etiqueta de cada volume. Este pedido tem ${un} ${un > 1 ? 'unidades' : 'unidade'}. Sem etiqueta o pedido não sai para expedição; se ainda não tiver todas, anexe depois em Meus pedidos.</p>
    ${etq.length ? `<ul class="files" style="margin-bottom:10px">${etq.map(id => arqLi(id, 'etq-loja-rem')).join('')}</ul>` : ''}
    <label tabindex="0" class="btn ghost sm">${etq.length ? 'Anexar mais etiquetas' : 'Anexar etiquetas em PDF'}<input type="file" accept="application/pdf" multiple hidden data-file="etq-loja"></label></div>
  <label class="field"><span>Observações para a JCN</span><textarea id="coObs" data-chg="co-obs">${esc(co.obs)}</textarea></label>
  <div class="bar" style="margin-top:14px"><button class="btn" data-act="enviar-pedido-loja">Enviar pedido</button><button class="btn ghost" data-act="cart-limpar" data-confirm="Confirmar: esvaziar">Esvaziar carrinho</button></div>`;
}

async function copiar(texto, alvo, ok) {
  try { await navigator.clipboard.writeText(texto); toast(ok); }
  catch (e) {                                                         // sem permissão de área de transferência: deixa o texto selecionado
    const el = alvo && $(alvo); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Não foi possível copiar sozinho. O texto ficou selecionado: copie com Ctrl+C.');
  }
}

Object.assign(acts, {
  // administrador
  'nova-conta': () => { if (!podeConta(eu())) return; ui.acesso = null; ui.drawer = { tipo: 'conta', desc: 0, draft: { id: 'u-' + uid(), nome: '', doc: '', cidade: '', contato: '', vendedorResp: '', login: '', senhaNova: gerarSenha(), liberados: {}, ativo: true } }; renderDrawer(); },
  'editar-conta': e => { const u = user(e.dataset.id); if (!u || !podeConta(eu(), u)) return; ui.drawer = { tipo: 'conta', desc: 0, draft: { doc: '', cidade: '', contato: '', vendedorResp: '', ...JSON.parse(JSON.stringify(u)), senhaNova: '' } }; renderDrawer(); },
  'conta-gerar': () => { ui.drawer.draft.senhaNova = gerarSenha(); renderDrawer(); },
  'lib': e => { const d = ui.drawer.draft; if (e.checked) d.liberados[e.dataset.id] = precoBase(prod(e.dataset.id)); else delete d.liberados[e.dataset.id]; renderDrawer(); },
  'lib-todos': () => liberarLista(vendaveis()),
  'lib-colors': () => liberarLista(vendaveis().filter(p => p.cat === 'colors')),
  'lib-cat': e => liberarLista(vendaveis().filter(p => p.cat === e.dataset.id)),
  'lib-limpar': () => { ui.drawer.draft.liberados = {}; renderDrawer(); },
  'salvar-conta': async () => {
    const d = ui.drawer.draft, antigo = user(d.id), quem = eu();
    if (!podeConta(quem, antigo)) return toast('Você só altera as contas de e-commerce que são suas.');
    if (quem.papel === 'vendedor') d.vendedorResp = quem.id;            // loja criada pelo vendedor fica no nome dele
    const nome = (d.nome || '').trim(), login = (d.login || '').trim().toLowerCase(), senha = d.senhaNova || '';
    if (!nome) return toast('Informe o nome da loja.');
    if (!/^[a-z0-9]+([._-][a-z0-9]+)*$/.test(login) || login.length < 3 || login.length > 30) return toast('O login precisa ter de 3 a 30 caracteres: letras minúsculas e números, podendo ter ponto, hífen ou sublinhado no meio.');
    if (state.usuarios.some(u => u.id !== d.id && ((u.login || '') === login || (u.email || '').toLowerCase() === login))) return toast('Já existe uma conta com este login. Escolha outro.');
    const resp = user(d.vendedorResp);
    if (!resp || resp.papel !== 'vendedor') { const s = $('#ctVend'); if (s) s.focus(); return toast('Escolha de qual vendedor é este e-commerce.'); }
    if (!antigo && !senha) return toast('Defina a senha da loja ou use "Gerar senha".');
    if (senha && senha.length < 8) return toast('A senha precisa ter pelo menos 8 caracteres.');
    const liberados = {};
    for (const p of state.catalogo.produtos) {
      if (d.liberados[p.id] == null) continue;
      const v = dinheiro(d.liberados[p.id]);
      if (!(v > 0)) return toast('Informe o valor de ' + p.nome + ' para a loja, ou desmarque o produto.');
      liberados[p.id] = v;
    }
    const u = { id: d.id, nome, empresa: nome, email: '', login, papel: 'ecommerce', doc: (d.doc || '').trim(), cidade: (d.cidade || '').trim(), contato: (d.contato || '').trim(), vendedorResp: resp.id, ativo: !!d.ativo, liberados };
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=salvar-conta]'); if (bt) { bt.disabled = true; bt.textContent = 'Gravando…'; }
    try { await API.salvarLoja(u, senha, antigo); }
    catch (err) { ui.ocupado = false; if (bt) { bt.disabled = false; bt.textContent = 'Salvar conta'; } return toast(msgErro(err)); }
    ui.ocupado = false; ui.acesso = senha ? { nome, login, senha } : null;
    fecharDrawer(); renderApp(); scrollTo(0, 0);
    toast(Object.keys(liberados).length ? 'Conta salva.' : 'Conta salva sem produtos liberados: a loja ainda não vê nada.');
  },
  'copiar-acesso': () => { const a = ui.acesso; if (a) return copiar(`Área do E-commerce JCN Gourmet\nLogin: ${a.login}\nSenha: ${a.senha}`, '#acDados', 'Login e senha copiados.'); },
  // loja
  'q-menos': e => { const i = $('#q-' + e.dataset.id); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); },
  'q-mais': e => { const i = $('#q-' + e.dataset.id); i.value = Math.min(999, (parseInt(i.value, 10) || 0) + 1); },
  'add-carrinho': e => {
    const u = eu(), x = liberadosDe(u).find(l => l.p.id === e.dataset.id); if (!x) return toast('Este produto não está mais disponível para a sua conta.');
    const c = carrinho(), q = Math.min(999, Math.max(1, parseInt($('#q-' + e.dataset.id).value, 10) || 1));
    c[x.p.id] = Math.min(999, (c[x.p.id] || 0) + q); guardarCarrinho(); renderApp(); toast(`${q} × ${rotulo(x.p)} no carrinho.`);
  },
  'cart-rem': e => { delete carrinho()[e.dataset.id]; guardarCarrinho(); renderApp(); },
  'cart-limpar': () => { ui.carrinho = {}; guardarCarrinho(); renderApp(); },
  'comp-loja-rem': () => { const co = checkout(); Files.remove(co.comprovante); co.comprovante = null; renderApp(); },
  'etq-loja-rem': e => { const co = checkout(); co.etiquetas = co.etiquetas.filter(x => x !== e.dataset.id); Files.remove(e.dataset.id); renderApp(); },
  'copiar-pix': () => copiar(state.conteudo.pix.chave, '#pixChave', 'Chave PIX copiada.'),
  'enviar-pedido-loja': async () => {
    const u = eu(), itens = itensCarrinho(u), co = checkout();
    if (!itens.length) return toast('O carrinho está vazio.');
    if (!co.comprovante || !state.arquivos[co.comprovante]) return toast('Anexe o comprovante do PIX para enviar o pedido.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=enviar-pedido-loja]'); if (bt) { bt.disabled = true; bt.textContent = 'Enviando…'; }
    const etiquetas = co.etiquetas.filter(id => state.arquivos[id]);
    try {
      const r = await API.lancarPedido({ origem: 'ecommerce', cliente: { nome: u.nome, doc: u.doc || '', cidade: u.cidade || '' }, obs: co.obs || '', forma: 'pix',
        itens: itens.map(({ p, preco, qtd }) => ({ produto: p.id, qtd, preco })), comprovante: co.comprovante, etiquetas });
      ui.carrinho = {}; guardarCarrinho(); ui.checkout = null; ui.view = 'pedidos'; renderApp(); scrollTo(0, 0);
      toast(`Pedido nº ${r.numero} enviado. ${r.falhas.length ? 'Um dos arquivos não subiu: abra o pedido e anexe de novo.' : etiquetas.length ? 'A JCN vai conferir o PIX.' : 'Falta anexar as etiquetas.'}`);
    } catch (err) { toast(msgErro(err)); if (bt) { bt.disabled = false; bt.textContent = 'Enviar pedido'; } }
    finally { ui.ocupado = false; }
  }
});
Object.assign(chgs, {
  'pix-cfg': e => { if (eu().papel !== 'admin') return; state.conteudo.pix[e.dataset.k] = e.value.trim(); salvar('conteudo'); },
  'conta-desc': e => { ui.drawer.desc = Math.min(90, Math.max(0, parseFloat(e.value) || 0)); },
  'filtro-loja': e => { ui.catLoja = e.value; renderApp(); },
  'busca-loja': e => { ui.buscaLoja = e.value; renderApp(); },
  'cart-qtd': e => { carrinho()[e.dataset.id] = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); guardarCarrinho(); renderApp(); },
  'co-obs': e => { checkout().obs = e.value; }
});
Object.assign(uploads, {
  'comp-loja': async f => { if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.'); const m = await Files.put(f); checkout().comprovante = m.id; renderApp(); toast('Comprovante anexado.'); },
  'etq-loja': async f => { if (!ehPDF(f)) return toast(`${f.name || 'O arquivo'} não é PDF. As etiquetas precisam ser PDF.`); const m = await Files.put(f); checkout().etiquetas.push(m.id); renderApp(); }
});
