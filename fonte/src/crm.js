/* ---------- Registro de ligações e possíveis clientes (administração e vendedores) ----------
   O vendedor registra cada ligação (loja, telefone, comprador, cidade, resultado e tratativa).
   A loja entra sozinha na base de possíveis clientes (uma por telefone) e a última ligação define a
   situação dela. A administração tem o controle de todas as ligações e o relatório por dia, semana e mês. */
const RESULTADOS = {
  interessado: ['Interessado', 'ok'], retornar: ['Pediu retorno', 'info'], nao_atendeu: ['Não atendeu', 'warn'],
  sem_interesse: ['Sem interesse', 'bad'], cliente: ['Virou cliente', 'ok'], numero_errado: ['Número errado', 'bad']
};
const SITUACOES = { novo: ['Novo', ''], ...RESULTADOS };
const podeCRM = u => u && (u.papel === 'admin' || u.papel === 'vendedor');
const telFmt = t => { const d = soDig(t); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d; };
const diaDe = iso => dataLocal(iso);
const horaDe = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const nomeVend = id => (user(id) || ((state.crm || {}).equipe || []).find(x => x.id === id) || {}).nome || 'Usuário removido';
const crm = () => state.crm || { prospects: [], ligacoes: [] };
const prospectDe = id => crm().prospects.find(p => p.id === id);
const chipRes = k => chip(SITUACOES[k] || [k, '']);
const ligDe = pid => crm().ligacoes.filter(l => l.prospect_id === pid);
const novaLig = () => ({ telefone: '', loja: '', comprador: '', cidade: '', uf: 'SP', email: '', resultado: '', tratativa: '', retornar_em: '' });
function avisoCRM() {
  return crm().indisponivel ? `<div class="panel"><p style="margin:0"><b>Falta um passo no banco.</b> Rode o arquivo <b>atualizacao-2.sql</b> no Supabase (SQL Editor, colar tudo, Run) para ligar o registro de ligações.</p></div>` : '';
}
function retornosPendentes(u, soMeus) {
  const hoje = hojeISO();
  return crm().prospects.filter(p => p.proximo_contato && p.proximo_contato <= hoje && !['cliente', 'sem_interesse', 'numero_errado'].includes(p.situacao))
    .filter(p => !soMeus || (ligDe(p.id)[0] || {}).vendedor_id === u.id)
    .sort((a, b) => a.proximo_contato < b.proximo_contato ? -1 : 1);
}
const linhaLig = (l, mostraVend) => { const p = prospectDe(l.prospect_id) || {}; return `<tr><td>${dataBR(diaDe(l.feita_em))}<div class="note">${horaDe(l.feita_em)}</div></td>
  <td><button class="linkbtn" data-act="abrir-prospect" data-id="${esc(l.prospect_id)}"><b>${esc(p.loja || '—')}</b></button><div class="note">${esc(p.comprador || '')}${p.comprador ? ' · ' : ''}${esc(telFmt(p.telefone || ''))}</div></td>
  <td>${esc(p.cidade || '')}${p.uf ? '/' + esc(p.uf) : ''}</td>${mostraVend ? `<td>${esc(nomeVend(l.vendedor_id))}</td>` : ''}
  <td>${chipRes(l.resultado)}${l.retornar_em ? `<div class="note">Retornar ${dataBR(l.retornar_em)}</div>` : ''}</td><td class="trat">${esc(l.tratativa)}${orcLink(l)}</td></tr>`; };
const orcLink = l => orcs().filter(o => o.ligacao_id === l.id).map(o => `<div class="note"><button class="linkbtn" data-act="abrir-orc" data-id="${esc(o.id)}">Orçamento nº ${esc(o.numero)}</button> · ${brl(totalOrc(o))} · ${esc(SIT_ORC[o.situacao][0])}</div>`).join('');

