/* ---------- galeria de fotos (vendedores, representantes, administração e lojas de e-commerce) ----------
   Mostra as fotos cadastradas nos produtos, separadas por categoria e por produto. Foto nova colocada no
   cadastro do produto aparece aqui sozinha. A loja de e-commerce vê só os produtos liberados para ela. */
const extDe = t => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/gif': 'gif' }[t] || 'jpg');
const nomeArquivo = (base, i, n) => nomeSeguro(base).replace(/\.[a-z0-9]+$/i, '') + (n > 1 ? '-' + (i + 1) : '');
function produtosDaGaleria(u) {
  const lista = u.papel === 'ecommerce' ? liberadosDe(u).map(x => x.p) : vendaveis();
  return u.papel === 'admin' ? lista : lista.filter(p => p.fotos && p.fotos.length);     // a administração vê também os produtos ainda sem foto, para colocar
}
function blocosDaGaleria(u) {
  const q = (ui.galBusca || '').trim().toLowerCase(), cf = ui.galCat || '';
  const ps = produtosDaGaleria(u).filter(p => !cf || p.cat === cf), bate = p => (p.nome + ' ' + (p.codigo || '') + ' ' + (p.cor || '')).toLowerCase().includes(q);
  return state.catalogo.categorias.map(c => {
    const grupos = modelos(ps.filter(p => p.cat === c.id)).filter(g => !q || g.some(bate)).map(g => {
      const fotos = [...new Set(g.flatMap(p => p.fotos))];
      const p = g[0], cods = g.map(x => x.codigo).filter(Boolean);
      const titulo = c.id === 'colors' ? `${p.nome} (${p.cor})` : p.nome;
      return { id: p.id, titulo, cods, fotos, base: (cods[0] || '') + '-' + (c.id === 'colors' ? p.nome : p.nome.split(',')[0]) };
    });
    return { c, grupos };
  }).filter(b => b.grupos.length);
}
function vGaleria(u) {
  const loja = u.papel === 'ecommerce', blocos = blocosDaGaleria(u), total = blocos.reduce((s, b) => s + b.grupos.reduce((t, g) => t + g.fotos.length, 0), 0);
  const cats = state.catalogo.categorias.filter(c => produtosDaGaleria(u).some(p => p.cat === c.id));
  const site = !loja && !ui.galCat && !ui.galBusca ? [...new Set([...(state.conteudo.galeria || []), ...(state.conteudo.linhas || []).filter(l => l.ativo).flatMap(l => l.fotos || [])])] : [];
  const foto = (ref, nome, alt) => `<figure class="gfoto"><button class="gimg" data-act="gal-ver" data-ref="${esc(ref)}" data-nome="${esc(nome)}" aria-label="Ampliar ${esc(alt)}"><img loading="lazy" src="${src(ref)}" alt="${esc(alt)}"></button>
      <button class="btn ghost sm" data-act="gal-baixar" data-ref="${esc(ref)}" data-nome="${esc(nome)}">Baixar</button></figure>`;
  return `<h1>Galeria de fotos</h1><p class="sub">${loja ? 'Fotos dos produtos liberados para a sua loja, para usar na divulgação.' : 'Todas as fotos dos produtos, separadas por categoria e por produto. Foto nova colocada no cadastro de um produto aparece aqui sozinha.'}</p>
  <div class="bar"><select id="galCat" class="inp" style="width:auto" data-chg="gal-cat" aria-label="Categoria"><option value="">Todas as categorias</option>${cats.map(c => `<option value="${esc(c.id)}" ${ui.galCat === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
    <input id="galBusca" class="inp" style="width:min(18rem,100%)" type="search" placeholder="Buscar por nome, código ou cor" value="${esc(ui.galBusca || '')}" aria-label="Buscar foto"><span class="note">${total} foto${total === 1 ? '' : 's'}</span></div>
  ${!blocos.length && !site.length ? `<div class="panel"><p class="note" style="margin:0">${loja && !produtosDaGaleria(u).length ? 'Ainda não há produtos com foto liberados para a sua loja.' : 'Nenhuma foto encontrada.'}</p></div>` : ''}
  ${blocos.map(b => `<section class="galcat"><h2>${esc(b.c.nome)}</h2><div class="galcards">
    ${b.grupos.map(g => `<article class="card galcard">
      ${g.fotos.length ? `<button class="gimg" data-act="gal-ver" data-ref="${esc(g.fotos[0])}" data-nome="${esc(nomeArquivo(g.base, 0, g.fotos.length))}" aria-label="Ampliar ${esc(g.titulo)}"><img loading="lazy" src="${src(g.fotos[0])}" alt="${esc(g.titulo)}"></button>` : '<div class="gimg gvazio">Sem foto ainda</div>'}
      ${g.fotos.length > 1 ? `<div class="galmini">${g.fotos.slice(1).map((r, i) => `<button class="gimg" data-act="gal-ver" data-ref="${esc(r)}" data-nome="${esc(nomeArquivo(g.base, i + 1, g.fotos.length))}" aria-label="Ampliar outra foto de ${esc(g.titulo)}"><img loading="lazy" src="${src(r)}" alt=""></button>`).join('')}</div>` : ''}
      <div><b>${esc(g.titulo)}</b>${g.cods.length ? `<div class="note">${esc(g.cods.join(' · '))}</div>` : ''}</div>
      ${u.papel === 'admin' ? `<label tabindex="0" class="btn ghost sm">Adicionar fotos<input type="file" accept="image/*" multiple hidden data-file="gal-foto" data-id="${esc(g.id)}"></label>` : ''}
      ${!g.fotos.length ? '' : g.fotos.length > 1 ? `<button class="btn sm" data-act="gal-baixar-todas" data-id="${esc(g.id)}">Baixar as ${g.fotos.length} fotos</button>`
        : `<button class="btn ghost sm" data-act="gal-baixar" data-ref="${esc(g.fotos[0])}" data-nome="${esc(nomeArquivo(g.base, 0, 1))}">Baixar foto</button>`}
    </article>`).join('')}</div></section>`).join('')}
  ${site.length ? `<section class="galcat"><h2>Fotos do site</h2><div class="panel galprod"><div class="galtop"><div><b>Ambientes e outras linhas</b></div>
    <button class="btn sm" data-act="gal-baixar-site">Baixar todas (${site.length})</button></div>
    <div class="galgrid">${site.map((r, i) => foto(r, 'jcn-gourmet-' + (i + 1), 'Foto do site JCN Gourmet')).join('')}</div></div></section>` : ''}`;
}
async function baixarFoto(ref, nome) {
  const r = await fetch(src(ref)); if (!r.ok) throw new Error('foto');
  const b = await r.blob(), url = URL.createObjectURL(b), a = document.createElement('a');
  a.href = url; a.download = nome + '.' + extDe(b.type); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function baixarVarias(lista) {
  toast(`Baixando ${lista.length} fotos…`);
  try { for (const [ref, nome] of lista) { await baixarFoto(ref, nome); await new Promise(r => setTimeout(r, 350)); } toast('Fotos baixadas. Se o navegador perguntar, permita baixar vários arquivos.'); }
  catch (e) { toast('Não foi possível baixar uma das fotos. Tente de novo.'); }
}
Object.assign(acts, {
  'gal-ver': e => {
    const v = document.createElement('div'); v.className = 'viewer';
    v.innerHTML = `<div class="vb"><b>${esc(e.dataset.nome)}</b><button class="btn sm" data-act="gal-baixar" data-ref="${esc(e.dataset.ref)}" data-nome="${esc(e.dataset.nome)}">Baixar</button><button class="btn ghost sm" style="color:#fff;border-color:#fff" data-act="fechar-viewer">Fechar</button></div>
      <div class="vc"><img src="${src(e.dataset.ref)}" alt="${esc(e.dataset.nome)}"></div>`;
    document.body.appendChild(v);
  },
  'gal-baixar': async e => { try { await baixarFoto(e.dataset.ref, e.dataset.nome); } catch (x) { toast('Não foi possível baixar a foto. Tente de novo.'); } },
  'gal-baixar-todas': e => { const u = eu(); if (!u) return; const g = blocosDaGaleria(u).flatMap(b => b.grupos).find(x => x.id === e.dataset.id); if (g) baixarVarias(g.fotos.map((r, i) => [r, nomeArquivo(g.base, i, g.fotos.length)])); },
  'gal-baixar-site': () => { const s = [...new Set([...(state.conteudo.galeria || []), ...(state.conteudo.linhas || []).filter(l => l.ativo).flatMap(l => l.fotos || [])])]; baixarVarias(s.map((r, i) => [r, 'jcn-gourmet-' + (i + 1)])); }
});
Object.assign(uploads, {
  // administração: foto nova direto na galeria vai para o cadastro do produto (e aparece no site e para as lojas)
  'gal-foto': async (f, t) => {
    if (eu().papel !== 'admin') return;
    const p = prod(t.dataset.id); if (!p) return;
    const m = await Files.put(f, { imagem: true });
    await quandoLivre();
    const caminho = await Files.publicar(m.id, 'produtos/' + p.id);                 // sobe uma vez só
    const grupo = p.grupo ? state.catalogo.produtos.filter(x => x.grupo === p.grupo) : [p];   // fogão de duas grelhas: a foto vale para os dois códigos
    grupo.forEach(x => x.fotos.push('pub:' + caminho)); salvar('catalogo'); renderApp(); toast('Foto adicionada a ' + p.nome + '.');
  }
});
Object.assign(chgs, { 'gal-cat': e => { ui.galCat = e.value; renderApp(); } });
let tGal = null;
document.addEventListener('input', ev => {
  if (ev.target.id !== 'galBusca') return;
  ui.galBusca = ev.target.value; clearTimeout(tGal);
  tGal = setTimeout(() => { renderApp(); const i = $('#galBusca'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
});
