/* ---------- Orçamentos das ligações (administração e vendedores) ----------
   O vendedor monta o orçamento na hora da ligação (ou depois, pela ficha da loja), com os itens e o preço
   combinado. Dentro do orçamento, a aba "Por que não foi concluído" guarda o motivo e o que aconteceu.
   O orçamento fica na base da loja e entra no relatório de ligações. */
const SIT_ORC = { aberto: ['Em aberto', 'info'], concluido: ['Concluído', 'ok'], nao_concluido: ['Não concluído', 'bad'] };
const MOTIVOS = { preco: 'Preço alto', frete: 'Frete caro', prazo: 'Prazo de entrega', pagamento: 'Forma de pagamento', concorrente: 'Comprou de outro fornecedor',
  sem_estoque: 'Faltou o produto', desistiu: 'Desistiu da compra', sem_resposta: 'Não respondeu mais', outro: 'Outro motivo' };
const orcs = () => crm().orcamentos || [];
const orcDe = id => orcs().find(o => o.id === id);
const orcsDe = pid => orcs().filter(o => o.prospect_id === pid);
const totalOrc = o => (o.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.preco_unit) || 0), 0);
const podeOrc = (o, u) => u && (u.papel === 'admin' || (u.papel === 'vendedor' && (!o.id || o.vendedor_id === u.id)));
const itemVazio = () => ({ produto_id: '', descricao: '', codigo: '', quantidade: 1, preco_unit: 0 });
const novoOrc = pid => ({ id: '', prospect_id: pid || '', situacao: 'aberto', validade: somaDias(hojeISO(), 7), obs: '', motivo: '', motivo_detalhe: '', itens: [], aba: 'itens' });
const rascunhoOrc = o => ({ id: o.id, numero: o.numero, prospect_id: o.prospect_id, ligacao_id: o.ligacao_id, vendedor_id: o.vendedor_id, criado_em: o.criado_em, situacao: o.situacao, validade: o.validade || '', obs: o.obs || '',
  motivo: o.motivo || '', motivo_detalhe: o.motivo_detalhe || '', itens: o.itens.length ? o.itens.map(i => ({ produto_id: i.produto_id || '', descricao: i.descricao, codigo: i.codigo || '', quantidade: i.quantidade, preco_unit: i.preco_unit, livre: !i.produto_id })) : [], aba: o.situacao === 'nao_concluido' ? 'motivo' : 'itens' });
const chipOrc = k => chip(SIT_ORC[k] || [k, '']);
const orcDraft = onde => onde === 'lig' ? ui.lig && ui.lig.orc : ui.drawer && ui.drawer.tipo === 'orcamento' ? ui.drawer.draft : null;
const redesenharOrc = onde => onde === 'lig' ? renderApp() : renderDrawer();
const resumoItens = o => (o.itens || []).map(i => `${i.quantidade}× ${i.descricao}`).join(', ');
function avisoOrc() {
  return crm().orcIndisponivel ? `<p class="note" style="margin:8px 0 0"><b>Falta um passo no banco para os orçamentos:</b> rode o arquivo <b>atualizacao-3.sql</b> no Supabase (SQL Editor, colar tudo, Run).</p>` : '';
}