/* ---------- tela: Ligações ---------- */
function vLigacoes(u) {
  const d = ui.lig || (ui.lig = novaLig()), adm = u.papel === 'admin', ja = crm().prospects.find(p => p.telefone === soDig(d.telefone).replace(/^55(?=\d{10,11}$)/, ''));
  const soMeus = adm ? false : ui.ligSoMeus !== false, ret = retornosPendentes(u, soMeus), hoje = hojeISO();
  const minhas = crm().ligacoes.filter(l => adm || l.vendedor_id === u.id).slice(0, 40);
  const hojeN = crm().ligacoes.filter(l => l.vendedor_id === u.id && diaDe(l.feita_em) === hoje).length;
  const campo = (k, t, extra = '') => `<label class="field"><span>${t}</span><input id="lg-${k}" data-lg="${k}" value="${esc(d[k])}" ${extra}></label>`;
  return `<h1>Ligações</h1><p class="sub">Registre cada ligação. A loja entra sozinha na base de possíveis clientes e o histórico fica guardado para toda a equipe. Você fez ${hojeN} ${hojeN === 1 ? 'ligação' : 'ligações'} hoje.</p>
  ${avisoCRM()}
  <div class="panel"><h2>Registrar ligação</h2>
    <div class="grid3">${campo('telefone', 'Telefone da loja (com DDD)', 'inputmode="tel" autocomplete="off" placeholder="(17) 99999-9999"')}${campo('loja', 'Nome da loja')}${campo('comprador', 'Nome do comprador')}</div>
    ${ja ? `<p class="aviso-lig">Esta loja já está na base: <b>${esc(ja.loja)}</b>, ${esc(ja.cidade)}/${esc(ja.uf)}, ${chipRes(ja.situacao)}${ja.ultima_ligacao ? ` · última ligação em ${dataBR(diaDe(ja.ultima_ligacao))} por ${esc(nomeVend((ligDe(ja.id)[0] || {}).vendedor_id))}` : ''}.
      <button class="linkbtn" data-act="abrir-prospect" data-id="${esc(ja.id)}">Ver histórico</button>${!d.loja ? ` <button class="linkbtn" data-act="lig-usar" data-id="${esc(ja.id)}">Preencher com os dados dela</button>` : ''}</p>` : ''}
    <div class="grid-lig">${campo('cidade', 'Cidade')}<label class="field"><span>UF</span><select id="lg-uf" data-lg="uf">${UFS.map(x => `<option ${x === d.uf ? 'selected' : ''}>${x}</option>`).join('')}</select></label>${campo('email', 'E-mail (opcional)', 'type="email"')}</div>
    <fieldset class="res"><legend>Resultado da ligação</legend>${Object.entries(RESULTADOS).map(([k, [t]]) => `<label class="opt-res"><input type="radio" name="lgres" value="${k}" data-lg="resultado" ${d.resultado === k ? 'checked' : ''}> ${t}</label>`).join('')}</fieldset>
    <label class="field"><span>Tratativa: o que foi conversado</span><textarea id="lg-tratativa" data-lg="tratativa" rows="3" placeholder="Ex.: falou com o João, pediu tabela de fogões industriais, vai ver com o sócio.">${esc(d.tratativa)}</textarea></label>
    <div class="grid-lig" style="margin-top:10px"><label class="field"><span>Retornar em (opcional)</span><input id="lg-retornar_em" type="date" data-lg="retornar_em" value="${esc(d.retornar_em)}" min="${hoje}"></label></div>
    ${crm().orcIndisponivel ? avisoOrc() : d.orc ? `<div class="orc-box" id="orcLig"><div class="galtop" style="margin:0 0 10px"><h3 style="margin:0">Orçamento desta ligação</h3><button class="linkbtn" data-act="lig-orc-tirar">Tirar o orçamento</button></div>${orcEditor(d.orc, 'lig', false)}</div>`
      : `<div class="bar" style="margin:12px 0 0"><button class="btn ghost sm" data-act="lig-orc">+ Adicionar orçamento</button><span class="note">Monte o orçamento com os itens que a loja pediu.</span></div>`}
    <p class="err" role="alert" id="lgErro" ${ui.ligErro ? '' : 'hidden'}>${esc(ui.ligErro || '')}</p>
    <div class="bar" style="margin:12px 0 0"><button class="btn" data-act="lig-salvar">${d.orc ? 'Salvar ligação e orçamento' : 'Salvar ligação'}</button><button class="btn ghost" data-act="lig-limpar">Limpar</button></div></div>
  <div class="panel"><div class="galtop" style="margin:0 0 10px"><h2 style="margin:0">Retornos para hoje e atrasados (${ret.length})</h2>
    ${adm ? '' : `<label class="check"><input type="checkbox" data-chg="lig-meus" ${soMeus ? 'checked' : ''}> Só os meus</label>`}</div>
    ${ret.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Retornar em</th><th>Loja</th><th>Cidade</th><th>Situação</th><th>Última tratativa</th></tr></thead><tbody>
      ${ret.map(p => `<tr><td>${p.proximo_contato < hoje ? `<span class="chip bad">${dataBR(p.proximo_contato)}</span>` : '<span class="chip info">Hoje</span>'}</td>
        <td><button class="linkbtn" data-act="abrir-prospect" data-id="${esc(p.id)}"><b>${esc(p.loja)}</b></button><div class="note">${esc(p.comprador || '')}${p.comprador ? ' · ' : ''}<a href="tel:+55${esc(p.telefone)}">${esc(telFmt(p.telefone))}</a></div></td>
        <td>${esc(p.cidade)}/${esc(p.uf)}</td><td>${chipRes(p.situacao)}</td><td class="trat">${esc((ligDe(p.id)[0] || {}).tratativa || '')}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="note" style="margin:0">Nenhum retorno pendente.</p>'}</div>
  ${painelOrcs(u)}
  <div class="panel"><h2>${adm ? 'Últimas ligações da equipe' : 'Minhas últimas ligações'}</h2>
    ${minhas.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Loja</th><th>Cidade</th>${adm ? '<th>Vendedor</th>' : ''}<th>Resultado</th><th>Tratativa</th></tr></thead><tbody>${minhas.map(l => linhaLig(l, adm)).join('')}</tbody></table></div>`
      : '<p class="note" style="margin:0">Nenhuma ligação registrada ainda.</p>'}</div>`;
}

/* ---------- tela: Possíveis clientes ---------- */
function filtrarProspects() {
  const f = ui.pcF || (ui.pcF = { busca: '', uf: '', cidade: '', situacao: '', vendedor: '', retorno: false });
  const q = f.busca.trim().toLowerCase(), qd = soDig(f.busca), hoje = hojeISO();
  return crm().prospects.filter(p => (!f.uf || p.uf === f.uf) && (!f.cidade || p.cidade.toLowerCase() === f.cidade.toLowerCase()) && (!f.situacao || p.situacao === f.situacao)
    && (!f.vendedor || ligDe(p.id).some(l => l.vendedor_id === f.vendedor) || p.criado_por === f.vendedor)
    && (!f.retorno || (p.proximo_contato && p.proximo_contato <= hoje))
    && (!q || (p.loja + ' ' + (p.comprador || '') + ' ' + p.cidade + ' ' + (p.email || '')).toLowerCase().includes(q) || (qd.length >= 4 && p.telefone.includes(qd))));
}
function vClientes(u) {
  const f = ui.pcF || (ui.pcF = { busca: '', uf: '', cidade: '', situacao: '', vendedor: '', retorno: false }), adm = u.papel === 'admin';
  const todos = crm().prospects, lista = filtrarProspects().sort((a, b) => (a.cidade.localeCompare(b.cidade, 'pt-BR') || a.loja.localeCompare(b.loja, 'pt-BR')));
  const ufs = [...new Set(todos.map(p => p.uf))].sort(), cidades = [...new Set(todos.filter(p => !f.uf || p.uf === f.uf).map(p => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const porCidade = new Map(); lista.forEach(p => { const k = p.cidade + '/' + p.uf; porCidade.set(k, (porCidade.get(k) || 0) + 1); });
  const porSit = Object.keys(SITUACOES).map(k => [k, lista.filter(p => p.situacao === k).length]).filter(x => x[1]);
  const vends = state.usuarios.filter(x => x.papel === 'vendedor' || x.papel === 'admin');
  return `<h1>Possíveis clientes</h1><p class="sub">Todas as lojas que a equipe já procurou, com telefone, comprador, cidade, situação e o histórico de cada ligação.</p>
  ${avisoCRM()}
  <div class="bar"><input class="inp" style="width:min(18rem,100%)" type="search" id="pcBusca" placeholder="Buscar loja, comprador ou telefone" value="${esc(f.busca)}" aria-label="Buscar">
    <select class="inp" style="width:auto" data-chg="pc-f" data-k="uf" aria-label="Estado"><option value="">Todos os estados</option>${ufs.map(x => `<option ${x === f.uf ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-chg="pc-f" data-k="cidade" aria-label="Cidade"><option value="">Todas as cidades</option>${cidades.map(x => `<option ${x === f.cidade ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-chg="pc-f" data-k="situacao" aria-label="Situação"><option value="">Todas as situações</option>${Object.entries(SITUACOES).map(([k, [t]]) => `<option value="${k}" ${k === f.situacao ? 'selected' : ''}>${t}</option>`).join('')}</select>
    ${adm ? `<select class="inp" style="width:auto" data-chg="pc-f" data-k="vendedor" aria-label="Vendedor"><option value="">Todos os vendedores</option>${vends.map(x => `<option value="${esc(x.id)}" ${x.id === f.vendedor ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>` : ''}
    <label class="check"><input type="checkbox" data-chg="pc-f" data-k="retorno" ${f.retorno ? 'checked' : ''}> Com retorno vencendo</label>
    <button class="btn ghost sm" data-act="pc-csv">Baixar planilha</button></div>
  <p class="note">${lista.length} de ${todos.length} ${todos.length === 1 ? 'loja' : 'lojas'}${porSit.length ? ' · ' + porSit.map(([k, n]) => `${SITUACOES[k][0]}: ${n}`).join(' · ') : ''}</p>
  ${porCidade.size > 1 ? `<div class="cidades">${[...porCidade.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([c, n]) => `<button class="chip" data-act="pc-cidade" data-c="${esc(c)}">${esc(c)} <b>${n}</b></button>`).join('')}</div>` : ''}
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Loja</th><th>Telefone</th><th>Cidade</th><th>Situação</th><th>Última ligação</th><th>Retornar</th><th class="num">Ligações</th></tr></thead><tbody>
    ${lista.map(p => { const ls = ligDe(p.id); return `<tr><td><button class="linkbtn" data-act="abrir-prospect" data-id="${esc(p.id)}"><b>${esc(p.loja)}</b></button>${p.comprador ? `<div class="note">${esc(p.comprador)}</div>` : ''}</td>
      <td><a href="tel:+55${esc(p.telefone)}">${esc(telFmt(p.telefone))}</a> <a class="note" href="https://wa.me/55${esc(p.telefone)}" target="_blank" rel="noopener">WhatsApp</a></td>
      <td>${esc(p.cidade)}/${esc(p.uf)}</td><td>${chipRes(p.situacao)}</td>
      <td>${p.ultima_ligacao ? `${dataBR(diaDe(p.ultima_ligacao))}<div class="note">${esc(nomeVend((ls[0] || {}).vendedor_id))}</div>` : '—'}</td>
      <td>${p.proximo_contato ? (p.proximo_contato < hojeISO() ? `<span class="chip bad">${dataBR(p.proximo_contato)}</span>` : dataBR(p.proximo_contato)) : '—'}</td><td class="num">${ls.length}</td></tr>`; }).join('')}
  </tbody></table></div>` : `<div class="panel"><p class="note" style="margin:0">${todos.length ? 'Nenhuma loja com esses filtros.' : 'A base começa a ser montada com a primeira ligação registrada.'}</p></div>`}`;
}
function dProspect(dr, u) {
  const p = prospectDe(dr.id); if (!p) return '';
  const d = dr.draft || (dr.draft = { loja: p.loja, comprador: p.comprador || '', telefone: telFmt(p.telefone), cidade: p.cidade, uf: p.uf, email: p.email || '', observacoes: p.observacoes || '', proximo_contato: p.proximo_contato || '' });
  const ls = ligDe(p.id), adm = u.papel === 'admin';
  const campo = (k, t, extra = '') => `<label class="field"><span>${t}</span><input data-pd="${k}" value="${esc(d[k])}" ${extra}></label>`;
  return `<h2 class="dt">${esc(p.loja)}</h2><p class="note">${chipRes(p.situacao)} · ${esc(p.cidade)}/${esc(p.uf)} · cadastrada em ${dataBR(diaDe(p.criado_em))} por ${esc(nomeVend(p.criado_por))}</p>
  <div class="bar"><a class="btn sm" href="tel:+55${esc(p.telefone)}">Ligar ${esc(telFmt(p.telefone))}</a><a class="btn ghost sm" href="https://wa.me/55${esc(p.telefone)}" target="_blank" rel="noopener">WhatsApp</a>
    <button class="btn ghost sm" data-act="lig-desta" data-id="${esc(p.id)}">Registrar nova ligação</button></div>
  <h3>Histórico (${ls.length} ${ls.length === 1 ? 'ligação' : 'ligações'})</h3>
  ${ls.length ? `<ol class="hist">${ls.map(l => `<li><div><b>${dataBR(diaDe(l.feita_em))} ${horaDe(l.feita_em)}</b> · ${esc(nomeVend(l.vendedor_id))} · ${chipRes(l.resultado)}${l.retornar_em ? ` · retornar ${dataBR(l.retornar_em)}` : ''}
    ${adm ? `<button class="linkbtn" data-act="lig-apagar" data-id="${esc(l.id)}" data-confirm="Confirmar: apagar ligação">Apagar</button>` : ''}</div><p>${esc(l.tratativa)}</p>${orcLink(l)}</li>`).join('')}</ol>` : '<p class="note">Nenhuma ligação ainda.</p>'}
  ${crm().orcIndisponivel ? '' : `<div class="galtop" style="margin:14px 0 8px"><h3 style="margin:0">Orçamentos (${orcsDe(p.id).length})</h3><button class="btn ghost sm" data-act="orc-novo" data-id="${esc(p.id)}">Novo orçamento</button></div>
  ${orcsDe(p.id).length ? tabelaOrcs(orcsDe(p.id), false) : '<p class="note">Nenhum orçamento para esta loja.</p>'}`}
  <h3>Dados da loja</h3>
  <div class="grid2">${campo('loja', 'Nome da loja')}${campo('comprador', 'Comprador')}${campo('telefone', 'Telefone', 'inputmode="tel"')}${campo('email', 'E-mail', 'type="email"')}${campo('cidade', 'Cidade')}
    <label class="field"><span>UF</span><select data-pd="uf">${UFS.map(x => `<option ${x === d.uf ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="field"><span>Próximo contato</span><input type="date" data-pd="proximo_contato" value="${esc(d.proximo_contato)}"></label></div>
  <label class="field" style="margin-top:10px"><span>Observações</span><textarea data-pd="observacoes" rows="3">${esc(d.observacoes)}</textarea></label>
  <p class="err" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
  <div class="foot"><button class="btn" data-act="prospect-salvar">Salvar dados</button><button class="btn ghost" data-act="fechar">Fechar</button>
    ${adm ? `<button class="btn danger" data-act="prospect-apagar" data-confirm="Confirmar: apagar loja e histórico">Apagar loja</button>` : ''}</div>`;
}

/* ---------- tela: Relatório de ligações (administração) ---------- */
const PER_LIG = [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['semana', 'Esta semana'], ['7', 'Últimos 7 dias'], ['mes', 'Este mês'], ['anterior', 'Mês passado'], ['30', 'Últimos 30 dias'], ['tudo', 'Desde o início']];
function faixaLig(k) {
  const h = hojeISO(), dow = (new Date(h + 'T12:00:00').getDay() + 6) % 7;      // segunda = 0
  if (k === 'hoje') return [h, h];
  if (k === 'ontem') { const o = somaDias(h, -1); return [o, o]; }
  if (k === 'semana') return [somaDias(h, -dow), h];
  if (k === '7') return [somaDias(h, -6), h];
  if (k === '30') return [somaDias(h, -29), h];
  return intervalo(k);
}
function ligsDoRelatorio() {
  const r = ui.relLig || (ui.relLig = { per: 'semana', vendedor: '', resultado: '', cidade: '' }), [de, ate] = faixaLig(r.per);
  return crm().ligacoes.filter(l => { const d = diaDe(l.feita_em), p = prospectDe(l.prospect_id) || {};
    return d >= de && d <= ate && (!r.vendedor || l.vendedor_id === r.vendedor) && (!r.resultado || l.resultado === r.resultado) && (!r.cidade || (p.cidade + '/' + p.uf) === r.cidade); });
}
function vRelLig(u) {
  if (u.papel !== 'admin') return '';
  const r = ui.relLig || (ui.relLig = { per: 'semana', vendedor: '', resultado: '', cidade: '' }), [de, ate] = faixaLig(r.per), ls = ligsDoRelatorio(), hoje = hojeISO();
  const lojasL = new Set(ls.map(l => l.prospect_id)), novos = crm().prospects.filter(p => { const d = diaDe(p.criado_em); return d >= de && d <= ate; });
  const conta = k => ls.filter(l => l.resultado === k).length, atras = retornosPendentes(u, false).filter(p => p.proximo_contato < hoje).length;
  const atend = ls.filter(l => !['nao_atendeu', 'numero_errado'].includes(l.resultado)).length;
  const tile = (rot, v, sub) => `<div class="tile"><span class="t-rot">${rot}</span><b class="t-val">${v}</b><span class="t-sub">${sub}</span></div>`;
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const vends = state.usuarios.filter(x => x.papel === 'vendedor' || x.papel === 'admin');
  const porVend = vends.map(v => { const x = ls.filter(l => l.vendedor_id === v.id); return { v, n: x.length, lojas: new Set(x.map(l => l.prospect_id)).size, ...Object.fromEntries(Object.keys(RESULTADOS).map(k => [k, x.filter(l => l.resultado === k).length])) }; }).filter(x => x.n || x.v.papel === 'vendedor').sort((a, b) => b.n - a.n);
  const pc = new Map(); ls.forEach(l => { const p = prospectDe(l.prospect_id); if (!p) return; const k = p.cidade + '/' + p.uf, o = pc.get(k) || { n: 0, lojas: new Set(), int: 0, cli: 0 }; o.n++; o.lojas.add(p.id); if (l.resultado === 'interessado') o.int++; if (l.resultado === 'cliente') o.cli++; pc.set(k, o); });
  const dias = []; if (r.per !== 'tudo') for (let d = de; d <= ate && dias.length < 62; d = somaDias(d, 1)) dias.push(d);
  const porDia = dias.map(d => [d, ls.filter(l => diaDe(l.feita_em) === d).length]), maxD = Math.max(1, ...porDia.map(x => x[1]));
  const cidadesTodas = [...new Set(crm().prospects.map(p => p.cidade + '/' + p.uf))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return `<h1>Relatório de ligações</h1><p class="sub">Controle de tudo o que a equipe está ligando e tratando, por dia, semana e mês.</p>
  ${avisoCRM()}
  <div class="bar"><select class="inp" style="width:auto" data-chg="rel-f" data-k="per" aria-label="Período">${PER_LIG.map(([k, t]) => `<option value="${k}" ${k === r.per ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-chg="rel-f" data-k="vendedor" aria-label="Vendedor"><option value="">Todos os vendedores</option>${vends.map(x => `<option value="${esc(x.id)}" ${x.id === r.vendedor ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-chg="rel-f" data-k="resultado" aria-label="Resultado"><option value="">Todos os resultados</option>${Object.entries(RESULTADOS).map(([k, [t]]) => `<option value="${k}" ${k === r.resultado ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-chg="rel-f" data-k="cidade" aria-label="Cidade"><option value="">Todas as cidades</option>${cidadesTodas.map(x => `<option ${x === r.cidade ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
    <button class="btn ghost sm" data-act="rel-csv">Baixar planilha</button></div>
  <p class="note">${r.per === 'tudo' ? 'Todas as ligações' : de === ate ? `Ligações de ${dataBR(de)}` : `Ligações de ${dataBR(de)} a ${dataBR(ate)}`}</p>
  <div class="tiles" id="relTiles">
    ${tile('Ligações', ls.length, `${lojasL.size} ${lojasL.size === 1 ? 'loja' : 'lojas'} diferentes`)}
    ${tile('Atendidas', atend, `${pct(atend, ls.length)} das ligações`)}
    ${tile('Interessados', conta('interessado'), `${conta('retornar')} pediram retorno`)}
    ${tile('Viraram clientes', conta('cliente'), `${pct(conta('cliente'), lojasL.size)} das lojas contatadas`)}
    ${tile('Lojas novas na base', novos.length, `${crm().prospects.length} no total`)}
    ${tile('Retornos atrasados', atras, 'de toda a equipe, hoje')}
  </div>
  ${dias.length > 1 ? `<div class="panel"><h2>Ligações por dia</h2><div class="barras">${porDia.map(([d, n]) => `<div class="bdia" title="${dataBR(d)}: ${n}"><span class="bn">${n || ''}</span><i style="height:${Math.round(n / maxD * 100)}%"></i><span class="bd">${d.slice(8)}/${d.slice(5, 7)}</span></div>`).join('')}</div></div>` : ''}
  <div class="panel" id="relVend"><h2>Por vendedor</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vendedor</th><th class="num">Ligações</th><th class="num">Lojas</th>${Object.values(RESULTADOS).map(([t]) => `<th class="num">${t}</th>`).join('')}</tr></thead><tbody>
    ${porVend.map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td class="num">${x.n}</td><td class="num">${x.lojas}</td>${Object.keys(RESULTADOS).map(k => `<td class="num">${x[k]}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div></div>
  ${pc.size ? `<div class="panel" id="relCid"><h2>Por cidade</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cidade</th><th class="num">Ligações</th><th class="num">Lojas</th><th class="num">Interessados</th><th class="num">Viraram clientes</th></tr></thead><tbody>
    ${[...pc.entries()].sort((a, b) => b[1].n - a[1].n).map(([c, o]) => `<tr><td>${esc(c)}</td><td class="num">${o.n}</td><td class="num">${o.lojas.size}</td><td class="num">${o.int}</td><td class="num">${o.cli}</td></tr>`).join('')}
  </tbody></table></div></div>` : ''}
  ${relOrcs(de, ate, r)}
  <div class="panel" id="relLista"><h2>Todas as ligações do período (${ls.length})</h2>
    ${ls.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Loja</th><th>Cidade</th><th>Vendedor</th><th>Resultado</th><th>Tratativa</th></tr></thead><tbody>${ls.slice(0, 300).map(l => linhaLig(l, true)).join('')}</tbody></table></div>${ls.length > 300 ? '<p class="note">Mostrando as 300 mais recentes. A planilha traz todas.</p>' : ''}` : '<p class="note" style="margin:0">Nenhuma ligação neste período.</p>'}</div>`;
}

/* ---------- planilha (abre no Excel) ---------- */
function baixarCSV(nome, linhas) {
  const csv = '﻿' + linhas.map(l => l.map(v => { const s = String(v == null ? '' : v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- ações ---------- */
Object.assign(acts, {
  'lig-limpar': () => { ui.lig = novaLig(); ui.ligErro = ''; renderApp(); },
  'lig-usar': e => { const p = prospectDe(e.dataset.id); if (!p) return; Object.assign(ui.lig, { loja: p.loja, comprador: p.comprador || '', cidade: p.cidade, uf: p.uf, email: p.email || '' }); renderApp(); const t = $('#lg-tratativa'); if (t) t.focus(); },
  'lig-desta': e => { const p = prospectDe(e.dataset.id); if (!p) return; ui.lig = { ...novaLig(), telefone: telFmt(p.telefone), loja: p.loja, comprador: p.comprador || '', cidade: p.cidade, uf: p.uf, email: p.email || '' }; ui.ligErro = ''; fecharDrawer(); ui.view = 'ligacoes'; renderApp(); scrollTo(0, 0); const t = $('#lg-tratativa'); if (t) t.focus(); },
  'lig-salvar': async () => {
    const u = eu(); if (!podeCRM(u) || ui.ocupado) return;
    const d = ui.lig, tel = soDig(d.telefone).replace(/^55(?=\d{10,11}$)/, ''), erro = m => { ui.ligErro = m; renderApp(); const x = $('#lgErro'); if (x) x.scrollIntoView({ block: 'center' }); };
    if (tel.length < 10 || tel.length > 11) return erro('Informe o telefone com DDD (10 ou 11 números).');
    if (d.loja.trim().length < 2) return erro('Informe o nome da loja.');
    if (d.cidade.trim().length < 2) return erro('Informe a cidade.');
    if (!d.resultado) return erro('Escolha o resultado da ligação.');
    if (!d.tratativa.trim()) return erro('Escreva a tratativa: o que foi conversado.');
    if (d.resultado === 'retornar' && !d.retornar_em) return erro('Informe quando retornar.');
    if (d.orc) { const m = problemaOrc(d.orc); if (m) { if (/motivo/.test(m)) d.orc.aba = 'motivo'; return erro('Orçamento: ' + m); } }
    ui.ocupado = true; const bt = $('[data-act=lig-salvar]'); if (bt) { bt.disabled = true; bt.textContent = 'Salvando…'; }
    try {
      const { orc, ...lig } = d, r = await API.registrarLigacao({ ...lig, telefone: tel }); ui.lig = novaLig(); ui.ligErro = '';
      if (orc) {
        try { const o = await API.salvarOrcamento({ ...corpoOrc(orc), prospect_id: r.prospect_id, ligacao_id: r.ligacao_id }); renderApp(); toast(`Ligação registrada com o orçamento nº ${o.numero}.`); }
        catch (err) { renderApp(); ui.drawer = { tipo: 'orcamento', draft: { ...orc, prospect_id: r.prospect_id, ligacao_id: r.ligacao_id }, erro: 'A ligação foi salva, mas o orçamento não: ' + msgErro(err) }; renderDrawer(); }
        return;
      }
      renderApp(); toast('Ligação registrada.'); const t = $('#lg-telefone'); if (t) t.focus();
    }
    catch (err) { erro(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'abrir-prospect': e => { ui.drawer = { tipo: 'prospect', id: e.dataset.id }; renderDrawer(); },
  'prospect-salvar': async () => {
    const dr = ui.drawer, d = dr.draft, tel = soDig(d.telefone).replace(/^55(?=\d{10,11}$)/, '');
    if (tel.length < 10 || tel.length > 11) { dr.erro = 'Telefone com DDD: 10 ou 11 números.'; return renderDrawer(); }
    if (d.loja.trim().length < 2 || d.cidade.trim().length < 2) { dr.erro = 'Informe o nome da loja e a cidade.'; return renderDrawer(); }
    try { await API.salvarProspect(dr.id, { loja: d.loja.trim(), comprador: d.comprador.trim() || null, telefone: tel, cidade: d.cidade.trim(), uf: d.uf, email: d.email.trim() || null, observacoes: d.observacoes.trim() || null, proximo_contato: d.proximo_contato || null });
      dr.draft = null; dr.erro = ''; refresh(); toast('Dados salvos.'); }
    catch (err) { dr.erro = /duplicate|23505|já existe/i.test(err.message + err.code) ? 'Já existe outra loja com este telefone.' : msgErro(err); renderDrawer(); }
  },
  'prospect-apagar': async () => { if (eu().papel !== 'admin') return; const id = ui.drawer.id; try { await API.apagarProspect(id); fecharDrawer(); renderApp(); toast('Loja apagada da base.'); } catch (err) { toast(msgErro(err)); } },
  'lig-apagar': async e => { if (eu().papel !== 'admin') return; try { await API.apagarLigacao(e.dataset.id); refresh(); toast('Ligação apagada.'); } catch (err) { toast(msgErro(err)); } },
  'pc-cidade': e => { const [c, uf] = e.dataset.c.split('/'); Object.assign(ui.pcF, { cidade: c, uf }); renderApp(); },
  'pc-csv': () => baixarCSV('possiveis-clientes.csv', [['Loja', 'Comprador', 'Telefone', 'E-mail', 'Cidade', 'UF', 'Situação', 'Última ligação', 'Último vendedor', 'Última tratativa', 'Retornar em', 'Ligações', 'Observações']]
    .concat(filtrarProspects().map(p => { const l = ligDe(p.id)[0] || {}; return [p.loja, p.comprador, telFmt(p.telefone), p.email, p.cidade, p.uf, SITUACOES[p.situacao][0], p.ultima_ligacao ? dataBR(diaDe(p.ultima_ligacao)) : '', l.vendedor_id ? nomeVend(l.vendedor_id) : '', l.tratativa, p.proximo_contato ? dataBR(p.proximo_contato) : '', ligDe(p.id).length, p.observacoes]; }))),
  'rel-csv': () => baixarCSV('ligacoes.csv', [['Data', 'Hora', 'Vendedor', 'Loja', 'Comprador', 'Telefone', 'Cidade', 'UF', 'Resultado', 'Tratativa', 'Retornar em']]
    .concat(ligsDoRelatorio().map(l => { const p = prospectDe(l.prospect_id) || {}; return [dataBR(diaDe(l.feita_em)), horaDe(l.feita_em), nomeVend(l.vendedor_id), p.loja, p.comprador, telFmt(p.telefone || ''), p.cidade, p.uf, RESULTADOS[l.resultado][0], l.tratativa, l.retornar_em ? dataBR(l.retornar_em) : '']; })))
});
Object.assign(chgs, {
  'lig-meus': e => { ui.ligSoMeus = e.checked; renderApp(); },
  'pc-f': e => { ui.pcF[e.dataset.k] = e.type === 'checkbox' ? e.checked : e.value; if (e.dataset.k === 'uf') ui.pcF.cidade = ''; renderApp(); },
  'rel-f': e => { ui.relLig[e.dataset.k] = e.value; renderApp(); }
});
let tPc = null;
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.lg && ui.lig) {
    ui.lig[t.dataset.lg] = t.value;
    if (t.dataset.lg === 'telefone') { clearTimeout(tPc); tPc = setTimeout(() => { const pos = t.selectionStart; renderApp(); const i = $('#lg-telefone'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) { } } }, 400); }
  }
  if (t.dataset && t.dataset.pd && ui.drawer && ui.drawer.draft) ui.drawer.draft[t.dataset.pd] = t.value;
  if (t.id === 'pcBusca') { ui.pcF.busca = t.value; clearTimeout(tPc); tPc = setTimeout(() => { renderApp(); const i = $('#pcBusca'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); }
});
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.lg && ui.lig) ui.lig[t.dataset.lg] = t.value; if (t.dataset && t.dataset.pd && ui.drawer && ui.drawer.draft) ui.drawer.draft[t.dataset.pd] = t.value; });
