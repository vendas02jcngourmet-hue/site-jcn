/* ---------- Loja do site: consumidor final, sem login ----------
   Fica no fim da página inicial. Preço = tabela JCN + acréscimo (precoSite). A grelha é obrigatória e o forno é
   opcional, na mesma ficha do portal. O pedido entra em Pedidos com origem "site", para a JCN conferir o PIX. */
const LS_SACOLA = 'jcn-sacola-site';
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const lojaCfg = () => state.conteudo.loja || { ativa: true, acrescimo: 20 };
const naVitrine = () => state.pronto ? vendaveis().filter(p => precoSite(p) > 0) : [];
const soDig = s => String(s || '').replace(/\D/g, '');
function sacola() { if (!ui.sacola) { ui.sacola = {}; try { ui.sacola = JSON.parse(localStorage.getItem(LS_SACOLA)) || {}; } catch (e) { ui.sacola = {}; } } return ui.sacola; }
function guardarSacola() { const s = sacola(); Object.keys(s).forEach(k => { if (!(s[k] > 0)) delete s[k]; }); try { localStorage.setItem(LS_SACOLA, JSON.stringify(s)); } catch (e) { } }
function itensSacola() { const s = sacola(); return naVitrine().filter(p => s[p.id] > 0).map(p => ({ p, preco: precoSite(p), qtd: s[p.id] })); }
const qtdSacola = () => itensSacola().reduce((n, i) => n + i.qtd, 0);
function compra() { return ui.compra || (ui.compra = { nome: '', doc: '', fone: '', email: '', cep: '', rua: '', numero: '', compl: '', bairro: '', cidade: '', uf: 'SP', obs: '', comprovante: null }); }
// pedidos feitos neste aparelho (anotados no navegador); o andamento vem do servidor
function meusSite() { return (state.daqui || []).slice(); }
const notaDoSite = numero => lerPedidosDoSite().find(n => n.numero === numero);
const enderecoTxt = e => e ? `${e.rua}, ${e.numero}${e.compl ? ', ' + e.compl : ''}${e.bairro ? ' — ' + e.bairro : ''}. ${e.cidade}, ${e.uf}. CEP ${e.cep}` : '';

