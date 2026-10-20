/* ============================================================================
   DADOS DE VERDADE (Supabase)
   As telas continuam trabalhando com o mesmo "state" do protótipo. Este arquivo:
   1. lê o banco e monta o state (o servidor só entrega o que a pessoa pode ver);
   2. quando uma tela chama salvar('parte'), compara com o último retrato do servidor,
      manda só a diferença e relê. Se o servidor recusar, avisa e volta ao que vale;
   3. cuida do que nasce no servidor: login, contas, pedidos novos e arquivos.
   ============================================================================ */
const CAT_ID = { 'colors': 'colors', 'fogoes-baixa-pressao': 'industriais', 'fogoes-alta-pressao': 'altapressao', 'fogoes-camping': 'camping', 'fornos-cavalete': 'fornos', 'fornos-avulsos': 'fornosavulsos',
  'tachos-fritadores': 'tacho', 'sanduicheiras': 'sanduicheiras', 'chapeiras': 'chapeiras', 'discos-de-arado': 'disco', 'picadores': 'picadores', 'engenhos': 'engenho', 'mesas-de-panificacao': 'mesas',
  'lanca-chamas': 'lanca', 'banquetas': 'banquetas', 'cabideiros': 'cabideiros', 'prateleiras': 'prateleiras', 'portao-pet': 'portaopet' };
