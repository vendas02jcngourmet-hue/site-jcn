/* ---------- Avisos no Telegram ----------
   O banco manda as mensagens pelo robô da JCN (vendas, financeiro, RH, retornos de ligação e resumo das 8h).
   Aqui a administração guarda o código do robô, liga grupos e pessoas e escolhe o que cada um recebe.
   Cada pessoa da equipe também pode ligar o próprio Telegram para os avisos pessoais. */
const SETORES_TG = { vendas: 'Vendas', financeiro: 'Financeiro', rh: 'RH', tudo: 'Tudo' };
const tg = () => state.tg || { destinos: [], status: null };
async function carregarTG() {
  const p = papelAtual(); if (!p || p === 'ecommerce') { state.tg = { destinos: [], status: null }; return; }
  try {
    const [d, st] = await Promise.all([selTudo('tg_destinos', 'select=*&order=criado_em.asc,id.asc'), p === 'admin' ? SB.rpc('tg_status') : null]);
    state.tg = { destinos: d, status: st };
  } catch (e) { if (e.rede) throw e; state.tg = { destinos: [], status: null, indisponivel: true }; }
}
const meuTG = u => tg().destinos.find(d => d.perfil_id === u.id && d.ativo);
function blocoCodigo(c) {
  return c ? `<div class="tg-cod" role="status"><p>No Telegram, abra o robô da JCN${c.grupo ? ' dentro do grupo' : ''} e envie esta mensagem:</p>
    <p class="tg-cod-txt"><code>/start ${esc(c.codigo)}</code> <button class="btn ghost sm" data-act="tg-copiar" data-t="/start ${esc(c.codigo)}">Copiar</button></p>
    <p class="note">Em até 1 minuto o robô responde "Pronto!" e a ligação aparece aqui. O código vale por 2 dias.</p></div>` : '';
}
function vAvisos(u) {
  if (u.papel !== 'admin') return '';
  const st = tg().status || {}, ds = tg().destinos, f = ui.tgNovo || (ui.tgNovo = { nome: '', setores: ['vendas'], perfil: '', grupo: true });
  const pessoas = state.usuarios.filter(x => x.papel !== 'ecommerce' && x.ativo);
  if (tg().indisponivel) return `<h1>Avisos no Telegram</h1><div class="panel"><p style="margin:0"><b>Falta um passo no banco.</b> Rode o arquivo <b>atualizacao-5.sql</b> no Supabase (SQL Editor, colar tudo, Run).</p></div>`;
  return `<h1>Avisos no Telegram</h1><p class="sub">O site manda avisos pelo robô da JCN no Telegram: vendas, financeiro, RH, retornos de ligação na hora marcada e um resumo todo dia às 8h.</p>
  <div class="panel"><h2>1. Robô da JCN ${st.token ? chip(['Ligado', 'ok']) : chip(['Falta o código', 'warn'])}</h2>
    ${st.token ? `<p class="note" style="margin:0 0 8px">Enviados nas últimas 24 horas: ${st.enviados_24h || 0}${st.falhas_24h ? ` · <b class="bad-t">falhas: ${st.falhas_24h}</b>` : ''} · na fila: ${st.pendentes || 0}${st.cron ? '' : ' · <b class="bad-t">o relógio de envio não está ligado: rode de novo o atualizacao-5.sql</b>'}</p>
      ${st.ultimo_erro ? `<p class="note">Último erro do Telegram: ${esc(String(st.ultimo_erro).slice(0, 200))}</p>` : ''}` : `<ol class="tg-passos"><li>No Telegram, procure <b>@BotFather</b> e envie <code>/newbot</code>.</li><li>Dê um nome (ex.: <b>JCN Gourmet Avisos</b>) e um usuário terminado em <b>bot</b> (ex.: <b>jcngourmet_avisos_bot</b>).</li><li>O BotFather responde com um código parecido com <code>123456789:ABCdef...</code>. Cole aqui embaixo.</li></ol>`}
    <div class="bar" style="margin:8px 0 0"><input class="inp" style="flex:1 1 280px;width:auto" id="tgToken" type="password" autocomplete="off" placeholder="${st.token ? 'Trocar o código do robô' : 'Código do robô (do BotFather)'}"><button class="btn sm" data-act="tg-token">${st.token ? 'Trocar código' : 'Salvar código'}</button></div>
    <p class="note" style="margin:6px 0 0">O código fica guardado no cofre do Supabase e não aparece no site depois de salvo.</p></div>
  <div class="panel"><h2>2. Ligar um grupo ou uma pessoa</h2>
    <p class="note" style="margin:0 0 10px">Dica: crie no Telegram um grupo por setor (ex.: "JCN Vendas", "JCN Financeiro", "JCN RH"), adicione o robô ao grupo e ligue o grupo aqui. Todos do grupo recebem.</p>
    <div class="grid2"><label class="field"><span>Nome (para você reconhecer)</span><input id="tgNome" value="${esc(f.nome)}" placeholder="Ex.: Grupo Financeiro"></label>
      <label class="field"><span>É de uma pessoa da equipe? (para os avisos pessoais dela)</span><select id="tgPerfil"><option value="">Não, é um grupo</option>${pessoas.map(x => `<option value="${esc(x.id)}" ${x.id === f.perfil ? 'selected' : ''}>${esc(x.nome)} (${esc(PAPEIS[x.papel])})</option>`).join('')}</select></label></div>
    <fieldset class="res"><legend>O que recebe</legend>${Object.entries(SETORES_TG).map(([k, t]) => `<label class="opt-res"><input type="checkbox" class="tgSet" value="${k}" ${f.setores.includes(k) ? 'checked' : ''}> ${t}</label>`).join('')}</fieldset>
    <button class="btn sm" data-act="tg-codigo" ${st.token ? '' : 'disabled'}>Gerar código</button>${st.token ? '' : ' <span class="note">Primeiro salve o código do robô.</span>'}
    ${blocoCodigo(ui.tgCod)}</div>
  <div class="panel"><h2>3. Quem recebe (${ds.length})</h2>
    ${ds.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>Tipo</th><th>Recebe</th><th>Avisos pessoais de</th><th>Ativo</th><th></th></tr></thead><tbody>
      ${ds.map(d => `<tr><td><b>${esc(d.nome)}</b></td><td>${d.tipo === 'grupo' ? 'Grupo' : 'Pessoa'}</td>
        <td>${Object.entries(SETORES_TG).map(([k, t]) => `<label class="check tg-ck"><input type="checkbox" data-chg="tg-set" data-id="${esc(d.id)}" data-k="${k}" ${d.setores.includes(k) ? 'checked' : ''}> ${t}</label>`).join('')}</td>
        <td>${d.perfil_id ? esc((user(d.perfil_id) || {}).nome || '—') : '—'}</td>
        <td><input type="checkbox" class="toggle" data-chg="tg-ativo" data-id="${esc(d.id)}" ${d.ativo ? 'checked' : ''} aria-label="${esc(d.nome)} ativo"></td>
        <td><button class="btn ghost sm" data-act="tg-teste" data-id="${esc(d.id)}">Enviar teste</button> <button class="btn danger sm" data-act="tg-rem" data-id="${esc(d.id)}" data-confirm="Confirmar remover">Remover</button></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="note" style="margin:0">Ninguém ligado ainda.</p>'}</div>
  ${painelCvTG(st, ds)}
  <div class="panel"><h2>Quais avisos são enviados</h2><ul class="tg-lista">
    <li><b>Vendas:</b> pedido novo (venda interna, e-commerce e loja do site), pagamento confirmado, pedido enviado, loja que virou cliente.</li>
    <li><b>Financeiro:</b> PIX para conferir, boleto para aprovar e, às 8h, as parcelas que vencem no dia ou estão atrasadas.</li>
    <li><b>RH:</b> currículo novo, reunião em 1 hora e em 15 minutos, e às 8h as reuniões do dia.</li>
    <li><b>Pessoais:</b> o retorno de ligação na hora que o cliente pediu, os retornos do dia às 8h, e o pagamento confirmado ou recusado dos pedidos da pessoa. Quem não ligou o próprio Telegram recebe isso no grupo de Vendas.</li></ul></div>`;
}
// currículos mandados em foto no grupo do RH: o que falta e se a função do Supabase está respondendo
function painelCvTG(st, ds) {
  const temRH = ds.some(d => d.ativo && (d.setores.includes('rh') || d.setores.includes('tudo'))), cv = st.cv, s = cv && cv.status;
  const est = !cv ? ['Ainda não chegou nenhuma foto', ''] : s >= 200 && s < 300 ? ['Funcionando', 'ok'] : s === 404 ? ['Falta criar a função', 'warn'] : s === 401 ? ['Falta desligar a verificação de JWT', 'warn'] : s ? ['A função respondeu com erro ' + s, 'bad'] : ['Esperando a resposta', 'info'];
  return `<div class="panel" id="painelCvTG"><h2>Currículos por foto no grupo do RH ${chip(est)}</h2>
    <p class="note" style="margin:0 0 8px">Foto ou PDF de currículo mandado no grupo do RH vira um currículo no site, com o arquivo guardado. A legenda da foto vira o nome (e o WhatsApp, a cidade e o e-mail, se estiverem escritos). Fotos do mesmo álbum, ou mandadas logo em seguida sem legenda, viram páginas do mesmo currículo.${st.cv_total ? ` Já chegaram ${st.cv_total} por aqui.` : ''}</p>
    ${!temRH ? '<p class="note"><b>Primeiro ligue o grupo do RH</b> no passo 2, marcando "RH".</p>' : ''}
    <ol class="tg-passos"><li>No Telegram, deixe o robô como <b>administrador do grupo do RH</b> (sem isso o Telegram não entrega as fotos para ele).</li>
      <li>No Supabase: <b>Edge Functions → Deploy a new function → Via Editor</b>, nome <code>curriculo-telegram</code>, cole o código do arquivo <b>curriculo-telegram.ts</b> e clique em Deploy.</li>
      <li>Na função criada, abra <b>Details</b> e desligue <b>"Verify JWT"</b> (ou "Enforce JWT Verification"). Quem protege a função é um segredo guardado no cofre do banco.</li></ol>
    ${cv ? `<p class="note" style="margin:6px 0 0">Última foto recebida em ${dtHora(cv.em)}${s && !(s >= 200 && s < 300) && cv.corpo ? ` · resposta: ${esc(String(cv.corpo).slice(0, 120))}` : ''}.</p>` : ''}</div>`;
}
function dMeuTG(dr, u) {
  const m = meuTG(u);
  return `<h2 class="dt">Meus avisos no Telegram</h2>
  ${m ? `<p>${chip(['Ligado', 'ok'])} Os seus avisos pessoais chegam no Telegram (${esc(m.nome)}).</p>` : '<p>Ligue o seu Telegram para receber os seus avisos: o retorno de ligação na hora que o cliente pediu, os retornos do dia às 8h e o pagamento dos seus pedidos.</p>'}
  ${m ? '' : `<button class="btn" data-act="tg-meu-codigo">Gerar meu código</button>${blocoCodigo(dr.cod)}`}
  <div class="foot"><button class="btn ghost" data-act="fechar">Fechar</button></div>`;
}
Object.assign(acts, {
  'tg-token': async () => {
    const v = ($('#tgToken') || {}).value || ''; if (!v.trim()) return toast('Cole o código do robô que o BotFather mandou.');
    try { await API.tgToken(v.trim()); toast('Código do robô salvo.'); renderApp(); } catch (err) { toast(msgErro(err)); }
  },
  'tg-codigo': async () => {
    const nome = $('#tgNome').value.trim(), perfil = $('#tgPerfil').value, setores = $$('.tgSet:checked').map(x => x.value);
    ui.tgNovo = { nome, perfil, setores };
    if (!nome && !perfil) return toast('Dê um nome para reconhecer este grupo.');
    if (!setores.length && !perfil) return toast('Marque o que este grupo recebe.');
    try { const c = await API.tgCodigo(nome || (user(perfil) || {}).nome, setores, perfil || null); ui.tgCod = { codigo: c, grupo: !perfil }; renderApp(); }
    catch (err) { toast(msgErro(err)); }
  },
  'tg-meu-codigo': async () => { const u = eu(); try { const c = await API.tgCodigo(u.nome, [], u.id); ui.drawer.cod = { codigo: c }; renderDrawer(); } catch (err) { toast(msgErro(err)); } },
  'tg-copiar': e => { try { navigator.clipboard.writeText(e.dataset.t); toast('Copiado.'); } catch (x) { toast(e.dataset.t); } },
  'tg-teste': async e => { try { await API.tgTeste(e.dataset.id); toast('Mensagem de teste na fila: chega em até 1 minuto.'); } catch (err) { toast(msgErro(err)); } },
  'tg-rem': async e => { try { await API.tgSalvar(e.dataset.id, null); renderApp(); toast('Removido.'); } catch (err) { toast(msgErro(err)); } },
  'meu-tg': () => { ui.drawer = { tipo: 'meu-tg' }; renderDrawer(); }
});
Object.assign(chgs, {
  'tg-set': async e => { const d = tg().destinos.find(x => x.id === e.dataset.id); if (!d) return; const s = new Set(d.setores); e.checked ? s.add(e.dataset.k) : s.delete(e.dataset.k); try { await API.tgSalvar(d.id, { setores: [...s] }); renderApp(); } catch (err) { toast(msgErro(err)); } },
  'tg-ativo': async e => { try { await API.tgSalvar(e.dataset.id, { ativo: e.checked }); renderApp(); } catch (err) { toast(msgErro(err)); } }
});
