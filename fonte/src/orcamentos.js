/* ---------- Orçamentos (no lugar de "Lançar pedido") ----------
   O vendedor (ou representante) monta o orçamento para qualquer cliente, com os produtos por cliques,
   as condições de venda e o PDF caprichado para mandar ao cliente. "Em aberto" enquanto negocia;
   "Fechar orçamento" cria o pedido que segue para o faturamento (Pedidos), com os preços combinados. */
const FORMAS_ORC = { a_combinar: 'A combinar', pix: 'PIX', boleto: 'Boleto parcelado' };
const FRETES_ORC = ['CIF (por conta da JCN)', 'FOB (por conta do cliente)', 'A combinar'];
const EMPRESA_PADRAO = { nome: 'JCN Gourmet', razao: '', cnpj: '', endereco: 'Rua Araraquara, 710 - Vila Rodrigues - Catanduva/SP', telefone: '(17) 99633-2037',
  whatsapp: '(17) 99151-9932', email: 'vendas@jcngourmet.com.br', site: 'www.jcngourmet.com.br', rodape: 'Fábrica de fogões industriais e da Linha Colors. Catanduva/SP.' };
const empresa = () => ({ ...EMPRESA_PADRAO, ...((state.conteudo || {}).empresa || {}) });
const CONTATO_VEND = 'jcn-contato-vendedor';
const lerContatoVend = () => { try { return localStorage.getItem(CONTATO_VEND) || ''; } catch (e) { return ''; } };
const clienteVazio = () => ({ nome: '', doc: '', contato: '', telefone: '', email: '', cidade: '' });
const nomeCliOrc = o => o.cliente_nome || (prospectDe(o.prospect_id) || {}).loja || '—';
const cidadeCliOrc = o => o.cliente_cidade || ((p => p ? `${p.cidade}/${p.uf}` : '')(prospectDe(o.prospect_id)));
const nomeVendOrc = id => { const u = eu(); return u && u.id === id ? u.nome : nomeVend(id); };
function novoOrcEd(pid) {
  const pr = pid ? prospectDe(pid) : null;
  return { ...novoOrc(pid), cliente: pr ? { nome: pr.loja, doc: '', contato: pr.comprador || '', telefone: telFmt(pr.telefone), email: pr.email || '', cidade: `${pr.cidade}/${pr.uf}` } : clienteVazio(),
    forma: 'a_combinar', dias: [], frete: '', prazo: '', vendedor_contato: lerContatoVend() };
}
function edDeOrc(o) {
  const pr = o.prospect_id ? prospectDe(o.prospect_id) : null;
  return { ...rascunhoOrc(o), cliente: { nome: nomeCliOrc(o) === '—' ? '' : nomeCliOrc(o), doc: o.cliente_doc || '', contato: o.cliente_contato || (pr || {}).comprador || '', telefone: telFmt(o.cliente_telefone || (pr || {}).telefone || ''),
    email: o.cliente_email || (pr || {}).email || '', cidade: cidadeCliOrc(o) }, forma: o.forma_pagamento || 'a_combinar', dias: o.boleto_dias || [], frete: o.frete || '', prazo: o.prazo_entrega || '',
    vendedor_contato: o.vendedor_contato || lerContatoVend(), pedido_id: o.pedido_id, fechado_em: o.fechado_em };
}
const corpoOrcCompleto = d => ({ ...corpoOrc(d), prospect_id: d.prospect_id || '', cliente_nome: d.cliente.nome.trim(), cliente_doc: d.cliente.doc.trim(), cliente_contato: d.cliente.contato.trim(),
  cliente_telefone: soDig(d.cliente.telefone), cliente_email: d.cliente.email.trim(), cliente_cidade: d.cliente.cidade.trim(), forma_pagamento: d.forma, boleto_dias: d.forma === 'boleto' ? d.dias : [],
  frete: d.frete.trim(), prazo_entrega: d.prazo.trim(), vendedor_contato: d.vendedor_contato.trim() });