const PIX_BD = { sem_comprovante: 'sem', em_analise: 'analise', verificado: 'verificado', recusado: 'recusado' }, PIX_TELA = { sem: 'sem_comprovante', analise: 'em_analise', verificado: 'verificado', recusado: 'recusado' };
const ENVIO_BD = { aguardando_pagamento: 'aguardando', em_expedicao: 'expedicao', enviado: 'enviado' }, ENVIO_TELA = { aguardando: 'aguardando_pagamento', expedicao: 'em_expedicao', enviado: 'enviado' };
const LS_SITE = 'jcn-pedidos-do-site';
const clone = o => JSON.parse(JSON.stringify(o));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const espelho = {};                       // último retrato do servidor, por parte
const dataLocal = iso => { const t = new Date(iso); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const nomeSeguro = n => String(n || 'arquivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'arquivo';
const slugDe = n => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';
// A loja entra com um login, mas o Supabase Auth pede um e-mail: o site forma um endereço interno com o domínio do próprio site.
// Nenhuma mensagem é enviada para ele. O endereço fica gravado na conta, então continua valendo se o site mudar de hospedagem.
function enderecoDaLoja(login) {
  const d = String(CONFIG.dominio_dos_logins || location.hostname || '').toLowerCase().replace(/^www\./, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || /^\d+(\.\d+){3}$/.test(d)) throw new Error('Preencha "dominio_dos_logins" no arquivo config.js com o domínio do site (ex.: jcngourmet.com.br).');
  return `loja-${login}@${d}`;
}
const papelAtual = () => { const u = typeof eu === 'function' ? eu() : null; return u ? u.papel : null; };
function msgErro(e) {
  const m = (e && e.message) || '';
  if (e && e.rede) return m;
  if (/row-level security|permission denied|42501/i.test(m + ' ' + (e && e.code))) return 'Você não tem permissão para fazer esta alteração.';
  if (/duplicate key|23505/i.test(m + ' ' + (e && e.code))) return /codigo/i.test(m) ? 'Já existe um produto com este código.' : /login|email/i.test(m) ? 'Já existe uma conta com este login ou e-mail.' : 'Este registro já existe.';
  if (/JWT|token/i.test(m) && e.status === 401) return 'Sua sessão terminou. Entre de novo.';
  return m || 'Não foi possível concluir. Tente de novo.';
}
// o banco devolve no máximo 1000 linhas por vez: busca em páginas até acabar
async function selTudo(tabela, consulta) {
  const tudo = [];
  for (let i = 0; ; i += 1000) { const l = await SB.sel(tabela, `${consulta}&limit=1000&offset=${i}`); tudo.push(...l); if (l.length < 1000) return tudo; }
}
function inicial() {
  const d = defaults(); d.usuarios = []; d.pedidos = []; d.daqui = []; d.arquivos = {}; d.crm = { prospects: [], ligacoes: [], orcamentos: [] };
  d.conteudo.pix = { chave: '', favorecido: '', banco: '' }; d.conteudo.loja = { ativa: false, acrescimo: 20 };
  return d;
}

/* ---------- leitura ---------- */
async function carregarCatalogo() {
  const interno = ['admin', 'vendedor', 'representante'].includes(papelAtual());
  const [cats, prods, fotos, fornos, vit, precos] = await Promise.all([
    SB.sel('categorias', 'select=*&order=ordem.asc,nome.asc'), selTudo('produtos', 'select=*&order=ordem.asc,nome.asc,id.asc'), selTudo('fotos_produto', 'select=*&order=ordem.asc,id.asc'),
    selTudo('fornos_do_fogao', 'select=*&order=ordem.asc,fogao_id.asc,forno_id.asc'), selTudo('vitrine', 'select=*&order=produto_id.asc'), interno ? selTudo('precos', 'select=produto_id,valor&order=produto_id.asc') : []]);
  const catDe = new Map(cats.map(c => [c.id, CAT_ID[c.slug] || c.slug]));
  const preco = new Map(precos.map(x => [x.produto_id, Number(x.valor)])), vitr = new Map(vit.map(x => [x.produto_id, Number(x.preco)]));
  const fotosDe = {}, fornosDe2 = {};
  fotos.forEach(f => (fotosDe[f.produto_id] = fotosDe[f.produto_id] || []).push(f.caminho.startsWith('img:') ? f.caminho : 'pub:' + f.caminho));
  fornos.forEach(f => (fornosDe2[f.fogao_id] = fornosDe2[f.fogao_id] || []).push(f.forno_id));
  state.catalogo = {
    versao: 4,
    categorias: cats.map(c => ({ id: catDe.get(c.id), uuid: c.id, nome: c.nome, ativa: c.ativa, ordem: c.ordem })),
    produtos: prods.map(r => ({ id: r.id, cat: catDe.get(r.categoria_id), nome: r.nome, codigo: r.codigo || '', cor: r.cor || '', hex: r.cor_hex || '#8A8A8A', slogan: r.frase || '', historia: r.historia || '',
      specs: Array.isArray(r.especificacoes) ? r.especificacoes : [], preco: preco.get(r.id) || 0, vit: vitr.has(r.id) ? vitr.get(r.id) : null, grupo: r.grupo || '', grelha: r.grelha || '', sub: r.subgrupo || '',
      fornos: fornosDe2[r.id] || [], mostrar_preco: !!r.mostrar_preco, ativo: !!r.ativo, ordem: r.ordem, fotos: fotosDe[r.id] || [] }))
  };
  // os onze fogões da Linha Colors têm um apelido fixo (zilda, carlos...) usado nas faixas da abertura
  const apelido = new Map(COLORS.map(c => [c[2], c[0]]));
  state.catalogo.produtos.forEach(p => { if (p.cat === 'colors' && apelido.has(p.codigo)) p.leg = apelido.get(p.codigo); });
  const m = state.catalogo.produtos.find(p => p.leg && p.leg === ui.modelo); if (m) ui.modelo = m.id;
  espelho.catalogo = clone(state.catalogo);
  state.pronto = true;
}
async function carregarConteudo() {
  const base = inicial().conteudo, logado = !!papelAtual();
  const [linhas, cfg, pixPublico] = await Promise.all([SB.sel('conteudo_site', 'select=chave,valor'), logado ? SB.sel('configuracoes', 'select=chave,valor') : [], logado ? null : SB.rpc('pix_da_loja_site').catch(() => null)]);
  const site = (linhas.find(l => l.chave === 'site') || {}).valor, c = { ...base, ...(site || {}) };
  const de = k => (cfg.find(x => x.chave === k) || {}).valor;
  if (c.txtR === 'A mesma estrutura, outro clima. A Zilda chega com café recém-passado e pão de queijo. É o tipo de calor que não queima, acolhe.') c.txtR = base.txtR;   // a cozinha de casa agora mostra a Meire
  c.pix = { chave: '', favorecido: '', banco: '', ...((logado ? de('pix') : pixPublico) || {}) };
  c.loja = logado && de('loja_site') ? { ativa: !!de('loja_site').ativa, acrescimo: Number(de('loja_site').acrescimo) || 0 } : { ativa: state.catalogo.produtos.some(p => p.vit != null), acrescimo: null };
  state.conteudo = c; atualizarLinhas();
  espelho.conteudo = clone(state.conteudo);
}
async function carregarContas() {
  if (!SB.id) { state.usuarios = []; espelho.usuarios = []; return; }
  const [perfis, lib] = await Promise.all([selTudo('perfis', 'select=*&order=criado_em.asc,id.asc'), selTudo('catalogo_loja', 'select=*&order=loja_id.asc,produto_id.asc')]);
  const libDe = {}; lib.forEach(x => { (libDe[x.loja_id] = libDe[x.loja_id] || {})[x.produto_id] = Number(x.preco); });
  state.usuarios = perfis.map(r => ({ id: r.id, nome: r.nome, email: r.email || '', login: r.login || '', papel: r.papel, empresa: r.empresa || '', doc: r.documento || '', cidade: r.cidade || '', contato: r.contato || '',
    vendedorResp: r.vendedor_id || '', ativo: !!r.ativo, senha: true, liberados: r.papel === 'ecommerce' ? (libDe[r.id] || {}) : undefined }));
  espelho.usuarios = clone(state.usuarios);
}
function pedidoDe(r, itens, anexos, parcelas) {
  const comp = anexos.filter(a => a.tipo === 'comprovante_pix').sort((a, b) => a.enviado_em < b.enviado_em ? 1 : -1)[0];
  const e = r.entrega;
  return { id: r.id, numero: Number(r.numero), criado: dataLocal(r.criado_em), origem: r.origem === 'interno' ? undefined : r.origem, vendedor: r.vendedor_id, acrescimo: r.acrescimo == null ? undefined : Number(r.acrescimo),
    cliente: { nome: r.cliente_nome, doc: r.cliente_doc || '', cidade: r.cliente_cidade || '', fone: r.cliente_telefone || '', email: r.cliente_email || '',
      endereco: e ? { cep: e.cep || '', rua: e.rua || '', numero: e.numero || '', compl: e.complemento || e.compl || '', bairro: e.bairro || '', cidade: e.cidade || '', uf: e.uf || '' } : undefined },
    itens: itens.map(i => ({ produto: i.produto_id, codigo: i.codigo || '', nome: i.descricao, qtd: i.quantidade, preco: Number(i.preco_unit) })), obs: r.observacoes || '',
    pagamento: r.forma_pagamento === 'boleto' ? { forma: 'boleto', dias: r.boleto_dias || [], status: r.boleto_status, por: r.boleto_decidido_por, em: r.boleto_decidido_em ? dataLocal(r.boleto_decidido_em) : '', motivo: r.boleto_motivo || '',
      recebidas: parcelas.filter(p => p.recebida_em).map(p => p.dias) } : { forma: 'pix' },
    pix: { status: PIX_BD[r.pix_status], arquivo: comp ? comp.id : null, por: r.pix_conferido_por },
    etiquetas: anexos.filter(a => a.tipo === 'etiqueta_envio').sort((a, b) => a.enviado_em < b.enviado_em ? -1 : 1).map(a => a.id), envio: ENVIO_BD[r.envio_status] };
}
async function carregarPedidos() {
  if (!papelAtual()) { state.pedidos = []; espelho.pedidos = []; return carregarPedidosDoSite(); }
  const [peds, itens, anexos, parcelas] = await Promise.all([selTudo('pedidos', 'select=*&order=numero.desc'), selTudo('itens_pedido', 'select=*&order=id.asc'), selTudo('anexos', 'select=*&order=enviado_em.asc,id.asc'), selTudo('parcelas_boleto', 'select=*&order=pedido_id.asc,numero.asc')]);
  const por = (l, k) => { const m = {}; l.forEach(x => (m[x[k]] = m[x[k]] || []).push(x)); return m; };
  const it = por(itens, 'pedido_id'), an = por(anexos, 'pedido_id'), pa = por(parcelas, 'pedido_id');
  const locais = {}; Object.entries(state.arquivos).forEach(([k, m]) => { if (m.local) locais[k] = m; });       // arquivos escolhidos e ainda não enviados continuam na tela
  state.arquivos = locais;
  anexos.forEach(a => { state.arquivos[a.id] = { id: a.id, nome: a.nome_original, tipo: a.mime, tamanho: Number(a.tamanho_bytes), em: a.enviado_em, guardado: true, bucket: a.bucket, caminho: a.caminho, por: a.enviado_por }; });
  state.pedidos = peds.map(r => pedidoDe(r, it[r.id] || [], an[r.id] || [], pa[r.id] || []));
  espelho.pedidos = clone(state.pedidos); espelho.arquivos = clone(state.arquivos);
  await carregarPedidosDoSite();
  await carregarCRM();
}
// registro de ligações e possíveis clientes (administração e vendedores)
async function carregarCRM() {
  if (!['admin', 'vendedor'].includes(papelAtual())) { state.crm = { prospects: [], ligacoes: [] }; return; }
  try {
    const [pr, lg, eq] = await Promise.all([selTudo('prospects', 'select=*&order=atualizado_em.desc,id.asc'), selTudo('ligacoes', 'select=*&order=feita_em.desc,id.asc'), SB.rpc('nomes_da_equipe').catch(() => [])]);
    state.crm = { prospects: pr, ligacoes: lg, equipe: eq || [], orcamentos: [] };
  } catch (e) {
    if (e.rede) throw e;
    state.crm = { prospects: [], ligacoes: [], orcamentos: [], indisponivel: /PGRST205|42P01|does not exist|schema cache/i.test((e.code || '') + ' ' + e.message) };
    return;
  }
  // orçamentos (atualização 3): se ainda não rodou, o resto das ligações continua funcionando
  try {
    const [orc, itens] = await Promise.all([selTudo('orcamentos', 'select=*&order=criado_em.desc,id.asc'), selTudo('orcamento_itens', 'select=*&order=orcamento_id.asc,ordem.asc')]);
    const de = {}; itens.forEach(i => (de[i.orcamento_id] = de[i.orcamento_id] || []).push({ ...i, quantidade: Number(i.quantidade), preco_unit: Number(i.preco_unit) }));
    state.crm.orcamentos = orc.map(o => ({ ...o, itens: de[o.id] || [] }));
  } catch (e) {
    if (e.rede) throw e;
    state.crm.orcIndisponivel = /PGRST205|42P01|does not exist|schema cache/i.test((e.code || '') + ' ' + e.message);
  }
}
// Loja do site: os pedidos feitos neste aparelho ficam anotados aqui (state.daqui); o andamento vem do servidor.
function lerPedidosDoSite() { try { return JSON.parse(localStorage.getItem(LS_SITE)) || []; } catch (e) { return []; } }
function guardarPedidosDoSite(l) { try { localStorage.setItem(LS_SITE, JSON.stringify(l.slice(0, 30))); } catch (e) { } }
async function andamentoDoSite(numero, doc) { return SB.rpc('acompanhar_pedido_site', { p_numero: numero, p_documento: doc }); }
function pedidoDoSite(nota, a) {
  return { id: 'site-' + nota.numero, numero: nota.numero, chave: nota.chave || null, criado: a ? dataLocal(a.criado_em) : nota.criado, origem: 'site', vendedor: null, acrescimo: nota.acrescimo,
    cliente: nota.cliente || { nome: 'Pedido nº ' + nota.numero, doc: nota.doc },
    itens: a ? a.itens.map(i => ({ produto: null, codigo: i.codigo || '', nome: i.descricao, qtd: i.quantidade, preco: Number(i.preco_unit) })) : (nota.itens || []), obs: nota.obs || '',
    pagamento: { forma: 'pix' }, pix: { status: a ? PIX_BD[a.pix] : 'sem', arquivo: null, nomeComp: nota.comprovante || '' }, etiquetas: [], envio: a ? ENVIO_BD[a.envio] : 'aguardando' };
}
async function carregarPedidosDoSite() {
  const notas = lerPedidosDoSite();
  const l = await Promise.all(notas.map(n => andamentoDoSite(n.numero, n.doc).then(a => a ? pedidoDoSite(n, a) : null).catch(() => pedidoDoSite(n, null))));
  state.daqui = l.filter(Boolean);
}
async function recarregar(parte) {
  if (parte === 'catalogo') { await carregarCatalogo(); await carregarConteudo(); }
  else if (parte === 'conteudo') { await carregarCatalogo(); await carregarConteudo(); }      // o acréscimo da loja muda os preços do site
  else if (parte === 'usuarios') await carregarContas();
  else if (parte === 'pedidos') await carregarPedidos();
}
async function carregarTudo() {
  await carregarContas();                 // primeiro: quem é a pessoa e qual o perfil dela
  await carregarCatalogo();
  await Promise.all([carregarConteudo(), carregarPedidos()]);
}

/* ---------- arquivos ---------- */
const Files = {
  mem: {}, carregando: {}, LIM: 170 * 1024,
  // guarda o arquivo escolhido; ele sobe para o servidor quando o pedido (ou o produto) é gravado
  async put(file, { imagem = false } = {}) {
    let blob = file, nome = file.name || 'arquivo', tipo = file.type || (/\.pdf$/i.test(file.name || '') ? 'application/pdf' : 'application/octet-stream');
    const paraJpeg = async (lado, limite) => { blob = await reduzirImagem(file, lado, limite); tipo = 'image/jpeg'; nome = nome.replace(/\.[^.]+$/, '') + '.jpg'; };
    if (imagem) await paraJpeg(1000, this.LIM);
    else if (tipo.startsWith('image/') && (blob.size > 900 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(tipo))) {     // foto grande ou em formato que o servidor não guarda (HEIC, GIF, BMP)
      try { await paraJpeg(2000, 900 * 1024); } catch (e) { if (!['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) throw new Error('Não foi possível ler esta imagem. Envie em JPG, PNG ou PDF.'); blob = file; }
    }
    if (blob.size > 9.5 * 1024 * 1024) throw new Error('O arquivo passa de 10 MB.');
    const id = 'loc-' + uid(), meta = { id, nome, tipo, tamanho: blob.size, em: new Date().toISOString(), guardado: true, local: true };
    this.mem[id] = { blob, url: URL.createObjectURL(blob) }; state.arquivos[id] = meta;
    return meta;
  },
  async get(id) {
    if (this.mem[id]) return this.mem[id];
    const m = state.arquivos[id]; if (!m || !m.caminho) return null;
    try { const blob = await SB.baixar(m.bucket, m.caminho); return (this.mem[id] = { blob, url: URL.createObjectURL(blob) }); } catch (e) { return null; }
  },
  urlSync(id) { return this.mem[id] ? this.mem[id].url : TRANSP; },
  remove(id) { const m = state.arquivos[id]; if (m && m.local) { delete state.arquivos[id]; delete this.mem[id]; } else if (m) delete state.arquivos[id]; },
  // sobe um arquivo local para o bucket privado e registra o anexo no pedido
  async anexar(idLocal, pedidoId, tipoAnexo) {
    const m = state.arquivos[idLocal], f = this.mem[idLocal]; if (!m || !f) throw new Error('O arquivo escolhido se perdeu. Anexe de novo.');
    const caminho = `pedidos/${pedidoId}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('vendas', caminho, f.blob, m.tipo);
    await SB.ins('anexos', [{ tipo: tipoAnexo, bucket: 'vendas', caminho, nome_original: m.nome, mime: m.tipo, tamanho_bytes: m.tamanho, pedido_id: pedidoId, enviado_por: SB.id }]);
    delete state.arquivos[idLocal];
  },
  // sobe uma foto para o bucket público e devolve a referência que as telas usam
  async publicar(idLocal, pasta) {
    const m = state.arquivos[idLocal], f = this.mem[idLocal]; if (!m || !f) throw new Error('A foto escolhida se perdeu. Envie de novo.');
    const caminho = `${pasta}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('publico', caminho, f.blob, m.tipo); delete state.arquivos[idLocal];
    return caminho;
  }
};

/* ---------- gravação: manda só a diferença ---------- */
// Uma coisa de cada vez: gravações e releituras entram numa fila. Enquanto a fila anda, os cliques novos esperam
// (quandoLivre) e só são aplicados sobre os dados já relidos — assim nenhum clique é perdido nem grava por cima de dado velho.
const pendente = new Set(); let sincronizando = false, ocupados = 0, fila = Promise.resolve();
function naFila(fn) { ocupados++; fila = fila.then(fn).catch(() => { }).finally(() => { ocupados--; }); return fila; }
async function quandoLivre() { while (ocupados) await fila; }
function salvar(parte) {
  if (parte === 'arquivos') return;
  pendente.add(parte); naFila(rodarSync);
}
async function rodarSync() {
  if (sincronizando) return;
  sincronizando = true;
  try {
    while (pendente.size) {
      const parte = [...pendente][0]; pendente.delete(parte);
      try { await SYNC[parte](); } catch (e) { toast(msgErro(e)); }
      try { await recarregar(parte); } catch (e) { }
      redesenhar();
    }
  } finally { sincronizando = false; }
}
const SYNC = {
  async catalogo() {
    const antes = espelho.catalogo, agora = state.catalogo;
    // categorias
    for (const [i, c] of agora.categorias.entries()) {
      const a = antes.categorias.find(x => x.id === c.id);
      if (!a) { const r = await SB.ins('categorias', [{ nome: c.nome, slug: slugDe(c.nome) + '-' + uid().slice(-4), ativa: c.ativa !== false, ordem: i + 1 }]); c.uuid = r[0].id; }
      else if (a.nome !== c.nome || a.ativa !== c.ativa) await SB.upd('categorias', { id: a.uuid }, { nome: c.nome, ativa: !!c.ativa });
    }
    for (const a of antes.categorias) if (!agora.categorias.some(c => c.id === a.id)) await SB.del('categorias', { id: a.uuid });
    const catUuid = id => (agora.categorias.find(c => c.id === id) || {}).uuid;
    // produtos
    const campos = p => ({ categoria_id: catUuid(p.cat), nome: p.nome, codigo: (p.codigo || '').trim() || null, cor: p.cor || null, cor_hex: /^#[0-9A-Fa-f]{6}$/.test(p.hex || '') ? p.hex : null, frase: p.slogan || null,
      historia: p.historia || null, especificacoes: p.specs || [], grupo: p.grupo || null, grelha: p.grelha || null, subgrupo: p.sub || null, mostrar_preco: !!p.mostrar_preco, ativo: !!p.ativo });
    const novoId = {};
    for (const p of agora.produtos) {
      const a = antes.produtos.find(x => x.id === p.id);
      let id = p.id;
      if (!a) { const r = await SB.ins('produtos', [{ ...campos(p), ordem: 9000 }]); id = novoId[p.id] = r[0].id; }
      else if (!igual(campos(a), campos(p))) await SB.upd('produtos', { id }, campos(p));
      if (!a || (a.preco || 0) !== (p.preco || 0)) { if (p.preco > 0) await SB.ins('precos', [{ produto_id: id, valor: p.preco }], { conflito: 'produto_id' }); else if (a && a.preco > 0) await SB.del('precos', { produto_id: id }); }
      if (!igual(a ? a.fotos : [], p.fotos)) {
        const refs = [];
        for (const f of p.fotos) refs.push(f.startsWith('file:') ? await Files.publicar(f.slice(5), 'produtos/' + id) : f.startsWith('pub:') ? f.slice(4) : f);
        if (a) for (const f of a.fotos) if (f.startsWith('pub:') && !refs.includes(f.slice(4))) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
        if (a) await SB.del('fotos_produto', { produto_id: id });
        if (refs.length) await SB.ins('fotos_produto', refs.map((caminho, ordem) => ({ produto_id: id, caminho, ordem })));
      }
    }
    for (const p of agora.produtos) {       // fornos por último: o forno pode ter acabado de ser criado
      const a = antes.produtos.find(x => x.id === p.id), id = novoId[p.id] || p.id, lista = (p.fornos || []).map(f => novoId[f] || f);
      if (igual(a ? a.fornos : [], lista)) continue;
      if (a) await SB.del('fornos_do_fogao', { fogao_id: id });
      if (lista.length) await SB.ins('fornos_do_fogao', lista.map((forno_id, ordem) => ({ fogao_id: id, forno_id, ordem: ordem + 1 })));
    }
    for (const a of antes.produtos) if (!agora.produtos.some(p => p.id === a.id)) {
      await SB.del('produtos', { id: a.id });
      for (const f of a.fotos) if (f.startsWith('pub:')) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
    }
  },
  async usuarios() {
    for (const u of state.usuarios) { const a = (espelho.usuarios || []).find(x => x.id === u.id); if (a && a.ativo !== u.ativo) await SB.upd('perfis', { id: u.id }, { ativo: !!u.ativo }); }
  },
  async conteudo() {
    const c = state.conteudo, a = espelho.conteudo, adm = papelAtual() === 'admin';
    if (!adm) return;
    // fotos novas da galeria e das linhas sobem para o bucket público
    for (let i = 0; i < c.galeria.length; i++) if (c.galeria[i].startsWith('file:')) c.galeria[i] = 'pub:' + await Files.publicar(c.galeria[i].slice(5), 'site');
    for (const l of c.linhas) for (let i = 0; i < (l.fotos || []).length; i++) if (l.fotos[i].startsWith('file:')) l.fotos[i] = 'pub:' + await Files.publicar(l.fotos[i].slice(5), 'site');
    // fotos que saíram do site deixam de ocupar espaço no Storage
    const usadas = new Set([...c.galeria, ...c.linhas.flatMap(l => l.fotos || [])]);
    for (const f of [...a.galeria, ...a.linhas.flatMap(l => l.fotos || [])]) if (f.startsWith('pub:') && !usadas.has(f)) { try { await SB.apagar('publico', f.slice(4)); } catch (e) { } }
    const { pix, loja, ...site } = c, { pix: pixA, loja: lojaA, ...siteA } = a;
    if (!igual(site, siteA)) await SB.ins('conteudo_site', [{ chave: 'site', valor: site, atualizado_por: SB.id }], { conflito: 'chave' });
    if (!igual(pix, pixA)) await SB.ins('configuracoes', [{ chave: 'pix', valor: pix }], { conflito: 'chave' });
    if (!igual(loja, lojaA)) await SB.ins('configuracoes', [{ chave: 'loja_site', valor: { ativa: !!loja.ativa, acrescimo: Number(loja.acrescimo) || 0 } }], { conflito: 'chave' });
  },
  async pedidos() {
    if (!papelAtual()) return;
    const adm = papelAtual() === 'admin';
    for (const p of state.pedidos) {
      const a = (espelho.pedidos || []).find(x => x.id === p.id); if (!a) continue;
      // arquivos novos: sobem e viram anexos (o banco põe o pedido "em análise" sozinho)
      let subiuComp = false;
      if (p.pix.arquivo && p.pix.arquivo !== a.pix.arquivo && (state.arquivos[p.pix.arquivo] || {}).local) { await Files.anexar(p.pix.arquivo, p.id, 'comprovante_pix'); subiuComp = true; }
      for (const e of p.etiquetas) if (!a.etiquetas.includes(e) && (state.arquivos[e] || {}).local) await Files.anexar(e, p.id, 'etiqueta_envio');
      for (const e of a.etiquetas) if (!p.etiquetas.includes(e)) { const m = espelho.arquivos[e]; if (m) { try { await SB.apagar(m.bucket, m.caminho); } catch (x) { } await SB.del('anexos', { id: e }); } }
      // situação do pedido
      const v = {};
      if (p.pagamento.forma !== a.pagamento.forma) { v.forma_pagamento = p.pagamento.forma; if (p.pagamento.forma === 'boleto') v.boleto_dias = p.pagamento.dias; }
      if (p.pagamento.forma === 'boleto' && a.pagamento.forma === 'boleto') {
        if (!igual(p.pagamento.dias, a.pagamento.dias)) v.boleto_dias = p.pagamento.dias;
        if (p.pagamento.status !== a.pagamento.status) { v.boleto_status = p.pagamento.status; if (p.pagamento.status === 'recusado') v.boleto_motivo = p.pagamento.motivo || null; }
      }
      if (p.pix.status !== a.pix.status && !(subiuComp && p.pix.status === 'analise') && (adm || p.pix.status === 'sem')) v.pix_status = PIX_TELA[p.pix.status];
      if (p.envio !== a.envio) v.envio_status = ENVIO_TELA[p.envio];
      if (Object.keys(v).length) { const r = await SB.upd('pedidos', { id: p.id }, v); if (!r.length) throw new Error('Você não tem permissão para alterar este pedido.'); }
      // parcelas recebidas (depois da aprovação, que é quando as parcelas nascem)
      if (p.pagamento.forma === 'boleto' && a.pagamento.forma === 'boleto') {
        const antesR = a.pagamento.recebidas || [], agoraR = p.pagamento.recebidas || [];
        for (const d of p.pagamento.dias) if (antesR.includes(d) !== agoraR.includes(d)) await SB.upd('parcelas_boleto', { pedido_id: p.id, dias: d }, { recebida_em: agoraR.includes(d) ? new Date().toISOString() : null });
      }
    }
  }
};

/* ---------- o que nasce no servidor ---------- */
const NUCLEO = {
  // login: confere a senha no servidor e só então carrega o que o perfil pode ver
  async entrar(identificador, senha, portal) {
    let email = identificador;
    if (portal === 'ecommerce' && !identificador.includes('@')) {
      email = await SB.rpc('email_do_login', { p_login: identificador });
      if (!email) { const e = new Error('Invalid login credentials'); e.code = 'invalid_credentials'; throw e; }
    }
    // na equipe interna, quem digita só o nome (ex.: adminmaster) entra como nome@domínio do site
    else if (!identificador.includes('@')) email = identificador + '@' + String(CONFIG.dominio_dos_logins || location.hostname).replace(/^www\./, '');
    await SB.entrar(email, senha);
    await carregarContas();
    const u = state.usuarios.find(x => x.id === SB.id);
    if (!u || !u.ativo) { await SB.sair(); state.usuarios = []; throw new Error('Esta conta está inativa ou ainda não foi liberada. Fale com a administração da JCN.'); }
    if (portalDe(u) !== portal) { await SB.sair(); state.usuarios = []; throw new Error('Esta conta entra pela aba ' + PORTAIS[portalDe(u)][0] + '.'); }
    sessao = u.id;
    await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]);
    return u;
  },
  async sair() { await SB.sair(); sessao = null; state.usuarios = []; state.pedidos = []; state.arquivos = {}; await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]); },
  // pedido do portal de vendas (vendedor, representante, administrador) ou da loja de e-commerce
  async lancarPedido({ origem, cliente, itens, obs, forma, dias, comprovante, etiquetas = [] }) {
    // uma chamada só: ou o pedido entra com todos os itens, ou não entra nada. O valor de cada item é posto pelo banco
    // (tabela de preços, ou o valor liberado para a loja); só o da administração é aceito como veio.
    const ped = await SB.rpc('lancar_pedido', {
      p_pedido: { origem, cliente_nome: cliente.nome, cliente_doc: cliente.doc || '', cliente_cidade: cliente.cidade || '', observacoes: obs || '', forma_pagamento: forma === 'boleto' ? 'boleto' : 'pix', boleto_dias: forma === 'boleto' ? dias : null },
      p_itens: itens.map(i => ({ produto_id: i.produto, quantidade: i.qtd, preco_unit: i.preco })) });
    const falhas = [];
    if (comprovante) { try { await Files.anexar(comprovante, ped.id, 'comprovante_pix'); } catch (e) { falhas.push('comprovante'); } }
    for (const e of etiquetas) { try { await Files.anexar(e, ped.id, 'etiqueta_envio'); } catch (x) { falhas.push('etiqueta'); } }
    await carregarPedidos();
    return { id: ped.id, numero: Number(ped.numero), falhas };
  },
  // pedido da loja do site: o visitante não grava em tabela nenhuma, só chama esta função do banco
  async pedidoDoSite(c, itens, comprovante) {
    const cliente = { nome: c.nome.trim(), documento: c.doc.trim(), telefone: c.fone.trim(), email: c.email.trim(), observacoes: c.obs.trim(),
      entrega: { cep: soDig(c.cep).replace(/(\d{5})(\d{3})/, '$1-$2'), rua: c.rua.trim(), numero: c.numero.trim(), complemento: c.compl.trim(), bairro: c.bairro.trim(), cidade: c.cidade.trim(), uf: c.uf } };
    const r = await SB.rpc('criar_pedido_site', { p_cliente: cliente, p_itens: itens.map(i => ({ produto_id: i.p.id, quantidade: i.qtd })) });
    const ped = Array.isArray(r) ? r[0] : r;
    const nota = { numero: Number(ped.numero), chave: ped.chave, doc: soDig(c.doc), criado: hojeISO(), acrescimo: lojaCfg().acrescimo, obs: cliente.observacoes,
      cliente: { nome: cliente.nome, doc: cliente.documento, cidade: `${cliente.entrega.cidade}, ${cliente.entrega.uf}`, fone: cliente.telefone, email: cliente.email, endereco: { ...cliente.entrega, compl: cliente.entrega.complemento } },
      itens: itens.map(({ p, preco, qtd }) => ({ produto: p.id, codigo: p.codigo, nome: rotulo(p), qtd, preco })) };
    let falhou = false;
    try { nota.comprovante = await NUCLEO.comprovanteDoSite(nota, comprovante); } catch (e) { falhou = true; }
    guardarPedidosDoSite([nota, ...lerPedidosDoSite().filter(n => n.numero !== nota.numero)]);
    await carregarPedidos();
    return { numero: nota.numero, id: 'site-' + nota.numero, falhou };
  },
  async comprovanteDoSite(nota, idLocal) {
    const m = state.arquivos[idLocal], f = Files.mem[idLocal]; if (!m || !f) throw new Error('O comprovante escolhido se perdeu. Anexe de novo.');
    const caminho = `site/${nota.chave}/${uid()}-${nomeSeguro(m.nome)}`;
    await SB.enviar('vendas', caminho, f.blob, m.tipo);
    await SB.rpc('anexar_comprovante_site', { p_numero: nota.numero, p_chave: nota.chave, p_caminho: caminho, p_nome: m.nome, p_mime: m.tipo, p_tamanho: m.tamanho });
    delete state.arquivos[idLocal];
    return m.nome;
  },
  // novo login (vendedor, representante, administrador ou loja). Quem está logado continua logado.
  async criarAcesso({ email, senha, perfil, liberados }) {
    const regras = await SB.regras().catch(() => null);
    if (regras && regras.mailer_autoconfirm === false) throw new Error('Para criar logins por aqui, desligue "Confirm email" no Supabase (Authentication, Sign In / Providers, Email) e tente de novo.');
    let novo;
    const recusa = e => new Error(/password/i.test(e.message + ' ' + e.code) ? 'O servidor recusou a senha: use pelo menos 8 caracteres, com letras e números.'
      : /email.*invalid|invalid.*email/i.test(e.message + ' ' + e.code) ? 'O servidor não aceitou o endereço ' + email + '. Confira o e-mail (ou o "dominio_dos_logins" em config.js).'
      : /rate|too many|429/i.test(e.message + ' ' + e.status) ? 'Muitos cadastros em pouco tempo. Espere um minuto e tente de novo.' : msgErro(e));
    const ja = e => /already|registered|exists/i.test(e.message + ' ' + e.code);
    try { novo = await SB.criarLogin(email, senha); }
    catch (e) {
      if (!ja(e)) throw recusa(e);
      // já existe um login com este e-mail. Se ele tem conta, o banco recusa; se está "solto" (cadastro que parou no meio,
      // ou alguém que se cadastrou por fora), o banco apaga e criamos um login novo — o antigo nunca é aproveitado.
      await SB.rpc('liberar_email', { p_email: email });
      try { novo = await SB.criarLogin(email, senha); } catch (e2) { throw ja(e2) ? new Error('Este e-mail está sendo usado em outro cadastro agora. Tente de novo em instantes.') : recusa(e2); }
    }
    await SB.ins('perfis', [{ id: novo.id, email, ...perfil }]);
    if (liberados) await NUCLEO.gravarLiberados(novo.id, {}, liberados);
    await carregarContas();
    return novo.id;
  },
  async gravarLiberados(lojaId, antes, agora) {
    const tirar = Object.keys(antes).filter(k => agora[k] == null), por = Object.keys(agora).filter(k => antes[k] !== agora[k]);
    for (let i = 0; i < tirar.length; i += 40) await SB.del('catalogo_loja', { loja_id: lojaId, produto_id: tirar.slice(i, i + 40) });     // em partes: o endereço do pedido tem tamanho máximo
    if (por.length) await SB.ins('catalogo_loja', por.map(k => ({ loja_id: lojaId, produto_id: k, preco: agora[k] })), { conflito: 'loja_id,produto_id' });
  },
  async salvarLoja(u, senha, antigo) {
    const perfil = { nome: u.nome, login: u.login, papel: 'ecommerce', empresa: u.nome, documento: u.doc || null, cidade: u.cidade || null, contato: u.contato || null, vendedor_id: u.vendedorResp, ativo: !!u.ativo };
    if (!antigo) return NUCLEO.criarAcesso({ email: enderecoDaLoja(u.login), senha, perfil, liberados: u.liberados });
    const { login, papel, ...novoP } = perfil;                      // o login e o perfil não mudam depois de criados
    if (papelAtual() !== 'admin') delete novoP.vendedor_id;
    const era = { nome: antigo.nome, empresa: antigo.nome, documento: antigo.doc || null, cidade: antigo.cidade || null, contato: antigo.contato || null, vendedor_id: antigo.vendedorResp, ativo: !!antigo.ativo };
    const muda = {}; Object.keys(novoP).forEach(k => { if (novoP[k] !== era[k]) muda[k] = novoP[k]; });       // só o que mudou nesta tela: não desfaz o que outra pessoa alterou
    if (Object.keys(muda).length) { const r = await SB.upd('perfis', { id: antigo.id }, muda); if (!r.length) throw new Error('Você não tem permissão para alterar esta conta.'); }
    await NUCLEO.gravarLiberados(antigo.id, antigo.liberados || {}, u.liberados);
    if (senha) await SB.rpc('definir_senha', { p_usuario: antigo.id, p_senha: senha });
    await carregarContas();
    return antigo.id;
  },
  async registrarLigacao(d) { const r = await SB.rpc('registrar_ligacao', { p: d }); await carregarCRM(); return r; },
  async salvarProspect(id, campos) { const r = await SB.upd('prospects', { id }, campos); if (!r.length) throw new Error('Você não tem permissão para alterar este cadastro.'); await carregarCRM(); },
  async apagarLigacao(id) { await SB.del('ligacoes', { id }); await carregarCRM(); },
  async apagarProspect(id) { await SB.del('prospects', { id }); await carregarCRM(); },
  async salvarOrcamento(d) { const r = await SB.rpc('salvar_orcamento', { p: d }); await carregarCRM(); return r; },
  async apagarOrcamento(id) { await SB.del('orcamentos', { id }); await carregarCRM(); },
  async definirSenha(id, senha) { await SB.rpc('definir_senha', { p_usuario: id, p_senha: senha }); }
};

// O que as telas chamam: cada operação entra na mesma fila das gravações (uma de cada vez).
// Por dentro, as operações usam NUCLEO direto, para não esperar por si mesmas.
const API = {};
Object.keys(NUCLEO).forEach(k => { API[k] = (...a) => { let r; return naFila(() => (r = NUCLEO[k](...a))).then(() => r); }; });

/* ---------- atualização periódica: o que outra pessoa gravou aparece sem recarregar a página ---------- */
let tRelogio = null;
function ligarRelogio() {
  clearInterval(tRelogio);
  tRelogio = setInterval(() => {
    if (document.hidden || ocupados) return;
    const a = document.activeElement;
    if (a && a.matches && a.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select')) return;      // não mexe na tela de quem está digitando
    naFila(async () => {
      const antes = JSON.stringify([state.pedidos, state.usuarios, state.daqui, state.crm]), dentro = !!sessao;
      try { if (dentro) await carregarContas(); await carregarPedidos(); } catch (e) { return; }
      if (dentro && sessao && !eu()) {            // a conta foi desativada enquanto a pessoa estava dentro
        try { await NUCLEO.sair(); } catch (e) { sessao = null; }
        ui.erro = 'Esta conta foi desativada. Fale com a administração da JCN.'; fecharDrawer(); if (!$('#app').hidden) renderApp(); return;
      }
      if (antes !== JSON.stringify([state.pedidos, state.usuarios, state.daqui, state.crm])) redesenhar();
    });
  }, (CONFIG.segundos_entre_atualizacoes || 30) * 1000);
}
