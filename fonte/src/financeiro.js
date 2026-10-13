/* ---------- Financeiro (administração): quanto vendeu, o que falta receber e os boletos para aprovar ----------
   "Vendido" = pedidos com pagamento confirmado: PIX verificado ou boleto aprovado.
   Venda de loja de e-commerce conta para o vendedor responsável por ela. */
const PERIODOS = [['mes', 'Este mês'], ['anterior', 'Mês passado'], ['90', 'Últimos 90 dias'], ['ano', 'Este ano'], ['tudo', 'Desde o início']];
function intervalo(k) {
  const h = hojeISO(), ano = +h.slice(0, 4), mes = +h.slice(5, 7), z = n => String(n).padStart(2, '0');
  if (k === 'mes') return [`${ano}-${z(mes)}-01`, h];
  if (k === 'anterior') { const a = mes === 1 ? ano - 1 : ano, m = mes === 1 ? 12 : mes - 1; return [`${a}-${z(m)}-01`, somaDias(`${ano}-${z(mes)}-01`, -1)]; }
  if (k === '90') return [somaDias(h, -89), h];
  if (k === 'ano') return [`${ano}-01-01`, h];
  return ['0000-00-00', '9999-12-31'];
}
const noPeriodo = (p, [de, ate]) => p.criado >= de && p.criado <= ate;
const somaPed = l => l.reduce((s, p) => s + totalPedido(p), 0);
const canalDe = p => p.origem === 'ecommerce' ? 'E-commerce' : p.origem === 'site' ? 'Loja do site' : 'Vendedores';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

