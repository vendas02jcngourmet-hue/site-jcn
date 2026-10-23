/* ---------- RH: "Trabalhe conosco" (página inicial), currículos, reuniões e avisos ----------
   O candidato envia os dados e o currículo pelo site, sem login. O arquivo fica na pasta privada "rh".
   RH administrativo: tudo do RH (inclusive os logins do RH). RH assistente: vê, avalia e agenda, sem apagar.
   Quem é do RH não vê nada de vendas, pedidos ou financeiro. */
const ST_CAND = { novo: ['Novo', 'info'], em_analise: ['Em análise', ''], entrevista: ['Entrevista', 'warn'], aprovado: ['Aprovado', 'ok'], reprovado: ['Não aprovado', 'bad'], banco_talentos: ['Banco de talentos', ''] };
const ST_REU = { agendada: ['Agendada', 'info'], realizada: ['Realizada', 'ok'], cancelada: ['Cancelada', ''], faltou: ['Não compareceu', 'bad'] };
const rh = () => state.rh || { cands: [], reunioes: [] };
const candDe = id => rh().cands.find(c => c.id === id);
const reunioesDe = id => rh().reunioes.filter(r => r.candidatura_id === id);
const ehRHAdm = u => u && (u.papel === 'admin' || u.papel === 'rh_admin');
const dtHora = iso => { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
const diaLocal = iso => dataLocal(iso);
const proximas = () => rh().reunioes.filter(r => r.status === 'agendada' && new Date(r.inicio).getTime() + r.duracao_min * 60000 > Date.now());
const naoVistos = () => rh().cands.filter(c => !c.visto_em);
function avisoRH() { return rh().indisponivel ? `<div class="panel"><p style="margin:0"><b>Falta um passo no banco.</b> Rode o arquivo <b>atualizacao-4.sql</b> no Supabase (SQL Editor, colar tudo, Run) para ligar o RH.</p></div>` : ''; }

/* ---------- Trabalhe conosco (página inicial): ficha em etapas ---------- */
const ETAPAS_TC = [...FICHA, { id: 'envio', tit: 'Currículo e envio', curto: 'Envio' }];
const RASCUNHO_TC = 'jcn-trabalhe';
let etapaTC = 0; const feitasTC = new Set();
function prepararTrabalhe() {
  const f = $('#tcForm'); if (!f || f.dataset.ok) return; f.dataset.ok = '1';
  let v = {}; try { v = JSON.parse(sessionStorage.getItem(RASCUNHO_TC)) || {}; } catch (e) { }
  f.innerHTML = `<ol class="tc-passos" aria-label="Etapas da ficha">${ETAPAS_TC.map((s, i) => `<li><button type="button" class="tc-passo" data-tc-ir="${i}"><b>${i + 1}</b><span>${esc(s.curto)}</span></button></li>`).join('')}</ol>
    <div class="tc-barra" aria-hidden="true"><span></span></div>
    ${FICHA.map((s, i) => `<fieldset class="tc-etapa" data-etapa="${i}" hidden><legend>${i + 1}. ${esc(s.tit)}</legend>${s.nota ? `<p class="note tc-nota">${esc(s.nota)}</p>` : ''}${camposDaEtapa(s, 'tc', v)}</fieldset>`).join('')}
    <fieldset class="tc-etapa" data-etapa="${FICHA.length}" hidden><legend>${FICHA.length + 1}. Currículo e envio</legend>
      <label class="tc-arq"><input id="tc-arquivo" type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"><span id="tcArqNome">Escolher o currículo (PDF, Word ou foto, até 10 MB) *</span></label>
      <label class="check tc-lgpd"><input type="checkbox" id="tc-consentimento"> Autorizo a JCN Gourmet a guardar e usar estes dados, inclusive documentos e a cor/raça informada, apenas para processos seletivos e, se eu for contratado, para a minha admissão. *</label>
    </fieldset>
    <p class="tc-erro" role="alert" id="tcErro" hidden></p>
    <div class="tc-nav"><button type="button" class="btn ghost" id="tcVoltar">Voltar</button><button type="button" class="btn" id="tcSeguir">Continuar</button><button class="btn" type="submit" id="tcEnviar">Enviar currículo</button></div>`;
  f.addEventListener('submit', ev => { ev.preventDefault(); enviarCandidatura(); });
  f.addEventListener('click', ev => {
    const b = ev.target.closest('[data-tc-ir]'); if (b) return irEtapaTC(+b.dataset.tcIr);
    if (ev.target.closest('#tcVoltar')) return irEtapaTC(etapaTC - 1);
    if (ev.target.closest('#tcSeguir')) { const m = problemaFicha('tc', lerFicha('tc'), camposEtapa(etapaTC), true); if (m) return erroTC(m[0], m[1]); feitasTC.add(etapaTC); irEtapaTC(etapaTC + 1); }
  });
  const guardar = () => { try { sessionStorage.setItem(RASCUNHO_TC, JSON.stringify(lerFicha('tc'))); } catch (e) { } };
  f.addEventListener('input', () => { guardar(); $('#tcErro').hidden = true; }); f.addEventListener('change', guardar);
  $('#tc-arquivo').addEventListener('change', e => { const a = e.target.files[0]; $('#tcArqNome').textContent = a ? `${a.name} (${kb(a.size)})` : 'Escolher o currículo (PDF, Word ou foto, até 10 MB) *'; });
  aplicarSe('tc'); irEtapaTC(0, true);
}
const camposEtapa = i => (FICHA[i] ? FICHA[i].campos.filter(c => c.k).map(c => c.k) : []);
function irEtapaTC(i, quieto) {
  i = Math.max(0, Math.min(ETAPAS_TC.length - 1, i)); etapaTC = i; $('#tcErro').hidden = true;
  $$('.tc-etapa').forEach(x => { x.hidden = +x.dataset.etapa !== i; });
  $$('.tc-passo').forEach((b, j) => { b.classList.toggle('feito', feitasTC.has(j) && j !== i); if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  $('.tc-barra span').style.width = Math.round((i + 1) / ETAPAS_TC.length * 100) + '%';
  $('#tcVoltar').hidden = i === 0; $('#tcSeguir').hidden = i === ETAPAS_TC.length - 1; $('#tcEnviar').hidden = i !== ETAPAS_TC.length - 1;
  if (!quieto) { const l = $(`.tc-etapa[data-etapa="${i}"] legend`); $('#trabalhe .tc-passos').scrollIntoView({ block: 'start', behavior: 'smooth' }); const pr = $(`.tc-etapa[data-etapa="${i}"] input:not([type=hidden]), .tc-etapa[data-etapa="${i}"] select, .tc-etapa[data-etapa="${i}"] textarea`); if (pr) setTimeout(() => { const at = document.activeElement, et = $(`.tc-etapa[data-etapa="${i}"]`); if (etapaTC === i && !(et && et.contains(at))) pr.focus({ preventScroll: true }); }, 300); }
}
function erroTC(m, k) {
  const i = k ? FICHA.findIndex(s => s.campos.some(c => c.k === k)) : -1; if (i >= 0 && i !== etapaTC) irEtapaTC(i, true);
  const e = $('#tcErro'); e.textContent = m; e.hidden = false;
  if (k === 'arquivo' || k === 'consentimento') { const c = $('#tc-' + k); if (c) c.focus(); } else if (k) irAoCampo('tc', k);
}
const TIPOS_CV = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
function tipoCV(f) {
  if (TIPOS_CV.includes(f.type)) return f.type;
  const e = (f.name.split('.').pop() || '').toLowerCase();
  return { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[e] || '';
}
async function enviarCandidatura() {
  const v = lerFicha('tc'), m = problemaFicha('tc', v, null, true); if (m) return erroTC(m[0], m[1]);
  const { base, ficha } = montarFicha('tc', v), arq = $('#tc-arquivo').files[0];
  if (!arq) return erroTC('Anexe o seu currículo.', 'arquivo');
  const tipo = tipoCV(arq); if (!tipo) return erroTC('Envie o currículo em PDF, Word (DOC ou DOCX) ou foto (JPG ou PNG).', 'arquivo');
  if (arq.size > 10 * 1024 * 1024) return erroTC('O arquivo passa de 10 MB. Envie um arquivo menor.', 'arquivo');
  if (!$('#tc-consentimento').checked) return erroTC('Marque a autorização para o uso dos dados no processo seletivo.', 'consentimento');
  $('#tcErro').hidden = true; const bt = $('#tcEnviar'); bt.disabled = true; bt.textContent = 'Enviando…';
  try {
    const r = await SB.rpc('enviar_candidatura', { p: { ...base, ficha, consentimento: true } });
    const caminho = `curriculos/${r.chave}/${uid()}-${nomeSeguro(arq.name)}`;
    await SB.enviar('rh', caminho, arq, tipo);
    await SB.rpc('anexar_curriculo', { p_id: r.id, p_chave: r.chave, p_caminho: caminho, p_nome: arq.name, p_mime: tipo });
    try { sessionStorage.removeItem(RASCUNHO_TC); } catch (e) { }
    $('#tcForm').hidden = true; const ok = $('#tcOk'); ok.hidden = false;
    ok.innerHTML = `<h3>Currículo enviado. Obrigado, ${esc(base.nome.split(' ')[0])}!</h3><p>O RH da JCN Gourmet vai analisar os seus dados e entra em contato pelo WhatsApp ou pelo e-mail ${esc(base.email)}.</p>`;
    ok.scrollIntoView({ block: 'center' });
  } catch (e) { erroTC(msgErro(e)); } finally { bt.disabled = false; bt.textContent = 'Enviar currículo'; }
}

/* ---------- avisos: currículo novo e reunião chegando ---------- */
let rhConhecidos = null;
const notifOk = () => 'Notification' in window && Notification.permission === 'granted';
function notificar(titulo, corpo) { toast(titulo + (corpo ? ': ' + corpo : '')); if (notifOk()) { try { new Notification(titulo, { body: corpo || '', tag: titulo + corpo }); } catch (e) { } } }
function avisosRH() {
  const u = typeof eu === 'function' ? eu() : null; if (!u || !(ehRH(u.papel) || u.papel === 'admin')) return;
  const ids = new Set(rh().cands.map(c => c.id));
  if (rhConhecidos) rh().cands.filter(c => !rhConhecidos.has(c.id)).forEach(c => notificar('Novo currículo recebido', `${c.nome} · ${c.area}`));
  rhConhecidos = ids;
  const agora = Date.now(); let lidos = {}; try { lidos = JSON.parse(localStorage.getItem('jcn-avisos-reuniao')) || {}; } catch (e) { }
  proximas().forEach(r => {
    const falta = (new Date(r.inicio).getTime() - agora) / 60000, c = candDe(r.candidatura_id) || {};
    [[60, '1 hora'], [15, '15 minutos']].forEach(([m, t]) => {
      const k = r.id + ':' + m; if (falta <= m && falta > -5 && !lidos[k]) { lidos[k] = 1; notificar(`Reunião em ${falta < 1 ? 'instantes' : 'até ' + t}`, `${c.nome || 'Candidato'} às ${new Date(r.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`); }
    });
  });
  try { localStorage.setItem('jcn-avisos-reuniao', JSON.stringify(lidos)); } catch (e) { }
}
setInterval(() => { if (!document.hidden) avisosRH(); }, 60000);
function painelAvisos() {
  const hoje = hojeISO(), amanha = somaDias(hoje, 1), prox = proximas().filter(r => diaLocal(r.inicio) <= amanha), nv = naoVistos().length;
  const sem = 'Notification' in window && Notification.permission === 'default';
  if (!prox.length && !nv && !sem) return '';
  return `<div class="avisos" role="status">
    ${nv ? `<p><b>${nv} ${nv === 1 ? 'currículo novo' : 'currículos novos'}</b> esperando a primeira leitura. <button class="linkbtn" data-act="rh-novos">Ver agora</button></p>` : ''}
    ${prox.map(r => { const c = candDe(r.candidatura_id) || {}; return `<p><b>Reunião ${diaLocal(r.inicio) === hoje ? 'hoje' : 'amanhã'} às ${new Date(r.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b> com ${esc(c.nome || '')}
      ${r.link ? ` · <a href="${esc(r.link)}" target="_blank" rel="noopener">Entrar na reunião</a>` : ''} · <button class="linkbtn" data-act="abrir-cand" data-id="${esc(r.candidatura_id)}">Abrir</button></p>`; }).join('')}
    ${sem ? `<p class="note">Quer ser avisado mesmo com o site em outra aba? <button class="linkbtn" data-act="rh-notif">Ativar avisos no navegador</button></p>` : ''}</div>`;
}

/* ---------- tela: Currículos ---------- */
function filtrarCands() {
  const f = ui.rhF || (ui.rhF = { busca: '', status: '', area: '', uf: '', per: '', novos: false }), q = f.busca.trim().toLowerCase(), qd = soDig(f.busca);
  const lim = f.per ? somaDias(hojeISO(), -(+f.per) + 1) : '';
  return rh().cands.filter(c => (!f.status || c.status === f.status) && (!f.area || c.area === f.area) && (!f.uf || c.uf === f.uf) && (!f.novos || !c.visto_em) && (!lim || diaLocal(c.criado_em) >= lim)
    && (!q || [c.nome, c.email, c.cidade, c.cargo, c.experiencia, c.mensagem].join(' ').toLowerCase().includes(q) || (qd.length >= 4 && ((c.telefone || '').includes(qd) || ((c.ficha || {}).cpf || '').includes(qd)))));
}
const estrelas = n => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';
function vRH(u) {
  const f = ui.rhF || (ui.rhF = { busca: '', status: '', area: '', uf: '', per: '', novos: false }), lista = filtrarCands(), todos = rh().cands;
  const areas = [...new Set(todos.map(c => c.area))].sort(), ufs = [...new Set(todos.map(c => c.uf).filter(Boolean))].sort();
  const sel = (k, rot, ops) => `<select class="inp" style="width:auto" data-chg="rh-f" data-k="${k}" aria-label="${rot}"><option value="">${rot}</option>${ops.map(([v, t]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const conta = k => todos.filter(c => c.status === k).length;
  return `<h1>Currículos</h1><p class="sub">Candidaturas do "Trabalhe conosco" do site e as fotos de currículo mandadas no grupo do RH no Telegram. Abra para ler, ver o currículo, avaliar e agendar a entrevista.</p>
  ${avisoRH()}${painelAvisos()}
  <div class="tiles">${[['novo', 'Novos'], ['em_analise', 'Em análise'], ['entrevista', 'Entrevista'], ['aprovado', 'Aprovados'], ['banco_talentos', 'Banco de talentos']].map(([k, t]) =>
    `<button class="tile tile-bt${f.status === k ? ' on' : ''}" data-act="rh-st" data-k="${k}"><span class="t-rot">${t}</span><b class="t-val">${conta(k)}</b></button>`).join('')}</div>
  <div class="bar"><input class="inp" style="width:min(18rem,100%)" type="search" id="rhBusca" placeholder="Buscar nome, cidade, cargo, telefone ou CPF" value="${esc(f.busca)}" aria-label="Buscar">
    ${sel('status', 'Todas as situações', Object.entries(ST_CAND).map(([k, [t]]) => [k, t]))}${sel('area', 'Todas as áreas', areas.map(a => [a, a]))}${sel('uf', 'Todos os estados', ufs.map(a => [a, a]))}
    ${sel('per', 'Desde o início', [['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']])}
    <label class="check"><input type="checkbox" data-chg="rh-f" data-k="novos" ${f.novos ? 'checked' : ''}> Só os não lidos</label>
    <button class="btn ghost sm" data-act="rh-csv">Baixar planilha</button></div>
  <p class="note">${lista.length} de ${todos.length} ${todos.length === 1 ? 'candidatura' : 'candidaturas'}</p>
  ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Recebido</th><th>Candidato</th><th>Área</th><th>Cidade</th><th>Situação</th><th>Avaliação</th><th>Reunião</th></tr></thead><tbody>
    ${lista.map(c => { const r = reunioesDe(c.id).filter(x => x.status === 'agendada' && new Date(x.inicio) > Date.now() - 3600000)[0]; return `<tr class="${c.visto_em ? '' : 'nao-lido'}">
      <td>${dataBR(diaLocal(c.criado_em))}</td>
      <td><button class="linkbtn" data-act="abrir-cand" data-id="${esc(c.id)}"><b>${esc(c.nome)}</b></button> ${c.visto_em ? '' : '<span class="chip info">Novo</span>'}${c.origem === 'telegram' ? ' <span class="chip tg">Telegram</span>' : ''}<div class="note">${[telFmt(c.telefone || ''), c.email].filter(Boolean).map(esc).join(' · ') || 'Dados a completar'}</div></td>
      <td>${esc(c.area)}${c.cargo ? `<div class="note">${esc(c.cargo)}</div>` : ''}</td><td>${c.cidade ? esc(c.cidade + (c.uf ? '/' + c.uf : '')) : '—'}</td>
      <td>${chip(ST_CAND[c.status])}</td><td class="estr">${estrelas(c.avaliacao)}</td><td>${r ? dtHora(r.inicio) : '—'}</td></tr>`; }).join('')}</tbody></table></div>`
    : `<div class="panel"><p class="note" style="margin:0">${todos.length ? 'Nenhuma candidatura com esses filtros.' : 'Nenhum currículo recebido ainda. Eles chegam pelo formulário "Trabalhe conosco" da página inicial e pelas fotos mandadas no grupo do RH no Telegram.'}</p></div>`}`;
}
function dCand(dr, u) {
  const c = candDe(dr.id); if (!c) return '';
  const d = dr.draft || (dr.draft = { status: c.status, avaliacao: c.avaliacao || 0, notas: c.notas || '' }), fv = dr.fdraft || valoresDaCand(c);
  const arqs = arquivosDe(c), falta = !c.telefone || !c.cidade || c.area === 'A definir', nf = Object.keys(c.ficha || {}).length;
  const rs = reunioesDe(c.id).slice().sort((a, b) => a.inicio < b.inicio ? 1 : -1), ag = dr.ag || (dr.ag = { data: somaDias(hojeISO(), 1), hora: '09:00', duracao: 30, link: '', obs: '' });
  return `<h2 class="dt">${esc(c.nome)}</h2><p class="note">${chip(ST_CAND[c.status])} · recebido em ${dtHora(c.criado_em)}${c.origem === 'telegram' ? ' · <span class="chip tg">pelo Telegram</span>' : ''}</p>
  ${fichaParaLer(c)}
  ${c.experiencia ? `<h3>Experiência</h3><p class="pre">${esc(c.experiencia)}</p>` : ''}${c.mensagem ? `<h3>Mensagem</h3><p class="pre">${esc(c.mensagem)}</p>` : ''}
  <h3>Currículo${arqs.length > 1 ? ` <span class="note">(${arqs.length} páginas)</span>` : ''}</h3>${arqs.length ? `<ul class="arqs">${arqs.map((a, i) => `<li><span>${arqs.length > 1 ? `<b>Página ${i + 1}</b> · ` : ''}<span class="note">${esc(a.nome || 'currículo')}</span></span><button class="btn sm" data-act="cv-ver" data-id="${esc(c.id)}" data-i="${i}">Ver</button><button class="btn ghost sm" data-act="cv-baixar" data-id="${esc(c.id)}" data-i="${i}">Baixar</button></li>`).join('')}</ul>` : '<p class="note">O candidato não chegou a enviar o arquivo.</p>'}
  <details class="panel cand-dados" ${falta || dr.fdraft ? 'open' : ''}><summary><b>${falta ? 'Completar a ficha do candidato' : 'Completar ou corrigir a ficha'}</b>${falta ? ' <span class="chip warn">faltam dados</span>' : nf ? '' : ' <span class="note">(sem documentos ainda)</span>'}</summary>
    ${FICHA.map(sc => `<h4 class="cand-sec">${esc(sc.tit)}</h4>${camposDaEtapa(sc, 'rf', fv)}`).join('')}
    <p class="err" role="alert" ${dr.erroDados ? '' : 'hidden'}>${esc(dr.erroDados || '')}</p>
    <div class="bar" style="margin-top:10px"><button class="btn" data-act="cand-dados">Salvar ficha</button></div></details>
  <h3>Avaliação do RH</h3>
  <div class="grid2"><label class="field"><span>Situação</span><select data-cd="status">${Object.entries(ST_CAND).map(([k, [t]]) => `<option value="${k}" ${k === d.status ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <div class="field"><span>Nota</span><div class="estrelas" role="radiogroup" aria-label="Nota de 1 a 5">${[1, 2, 3, 4, 5].map(n => `<button role="radio" aria-checked="${d.avaliacao === n}" data-act="cd-nota" data-n="${n}" aria-label="${n} de 5">${n <= d.avaliacao ? '★' : '☆'}</button>`).join('')}</div></div></div>
  <label class="field" style="margin-top:10px"><span>Anotações</span><textarea data-cd="notas" rows="3">${esc(d.notas)}</textarea></label>
  <p class="err" role="alert" ${dr.erro ? '' : 'hidden'}>${esc(dr.erro || '')}</p>
  <div class="bar" style="margin-top:10px"><button class="btn" data-act="cand-salvar">Salvar avaliação</button></div>
  <h3>Reuniões</h3>
  ${rs.length ? `<ul class="reu-lista">${rs.map(r => linhaReu(r, false)).join('')}</ul>` : '<p class="note">Nenhuma reunião ainda.</p>'}
  <div class="panel agendar"><h4>Agendar reunião online (Google Meet)</h4>
    <div class="grid-ag"><label class="field"><span>Dia</span><input type="date" data-ag="data" value="${esc(ag.data)}" min="${hojeISO()}"></label><label class="field"><span>Hora</span><input type="time" data-ag="hora" value="${esc(ag.hora)}"></label>
      <label class="field"><span>Duração</span><select data-ag="duracao">${[15, 30, 45, 60, 90].map(m => `<option value="${m}" ${+ag.duracao === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></label></div>
    <label class="field" style="margin-top:8px"><span>Link da reunião (opcional, cole depois de criar no Google Agenda)</span><input data-ag="link" value="${esc(ag.link)}" placeholder="https://meet.google.com/..."></label>
    <label class="field" style="margin-top:8px"><span>Observações</span><input data-ag="obs" value="${esc(ag.obs)}" maxlength="400"></label>
    <div class="bar" style="margin-top:10px"><button class="btn" data-act="reu-agendar">Agendar e abrir o Google Agenda</button></div>
    <p class="note" style="margin:6px 0 0">O Google Agenda abre com o candidato já convidado. Clique em <b>"Adicionar videoconferência do Google Meet"</b> (se ainda não estiver) e em <b>Salvar</b>: o Google envia o convite com o link para o e-mail do candidato.</p></div>
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button>${ehRHAdm(u) ? `<button class="btn danger" data-act="cand-apagar" data-confirm="Confirmar: apagar candidatura">Apagar candidatura</button>` : ''}</div>`;
}
function linkAgenda(r, c) {
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), ini = new Date(r.inicio), fim = new Date(ini.getTime() + r.duracao_min * 60000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: `Entrevista JCN Gourmet: ${c.nome}`, dates: `${z(ini)}/${z(fim)}`, ctz: 'America/Sao_Paulo',
    details: `Entrevista online com ${c.nome} (${c.area}${c.cargo ? ', ' + c.cargo : ''}).\nWhatsApp: ${telFmt(c.telefone)}${r.observacoes ? '\n' + r.observacoes : ''}`, add: c.email, vcon: 'meet' });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
function linhaReu(r, comNome) {
  const c = candDe(r.candidatura_id) || {}, futura = r.status === 'agendada';
  return `<li class="reu"><div><b>${dtHora(r.inicio)}</b> · ${r.duracao_min} min ${chip(ST_REU[r.status])}${comNome ? ` · <button class="linkbtn" data-act="abrir-cand" data-id="${esc(r.candidatura_id)}"><b>${esc(c.nome || '')}</b></button> <span class="note">${esc(c.area || '')}</span>` : ''}
    ${r.observacoes ? `<div class="note">${esc(r.observacoes)}</div>` : ''}</div>
    <div class="bar" style="margin:6px 0 0">${r.link ? `<a class="btn sm" href="${esc(r.link)}" target="_blank" rel="noopener">Entrar na reunião</a>` : ''}
      <a class="btn ghost sm" href="${esc(linkAgenda(r, c))}" target="_blank" rel="noopener">Abrir no Google Agenda</a>
      ${futura ? `<button class="btn ghost sm" data-act="reu-link" data-id="${esc(r.id)}">${r.link ? 'Trocar link' : 'Colar link do Meet'}</button>
        <button class="btn ghost sm" data-act="reu-st" data-id="${esc(r.id)}" data-s="realizada">Realizada</button><button class="btn ghost sm" data-act="reu-st" data-id="${esc(r.id)}" data-s="faltou">Não compareceu</button>
        <button class="btn ghost sm" data-act="reu-st" data-id="${esc(r.id)}" data-s="cancelada" data-confirm="Confirmar cancelamento">Cancelar</button>` : ''}</div>
    ${ui.reuLink === r.id ? `<div class="bar" style="margin:6px 0 0"><input class="inp" style="flex:1 1 220px;width:auto" id="reuLinkIn" placeholder="https://meet.google.com/..." value="${esc(r.link || '')}"><button class="btn sm" data-act="reu-link-salvar" data-id="${esc(r.id)}">Salvar link</button></div>` : ''}</li>`;
}

/* ---------- tela: Reuniões ---------- */
function vAgendaRH(u) {
  const hoje = hojeISO(), em7 = somaDias(hoje, 7), ps = proximas();
  const grupos = [['Hoje', ps.filter(r => diaLocal(r.inicio) === hoje)], ['Próximos 7 dias', ps.filter(r => diaLocal(r.inicio) > hoje && diaLocal(r.inicio) <= em7)], ['Mais adiante', ps.filter(r => diaLocal(r.inicio) > em7)]];
  const ant = rh().reunioes.filter(r => !ps.includes(r) && diaLocal(r.inicio) >= somaDias(hoje, -60)).sort((a, b) => a.inicio < b.inicio ? 1 : -1);
  return `<h1>Reuniões</h1><p class="sub">Entrevistas agendadas com os candidatos. O site avisa uma hora e quinze minutos antes de cada reunião.</p>
  ${avisoRH()}${painelAvisos()}
  ${grupos.map(([t, l]) => `<div class="panel"><h2>${t} (${l.length})</h2>${l.length ? `<ul class="reu-lista">${l.map(r => linhaReu(r, true)).join('')}</ul>` : '<p class="note" style="margin:0">Nenhuma reunião.</p>'}</div>`).join('')}
  <div class="panel"><h2>Anteriores (últimos 60 dias)</h2>${ant.length ? `<ul class="reu-lista">${ant.map(r => linhaReu(r, true)).join('')}</ul>` : '<p class="note" style="margin:0">Nenhuma reunião anterior.</p>'}</div>`;
}

/* ---------- tela: Equipe do RH (RH administrativo) ---------- */
function vEquipeRH(u) {
  if (!ehRHAdm(u)) return '';
  const eq = state.usuarios.filter(x => ehRH(x.papel)), ac = ui.acesso;
  return `<h1>Equipe do RH</h1><p class="sub">Logins do setor de RH. O RH administrativo controla tudo do RH; o RH assistente vê os currículos, avalia e agenda reuniões, sem apagar nada.</p>
  ${ac && ac.rh ? `<div class="acesso" role="status"><h2>Acesso de ${esc(ac.nome)}</h2><p>Envie estes dados para a pessoa e peça que ela troque a senha no primeiro acesso.</p>
    <dl id="acDados"><div><dt>E-mail</dt><dd>${esc(ac.login)}</dd></div><div><dt>Senha</dt><dd>${esc(ac.senha)}</dd></div></dl></div>` : ''}
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Ativo</th><th></th></tr></thead><tbody>
    ${eq.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td>${esc(x.email)}</td><td>${chip([PAPEIS[x.papel], x.papel === 'rh_admin' ? 'info' : ''])}</td>
      <td><input type="checkbox" class="toggle" data-act="toggle-user" data-id="${esc(x.id)}" ${x.ativo ? 'checked' : ''} ${x.id === sessao ? 'disabled' : ''} aria-label="${esc(x.nome)} ativo"></td>
      <td>${x.id === sessao ? '' : `<button class="btn ghost sm" data-act="rhq-senha" data-id="${esc(x.id)}" data-confirm="Confirmar: gerar senha nova">Nova senha</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="panel" style="margin-top:16px"><h2>Novo login do RH</h2><div class="grid2">
    <label class="field"><span>Nome</span><input id="rqNome"></label><label class="field"><span>E-mail</span><input id="rqEmail" type="email"></label>
    <label class="field"><span>Perfil</span><select id="rqPapel"><option value="rh_assistente">RH assistente</option><option value="rh_admin">RH administrativo</option></select></label>
    <label class="field"><span>Senha inicial</span><input id="rqSenha" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="mínimo de 8 caracteres"></label></div>
    <div class="bar" style="margin:10px 0 0"><button class="btn sm" data-act="rhq-add">Criar login</button><button class="btn ghost sm" data-act="rhq-gerar">Gerar senha</button></div></div>`;
}

/* ---------- ações ---------- */
const AREAS_RH = ['Produção / fábrica', 'Solda e serralheria', 'Pintura', 'Montagem', 'Expedição e logística', 'Motorista', 'Vendas', 'Administrativo / financeiro', 'Marketing', 'Outra área'];
function arquivosDe(c) { const a = Array.isArray(c.arquivos) ? c.arquivos.filter(x => x && x.caminho) : []; return a.length ? a : c.curriculo_caminho ? [{ caminho: c.curriculo_caminho, nome: c.curriculo_nome, mime: c.curriculo_mime }] : []; }
async function arquivoCV(c, i) { const a = arquivosDe(c)[+i || 0]; if (!a) throw new Error('sem arquivo'); const blob = await SB.baixar('rh', a.caminho); return { a, blob, url: URL.createObjectURL(blob) }; }
Object.assign(acts, {
  'rh-novos': () => { ui.rhF = { ...(ui.rhF || {}), busca: '', status: '', area: '', uf: '', per: '', novos: true }; ui.view = 'rh'; renderApp(); },
  'rh-st': e => { ui.rhF.status = ui.rhF.status === e.dataset.k ? '' : e.dataset.k; renderApp(); },
  'rh-notif': async () => { if ('Notification' in window) { await Notification.requestPermission(); renderApp(); if (notifOk()) toast('Avisos do navegador ligados.'); } },
  'abrir-cand': async e => {
    const c = candDe(e.dataset.id); if (!c) return;
    ui.drawer = { tipo: 'cand', id: c.id }; renderDrawer();
    if (!c.visto_em) { try { await API.salvarCand(c.id, { visto_em: new Date().toISOString(), visto_por: SB.id, status: c.status === 'novo' ? 'em_analise' : c.status }); if (ui.drawer && ui.drawer.id === c.id) ui.drawer.draft = null; refresh(); } catch (x) { } }
  },
  'cd-nota': e => { const d = ui.drawer && ui.drawer.draft; if (!d) return; d.avaliacao = d.avaliacao === +e.dataset.n ? 0 : +e.dataset.n; renderDrawer(); },
  'cand-salvar': async () => {
    const dr = ui.drawer, d = dr.draft;
    try { await API.salvarCand(dr.id, { status: d.status, avaliacao: d.avaliacao || null, notas: d.notas.trim() || null }); dr.draft = null; dr.erro = ''; refresh(); toast('Avaliação salva.'); }
    catch (err) { dr.erro = msgErro(err); renderDrawer(); }
  },
  'cand-dados': async () => {
    const dr = ui.drawer, v = lerFicha('rf'), m = problemaFicha('rf', v, null, false);
    if (m) { dr.fdraft = v; dr.erroDados = m[0]; renderDrawer(); return irAoCampo('rf', m[1]); }
    const { base, ficha } = montarFicha('rf', v), nul = x => (x === '' ? null : x);
    const campos = { ficha }; BASE_K.forEach(k => { campos[k] = nul(base[k]); });
    campos.nome = base.nome; campos.area = base.area || 'A definir'; if (campos.email) campos.email = campos.email.toLowerCase();
    try { await API.salvarCand(dr.id, campos); dr.fdraft = null; dr.erroDados = ''; refresh(); toast('Ficha do candidato salva.'); }
    catch (err) { dr.fdraft = v; dr.erroDados = msgErro(err); renderDrawer(); }
  },
  'cand-apagar': async () => { const c = candDe(ui.drawer.id); if (!c || !ehRHAdm(eu())) return; try { await API.apagarCand(c); fecharDrawer(); renderApp(); toast('Candidatura apagada.'); } catch (err) { toast(msgErro(err)); } },
  'cv-ver': async e => {
    const c = candDe(e.dataset.id); if (!c) return;
    try { const f = await arquivoCV(c, e.dataset.i), m = f.a.mime || f.blob.type, v = document.createElement('div'); v.className = 'viewer';
      v.innerHTML = `<div class="vb"><b>${esc(f.a.nome || 'Currículo')}</b><button class="btn sm" data-act="cv-baixar" data-id="${esc(c.id)}" data-i="${+e.dataset.i || 0}">Baixar</button><button class="btn ghost sm" style="color:#fff;border-color:#fff" data-act="fechar-viewer">Fechar</button></div>
        <div class="vc">${m.startsWith('image/') ? `<img src="${f.url}" alt="Currículo">` : m === 'application/pdf' ? `<iframe title="Currículo" src="${f.url}"></iframe>` : '<p style="padding:20px">Este arquivo é do Word: use o botão Baixar para abrir no computador.</p>'}</div>`;
      document.body.appendChild(v); } catch (x) { toast('Não foi possível abrir o currículo agora.'); }
  },
  'cv-baixar': async e => { const c = candDe(e.dataset.id); if (!c) return; try { const f = await arquivoCV(c, e.dataset.i), a = document.createElement('a'); a.href = f.url; a.download = f.a.nome || 'curriculo'; document.body.appendChild(a); a.click(); a.remove(); } catch (x) { toast('Não foi possível baixar o currículo agora.'); } },
  'reu-agendar': async () => {
    const dr = ui.drawer, c = candDe(dr.id), ag = dr.ag; if (!c) return;
    const ini = new Date(`${ag.data}T${ag.hora || '09:00'}:00`);
    if (!ag.data || isNaN(ini) || ini.getTime() < Date.now() - 60000) { dr.erro = 'Escolha um dia e uma hora que ainda não passaram.'; return renderDrawer(); }
    const janela = window.open('about:blank', '_blank');                 // abre já no clique (o navegador bloqueia janela aberta depois)
    try {
      const r = await API.agendarReuniao({ candidatura_id: c.id, inicio: ini.toISOString(), duracao_min: +ag.duracao || 30, link: ag.link.trim() || null, observacoes: ag.obs.trim() || null }, c);
      const url = linkAgenda(r, c); if (janela) janela.location.href = url; else window.open(url, '_blank');
      dr.ag = null; dr.draft = null; dr.erro = ''; refresh(); toast('Reunião agendada. Termine o convite no Google Agenda.');
    } catch (err) { if (janela) janela.close(); dr.erro = msgErro(err); renderDrawer(); }
  },
  'reu-st': async e => { try { await API.salvarReuniao(e.dataset.id, { status: e.dataset.s }); refresh(); toast('Reunião marcada como ' + ST_REU[e.dataset.s][0].toLowerCase() + '.'); } catch (err) { toast(msgErro(err)); } },
  'reu-link': e => { ui.reuLink = ui.reuLink === e.dataset.id ? null : e.dataset.id; refresh(); const i = $('#reuLinkIn'); if (i) i.focus(); },
  'reu-link-salvar': async e => { const v = ($('#reuLinkIn') || {}).value || ''; if (v && !/^https:\/\//.test(v.trim())) return toast('Cole o link completo, começando com https://'); try { await API.salvarReuniao(e.dataset.id, { link: v.trim() || null }); ui.reuLink = null; refresh(); toast('Link salvo.'); } catch (err) { toast(msgErro(err)); } },
  'rh-csv': () => baixarCSV('curriculos.csv', [['Recebido', 'Origem', 'Nome', 'E-mail', 'WhatsApp', 'Nascimento', 'Cidade', 'UF', 'Área', 'Cargo', 'Escolaridade', 'Disponibilidade', 'Pretensão', ...FICHA_CSV.map(c => c.ler || c.rot), 'Situação', 'Nota', 'Anotações']]
    .concat(filtrarCands().map(c => [dataBR(diaLocal(c.criado_em)), c.origem === 'telegram' ? 'Telegram' : 'Site', c.nome, c.email, telFmt(c.telefone || ''), c.nascimento ? dataBR(c.nascimento) : '', c.cidade, c.uf, c.area, c.cargo, c.escolaridade, c.disponibilidade, c.pretensao,
      ...FICHA_CSV.map(x => csvFicha(x, c.ficha)), ST_CAND[c.status][0], c.avaliacao || '', c.notas]))),
  'rhq-gerar': () => { $('#rqSenha').value = gerarSenha(); },
  'rhq-add': async () => {
    if (!ehRHAdm(eu()) || ui.ocupado) return;
    const nome = $('#rqNome').value.trim(), email = $('#rqEmail').value.trim().toLowerCase(), papel = $('#rqPapel').value, senha = $('#rqSenha').value;
    if (!nome || !/^\S+@\S+\.\S+$/.test(email)) return toast('Informe nome e um e-mail válido.');
    if (senha.length < 8) return toast('Defina uma senha inicial com pelo menos 8 caracteres, ou use "Gerar senha".');
    ui.ocupado = true;
    try { await API.criarAcesso({ email, senha, perfil: { nome, papel, empresa: 'JCN Gourmet', ativo: true } }); ui.acesso = { nome, login: email, senha, rh: true }; renderApp(); toast('Login do RH criado.'); }
    catch (err) { toast(msgErro(err)); } finally { ui.ocupado = false; }
  },
  'rhq-senha': async e => {
    const x = user(e.dataset.id), s = gerarSenha(); if (!ehRHAdm(eu()) || !x) return;
    try { await API.definirSenha(x.id, s); ui.acesso = { nome: x.nome, login: x.email, senha: s, rh: true }; renderApp(); scrollTo(0, 0); toast('Senha nova definida.'); } catch (err) { toast(msgErro(err)); }
  }
});
Object.assign(chgs, { 'rh-f': e => { ui.rhF[e.dataset.k] = e.type === 'checkbox' ? e.checked : e.value; renderApp(); } });
let tRh = null;
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'rhBusca') { ui.rhF.busca = t.value; clearTimeout(tRh); tRh = setTimeout(() => { renderApp(); const i = $('#rhBusca'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); }
  if (t.dataset && t.dataset.cd && ui.drawer && ui.drawer.draft) ui.drawer.draft[t.dataset.cd] = t.value; if (/^rf-/.test(t.id || '') && ui.drawer && ui.drawer.tipo === 'cand') ui.drawer.fdraft = lerFicha('rf');
  if (t.dataset && t.dataset.ag && ui.drawer && ui.drawer.ag) ui.drawer.ag[t.dataset.ag] = t.value;
});
document.addEventListener('change', ev => { const t = ev.target; if (/^rf-/.test(t.id || t.name || '') && ui.drawer && ui.drawer.tipo === 'cand') ui.drawer.fdraft = lerFicha('rf'); if (t.dataset && t.dataset.cd && ui.drawer && ui.drawer.draft) ui.drawer.draft[t.dataset.cd] = t.value; if (t.dataset && t.dataset.ag && ui.drawer && ui.drawer.ag) ui.drawer.ag[t.dataset.ag] = t.value; });