/* o editor do orçamento: o mesmo na tela de ligações e na gaveta. Duas abas: os itens e o motivo de não ter sido concluído */
function orcEditor(d, onde, so) {
  const ativos = state.catalogo.produtos.filter(p => p.ativo), dis = so ? 'disabled' : '', aba = d.aba || 'itens', id = x => `${x}-${onde}`;
  const opcoes = it => `<option value="">Escolha o produto</option>${state.catalogo.categorias.map(c => { const g = ativos.filter(a => a.cat === c.id); return g.length ? `<optgroup label="${esc(c.nome)}">${g.map(a => `<option value="${esc(a.id)}" ${a.id === it.produto_id ? 'selected' : ''}>${esc(rotulo(a))}${a.codigo ? ' · ' + esc(a.codigo) : ''}</option>`).join('')}</optgroup>` : ''; }).join('')}
    <option value="__livre" ${it.livre && !it.produto_id ? 'selected' : ''}>Outro item (escrever)</option>`;
  const itensV = d.itens.filter(it => it.produto_id || it.livre || (it.descricao || '').trim());
  const linhas = d.itens.map((it, i) => !(it.produto_id || it.livre || (it.descricao || '').trim()) ? '' : `<div class="orc-item">
      <div class="orc-prod">${it.produto_id || !it.livre ? `<div class="orc-desc"><b>${esc(it.descricao || 'Item')}</b>${it.codigo ? `<small>${esc(it.codigo)}</small>` : ''}</div>`
        : `<input class="inp" aria-label="Descrição do item ${i + 1}" placeholder="Descreva o item" data-oi="descricao" data-i="${i}" data-onde="${onde}" value="${esc(it.descricao)}" ${dis}>`}</div>
      <label class="orc-n"><span>Qtd.</span><input class="inp" type="number" min="1" max="9999" step="1" inputmode="numeric" data-oi="quantidade" data-i="${i}" data-onde="${onde}" value="${esc(it.quantidade)}" ${dis}></label>
      <label class="orc-n"><span>Preço un. (R$)</span><input class="inp" type="number" min="0" step="0.01" inputmode="decimal" data-oi="preco_unit" data-i="${i}" data-onde="${onde}" value="${esc(it.preco_unit)}" ${dis}></label>
      <span class="orc-sub" data-sub="${i}">${brl((+it.quantidade || 0) * (+it.preco_unit || 0))}</span>
      ${so ? '' : `<button class="btn ghost sm" data-act="orc-item-rem" data-i="${i}" data-onde="${onde}" aria-label="Tirar o item ${i + 1}">×</button>`}</div>`).join('');
  const sit = d.situacao || 'aberto';
  return `<div class="tabs orc-abas" role="tablist">
      <button role="tab" aria-selected="${aba === 'itens'}" data-act="orc-aba" data-aba="itens" data-onde="${onde}">Itens do orçamento</button>
      <button role="tab" aria-selected="${aba === 'motivo'}" data-act="orc-aba" data-aba="motivo" data-onde="${onde}">Por que não foi concluído${d.situacao === 'nao_concluido' ? ' •' : ''}</button></div>
    ${aba === 'itens' ? `${itensV.length ? `<div class="orc-itens">${linhas}</div>` : `<p class="note" style="margin:0 0 8px">Nenhum item ainda. Escolha os produtos abaixo.</p>`}
      ${so ? '' : montador(d, onde)}
      <p class="orc-total">Total <b id="${id('orcTotal')}">${brl(totalOrc(d))}</b></p>
      <div class="grid2"><label class="field"><span>Válido até</span><input type="date" data-oe="validade" data-onde="${onde}" value="${esc(d.validade)}" ${dis}></label>
        <label class="field"><span>Situação</span><select data-oe="situacao" data-onde="${onde}" ${dis}>${Object.entries(SIT_ORC).map(([k, [t]]) => `<option value="${k}" ${k === sit ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <label class="field" style="margin-top:10px"><span>Observações do orçamento (frete, pagamento, prazo)</span><textarea rows="2" data-oe="obs" data-onde="${onde}" ${dis}>${esc(d.obs)}</textarea></label>`
    : `<p class="note" style="margin:0 0 10px">Se a loja não fechou, escolha o motivo e escreva o que aconteceu. O orçamento passa a contar como <b>não concluído</b> no relatório.</p>
      <label class="field"><span>Motivo</span><select data-oe="motivo" data-onde="${onde}" ${dis}><option value="">Ainda não sei / foi concluído</option>${Object.entries(MOTIVOS).map(([k, t]) => `<option value="${k}" ${k === d.motivo ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field" style="margin-top:10px"><span>Por que não foi concluído</span><textarea rows="5" data-oe="motivo_detalhe" data-onde="${onde}" placeholder="Ex.: achou o frete caro para Rio Preto; o concorrente fez R$ 200 a menos no FF011; pediu para ver de novo no mês que vem." ${dis}>${esc(d.motivo_detalhe)}</textarea></label>
      <p class="note" style="margin:8px 0 0">Situação agora: ${chipOrc(sit)}</p>`}`;
}
/* montador do orçamento: escolhe o produto com cliques, depois a grelha (obrigatória) e o forno (opcional) */
function montador(d, onde) {
  const k = d.pick || (d.pick = { cat: 'colors', busca: '', modelo: '', sel: '', forno: '', qtd: 1 });
  const ativos = state.catalogo.produtos.filter(p => p.ativo && (cat(p.cat) || {}).ativa), u = eu();
  const de = (a, x) => `data-act="${a}" data-onde="${onde}"${x || ''}`;
  if (k.modelo) {
    const g = modelos(ativos).find(m => m.some(p => p.id === k.modelo)) || [], p0 = g[0];
    if (!p0) { k.modelo = ''; return montador(d, onde); }
    if (g.length === 1) k.sel = p0.id;
    const at = g.find(p => p.id === k.sel), p = at || p0, fs = fornosDe(p, 'venda', u), fa = fs.find(f => f.p.id === k.forno);
    if (!fa) k.forno = '';
    const tot = at ? (at.preco + (fa ? fa.preco : 0)) * (k.qtd || 1) : 0;
    return `<div class="mont" id="mont-${onde}"><div class="mont-top"><button class="linkbtn" ${de('pk-voltar')}>← Voltar aos produtos</button></div>
      <div class="mont-sel"><div class="ph">${fotoDe(p, p.nome)}</div><div><h4>${esc(p.nome)}</h4>
        ${g.length > 1 ? `<p class="leg">1. Escolha a grelha <span class="opc obr">obrigatória</span></p><div class="pk-ops">${g.map(x => `<button class="pk-op${x.id === k.sel ? ' sel' : ''}" ${de('pk-grelha', ` data-id="${esc(x.id)}"`)} aria-pressed="${x.id === k.sel}"><b>${esc(GRELHAS[x.grelha] || detalhe(x))}</b><small>${esc(x.codigo || '')}</small><span>${precoTxt(x.preco)}</span></button>`).join('')}</div>`
          : `<p class="leg">${grelhaDe(p) ? `Grelha: <b>${esc(grelhaDe(p))}</b> (única deste modelo)` : esc(detalhe(p) || '')} · ${esc(p.codigo || '')} · <b>${precoTxt(p.preco)}</b></p>`}
        ${fs.length ? `<p class="leg">${g.length > 1 ? '2. ' : ''}Forno <span class="opc">opcional</span></p><div class="pk-ops">
          <button class="pk-op${fa ? '' : ' sel'}" ${de('pk-forno', ' data-id=""')} aria-pressed="${!fa}"><b>Sem forno</b></button>
          ${fs.map(f => `<button class="pk-op${f === fa ? ' sel' : ''}" ${de('pk-forno', ` data-id="${esc(f.p.id)}"`)} aria-pressed="${f === fa}"><b>${esc(nomeForno(f.p, true))}</b><small>${esc(f.p.codigo || '')}</small><span>+ ${brl(f.preco)}</span></button>`).join('')}</div>`
          : ehFogao(p) ? `<p class="note">${specDe(p, 'forno interno') || specDe(p, 'forno') ? 'Este fogão já vem com forno.' : 'Este modelo não leva forno avulso.'}</p>` : ''}
        <div class="pk-fim"><div class="qty"><button ${de('pk-qtd', ' data-d="-1"')} aria-label="Diminuir">−</button><b class="pk-q">${k.qtd || 1}</b><button ${de('pk-qtd', ' data-d="1"')} aria-label="Aumentar">+</button></div>
          <button class="btn" ${de('pk-add')} ${at ? '' : 'disabled'}>${at ? `Adicionar ao orçamento · ${brl(tot)}` : 'Escolha a grelha'}</button></div>
      </div></div></div>`;
  }
  const q = (k.busca || '').trim().toLowerCase(), cats = state.catalogo.categorias.filter(c => c.ativa !== false && ativos.some(p => p.cat === c.id));
  const base = ativos.filter(p => q ? (p.nome + ' ' + (p.codigo || '') + ' ' + (p.cor || '')).toLowerCase().includes(q) || ativos.some(x => x.grupo && x.grupo === p.grupo && (x.codigo || '').toLowerCase().includes(q)) : p.cat === k.cat);
  const lista = modelos(filtrarFogao(base, k));
  return `<div class="mont" id="mont-${onde}"><div class="mont-top"><b>Adicionar produto</b>
      <input class="inp" type="search" placeholder="Buscar por nome ou código" data-pk="busca" data-onde="${onde}" value="${esc(k.busca)}" aria-label="Buscar produto">
      <button class="btn ghost sm" ${de('pk-livre')}>Item avulso (escrever)</button></div>
    ${q ? '' : `<div class="pk-cats">${cats.map(c => `<button class="chip${c.id === k.cat ? ' on' : ''}" ${de('pk-cat', ` data-id="${esc(c.id)}"`)}>${esc(c.nome)}</button>`).join('')}</div>`}
    ${chipsFogao(base, k, 'pk-ff', ` data-onde="${onde}"`)}
    <div class="pk-grid">${lista.slice(0, 60).map(g => { const p = g[0], mn = Math.min(...g.map(x => x.preco > 0 ? x.preco : Infinity)), fo = g.some(x => (x.fornos || []).length);
      return `<button class="pk-card" ${de('pk-modelo', ` data-id="${esc(p.id)}"`)}><span class="ph">${fotoDe(p, '')}</span><b>${esc(p.cat === 'colors' ? `${p.nome} (${p.cor})` : p.nome)}</b>
        <small>${esc(g.map(x => x.codigo).filter(Boolean).join(' · '))}</small><span class="pk-pr">${isFinite(mn) ? (g.length > 1 ? 'a partir de ' : '') + brl(mn) : 'Preço a definir'}${g.length > 1 ? ' · 2 grelhas' : ''}${fo ? ' · forno opcional' : ''}</span></button>`; }).join('') || '<p class="note">Nenhum produto encontrado.</p>'}</div></div>`;
}
// confere o rascunho antes de gravar; devolve a mensagem de erro ou ''
function problemaOrc(d) {
  const itens = d.itens.filter(i => i.produto_id || (i.descricao || '').trim());
  if (!itens.length) return 'Coloque pelo menos um item no orçamento.';
  if (itens.some(i => !(+i.quantidade >= 1))) return 'Informe a quantidade de cada item.';
  if (itens.some(i => !(+i.preco_unit >= 0))) return 'Confira o preço dos itens.';
  if (d.situacao === 'nao_concluido' && !d.motivo) return 'Na aba "Por que não foi concluído", escolha o motivo.';
  return '';
}
const corpoOrc = d => ({ id: d.id || '', prospect_id: d.prospect_id, ligacao_id: d.ligacao_id || '', situacao: d.situacao, validade: d.validade || '', obs: d.obs, motivo: d.situacao === 'nao_concluido' ? d.motivo : '', motivo_detalhe: d.situacao === 'nao_concluido' ? d.motivo_detalhe : '',
  itens: d.itens.filter(i => i.produto_id || (i.descricao || '').trim()).map(i => ({ produto_id: i.produto_id, descricao: i.descricao.trim(), codigo: i.codigo, quantidade: Math.round(+i.quantidade), preco_unit: +i.preco_unit || 0 })) });

/* gaveta do orçamento */
function dOrcamento(dr, u) {
  const d = dr.draft, p = prospectDe(d.prospect_id); if (!p) return '';
  const so = !podeOrc(d, u), adm = u.papel === 'admin';
  return `<h2 class="dt">${d.id ? `Orçamento nº ${esc(d.numero)}` : 'Novo orçamento'}</h2>
  <p class="note"><button class="linkbtn" data-act="abrir-prospect" data-id="${esc(p.id)}"><b>${esc(p.loja)}</b></button> · ${esc(p.cidade)}/${esc(p.uf)}${p.comprador ? ' · ' + esc(p.comprador) : ''}
    ${d.id ? `<br>Feito em ${dataBR(diaDe(d.criado_em))} por ${esc(nomeVend(d.vendedor_id))}` : ''}</p>
  ${so ? '<p class="note">Só quem fez o orçamento ou a administração pode alterá-lo.</p>' : ''}
  ${orcEditor(d, 'dr', so)}
  <p class="err" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
  <div class="foot">${so ? '' : `<button class="btn" data-act="orc-salvar">${d.id ? 'Salvar orçamento' : 'Criar orçamento'}</button>`}
    ${d.id ? `<a class="btn ghost" href="https://wa.me/55${esc(p.telefone)}?text=${encodeURIComponent(textoOrc(d, p))}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>` : ''}
    <button class="btn ghost" data-act="fechar">Fechar</button>
    ${adm && d.id ? `<button class="btn danger" data-act="orc-apagar" data-confirm="Confirmar: apagar orçamento">Apagar</button>` : ''}</div>`;
}
function textoOrc(d, p) {
  return [`Olá${p.comprador ? ', ' + p.comprador : ''}! Segue o orçamento nº ${d.numero} da JCN Gourmet:`, '']
    .concat(d.itens.filter(i => i.descricao).map(i => `• ${i.quantidade}× ${i.descricao}${i.codigo ? ' (' + i.codigo + ')' : ''}: ${brl(i.quantidade * i.preco_unit)}`))
    .concat(['', `Total: ${brl(totalOrc(d))}`], d.validade ? [`Válido até ${dataBR(d.validade)}.`] : [], d.obs ? [d.obs] : []).join('\n');
}

/* lista de orçamentos (tela de ligações e ficha da loja) */
function tabelaOrcs(lista, mostraLoja) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th>${mostraLoja ? '<th>Loja</th>' : ''}<th>Vendedor</th><th>Itens</th><th class="num">Total</th><th>Situação</th></tr></thead><tbody>
    ${lista.map(o => { const p = prospectDe(o.prospect_id) || {}; return `<tr><td><button class="linkbtn" data-act="abrir-orc" data-id="${esc(o.id)}"><b>${esc(o.numero)}</b></button></td><td>${dataBR(diaDe(o.criado_em))}</td>
      ${mostraLoja ? `<td><button class="linkbtn" data-act="abrir-orc" data-id="${esc(o.id)}"><b>${esc(p.loja || '—')}</b></button><div class="note">${esc(p.cidade || '')}${p.uf ? '/' + esc(p.uf) : ''}</div></td>` : ''}
      <td>${esc(nomeVend(o.vendedor_id))}</td><td class="trat">${esc(resumoItens(o))}</td><td class="num">${brl(totalOrc(o))}</td>
      <td>${chipOrc(o.situacao)}${o.motivo ? `<div class="note">${esc(MOTIVOS[o.motivo] || '')}</div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function painelOrcs(u) {
  if (crm().indisponivel) return '';
  const f = ui.orcF || 'aberto', adm = u.papel === 'admin', base = orcs().filter(o => adm || ui.orcTodos || o.vendedor_id === u.id);
  const lista = base.filter(o => f === 'todos' || o.situacao === f).slice(0, 60);
  const n = k => base.filter(o => o.situacao === k).length;
  return `<div class="panel" id="painelOrc"><div class="galtop" style="margin:0 0 10px"><h2 style="margin:0">${adm ? 'Orçamentos da equipe' : 'Meus orçamentos'}</h2>
      ${adm ? '' : `<label class="check"><input type="checkbox" data-chg="orc-todos" ${ui.orcTodos ? 'checked' : ''}> Ver os da equipe</label>`}</div>
    ${avisoOrc()}
    <div class="bar" role="group" aria-label="Situação dos orçamentos">${[['aberto', 'Em aberto'], ['nao_concluido', 'Não concluídos'], ['concluido', 'Concluídos'], ['todos', 'Todos']].map(([k, t]) =>
      `<button class="btn sm ${f === k ? '' : 'ghost'}" data-act="orc-f" data-f="${k}">${t} (${k === 'todos' ? base.length : n(k)})</button>`).join('')}</div>
    ${lista.length ? tabelaOrcs(lista, true) : `<p class="note" style="margin:0">${base.length ? 'Nenhum orçamento nesta situação.' : 'Nenhum orçamento ainda. Use "Adicionar orçamento" ao registrar uma ligação.'}</p>`}</div>`;
}

/* relatório: orçamentos do período (administração) */
function relOrcs(de, ate, r) {
  if (crm().orcIndisponivel) return `<div class="panel"><h2>Orçamentos</h2>${avisoOrc()}</div>`;
  const ls = orcs().filter(o => { const d = diaDe(o.criado_em), p = prospectDe(o.prospect_id) || {}; return d >= de && d <= ate && (!r.vendedor || o.vendedor_id === r.vendedor) && (!r.cidade || (p.cidade + '/' + p.uf) === r.cidade); });
  if (!ls.length) return `<div class="panel" id="relOrc"><h2>Orçamentos</h2><p class="note" style="margin:0">Nenhum orçamento neste período.</p></div>`;
  const soma = k => ls.filter(o => !k || o.situacao === k).reduce((s, o) => s + totalOrc(o), 0), conta = k => ls.filter(o => o.situacao === k).length;
  const nc = ls.filter(o => o.situacao === 'nao_concluido'), mot = Object.keys(MOTIVOS).map(k => [k, nc.filter(o => o.motivo === k)]).filter(x => x[1].length).sort((a, b) => b[1].length - a[1].length);
  const tile = (rot, v, sub) => `<div class="tile"><span class="t-rot">${rot}</span><b class="t-val">${v}</b><span class="t-sub">${sub}</span></div>`;
  return `<div class="panel" id="relOrc"><h2>Orçamentos</h2>
    <div class="tiles">${tile('Orçamentos', ls.length, brl(soma()) + ' no total')}${tile('Concluídos', conta('concluido'), brl(soma('concluido')))}
      ${tile('Não concluídos', conta('nao_concluido'), brl(soma('nao_concluido')))}${tile('Em aberto', conta('aberto'), brl(soma('aberto')))}</div>
    ${mot.length ? `<h3>Por que não foram concluídos</h3><div class="tbl-wrap"><table class="tbl" id="relMotivos"><thead><tr><th>Motivo</th><th class="num">Orçamentos</th><th class="num">Valor</th><th>O que foi escrito</th></tr></thead><tbody>
      ${mot.map(([k, os]) => `<tr><td><b>${esc(MOTIVOS[k])}</b></td><td class="num">${os.length}</td><td class="num">${brl(os.reduce((s, o) => s + totalOrc(o), 0))}</td>
        <td class="trat">${os.filter(o => o.motivo_detalhe).slice(0, 3).map(o => `<button class="linkbtn" data-act="abrir-orc" data-id="${esc(o.id)}">nº ${esc(o.numero)}</button> ${esc(o.motivo_detalhe)}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <h3>Orçamentos do período</h3>${tabelaOrcs(ls.slice(0, 200), true)}
    <div class="bar" style="margin:10px 0 0"><button class="btn ghost sm" data-act="orc-csv">Baixar orçamentos em planilha</button></div></div>`;
}
/* ---------- ações ---------- */
Object.assign(acts, {
  'lig-orc': () => { if (!ui.lig.orc) ui.lig.orc = novoOrc(); renderApp(); const s = $('#orcLig'); if (s) s.scrollIntoView({ block: 'start' }); },
  'lig-orc-tirar': () => { delete ui.lig.orc; renderApp(); },
  'orc-aba': e => { const d = orcDraft(e.dataset.onde); if (!d) return; d.aba = e.dataset.aba; redesenharOrc(e.dataset.onde); },
  'orc-item-add': e => { const d = orcDraft(e.dataset.onde); if (!d) return; d.itens.push(itemVazio()); redesenharOrc(e.dataset.onde); },
  'orc-item-rem': e => { const d = orcDraft(e.dataset.onde); if (!d) return; d.itens.splice(+e.dataset.i, 1); redesenharOrc(e.dataset.onde); },
  'orc-novo': e => { ui.drawer = { tipo: 'orcamento', draft: novoOrc(e.dataset.id) }; renderDrawer(); },
  'abrir-orc': e => { const o = orcDe(e.dataset.id); if (!o) return; ui.drawer = { tipo: 'orcamento', draft: rascunhoOrc(o) }; renderDrawer(); },
  'orc-f': e => { ui.orcF = e.dataset.f; renderApp(); },
  'orc-salvar': async () => {
    const dr = ui.drawer, d = dr.draft, u = eu(); if (!podeOrc(d, u) || ui.ocupado) return;
    const m = problemaOrc(d); if (m) { dr.erro = m; if (/motivo/.test(m)) d.aba = 'motivo'; return renderDrawer(); }
    ui.ocupado = true;
    try { const r = await API.salvarOrcamento(corpoOrc(d)); const o = orcDe(r.id); dr.draft = o ? rascunhoOrc(o) : d; dr.erro = ''; refresh(); toast(d.id ? 'Orçamento salvo.' : `Orçamento nº ${r.numero} criado.`); }
    catch (err) { dr.erro = msgErro(err); renderDrawer(); } finally { ui.ocupado = false; }
  },
  'orc-apagar': async () => { if (eu().papel !== 'admin') return; try { await API.apagarOrcamento(ui.drawer.draft.id); fecharDrawer(); renderApp(); toast('Orçamento apagado.'); } catch (err) { toast(msgErro(err)); } },
  'orc-csv': () => { const r = ui.relLig || {}, [de, ate] = faixaLig(r.per || 'semana');
    baixarCSV('orcamentos.csv', [['Nº', 'Data', 'Vendedor', 'Loja', 'Cidade', 'UF', 'Telefone', 'Itens', 'Total', 'Situação', 'Motivo', 'Por que não foi concluído', 'Válido até', 'Observações']]
      .concat(orcs().filter(o => { const d = diaDe(o.criado_em), p = prospectDe(o.prospect_id) || {}; return d >= de && d <= ate && (!r.vendedor || o.vendedor_id === r.vendedor) && (!r.cidade || (p.cidade + '/' + p.uf) === r.cidade); })
        .map(o => { const p = prospectDe(o.prospect_id) || {}; return [o.numero, dataBR(diaDe(o.criado_em)), nomeVend(o.vendedor_id), p.loja, p.cidade, p.uf, telFmt(p.telefone || ''), resumoItens(o), totalOrc(o).toFixed(2).replace('.', ','), SIT_ORC[o.situacao][0], MOTIVOS[o.motivo] || '', o.motivo_detalhe, o.validade ? dataBR(o.validade) : '', o.obs]; }))); }
});
const pk = e => { const d = orcDraft(e.dataset.onde); return d && d.pick ? [d, d.pick] : [null, null]; };
const pkVolta = onde => { redesenharOrc(onde); const m = $(`#mont-${onde}`); if (m && m.getBoundingClientRect().top < 0) m.scrollIntoView({ block: 'start' }); };
Object.assign(acts, {
  'pk-ff': e => { const [d, k] = pk(e); if (!d) return; k[e.dataset.k] = e.dataset.v; redesenharOrc(e.dataset.onde); },
  'pk-cat': e => { const [d, k] = pk(e); if (!d) return; k.cat = e.dataset.id; redesenharOrc(e.dataset.onde); },
  'pk-modelo': e => { const [d, k] = pk(e); if (!d) return; Object.assign(k, { modelo: e.dataset.id, sel: '', forno: '', qtd: 1 }); pkVolta(e.dataset.onde); },
  'pk-voltar': e => { const [d, k] = pk(e); if (!d) return; k.modelo = ''; pkVolta(e.dataset.onde); },
  'pk-grelha': e => { const [d, k] = pk(e); if (!d) return; k.sel = e.dataset.id; redesenharOrc(e.dataset.onde); },
  'pk-forno': e => { const [d, k] = pk(e); if (!d) return; k.forno = e.dataset.id; redesenharOrc(e.dataset.onde); },
  'pk-qtd': e => { const [d, k] = pk(e); if (!d) return; k.qtd = Math.min(999, Math.max(1, (k.qtd || 1) + +e.dataset.d)); redesenharOrc(e.dataset.onde); },
  'pk-livre': e => { const d = orcDraft(e.dataset.onde); if (!d) return; d.itens = d.itens.filter(i => i.produto_id || (i.descricao || '').trim() || i.livre); d.itens.push({ ...itemVazio(), livre: true }); redesenharOrc(e.dataset.onde);
    const ins = $$(`[data-oi=descricao][data-onde="${e.dataset.onde}"]`); if (ins.length) ins[ins.length - 1].focus(); },
  'pk-add': e => {
    const [d, k] = pk(e); if (!d) return; const p = prod(k.sel); if (!p) return;
    const q = k.qtd || 1, f = k.forno && prod(k.forno);
    d.itens = d.itens.filter(i => i.produto_id || (i.descricao || '').trim());
    const por = (x) => { const ja = d.itens.find(i => i.produto_id === x.id); if (ja) ja.quantidade = (+ja.quantidade || 0) + q; else d.itens.push({ produto_id: x.id, descricao: rotulo(x), codigo: x.codigo || '', quantidade: q, preco_unit: x.preco || 0 }); };
    por(p); if (f) por(f);
    Object.assign(k, { modelo: '', sel: '', forno: '', qtd: 1 });
    redesenharOrc(e.dataset.onde); toast(`${q} × ${rotulo(p)}${f ? ' + forno' : ''} no orçamento.`);
  }
});
let tPk = null;
document.addEventListener('input', ev => { const t = ev.target; if (!t.dataset || t.dataset.pk !== 'busca') return; const d = orcDraft(t.dataset.onde); if (!d || !d.pick) return;
  d.pick.busca = t.value; clearTimeout(tPk); tPk = setTimeout(() => { const onde = t.dataset.onde; redesenharOrc(onde); const i = $(`[data-pk=busca][data-onde="${onde}"]`); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); });
Object.assign(chgs, { 'orc-todos': e => { ui.orcTodos = e.checked; renderApp(); } });
// digitação nos campos do orçamento: guarda no rascunho; o total se atualiza sem redesenhar (para não perder o cursor)
function campoOrc(t, final) {
  const onde = t.dataset.onde, d = orcDraft(onde); if (!d) return;
  if (t.dataset.oe) {
    d[t.dataset.oe] = t.value;
    if (t.dataset.oe === 'motivo' && final) { if (t.value) d.situacao = 'nao_concluido'; else if (d.situacao === 'nao_concluido') d.situacao = 'aberto'; redesenharOrc(onde); }
    if (t.dataset.oe === 'motivo_detalhe' && final && t.value.trim() && d.situacao !== 'nao_concluido' && !d.motivo) { d.motivo = 'outro'; d.situacao = 'nao_concluido'; redesenharOrc(onde); }
    if (t.dataset.oe === 'situacao' && final) redesenharOrc(onde);
    return;
  }
  const it = d.itens[+t.dataset.i], k = t.dataset.oi; if (!it) return;
  if (k === 'produto_id') {
    if (!final) return;
    if (t.value === '__livre') Object.assign(it, { produto_id: '', descricao: '', codigo: '', livre: true });
    else { const p = prod(t.value); Object.assign(it, p ? { produto_id: p.id, descricao: rotulo(p), codigo: p.codigo || '', preco_unit: p.preco || 0, livre: false } : itemVazio()); }
    return redesenharOrc(onde);
  }
  it[k] = k === 'descricao' ? t.value : t.value === '' ? '' : Number(t.value);
  const sub = t.closest('.orc-item') && t.closest('.orc-item').querySelector('.orc-sub'); if (sub) sub.textContent = brl((+it.quantidade || 0) * (+it.preco_unit || 0));
  const tot = $(`#orcTotal-${onde}`); if (tot) tot.textContent = brl(totalOrc(d));
}
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && (t.dataset.oe || t.dataset.oi)) campoOrc(t, false); });
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && (t.dataset.oe || t.dataset.oi)) campoOrc(t, true); });