function problemaOrcEd(d) {
  if (!d.prospect_id && d.cliente.nome.trim().length < 2) return 'Informe o nome do cliente.';
  if (d.cliente.email.trim() && !/^\S+@\S+\.\S+$/.test(d.cliente.email.trim())) return 'Confira o e-mail do cliente.';
  if (d.forma === 'boleto' && !d.dias.length) return 'Escolha os dias das parcelas do boleto.';
  return problemaOrc(d);
}

/* ---------- lista ---------- */
function vOrcamentos(u) {
  if (crm().orcIndisponivel) return `<h1>Orçamentos</h1>${avisoOrc()}`;
  if (ui.orcEd) return vOrcEditor(u, ui.orcEd);
  const f = ui.orcLista || (ui.orcLista = { sit: 'aberto', busca: '' }), adm = u.papel === 'admin', q = f.busca.trim().toLowerCase();
  const base = orcs().filter(o => adm || o.vendedor_id === u.id), n = k => base.filter(o => o.situacao === k).length;
  const lista = base.filter(o => (f.sit === 'todos' || o.situacao === f.sit) && (!q || [o.numero, nomeCliOrc(o), cidadeCliOrc(o), o.cliente_doc, adm ? nomeVend(o.vendedor_id) : ''].join(' ').toLowerCase().includes(q)));
  return `<h1>Orçamentos</h1><p class="sub">Monte o orçamento com cliques, gere o PDF para mandar ao cliente e, quando ele aprovar, feche o orçamento: ele vira o pedido e segue para o faturamento.</p>
  ${adm ? painelEmpresaOrc() : ''}
  <div class="bar"><button class="btn" data-act="oe-novo">Novo orçamento</button><span class="grow"></span>
    <input class="inp" style="width:min(18rem,100%)" type="search" id="orcBusca" placeholder="Buscar cliente, cidade ou número" value="${esc(f.busca)}" aria-label="Buscar orçamento"></div>
  <div class="ff-cats" role="group" aria-label="Situação">${[['aberto', 'Em aberto'], ['concluido', 'Fechados'], ['nao_concluido', 'Não fechados'], ['todos', 'Todos']].map(([k, t]) =>
    `<button class="chip${f.sit === k ? ' on' : ''}" data-act="ol-sit" data-v="${k}">${t} (${k === 'todos' ? base.length : n(k)})</button>`).join('')}</div>
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl" id="tblOrc"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th>${adm ? '<th>Vendedor</th>' : ''}<th class="num">Total</th><th>Situação</th><th></th></tr></thead><tbody>
    ${lista.slice(0, 200).map(o => `<tr><td><button class="linkbtn" data-act="oe-abrir" data-id="${esc(o.id)}"><b>${esc(o.numero)}</b></button></td><td>${dataBR(diaDe(o.criado_em))}</td>
      <td><button class="linkbtn" data-act="oe-abrir" data-id="${esc(o.id)}"><b>${esc(nomeCliOrc(o))}</b></button><div class="note">${esc(cidadeCliOrc(o))}${o.itens.length ? ' · ' + o.itens.length + (o.itens.length === 1 ? ' item' : ' itens') : ''}</div></td>
      ${adm ? `<td>${esc(nomeVend(o.vendedor_id))}</td>` : ''}<td class="num">${brl(totalOrc(o))}</td>
      <td>${chipOrc(o.situacao)}${o.pedido_id ? `<div class="note">${(p => p ? `<button class="linkbtn" data-act="abrir-pedido" data-id="${esc(p.id)}">pedido nº ${esc(p.numero)}</button>` : 'virou pedido')(state.pedidos.find(p => p.id === o.pedido_id))}</div>` : o.validade && o.situacao === 'aberto' && o.validade < hojeISO() ? '<div class="note bad-t">validade vencida</div>' : ''}</td>
      <td class="acoes"><button class="btn ghost sm" data-act="oe-pdf" data-id="${esc(o.id)}">PDF</button></td></tr>`).join('')}</tbody></table></div>`
    : `<div class="panel"><p class="note" style="margin:0">${base.length ? 'Nenhum orçamento nesta situação.' : 'Nenhum orçamento ainda. Clique em "Novo orçamento".'}</p></div>`}`;
}
function painelEmpresaOrc() {
  const e = empresa(), c = (k, t, ph = '') => `<label class="field"><span>${t}</span><input data-emp="${k}" value="${esc(e[k] || '')}" placeholder="${esc(ph)}"></label>`;
  return `<details class="panel" id="painelEmpresa"><summary><b>Dados da empresa no PDF</b> <span class="note">(nome, CNPJ, endereço e contatos que aparecem nos orçamentos)</span></summary>
    <div class="grid2" style="margin-top:10px">${c('nome', 'Nome da empresa')}${c('razao', 'Razão social', 'Opcional')}${c('cnpj', 'CNPJ', '00.000.000/0000-00')}${c('endereco', 'Endereço')}
      ${c('telefone', 'Telefone')}${c('whatsapp', 'WhatsApp')}${c('email', 'E-mail')}${c('site', 'Site')}</div>
    <label class="field" style="margin-top:10px"><span>Texto do rodapé</span><input data-emp="rodape" value="${esc(e.rodape || '')}"></label>
    <p class="note" style="margin:8px 0 0">As mudanças valem assim que você sai do campo.</p></details>`;
}

/* ---------- editor ---------- */
function vOrcEditor(u, d) {
  const so = !podeOrc(d, u) || !!d.pedido_id, c = d.cliente, ped = d.pedido_id && state.pedidos.find(p => p.id === d.pedido_id);
  const cc = (k, t, extra = '') => `<label class="field"><span>${t}</span><input data-oc="${k}" value="${esc(c[k])}" ${extra} ${so ? 'disabled' : ''}></label>`;
  const fechando = d.fechando && !so;
  return `<div class="bar" style="margin:0 0 6px"><button class="linkbtn" data-act="oe-voltar">← Voltar para os orçamentos</button></div>
  <h1>${d.id ? `Orçamento nº ${esc(d.numero)}` : 'Novo orçamento'} ${d.id ? chipOrc(d.situacao) : ''}</h1>
  <p class="sub">${d.id ? `Feito em ${dataBR(diaDe(d.criado_em))} por ${esc(nomeVendOrc(d.vendedor_id))}.` : 'Escolha o cliente, os produtos e as condições. Depois salve e gere o PDF para o cliente.'}
    ${d.pedido_id ? ` <b>Fechado${d.fechado_em ? ' em ' + dataBR(diaDe(d.fechado_em)) : ''}: virou o ${ped ? `<button class="linkbtn" data-act="abrir-pedido" data-id="${esc(ped.id)}">pedido nº ${esc(ped.numero)}</button>` : 'pedido'}, que segue para o faturamento.</b>` : ''}</p>
  <div class="panel"><h2>Cliente</h2>
    <div class="grid3">${cc('nome', 'Nome ou razão social *', 'maxlength="160"')}${cc('doc', 'CPF ou CNPJ', 'inputmode="numeric" maxlength="20"')}${cc('contato', 'Contato (comprador)', 'maxlength="120"')}
      ${cc('telefone', 'Telefone / WhatsApp', 'inputmode="tel"')}${cc('email', 'E-mail', 'type="email"')}${cc('cidade', 'Cidade/UF', 'placeholder="Ex.: Catanduva/SP"')}</div></div>
  <div class="panel"><h2>Produtos</h2>
    ${orcEditor(d, 'oe', so)}</div>
  <div class="panel"><h2>Condições</h2>
    <div class="opts formas" role="radiogroup" aria-label="Forma de pagamento">${Object.entries(FORMAS_ORC).map(([k, t]) => `<label class="opt${d.forma === k ? ' sel' : ''}"><input type="radio" name="oeforma" value="${k}" data-act="oe-forma" ${d.forma === k ? 'checked' : ''} ${so ? 'disabled' : ''}><span class="on"><b>${t}</b></span></label>`).join('')}</div>
    ${d.forma === 'boleto' ? `<h3 class="sub3">Vencimento das parcelas, em dias</h3><div class="dias" role="group" aria-label="Dias das parcelas">${BOLETO_DIAS.map(x => `<label class="dia${d.dias.includes(x) ? ' on' : ''}"><input type="checkbox" data-act="oe-dia" data-d="${x}" ${d.dias.includes(x) ? 'checked' : ''} ${so ? 'disabled' : ''}>${x}</label>`).join('')}</div>
      ${d.dias.length ? `<p class="note">${planoBoleto(totalOrc(d), d.dias, hojeISO()).map(x => `${x.n}ª em ${x.dias} dias: ${brl(x.valor)}`).join(' · ')}</p>` : ''}` : ''}
    <div class="grid3" style="margin-top:10px"><label class="field"><span>Frete</span><select data-ox="frete" ${so ? 'disabled' : ''}><option value="">Escolha</option>${[...new Set([...FRETES_ORC, d.frete].filter(Boolean))].map(x => `<option ${x === d.frete ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="field"><span>Prazo de entrega</span><input data-ox="prazo" value="${esc(d.prazo)}" placeholder="Ex.: 15 dias úteis" maxlength="120" ${so ? 'disabled' : ''}></label>
      <label class="field"><span>Seu telefone/WhatsApp no PDF</span><input data-ox="vendedor_contato" value="${esc(d.vendedor_contato)}" placeholder="(17) 99999-9999" maxlength="120" ${so ? 'disabled' : ''}></label></div></div>
  ${fechando ? painelFechar(d) : ''}
  <p class="err" role="alert" id="oeErro" ${d.erro ? '' : 'hidden'}>${esc(d.erro || '')}</p>
  <div class="bar oe-acoes">${so ? '' : `<button class="btn" data-act="oe-salvar">${d.id ? 'Salvar orçamento' : 'Criar orçamento'}</button>`}
    <button class="btn ghost" data-act="oe-pdf">Gerar PDF</button>
    ${'share' in navigator ? '<button class="btn ghost" data-act="oe-share">Compartilhar PDF</button>' : ''}
    ${soDig(c.telefone).length >= 10 && d.id ? `<a class="btn ghost" href="https://wa.me/55${esc(soDig(c.telefone))}?text=${encodeURIComponent(`Olá${c.contato ? ', ' + c.contato : ''}! Segue o orçamento nº ${d.numero} da ${empresa().nome}, no valor de ${brl(totalOrc(d))}. Vou enviar o PDF aqui na conversa.`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
    <span class="grow"></span>
    ${!so && d.id && d.situacao !== 'nao_concluido' && !fechando ? '<button class="btn ok" data-act="oe-fechar">Fechar orçamento</button>' : ''}
    ${eu().papel === 'admin' && d.id && !d.pedido_id ? '<button class="btn danger" data-act="oe-apagar" data-confirm="Confirmar: apagar orçamento">Apagar</button>' : ''}</div>`;
}
function painelFechar(d) {
  const f = d.fecha || (d.fecha = { forma: d.forma === 'boleto' ? 'boleto' : 'pix', dias: d.dias.slice() });
  return `<div class="panel fechar-box" id="painelFechar"><h2>Fechar o orçamento nº ${esc(d.numero)}</h2>
    <p class="note" style="margin:0 0 10px">O orçamento vira o pedido de <b>${brl(totalOrc(d))}</b> para <b>${esc(d.cliente.nome || '')}</b>, com os preços combinados, e segue para o faturamento em Pedidos. Depois de fechado, o orçamento não muda mais.</p>
    <div class="opts formas" role="radiogroup" aria-label="Pagamento do pedido">
      <label class="opt${f.forma === 'pix' ? ' sel' : ''}"><input type="radio" name="fcforma" value="pix" data-act="fc-forma" ${f.forma === 'pix' ? 'checked' : ''}><span class="on"><b>PIX</b><small>Anexe o comprovante depois, no pedido.</small></span></label>
      <label class="opt${f.forma === 'boleto' ? ' sel' : ''}"><input type="radio" name="fcforma" value="boleto" data-act="fc-forma" ${f.forma === 'boleto' ? 'checked' : ''}><span class="on"><b>Boleto parcelado</b><small>Precisa da aprovação do financeiro.</small></span></label></div>
    ${f.forma === 'boleto' ? `<div class="dias" role="group" aria-label="Dias das parcelas" style="margin-top:10px">${BOLETO_DIAS.map(x => `<label class="dia${f.dias.includes(x) ? ' on' : ''}"><input type="checkbox" data-act="fc-dia" data-d="${x}" ${f.dias.includes(x) ? 'checked' : ''}>${x}</label>`).join('')}</div>` : ''}
    <div class="bar" style="margin:12px 0 0"><button class="btn ok" data-act="oe-fechar-ok">Fechar e enviar para o faturamento</button><button class="btn ghost" data-act="oe-fechar-nao">Cancelar</button></div></div>`;
}

/* ---------- PDF ---------- */
let jsPdfPronto = null;
function carregarJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
  const s = src => new Promise((ok, erro) => { const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = () => erro(new Error('Não foi possível carregar o gerador de PDF.')); document.head.appendChild(t); });
  return jsPdfPronto || (jsPdfPronto = s('vendor/jspdf.umd.min.js').then(() => s('vendor/jspdf.plugin.autotable.min.js')).catch(e => { jsPdfPronto = null; throw e; }));
}
const fotosPdf = {};
function fotoParaPdf(p) {                                      // foto do produto em JPEG pequeno (o PDF não lê webp)
  const ref = p && (p.fotos || [])[0]; if (!ref) return Promise.resolve(null);
  if (ref in fotosPdf) return Promise.resolve(fotosPdf[ref]);
  return new Promise(ok => {
    const img = new Image(), fim = v => { fotosPdf[ref] = v; ok(v); }, t = setTimeout(() => fim(null), 6000);
    img.crossOrigin = 'anonymous';
    img.onload = () => { clearTimeout(t); try { const k = 240 / Math.max(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); fim({ d: c.toDataURL('image/jpeg', .85), r: c.width / c.height }); } catch (e) { fim(null); } };
    img.onerror = () => { clearTimeout(t); fim(null); };
    img.src = src(ref);
  });
}
async function pdfOrcamento(o) {
  await carregarJsPDF();
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' }), E = empresa(), W = 210, M = 14, AZUL = [35, 59, 114], CINZA = [95, 92, 88], CLARO = [236, 235, 230];
  const cli = edDeOrc(o).cliente, itens = o.itens || [], fotos = await Promise.all(itens.map(i => fotoParaPdf(i.produto_id && prod(i.produto_id))));
  const vend = o.vendedor_id === (eu() || {}).id ? eu() : user(o.vendedor_id) || {}, total = totalOrc(o), txt = (s, x, y, op) => doc.text(String(s || ''), x, y, op);
  // cabeçalho
  doc.setFillColor(...AZUL); doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(30); txt('JCN', M, 19);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setCharSpace(2.2); txt('GOURMET', M + 1, 25.5); doc.setCharSpace(0);
  doc.setFontSize(18); txt('ORÇAMENTO', W - M, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); txt(`Nº ${o.numero}`, W - M, 21.5, { align: 'right' });
  txt(`Emitido em ${dataBR(diaDe(o.criado_em))}${o.validade ? '  ·  válido até ' + dataBR(o.validade) : ''}`, W - M, 27.5, { align: 'right' });
  // dados da empresa
  doc.setTextColor(...CINZA); doc.setFontSize(8.2);
  const linhaEmp = [E.razao || E.nome, E.cnpj ? 'CNPJ ' + E.cnpj : '', E.endereco].filter(Boolean).join('  ·  '), contEmp = [E.telefone ? 'Tel. ' + E.telefone : '', E.whatsapp ? 'WhatsApp ' + E.whatsapp : '', E.email, E.site].filter(Boolean).join('  ·  ');
  txt(linhaEmp, M, 40); txt(contEmp, M, 44.5);
  // cliente e vendedor
  let y = 50; const caixa = (x, w, titulo, linhas) => { doc.setDrawColor(...CLARO); doc.setFillColor(247, 246, 242); doc.roundedRect(x, y, w, 30, 1.5, 1.5, 'FD');
    doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); txt(titulo.toUpperCase(), x + 4, y + 6);
    doc.setTextColor(35, 31, 32); doc.setFontSize(10.5); txt(doc.splitTextToSize(linhas[0] || '', w - 8)[0], x + 4, y + 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6); linhas.slice(1).filter(Boolean).slice(0, 3).forEach((l, i) => txt(doc.splitTextToSize(l, w - 8)[0], x + 4, y + 17.5 + i * 4.3)); };
  caixa(M, 112, 'Cliente', [cli.nome, [cli.doc ? (soDig(cli.doc).length > 11 ? 'CNPJ ' : 'CPF ') + cli.doc : '', cli.cidade].filter(Boolean).join('  ·  '), [cli.contato ? 'A/C ' + cli.contato : '', cli.telefone].filter(Boolean).join('  ·  '), cli.email]);
  caixa(M + 116, W - 2 * M - 116, 'Vendedor', [vend.nome || nomeVendOrc(o.vendedor_id), o.vendedor_contato || '', vend.email && !/^loja-/.test(vend.email) ? vend.email : '', E.nome]);
  y += 36;
  // itens
  const temFoto = fotos.some(Boolean);
  doc.autoTable({ startY: y, margin: { left: M, right: M }, theme: 'grid',
    head: [[...(temFoto ? [''] : []), 'Código', 'Descrição', 'Qtd.', 'Unitário', 'Subtotal']],
    body: itens.map((i, k) => [...(temFoto ? [''] : []), i.codigo || '-', i.descricao, String(i.quantidade), brl(i.preco_unit), brl(i.quantidade * i.preco_unit)]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, lineColor: [225, 223, 216], lineWidth: .2, textColor: [35, 31, 32], valign: 'middle' },
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8.6 }, alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: Object.assign(temFoto ? { 0: { cellWidth: 18, minCellHeight: 16 } } : {}, { [temFoto ? 1 : 0]: { cellWidth: 29, fontStyle: 'bold', fontSize: 8.4 }, [temFoto ? 3 : 2]: { halign: 'center', cellWidth: 14 }, [temFoto ? 4 : 3]: { halign: 'right', cellWidth: 26 }, [temFoto ? 5 : 4]: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } }),
    didDrawCell: h => { if (temFoto && h.section === 'body' && h.column.index === 0) { const f = fotos[h.row.index]; if (f) { const a = Math.min(h.cell.width - 3, (h.cell.height - 3) * f.r), b = a / f.r; doc.addImage(f.d, 'JPEG', h.cell.x + (h.cell.width - a) / 2, h.cell.y + (h.cell.height - b) / 2, a, b); } } } });
  y = doc.lastAutoTable.finalY + 6;
  const novaPag = h => { if (y + h > 275) { doc.addPage(); y = 20; } };
  // total
  novaPag(16); doc.setFillColor(...AZUL); doc.roundedRect(W - M - 80, y, 80, 14, 1.5, 1.5, 'F'); doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); txt('TOTAL DO ORÇAMENTO', W - M - 76, y + 5.5); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); txt(brl(total), W - M - 4, y + 10.8, { align: 'right' });
  doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); txt(`${itens.reduce((s, i) => s + i.quantidade, 0)} ${itens.reduce((s, i) => s + i.quantidade, 0) === 1 ? 'unidade' : 'unidades'} · ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`, M, y + 8);
  y += 22;
  // condições
  const pag = o.forma_pagamento === 'boleto' && (o.boleto_dias || []).length ? `Boleto parcelado em ${o.boleto_dias.length}x (${o.boleto_dias.join('/')} dias): ` + planoBoleto(total, o.boleto_dias, diaDe(o.criado_em)).map(x => brl(x.valor)).join(' + ')
    : FORMAS_ORC[o.forma_pagamento || 'a_combinar'];
  const cond = [['Forma de pagamento', pag], ['Prazo de entrega', o.prazo_entrega || 'A combinar'], ['Frete', o.frete || 'A combinar'], ['Validade da proposta', o.validade ? 'Até ' + dataBR(o.validade) : 'A combinar']];
  novaPag(40); doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); txt('CONDIÇÕES', M, y); y += 2;
  doc.setDrawColor(...AZUL); doc.setLineWidth(.4); doc.line(M, y, W - M, y); y += 5;
  doc.setFontSize(9);
  cond.forEach(([k, v]) => { const l = doc.splitTextToSize(v, W - 2 * M - 48); novaPag(l.length * 4.4 + 2); doc.setTextColor(...CINZA); doc.setFont('helvetica', 'bold'); txt(k, M, y); doc.setTextColor(35, 31, 32); doc.setFont('helvetica', 'normal'); txt(l, M + 48, y); y += l.length * 4.4 + 1.6; });
  if (o.obs) { y += 3; novaPag(14); doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); txt('OBSERVAÇÕES', M, y); y += 2; doc.line(M, y, W - M, y); y += 5;
    doc.setTextColor(35, 31, 32); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); const l = doc.splitTextToSize(o.obs, W - 2 * M); novaPag(l.length * 4.4); txt(l, M, y); y += l.length * 4.4; }
  // aceite
  y += 10; novaPag(26); doc.setDrawColor(150, 150, 150); doc.setLineWidth(.2);
  doc.line(M, y + 12, M + 78, y + 12); doc.line(W - M - 78, y + 12, W - M, y + 12);
  doc.setTextColor(...CINZA); doc.setFontSize(8.2); txt(`${vend.nome || nomeVendOrc(o.vendedor_id)} · ${E.nome}`, M, y + 16.5); txt('De acordo do cliente (assinatura e data)', W - M - 78, y + 16.5);
  // rodapé
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(...AZUL); doc.setLineWidth(.6); doc.line(M, 284, W - M, 284); doc.setFontSize(7.6); doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal');
    txt(`${E.nome}${E.rodape ? ' · ' + E.rodape : ''}`, M, 289); txt(`Orçamento nº ${o.numero} · página ${i} de ${n}`, W - M, 289, { align: 'right' }); }
  return doc.output('blob');
}
const nomePdfOrc = o => `Orcamento-JCN-${o.numero}-${nomeSeguro(nomeCliOrc(o)).replace(/\.[a-z0-9]+$/i, '').slice(0, 40)}.pdf`;
function baixarBlob(b, nome) { const url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 8000); }
// grava o que está na tela antes do PDF (assim o PDF sai igual ao que a pessoa vê)
async function salvarOrcEd(silencioso) {
  const d = ui.orcEd, m = problemaOrcEd(d);
  if (m) { d.erro = m; if (/motivo/.test(m)) d.aba = 'motivo'; renderApp(); const x = $('#oeErro'); if (x) x.scrollIntoView({ block: 'center' }); return null; }
  try { localStorage.setItem(CONTATO_VEND, d.vendedor_contato.trim()); } catch (e) { }
  const r = await API.salvarOrcamento(corpoOrcCompleto(d)), o = orcDe(r.id);
  ui.orcEd = o ? { ...edDeOrc(o), pick: d.pick } : d; if (!silencioso) toast(d.id ? 'Orçamento salvo.' : `Orçamento nº ${r.numero} criado.`);
  renderApp(); return o;
}

/* ---------- ações ---------- */
Object.assign(acts, {
  'oe-novo': () => { ui.orcEd = novoOrcEd(); renderApp(); scrollTo(0, 0); },
  'oe-abrir': e => { const o = orcDe(e.dataset.id); if (!o) return; ui.orcEd = edDeOrc(o); ui.view = 'orcamentos'; fecharDrawer(); renderApp(); scrollTo(0, 0); },
  'oe-voltar': () => { ui.orcEd = null; renderApp(); scrollTo(0, 0); },
  'ol-sit': e => { ui.orcLista.sit = e.dataset.v; renderApp(); },
  'oe-forma': e => { const d = ui.orcEd; d.forma = e.value; renderApp(); },
  'oe-dia': e => { const d = ui.orcEd, x = +e.dataset.d; d.dias = BOLETO_DIAS.filter(k => k === x ? e.checked : d.dias.includes(k)); renderApp(); },
  'oe-salvar': async () => { if (ui.ocupado) return; ui.ocupado = true; try { await salvarOrcEd(); } catch (err) { ui.orcEd.erro = msgErro(err); renderApp(); } finally { ui.ocupado = false; } },
  'oe-pdf': async e => {
    if (ui.ocupado) return; ui.ocupado = true;
    try { let o = e.dataset.id ? orcDe(e.dataset.id) : null;
      if (!o) { const d = ui.orcEd; o = d.pedido_id || !podeOrc(d, eu()) ? orcDe(d.id) : await salvarOrcEd(true); }
      if (!o) return; toast('Gerando o PDF…'); baixarBlob(await pdfOrcamento(o), nomePdfOrc(o)); toast('PDF do orçamento baixado.'); }
    catch (err) { toast(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'oe-share': async () => {
    if (ui.ocupado) return; ui.ocupado = true;
    try { const d = ui.orcEd, o = d.pedido_id || !podeOrc(d, eu()) ? orcDe(d.id) : await salvarOrcEd(true); if (!o) return;
      const b = await pdfOrcamento(o), f = new File([b], nomePdfOrc(o), { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: `Orçamento nº ${o.numero}`, text: `Orçamento nº ${o.numero} da ${empresa().nome}` });
      else { baixarBlob(b, nomePdfOrc(o)); toast('Este aparelho não compartilha arquivos: o PDF foi baixado.'); } }
    catch (err) { if (err && err.name !== 'AbortError') toast(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'oe-fechar': () => { const d = ui.orcEd; d.fechando = true; d.fecha = null; renderApp(); const p = $('#painelFechar'); if (p) p.scrollIntoView({ block: 'center' }); },
  'oe-fechar-nao': () => { ui.orcEd.fechando = false; renderApp(); },
  'fc-forma': e => { ui.orcEd.fecha.forma = e.value; renderApp(); },
  'fc-dia': e => { const f = ui.orcEd.fecha, x = +e.dataset.d; f.dias = BOLETO_DIAS.filter(k => k === x ? e.checked : f.dias.includes(k)); renderApp(); },
  'oe-fechar-ok': async () => {
    const d = ui.orcEd, f = d.fecha; if (ui.ocupado || !f) return;
    if (f.forma === 'boleto' && !f.dias.length) { d.erro = 'Escolha os dias das parcelas do boleto.'; return renderApp(); }
    ui.ocupado = true;
    try { const o = await salvarOrcEd(true); if (!o) return;
      const r = await API.fecharOrcamento(o.id, { forma_pagamento: f.forma, boleto_dias: f.forma === 'boleto' ? f.dias : [] });
      const n = orcDe(o.id); ui.orcEd = n ? edDeOrc(n) : null; renderApp(); scrollTo(0, 0); toast(`Orçamento fechado: virou o pedido nº ${r.numero}, que segue para o faturamento.${f.forma === 'boleto' ? ' O boleto vai para a aprovação do financeiro.' : ' Anexe o comprovante do PIX no pedido.'}`); }
    catch (err) { ui.orcEd.erro = msgErro(err); renderApp(); } finally { ui.ocupado = false; }
  },
  'oe-apagar': async () => { if (eu().papel !== 'admin') return; try { await API.apagarOrcamento(ui.orcEd.id); ui.orcEd = null; renderApp(); toast('Orçamento apagado.'); } catch (err) { toast(msgErro(err)); } }
});
let tOb = null;
document.addEventListener('input', ev => {
  const t = ev.target, d = ui.orcEd;
  if (t.id === 'orcBusca') { ui.orcLista.busca = t.value; clearTimeout(tOb); tOb = setTimeout(() => { renderApp(); const i = $('#orcBusca'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); return; }
  if (!d || !t.dataset) return;
  if (t.dataset.oc) d.cliente[t.dataset.oc] = t.value;
  if ((t.dataset.oc || t.dataset.ox || t.dataset.oi || t.dataset.oe) && d.erro) { d.erro = ''; const x = $('#oeErro'); if (x) x.hidden = true; }
  if (t.dataset.ox) d[t.dataset.ox] = t.value;
});
document.addEventListener('change', ev => {
  const t = ev.target, d = ui.orcEd; if (!t.dataset) return;
  if (d && t.dataset.ox) d[t.dataset.ox] = t.value;
  if (t.dataset.emp && eu() && eu().papel === 'admin') { state.conteudo.empresa = { ...empresa(), [t.dataset.emp]: t.value.trim() }; salvar('conteudo'); toast('Dados da empresa salvos.'); }
});