function renderVitrine() {
  const sec = $('#loja'); if (!sec) return;
  if ($('#site').hidden) { $('#vitrine').innerHTML = ''; return; }
  const cfg = lojaCfg(); sec.hidden = !cfg.ativa; if (!cfg.ativa) return;
  const foco = document.activeElement; if (foco && foco.id === 'vitBusca' && $('#vitrine').firstChild) return;     // não atrapalha quem está digitando a busca
  const todos = naVitrine(), cats = state.catalogo.categorias.filter(c => c.ativa && todos.some(p => p.cat === c.id));
  if (!cats.some(c => c.id === ui.catSite)) ui.catSite = cats[0] ? cats[0].id : '';
  const q = ui.buscaSite.trim().toLowerCase(), s = sacola(), n = qtdSacola(), meus = meusSite().length;
  const achados0 = todos.filter(p => q ? (p.nome + ' ' + p.codigo + ' ' + detalhe(p)).toLowerCase().includes(q) : p.cat === ui.catSite);   // a busca olha a loja inteira
  const ffs = ui.ffSite || (ui.ffSite = { bocas: '', perfil: '' }), achados = filtrarFogao(achados0, ffs);
  const gs = new Set(achados.map(p => p.grupo).filter(Boolean)), lista = todos.filter(p => achados.includes(p) || gs.has(p.grupo));
  const ms = modelos(lista); let sub = '';
  $('#vitrine').innerHTML = `
  <div class="vit-bar">
    <nav class="vit-cats" aria-label="Categorias da loja">${cats.map(c => `<button data-act="vit-cat" data-id="${esc(c.id)}" aria-current="${!q && c.id === ui.catSite}">${esc(c.nome)}</button>`).join('')}</nav>
    <div class="vit-acoes"><label class="sr" for="vitBusca">Buscar na loja</label><input id="vitBusca" class="inp" type="search" placeholder="Buscar produto" data-chg="vit-busca" value="${esc(ui.buscaSite)}">
      ${meus ? `<button class="btn ghost" data-act="meus-site">Meus pedidos</button>` : `<button class="btn ghost" data-act="meus-site">Acompanhar pedido</button>`}
      <button class="btn" data-act="sacola" id="vitSacola">Sacola${n ? ` <span class="badge">${n}</span>` : ''}</button></div>
  </div>
  ${chipsFogao(achados0, ffs, 'vit-ff')}
  ${q ? `<p class="note vit-res">${ms.length} ${ms.length === 1 ? 'produto encontrado' : 'produtos encontrados'} para "${esc(ui.buscaSite.trim())}". <button class="lnk" data-act="vit-limpar">Limpar a busca</button></p>` : ''}
  ${ms.length ? `<div class="cards shop vit-cards">${ms.map(g => { const p = g[0], varias = g.length > 1, ids = g.map(x => x.id).join(','), fo = fornosDe(p, 'site').length, no = g.reduce((t, x) => t + (s[x.id] || 0), 0);
    let titulo = ''; if (!q && (p.sub || '') !== sub) { sub = p.sub || ''; if (sub) titulo = `<h3 class="subh">${esc(sub)}</h3>`; }
    return titulo + `<article class="card">
      <button class="ph" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site" aria-label="Ver ${esc(p.nome)}">${fotoDe(p, p.nome)}</button>
      <h3><button class="nome" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site">${esc(p.nome)}</button></h3>
      <span class="note">${varias ? 'Grelha de ferro fundido ou de aço carbono' : (p.grelha ? '' : `<i class="sw" style="background:${esc(p.hex)}"></i>`) + esc(detalhe(p))}</span>
      <span class="price">${varias ? 'A partir de ' + brl(Math.min(...g.map(precoSite))) : brl(precoSite(p))}</span>
      ${fo ? '<span class="chip">Forno opcional</span>' : ''}
      ${varias || fo || ehFogao(p) ? `<button class="btn sm" data-act="ficha" data-ids="${esc(ids)}" data-ctx="site">${varias ? (fo ? 'Escolher grelha e forno' : 'Escolher a grelha') : fo ? 'Comprar, com ou sem forno' : 'Ver opções e comprar'}</button>`
                     : `<button class="btn sm" data-act="sacola-add" data-id="${esc(p.id)}">Adicionar à sacola</button>`}
      ${no ? `<span class="chip info">${no} na sacola</span>` : ''}</article>`; }).join('')}</div>`
  : `<div class="empty">${q ? 'Nenhum produto com esse nome ou código.' : 'Nenhum produto disponível nesta categoria.'}</div>`}
  <p class="note vit-pe">Preços para o consumidor final, com pagamento por PIX. O frete não está incluído: a JCN confirma valor e prazo com você antes do envio. Já comprou? <button class="lnk" data-act="meus-site">Acompanhar pedido</button></p>`;
}

