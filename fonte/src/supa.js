/* ---------- Cliente do Supabase (login, banco e arquivos), sem biblioteca externa ----------
   Fala direto com as três portas do projeto: /auth/v1 (login), /rest/v1 (banco) e /storage/v1 (arquivos).
   A chave usada aqui é a pública (publishable): ela só identifica o projeto. Quem decide o que cada pessoa
   lê ou grava são as regras do banco (RLS), no servidor. */
const SB = (() => {
  const U = String(CONFIG.url || '').replace(/\/+$/, ''), K = CONFIG.chave, LSK = 'jcn-acesso';
  let sess = null, renovando = null;
  const lerGuardado = () => { try { return JSON.parse(localStorage.getItem(LSK)) || null; } catch (e) { return null; } };
  sess = lerGuardado();
  const guardar = s => { sess = s; try { if (s) localStorage.setItem(LSK, JSON.stringify(s)); else localStorage.removeItem(LSK); } catch (e) { } };
  const erroDe = (status, j, txt) => { const e = new Error((j && (j.message || j.msg || j.error_description || j.error)) || txt || ('Erro ' + status)); e.status = status; e.code = j && (j.code || j.error_code || j.error); e.detalhe = j; return e; };
  async function chamar(caminho, { method = 'GET', body, headers = {}, token, semLogin = false, cru = false } = {}) {
    const h = { apikey: K, ...headers };
    const t = token || (semLogin ? null : await tokenValido());
    h.Authorization = 'Bearer ' + (t || K);          // sem login, vai a própria chave pública (é assim que a biblioteca oficial do Supabase faz)
    let corpo = body;
    if (body != null && !(body instanceof Blob) && typeof body !== 'string') { corpo = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    let r;
    try { r = await fetch(U + caminho, { method, headers: h, body: corpo }); }
    catch (e) { const x = new Error('Sem conexão com o servidor. Confira a internet e tente de novo.'); x.rede = true; throw x; }
    if (cru) { if (!r.ok) { let j = null; try { j = await r.json(); } catch (e) { } throw erroDe(r.status, j); } return r; }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
    if (!r.ok) throw erroDe(r.status, j, txt);
    return j;
  }
  // a senha vale por 1 hora no servidor; antes de vencer, troca-se o bilhete por outro sem pedir a senha de novo
  async function tokenValido() {
    if (!sess) return null;
    if (sess.expira - Date.now() > 60000) return sess.access_token;
    // outra aba deste navegador pode já ter renovado: usa o bilhete mais novo em vez de gastar um vencido
    const g = lerGuardado(); if (g && g.id === sess.id && g.expira > sess.expira) { sess = g; if (sess.expira - Date.now() > 60000) return sess.access_token; }
    if (!renovando) renovando = chamar('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token }, semLogin: true })
      .then(j => { aceitar(j); return sess.access_token; })
      .catch(e => { if (e.rede) throw e;             // sem internet: o pedido falha com aviso de conexão, sem derrubar o login
        guardar(null); if (api.aoPerderSessao) setTimeout(api.aoPerderSessao, 0); return null; })
      .finally(() => { renovando = null; });
    return renovando;
  }
  const aceitar = j => guardar({ access_token: j.access_token, refresh_token: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000, id: j.user.id, email: j.user.email });
  const filtro = f => Object.entries(f || {}).map(([k, v]) => encodeURIComponent(k) + '=' + (Array.isArray(v) ? 'in.(' + v.map(x => encodeURIComponent('"' + String(x).replace(/"/g, '\\"') + '"')).join(',') + ')' : v === null ? 'is.null' : 'eq.' + encodeURIComponent(v))).join('&');
  const pasta = c => String(c).split('/').map(encodeURIComponent).join('/');
  const api = {
    aoPerderSessao: null,                  // avisado quando o servidor não renova mais a sessão (senha trocada, conta removida)
    get id() { return sess ? sess.id : null; },
    get email() { return sess ? sess.email : null; },
    // ----- login
    async entrar(email, senha) { const j = await chamar('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: senha }, semLogin: true }); aceitar(j); return sess.id; },
    async sair() { const t = sess && sess.access_token; guardar(null); if (t) { try { await chamar('/auth/v1/logout?scope=local', { method: 'POST', token: t, semLogin: true }); } catch (e) { } } },
    async sessaoValida() { return !!(await tokenValido()); },
    async trocarSenha(nova) { return chamar('/auth/v1/user', { method: 'PUT', body: { password: nova } }); },
    async regras() { return chamar('/auth/v1/settings', { semLogin: true }); },
    // cria o login de outra pessoa sem mexer na sessão de quem está logado
    async criarLogin(email, senha) { const j = await chamar('/auth/v1/signup', { method: 'POST', body: { email, password: senha }, semLogin: true }); const u = j.user || j; if (!u || !u.id) throw new Error('O servidor não devolveu o novo acesso.'); return { id: u.id, confirmado: !!(j.access_token || u.email_confirmed_at || u.confirmed_at) }; },
    // ----- banco
    sel(tabela, consulta = 'select=*') { return chamar('/rest/v1/' + tabela + '?' + consulta); },
    async ins(tabela, linhas, { conflito } = {}) { return chamar('/rest/v1/' + tabela + (conflito ? '?on_conflict=' + conflito : ''), { method: 'POST', body: linhas, headers: { Prefer: 'return=representation' + (conflito ? ',resolution=merge-duplicates' : '') } }); },
    async upd(tabela, onde, valores) { return chamar('/rest/v1/' + tabela + '?' + filtro(onde), { method: 'PATCH', body: valores, headers: { Prefer: 'return=representation' } }); },
    async del(tabela, onde) { return chamar('/rest/v1/' + tabela + '?' + filtro(onde), { method: 'DELETE', headers: { Prefer: 'return=representation' } }); },
    rpc(fn, args = {}) { return chamar('/rest/v1/rpc/' + fn, { method: 'POST', body: args }); },
    // ----- arquivos
    async enviar(bucket, caminho, blob, tipo) { return chamar('/storage/v1/object/' + bucket + '/' + pasta(caminho), { method: 'POST', body: blob, headers: { 'Content-Type': tipo || blob.type || 'application/octet-stream', 'x-upsert': 'false', 'cache-control': 'max-age=3600' } }); },
    async baixar(bucket, caminho) { const r = await chamar('/storage/v1/object/authenticated/' + bucket + '/' + pasta(caminho), { cru: true }); return r.blob(); },
    async apagar(bucket, caminho) { return chamar('/storage/v1/object/' + bucket + '/' + pasta(caminho), { method: 'DELETE' }); },
    publico(caminho) { return U + '/storage/v1/object/public/publico/' + pasta(caminho); }
  };
  // login ou saída feitos em outra aba valem aqui também
  addEventListener('storage', ev => {
    if (ev.key !== LSK) return;
    const g = lerGuardado(), era = sess && sess.id; sess = g;
    if (era && (!g || g.id !== era) && api.aoPerderSessao) api.aoPerderSessao();
  });
  return api;
})();