function vFinanceiro() {
  const per = PERIODOS.some(x => x[0] === ui.finPer) ? ui.finPer : (ui.finPer = 'mes'), faixa = intervalo(per), hoje = hojeISO();
  const todos = state.pedidos, noPer = todos.filter(p => noPeriodo(p, faixa));
  const vend = noPer.filter(pagoOk), aguard = noPer.filter(paraConferir), semPag = noPer.filter(p => !ehBoleto(p) && p.pix.status === 'sem');
  const total = somaPed(vend);
  // recebido e a receber
  const parc = todos.filter(p => ehBoleto(p) && p.pagamento.status === 'aprovado').flatMap(p => parcelasDe(p).map(x => ({ ...x, p })));
  const recebidoPer = somaPed(vend.filter(p => !ehBoleto(p))) + vend.filter(ehBoleto).reduce((s, p) => s + parcelasDe(p).filter(x => x.recebida).reduce((t, x) => t + x.valor, 0), 0);
  const abertas = parc.filter(x => !x.recebida).sort((a, b) => a.vence < b.vence ? -1 : a.vence > b.vence ? 1 : a.p.numero - b.p.numero), vencidas = abertas.filter(x => x.vence < hoje);
  const aReceber = abertas.reduce((s, x) => s + x.valor, 0);
  const boletos = todos.filter(p => ehBoleto(p) && p.pagamento.status === 'pendente').sort((a, b) => a.numero - b.numero);
  // por vendedor: vendas próprias + lojas de e-commerce que ele atende
  const linhas = new Map();
  const linha = (k, nome) => { if (!linhas.has(k)) linhas.set(k, { nome, pn: 0, pv: 0, ln: 0, lv: 0 }); return linhas.get(k); };
  const marca = u => u.nome + (u.papel === 'admin' ? ' (administração)' : u.papel === 'representante' ? ' (representante)' : '');
  state.usuarios.filter(u => u.ativo && (u.papel === 'vendedor' || u.papel === 'representante')).forEach(u => linha(u.id, marca(u)));
  vend.forEach(p => {
    const v = totalPedido(p);
    if (p.origem === 'site') { const l = linha('~site', 'Loja do site (sem vendedor)'); l.pn++; l.pv += v; }
    else if (p.origem === 'ecommerce') { const r = respDe(p), l = r && user(r) ? linha(r, user(r).nome) : linha('~sem', 'E-commerce sem vendedor definido'); l.ln++; l.lv += v; }
    else { const u = user(p.vendedor), l = linha(p.vendedor || '~?', u ? marca(u) : 'Usuário removido'); l.pn++; l.pv += v; }
  });
  const porVend = [...linhas.values()].sort((a, b) => (b.pv + b.lv) - (a.pv + a.lv));
  // por loja de e-commerce
  const lojasV = lojas().map(l => { const ps = vend.filter(p => p.origem === 'ecommerce' && p.vendedor === l.id); return { l, n: ps.length, v: somaPed(ps) }; }).filter(x => x.n).sort((a, b) => b.v - a.v);
  const canais = ['Vendedores', 'E-commerce', 'Loja do site'].map(c => { const ps = vend.filter(p => canalDe(p) === c); return [c, ps.length, somaPed(ps)]; });
  // produtos
  const pm = new Map(); vend.forEach(p => p.itens.forEach(i => { const k = i.codigo || i.nome, o = pm.get(k) || { nome: i.nome, codigo: i.codigo, q: 0, v: 0 }; o.q += i.qtd; o.v += i.qtd * i.preco; pm.set(k, o); }));
  const prods = [...pm.values()].sort((a, b) => b.v - a.v).slice(0, 8);
  // últimos 6 meses, sempre
  const mesesL = []; { let a = +hoje.slice(0, 4), m = +hoje.slice(5, 7); for (let i = 0; i < 6; i++) { mesesL.push(`${a}-${String(m).padStart(2, '0')}`); m--; if (!m) { m = 12; a--; } } }
  const porMes = mesesL.map(k => { const ps = todos.filter(p => p.criado.slice(0, 7) === k && pagoOk(p)); return [k, ps.length, somaPed(ps)]; });
  const tile = (rot, valor, sub, id) => `<div class="tile" id="${id}"><span class="t-rot">${rot}</span><b class="t-val">${valor}</b><span class="t-sub">${sub}</span></div>`;
  const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  return `<h1>Financeiro</h1><p class="sub">Quanto a JCN vendeu, o que já entrou, o que falta receber e os boletos que esperam aprovação. Conta como vendido o pedido com PIX verificado ou boleto aprovado.</p>
  <div class="bar"><label class="sr" for="finPer">Período</label><select id="finPer" class="inp" style="width:auto" data-chg="fin-per">${PERIODOS.map(([k, t]) => `<option value="${k}" ${k === per ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <span class="note">${per === 'tudo' ? 'Todos os pedidos' : `Pedidos de ${dataBR(faixa[0])} a ${dataBR(faixa[1])}`}</span></div>
  <div class="tiles">
    ${tile('Vendido', brl(total), vend.length ? `${pl(vend.length, 'pedido', 'pedidos')}, média de ${brl(total / vend.length)}` : 'Nenhum pedido confirmado no período', 'tVendido')}
    ${tile('Recebido', brl(recebidoPer), 'PIX verificados e parcelas de boleto já recebidas', 'tRecebido')}
    ${tile('A receber em boleto', brl(aReceber), abertas.length ? `${pl(abertas.length, 'parcela em aberto', 'parcelas em aberto')}${vencidas.length ? ', ' + pl(vencidas.length, 'vencida', 'vencidas') : ''}` : 'Nenhuma parcela em aberto', 'tReceber')}
    ${tile('Aguardando conferência', brl(somaPed(aguard)), aguard.length ? `${pl(aguard.filter(p => !ehBoleto(p)).length, 'PIX para conferir', 'PIX para conferir')}, ${pl(aguard.filter(ehBoleto).length, 'boleto para aprovar', 'boletos para aprovar')}` : 'Nada esperando por você', 'tAguardando')}
  </div>
  ${semPag.length ? `<p class="note" style="margin:-4px 0 16px">Fora dessas contas: ${pl(semPag.length, 'pedido', 'pedidos')} sem comprovante de PIX, somando ${brl(somaPed(semPag))}.</p>` : ''}

  <div class="panel" id="finBoletos"><h2>Boletos para aprovar ${boletos.length ? chip([String(boletos.length), 'warn']) : ''}</h2>
    ${boletos.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Vendedor</th><th>Parcelas</th><th class="num">Total</th><th></th></tr></thead><tbody>
      ${boletos.map(p => `<tr><td><b>${p.numero}</b></td><td>${dataBR(p.criado)}</td><td>${esc(p.cliente.nome)}<br><span class="note">${esc(p.cliente.doc || p.cliente.cidade || '')}</span></td><td>${esc((user(p.vendedor) || {}).nome || '')}</td>
        <td>${esc(prazosTxt(p.pagamento.dias))}</td><td class="num">${brl(totalPedido(p))}</td><td><button class="btn sm" data-act="abrir-pedido" data-id="${esc(p.id)}">Analisar</button></td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhum pedido de boleto esperando aprovação.</p>'}</div>

  <div class="panel" id="finVend"><h2>Vendas por vendedor e representante</h2>
    <p class="note" style="margin:0 0 10px">A venda de uma loja de e-commerce entra para o vendedor responsável por ela.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quem vendeu</th><th class="num">Pedidos próprios</th><th class="num">Valor</th><th class="num">Pedidos das lojas</th><th class="num">Valor</th><th class="num">Total</th></tr></thead><tbody>
      ${porVend.map(l => `<tr><td><b>${esc(l.nome)}</b></td><td class="num">${l.pn}</td><td class="num">${brl(l.pv)}</td><td class="num">${l.ln}</td><td class="num">${brl(l.lv)}</td><td class="num"><b>${brl(l.pv + l.lv)}</b></td></tr>`).join('')}
      <tr><td><b>Total</b></td><td class="num">${porVend.reduce((s, l) => s + l.pn, 0)}</td><td class="num">${brl(porVend.reduce((s, l) => s + l.pv, 0))}</td><td class="num">${porVend.reduce((s, l) => s + l.ln, 0)}</td><td class="num">${brl(porVend.reduce((s, l) => s + l.lv, 0))}</td><td class="num"><b>${brl(total)}</b></td></tr></tbody></table></div></div>

  <div class="fin2">
    <div class="panel" id="finCanal"><h2>Por canal</h2><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Canal</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${canais.map(([c, n, v]) => `<tr><td>${c}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="panel" id="finMes"><h2>Últimos 6 meses</h2><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Mês</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${porMes.map(([k, n, v]) => `<tr><td>${MESES[+k.slice(5) - 1]} de ${k.slice(0, 4)}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>

  <div class="panel" id="finLojas"><h2>Por loja de e-commerce</h2>
    ${lojasV.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Loja</th><th>Vendedor responsável</th><th class="num">Pedidos</th><th class="num">Vendido</th></tr></thead><tbody>
      ${lojasV.map(({ l, n, v }) => `<tr><td><b>${esc(l.nome)}</b></td><td>${l.vendedorResp && user(l.vendedorResp) ? esc(user(l.vendedorResp).nome) : chip(['definir em Contas e-commerce', 'warn'])}</td><td class="num">${n}</td><td class="num">${brl(v)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma venda de e-commerce confirmada no período.</p>'}</div>

  <div class="panel" id="finParcelas"><h2>Parcelas de boleto em aberto</h2>
    ${abertas.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vencimento</th><th>Pedido</th><th>Cliente</th><th>Parcela</th><th class="num">Valor</th><th>Situação</th><th>Recebida</th></tr></thead><tbody>
      ${abertas.map(x => { const d = diasEntre(hoje, x.vence); return `<tr><td>${dataBR(x.vence)}</td><td><button class="lnk" data-act="abrir-pedido" data-id="${esc(x.p.id)}">nº ${x.p.numero}</button></td><td>${esc(x.p.cliente.nome)}</td><td>${x.n} de ${x.de}</td><td class="num">${brl(x.valor)}</td>
        <td>${d < 0 ? chip([`Vencida há ${pl(-d, 'dia', 'dias')}`, 'bad']) : d === 0 ? chip(['Vence hoje', 'warn']) : chip([`Vence em ${pl(d, 'dia', 'dias')}`, ''])}</td>
        <td><input type="checkbox" class="toggle" data-act="parc-rec" data-id="${esc(x.p.id)}" data-d="${x.dias}" aria-label="Parcela ${x.n} do pedido ${x.p.numero} recebida"></td></tr>`; }).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma parcela em aberto. As parcelas aparecem aqui quando um boleto é aprovado.</p>'}</div>

  <div class="panel" id="finProd"><h2>Produtos mais vendidos</h2>
    ${prods.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Produto</th><th>Código</th><th class="num">Unidades</th><th class="num">Vendido</th></tr></thead><tbody>
      ${prods.map(o => `<tr><td>${esc(o.nome)}</td><td>${esc(o.codigo || '')}</td><td class="num">${o.q}</td><td class="num">${brl(o.v)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="note" style="margin:0">Nenhuma venda confirmada no período.</p>'}</div>`;
}
Object.assign(chgs, { 'fin-per': e => { ui.finPer = e.value; renderApp(); } });