/* ---------- sacola e fechamento ---------- */
function dSacola() {
  const itens = itensSacola(), c = compra(), px = state.conteudo.pix;
  if (!itens.length) return `<h2 class="dt">Sua sacola</h2><div class="empty">A sacola está vazia.<br><button class="btn" style="margin-top:12px" data-act="fechar">Ver os produtos</button></div>`;
  const total = itens.reduce((t, i) => t + i.qtd * i.preco, 0), un = itens.reduce((t, i) => t + i.qtd, 0), comp = c.comprovante && state.arquivos[c.comprovante];
  const campo = (k, t, extra = '') => `<label class="field"><span>${t}</span><input id="cp-${k}" data-c="${k}" value="${esc(c[k])}" ${extra}></label>`;
  return `<h2 class="dt">Sua sacola</h2>
  <div class="panel"><h2>Itens</h2>
    <ul class="cart">${itens.map(({ p, preco, qtd }) => `<li><div class="thumb">${fotoProd(p)}</div>
      <div class="ci"><b>${esc(p.nome)}</b><span class="note">${esc(detalhe(p))}${p.codigo ? ', ' + esc(p.codigo) : ''}</span><span class="note">${brl(preco)} cada</span></div>
      <label class="cq"><span class="sr">Quantidade de ${esc(p.nome)}</span><input class="inp qtd" id="sq-${esc(p.id)}" type="number" min="1" max="999" step="1" inputmode="numeric" data-chg="sac-qtd" data-id="${esc(p.id)}" value="${qtd}"></label>
      <b class="cs">${brl(preco * qtd)}</b>
      <button class="btn ghost sm cx" data-act="sac-rem" data-id="${esc(p.id)}" aria-label="Tirar ${esc(p.nome)} da sacola">×</button></li>`).join('')}</ul>
    <p class="cart-total">${un} ${un > 1 ? 'unidades' : 'unidade'} <b>Total ${brl(total)}</b></p>
    <p class="note" style="margin:0">Frete à parte: a JCN confirma o valor e o prazo pelo WhatsApp antes de enviar.</p></div>
  <div class="panel"><h2>Seus dados</h2><div class="rows">
    ${campo('nome', 'Nome completo ou razão social', 'autocomplete="name"')}
    <div class="grid2">${campo('doc', 'CPF ou CNPJ', 'inputmode="numeric"')}${campo('fone', 'WhatsApp com DDD', 'inputmode="tel" autocomplete="tel"')}</div>
    ${campo('email', 'E-mail (opcional)', 'type="email" autocomplete="email"')}</div></div>
  <div class="panel"><h2>Endereço de entrega</h2><div class="rows">
    <div class="grid2">${campo('cep', 'CEP', 'inputmode="numeric" autocomplete="postal-code"')}${campo('bairro', 'Bairro')}</div>
    <div class="grid-end">${campo('rua', 'Rua ou avenida', 'autocomplete="address-line1"')}${campo('numero', 'Número')}</div>
    ${campo('compl', 'Complemento (opcional)')}
    <div class="grid-end">${campo('cidade', 'Cidade')}<label class="field"><span>UF</span><select id="cp-uf" data-c="uf">${UFS.map(u => `<option ${u === c.uf ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div></div></div>
  <div class="panel"><h2>Pagamento por PIX</h2>
    ${px.chave ? `<dl class="pixbox"><div><dt>Chave PIX</dt><dd id="pixChave">${esc(px.chave)}</dd></div>${px.favorecido ? `<div><dt>Favorecido</dt><dd>${esc(px.favorecido)}</dd></div>` : ''}${px.banco ? `<div><dt>Banco</dt><dd>${esc(px.banco)}</dd></div>` : ''}<div><dt>Valor</dt><dd>${brl(total)}</dd></div></dl>
      <button class="btn ghost sm" data-act="copiar-pix">Copiar chave</button>`
    : `<p class="note" style="margin:0">A chave PIX ainda não está disponível aqui. Peça pelo WhatsApp (17) 99151-9932, pague ${brl(total)} e anexe o comprovante abaixo.</p>`}
    <h3 class="sub3">Comprovante</h3>
    ${comp ? `<ul class="files"><li><span class="nm">${esc(comp.nome)}</span><span class="mt">${kb(comp.tamanho)}</span><button class="btn danger sm" data-act="comp-site-rem">Remover</button></li></ul>`
    : `<p class="note" style="margin:0 0 8px">Imagem ou PDF do comprovante do PIX. Sem ele o pedido não é enviado.</p>
    <label tabindex="0" class="btn ghost sm">Anexar comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-site"></label>`}</div>
  <label class="field"><span>Observações (opcional)</span><textarea id="cp-obs" data-c="obs">${esc(c.obs)}</textarea></label>
  <p class="err" id="cpErro" role="alert" ${ui.erroCompra ? '' : 'hidden'}>${esc(ui.erroCompra || '')}</p>
  <div class="foot"><button class="btn" data-act="enviar-pedido-site">Enviar pedido</button><button class="btn ghost" data-act="fechar">Continuar comprando</button></div>`;
}
function validarCompra(c) {
  const d = soDig(c.doc), f = soDig(c.fone), cep = soDig(c.cep);
  if (c.nome.trim().length < 5) return ['nome', 'Escreva o nome completo ou a razão social.'];
  if (d.length !== 11 && d.length !== 14) return ['doc', 'O CPF tem 11 números e o CNPJ tem 14. Confira o que foi digitado.'];
  if (f.length < 10 || f.length > 11) return ['fone', 'Informe o WhatsApp com DDD, por exemplo (17) 99999-0000.'];
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) return ['email', 'O e-mail parece incompleto. Corrija ou deixe em branco.'];
  if (cep.length !== 8) return ['cep', 'O CEP tem 8 números.'];
  if (!c.rua.trim()) return ['rua', 'Informe a rua ou avenida da entrega.'];
  if (!c.numero.trim()) return ['numero', 'Informe o número. Se não houver, escreva "s/n".'];
  if (!c.cidade.trim()) return ['cidade', 'Informe a cidade da entrega.'];
  return null;
}
function dPedidoSite(p, dr) {
  const comp = p.pix.nomeComp ? { nome: p.pix.nomeComp } : (p.pix.arquivo && state.arquivos[p.pix.arquivo]), et = ['aguardando', 'expedicao', 'enviado'], ix = et.indexOf(p.envio), nota = notaDoSite(p.numero);
  return `<h2 class="dt">${dr.novo ? 'Pedido recebido' : 'Pedido nº ' + p.numero}</h2>
  ${dr.novo ? `<div class="acesso" role="status"><h2>Anote o número: ${p.numero}</h2><p>${p.pix.status === 'sem' ? 'Recebemos o seu pedido, mas o comprovante não subiu: envie de novo no botão abaixo.' : 'Recebemos o seu pedido e o comprovante.'} A JCN Gourmet confere o PIX e fala com você pelo WhatsApp ${esc(p.cliente.fone)} para combinar o frete e o prazo.</p></div>` : ''}
  <p style="margin:0 0 14px"><b>${esc(p.cliente.nome)}</b><br><span class="note">Feito em ${dataBR(p.criado)}.${p.cliente.endereco ? ' Entrega: ' + esc(enderecoTxt(p.cliente.endereco)) : ''}</span></p>
  <div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl" style="min-width:0"><thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Subtotal</th></tr></thead><tbody>
    ${p.itens.map(i => `<tr><td>${esc(i.nome)}${i.codigo ? `<br><span class="note">${esc(i.codigo)}</span>` : ''}</td><td class="num">${i.qtd}</td><td class="num">${brl(i.qtd * i.preco)}</td></tr>`).join('')}
    <tr><td colspan="2" class="num"><b>Total, sem o frete</b></td><td class="num"><b>${brl(totalPedido(p))}</b></td></tr></tbody></table></div>
  <div class="panel"><h2>Pagamento ${chip(PIX[p.pix.status])}</h2>
    <p class="note" style="margin:0">${p.pix.status === 'verificado' ? 'PIX conferido pela JCN.' : p.pix.status === 'recusado' ? 'O comprovante não foi aceito. Envie outro para o pedido voltar à conferência.' : comp ? 'Comprovante recebido: ' + esc(comp.nome) + '. Aguardando a conferência.' : 'Comprovante recebido. Aguardando a conferência.'}</p>
    ${(p.pix.status === 'recusado' || p.pix.status === 'sem') && nota && nota.chave ? `<div class="bar" style="margin:10px 0 0"><label tabindex="0" class="btn ghost sm">Enviar novo comprovante<input type="file" accept="image/*,application/pdf" hidden data-file="comp-site-pedido"></label></div>` : ''}</div>
  <div class="panel"><h2>Envio</h2><ol class="steps">${et.map((s, i) => `<li class="${i < ix ? 'done' : i === ix ? 'now' : ''}">${ENVIO[s][0]}</li>`).join('')}</ol></div>
  <p class="note">Dúvidas sobre este pedido: WhatsApp (17) 99151-9932, informando o número ${p.numero}.</p>
  <div class="foot"><button class="btn" data-act="fechar">${dr.novo ? 'Voltar para a loja' : 'Fechar'}</button>${dr.novo ? '' : '<button class="btn ghost" data-act="meus-site">Outros pedidos</button>'}</div>`;
}
function dMeusSite(dr) {
  const l = meusSite().sort((a, b) => b.numero - a.numero);
  return `<h2 class="dt">Acompanhar pedido</h2>
  ${l.length ? `<div class="panel"><h2>Pedidos feitos neste aparelho</h2><ul class="files">${l.map(p => `<li><span class="nm">Nº ${p.numero} <span class="note">· ${dataBR(p.criado)} · ${brl(totalPedido(p))}</span></span>${chip(PIX[p.pix.status])}${chip(ENVIO[p.envio])}
    <button class="btn ghost sm" data-act="abrir-pedido-site" data-id="${esc(p.id)}">Abrir</button></li>`).join('')}</ul></div>` : ''}
  <div class="panel"><h2>${l.length ? 'Comprou em outro aparelho?' : 'Encontre o seu pedido'}</h2>
    <p class="note" style="margin:0 0 10px">Informe o número do pedido e o CPF ou CNPJ usado na compra.</p>
    <div class="grid2"><label class="field"><span>Número do pedido</span><input id="acNum" inputmode="numeric" value="${esc(dr.num || '')}"></label><label class="field"><span>CPF ou CNPJ</span><input id="acDoc" inputmode="numeric" value="${esc(dr.doc || '')}"></label></div>
    <p class="err" id="acErro" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
    <div class="bar" style="margin:10px 0 0"><button class="btn" data-act="buscar-pedido-site">Procurar</button></div></div>
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}

Object.assign(acts, {
  'vit-cat': e => { ui.catSite = e.dataset.id; ui.buscaSite = ''; renderVitrine(); },
  'vit-ff': e => { ui.ffSite[e.dataset.k] = e.dataset.v; renderVitrine(); },
  'vit-limpar': () => { ui.buscaSite = ''; renderVitrine(); const b = $('#vitBusca'); if (b) b.focus(); },
  'sacola': () => { ui.erroCompra = ''; ui.drawer = { tipo: 'sacola', pub: true }; renderDrawer(); },
  'sacola-add': e => { const p = prod(e.dataset.id); if (!p || !naVitrine().includes(p)) return toast('Este produto não está mais disponível.'); const s = sacola(); s[p.id] = Math.min(999, (s[p.id] || 0) + 1); guardarSacola(); renderVitrine(); toast(`${rotulo(p)} na sacola.`); },
  'sac-rem': e => { delete sacola()[e.dataset.id]; guardarSacola(); renderVitrine(); renderDrawer(); },
  'comp-site-rem': () => { const c = compra(); if (c.comprovante) Files.remove(c.comprovante); c.comprovante = null; renderDrawer(); },
  'meus-site': () => { ui.drawer = { tipo: 'meus-site', pub: true, erro: '' }; renderDrawer(); },
  'abrir-pedido-site': e => { ui.drawer = { tipo: 'pedido-site', pub: true, id: e.dataset.id }; renderDrawer(); },
  'buscar-pedido-site': async () => {
    const n = parseInt(soDig($('#acNum').value), 10), d = soDig($('#acDoc').value);
    ui.drawer.num = $('#acNum').value; ui.drawer.doc = $('#acDoc').value;                 // o que foi digitado continua no campo se der erro
    const nao = () => { ui.drawer.erro = 'Não encontramos um pedido com esse número e esse documento. Confira os dois e tente de novo.'; renderDrawer(); };
    if (!n || !d) return nao();
    let a = null; try { a = await andamentoDoSite(n, d); } catch (err) { ui.drawer.erro = msgErro(err); return renderDrawer(); }
    if (!a) return nao();
    if (!notaDoSite(n)) guardarPedidosDoSite([{ numero: n, doc: d }, ...lerPedidosDoSite()]);
    await carregarPedidosDoSite();
    const p = state.daqui.find(x => x.numero === n); if (!p) return nao();
    ui.drawer = { tipo: 'pedido-site', pub: true, id: p.id }; renderDrawer(); renderVitrine();
  },
  'enviar-pedido-site': async () => {
    const itens = itensSacola(), c = compra();
    const falha = (campo, msg) => { ui.erroCompra = msg; renderDrawer(); const el = campo && $('#cp-' + campo); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } else $('#cpErro').scrollIntoView({ block: 'center' }); };
    if (!itens.length) return falha('', 'A sacola está vazia.');
    const erro = validarCompra(c); if (erro) return falha(erro[0], erro[1]);
    if (!c.comprovante || !state.arquivos[c.comprovante]) return falha('', 'Anexe o comprovante do PIX para enviar o pedido.');
    if (ui.ocupado) return; ui.ocupado = true;
    const bt = $('[data-act=enviar-pedido-site]'); if (bt) { bt.disabled = true; bt.textContent = 'Enviando…'; }
    let r;
    try { r = await API.pedidoDoSite(c, itens, c.comprovante); }
    catch (err) { ui.ocupado = false; return falha('', msgErro(err)); }
    ui.ocupado = false;
    ui.sacola = {}; guardarSacola(); ui.compra = { ...c, obs: '', comprovante: null }; ui.erroCompra = '';
    const p = state.daqui.find(x => x.numero === r.numero);
    ui.drawer = { tipo: 'pedido-site', pub: true, id: p ? p.id : r.id, novo: true }; renderDrawer(); const dw = $('.drawer'); if (dw) dw.scrollTop = 0; renderVitrine();
  }
});
Object.assign(chgs, {
  'vit-busca': e => { ui.buscaSite = e.value; e.blur(); renderVitrine(); },
  'sac-qtd': e => { sacola()[e.dataset.id] = Math.min(999, Math.max(1, parseInt(e.value, 10) || 1)); guardarSacola(); renderVitrine(); renderDrawer(); },
  'loja-site': e => {
    const l = state.conteudo.loja; if (e.dataset.k === 'ativa') l.ativa = e.checked; else { l.acrescimo = Math.min(500, Math.max(0, parseFloat(String(e.value).replace(',', '.')) || 0)); e.value = l.acrescimo; }
    salvar('conteudo'); const z = state.catalogo.produtos.find(p => p.preco > 0), ex = $('#ljExemplo'); if (z && ex) ex.textContent = `Exemplo: ${z.nome} sai de ${brl(z.preco)} na tabela para ${brl(precoSite(z))} no site.`;
  }
});
Object.assign(uploads, {
  'comp-site': async f => { if (!PDF_IMG(f)) { ui.erroCompra = 'Envie o comprovante em imagem ou PDF.'; return renderDrawer(); } const m = await Files.put(f); compra().comprovante = m.id; ui.erroCompra = ''; renderDrawer(); toast('Comprovante anexado.'); },
  'comp-site-pedido': async f => {
    if (!PDF_IMG(f)) return toast('Envie o comprovante em imagem ou PDF.');
    const p = ui.drawer && state.daqui.find(x => x.id === ui.drawer.id), nota = p && notaDoSite(p.numero); if (!p || !nota || !nota.chave || p.pix.status === 'verificado') return;
    const m = await Files.put(f);
    try { nota.comprovante = await API.comprovanteDoSite(nota, m.id); guardarPedidosDoSite(lerPedidosDoSite().map(n => n.numero === nota.numero ? nota : n)); toast('Comprovante enviado para conferência.'); }
    catch (err) { toast(msgErro(err)); }
    if (papelAtual()) await carregarPedidos(); else await carregarPedidosDoSite();
    const q = state.daqui.find(x => x.numero === nota.numero); if (q && ui.drawer) ui.drawer.id = q.id; renderDrawer();
  }
});
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.c && ui.compra) ui.compra[t.dataset.c] = t.value; });
