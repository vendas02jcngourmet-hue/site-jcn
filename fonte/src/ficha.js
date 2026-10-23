/* ---------- Ficha do candidato ("Trabalhe conosco" e a ficha do RH) ----------
   Uma definição só para o formulário da página inicial (em etapas) e para a ficha que o RH abre e completa.
   Os campos marcados com "base" ficam nas colunas da candidatura; os outros vão juntos em "ficha". */
const ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Separado(a)', 'Viúvo(a)'];
const AREAS_TC = ['Produção / fábrica', 'Solda e serralheria', 'Pintura', 'Montagem', 'Expedição e logística', 'Motorista', 'Vendas', 'Administrativo / financeiro', 'Marketing', 'Outra área'];
const CNH_CAT = ['Não tenho', 'A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'];
const temCNH = v => !!v && v !== 'Não tenho';
const FICHA = [
  { id: 'voce', tit: 'Seus dados', curto: 'Seus dados', campos: [
    { k: 'nome', rot: 'Nome completo', obr: 1, l: 4, max: 160, auto: 'name', base: 1 },
    { k: 'nascimento', rot: 'Data de nascimento', t: 'data', l: 2, base: 1 },
    { k: 'nasc_local', rot: 'Onde nasceu (cidade/UF)', l: 2, max: 80, ph: 'Ex.: Catanduva/SP' },
    { k: 'estado_civil', rot: 'Estado civil', t: 'sel', l: 2, ops: ESTADO_CIVIL },
    { k: 'conjuge', rot: 'Nome do cônjuge', l: 2, max: 160, se: ['estado_civil', v => /Casado|União/.test(v)] },
    { k: 'mae', rot: 'Nome da mãe', l: 3, max: 160 },
    { k: 'pai', rot: 'Nome do pai', l: 3, max: 160 }] },
  { id: 'contato', tit: 'Contato e endereço', curto: 'Contato', campos: [
    { k: 'telefone', rot: 'WhatsApp com DDD', t: 'tel', obr: 1, l: 2, base: 1, auto: 'tel' },
    { k: 'telefone2', rot: 'Outro telefone para contato', t: 'tel', l: 2, ph: 'Para recado, se tiver' },
    { k: 'email', rot: 'E-mail', t: 'email', obr: 1, l: 2, base: 1, auto: 'email' },
    { k: 'cep', rot: 'CEP', t: 'cep', l: 2, auto: 'postal-code', dica: 'Com o CEP, a rua, o bairro e a cidade se preenchem sozinhos.' },
    { k: 'rua', rot: 'Rua / avenida', l: 4, max: 120, auto: 'address-line1' },
    { k: 'numero', rot: 'Número', l: 1, max: 15 },
    { k: 'complemento', rot: 'Complemento (apto, bloco)', l: 2, max: 60, auto: 'address-line2' },
    { k: 'bairro', rot: 'Bairro', l: 3, max: 80 },
    { k: 'cidade', rot: 'Cidade', obr: 1, l: 4, max: 80, base: 1, auto: 'address-level2' },
    { k: 'uf', rot: 'Estado', t: 'uf', obr: 1, l: 2, base: 1 }] },
  { id: 'vaga', tit: 'Vaga e experiência', curto: 'Vaga', campos: [
    { k: 'area', rot: 'Área de interesse', t: 'sel', obr: 1, l: 2, base: 1, ops: AREAS_TC },
    { k: 'cargo', rot: 'Cargo pretendido', l: 2, max: 120, base: 1, ph: 'Ex.: soldador, auxiliar de produção' },
    { k: 'escolaridade', rot: 'Escolaridade', t: 'sel', l: 2, base: 1, ops: ['Ensino fundamental', 'Ensino médio incompleto', 'Ensino médio completo', 'Curso técnico', 'Superior incompleto', 'Superior completo', 'Pós-graduação'] },
    { k: 'disponibilidade', rot: 'Pode começar', t: 'sel', l: 2, base: 1, ops: ['Imediata', 'Em 15 dias', 'Em 30 dias', 'A combinar'] },
    { k: 'pretensao', rot: 'Pretensão salarial', l: 2, max: 60, base: 1, ph: 'Ex.: R$ 2.500' },
    { k: 'linkedin', rot: 'LinkedIn ou portfólio', t: 'url', l: 2, max: 300, base: 1, ph: 'https://' },
    { k: 'experiencia', rot: 'Experiência profissional', t: 'area', l: 6, max: 4000, base: 1, ph: 'Últimas empresas, funções e tempo em cada uma.' },
    { k: 'mensagem', rot: 'Mensagem para o RH', t: 'area', l: 6, max: 2000, base: 1 }] },
  { id: 'docs', tit: 'Documentos', curto: 'Documentos', nota: 'Os documentos agilizam a contratação. Se não tiver algum agora, pode deixar em branco.', campos: [
    { k: 'cpf', rot: 'CPF', t: 'cpf', l: 2 },
    { k: 'rg', rot: 'RG', l: 2, max: 20 },
    { k: 'rg_orgao', rot: 'Órgão emissor do RG', l: 2, max: 20, ph: 'Ex.: SSP/SP' },
    { k: 'pis', rot: 'PIS / PASEP / NIT', t: 'pis', l: 2 },
    { sub: 'CNH (carteira de motorista)' },
    { k: 'cnh_categoria', rot: 'Categoria', ler: 'CNH: categoria', t: 'sel', l: 2, ops: CNH_CAT },
    { k: 'cnh_numero', rot: 'Número da CNH', t: 'dig', n: 11, l: 2, se: ['cnh_categoria', temCNH] },
    { k: 'cnh_validade', rot: 'Vencimento da CNH', t: 'data', l: 2, se: ['cnh_categoria', temCNH] },
    { sub: 'Título de eleitor' },
    { k: 'titulo_numero', rot: 'Número do título', t: 'titulo', l: 2 },
    { k: 'titulo_zona', rot: 'Zona', ler: 'Título: zona', t: 'dig', n: 4, l: 2 },
    { k: 'titulo_secao', rot: 'Seção', ler: 'Título: seção', t: 'dig', n: 4, l: 2 }] },
  { id: 'familia', tit: 'Filhos', curto: 'Filhos', campos: [
    { k: 'filhos', rot: 'Tem filhos?', t: 'simnao', l: 2 },
    { k: 'filhos_qtd', rot: 'Quantos?', ler: 'Quantos filhos', t: 'qtd', l: 2, se: ['filhos', v => v === 'sim'] },
    { k: 'filhos_idades', rot: 'Idade de cada filho', t: 'idades', l: 6, se: ['filhos', v => v === 'sim'] }] },
  { id: 'corpo', tit: 'Características e uniforme', curto: 'Uniforme', nota: 'As medidas servem para separar o uniforme e os equipamentos de proteção.', campos: [
    { k: 'cor', rot: 'Cor ou raça (como você se declara)', t: 'sel', l: 2, ops: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'] },
    { k: 'altura', rot: 'Altura (m)', t: 'dec', l: 2, ph: 'Ex.: 1,75' },
    { k: 'peso', rot: 'Peso (kg)', t: 'dec', l: 2, ph: 'Ex.: 78' },
    { k: 'calcado', rot: 'Número do calçado', t: 'sel', l: 3, ops: Array.from({ length: 16 }, (_, i) => String(33 + i)) },
    { k: 'camisa', rot: 'Tamanho da camisa', t: 'sel', l: 3, ops: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'EG'] }] },
  { id: 'banco', tit: 'Pagamento', curto: 'Pagamento', nota: 'Usado só se você for contratado.', campos: [
    { k: 'pix_tipo', rot: 'Tipo da chave PIX', t: 'sel', l: 2, ops: ['CPF', 'Celular', 'E-mail', 'Chave aleatória'] },
    { k: 'pix', rot: 'Chave PIX', l: 4, max: 120, se: ['pix_tipo', v => !!v] },
    { k: 'itau', rot: 'Tem conta no banco Itaú?', t: 'simnao', l: 3 }] }
];
const FICHA_DEFS = FICHA.flatMap(s => s.campos.filter(c => c.k));
const defDe = k => FICHA_DEFS.find(c => c.k === k);
const BASE_K = FICHA_DEFS.filter(c => c.base).map(c => c.k);

/* números com máscara */
const MASCARA = {
  cpf: d => d.slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2'),
  cep: d => d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
  pis: d => d.slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{5})(\d)/, '$1.$2.$3').replace(/^(\d{3})\.(\d{5})\.(\d{2})(\d)/, '$1.$2.$3-$4'),
  titulo: d => d.slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 '),
  tel: d => { d = d.slice(0, 11); return d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; }
};
function cpfValido(c) {
  const d = soDig(c); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === +d[9] && dv(10) === +d[10];
}
function pisValido(p) {
  const d = soDig(p); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const s = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2].reduce((t, w, i) => t + w * +d[i], 0), r = 11 - (s % 11);
  return (r >= 10 ? 0 : r) === +d[10];
}
const numBR = v => { const t = String(v || '').trim().replace(/\s/g, '').replace(',', '.'); return t === '' ? NaN : Number(t); };

/* desenho dos campos: p = prefixo dos ids ("tc" no site, "rf" na ficha do RH); v = valores */
function campoFicha(c, p, v) {
  const id = `${p}-${c.k}`, val = v[c.k] == null ? '' : v[c.k], obr = c.obr && p === 'tc' ? ' <b class="obr" aria-hidden="true">*</b>' : '';
  const att = `id="${id}" ${c.obr && p === 'tc' ? 'aria-required="true"' : ''} ${c.auto ? `autocomplete="${c.auto}"` : ''} ${c.ph ? `placeholder="${esc(c.ph)}"` : ''}`;
  const cx = (dentro, rotulo = true) => `<${rotulo ? 'label' : 'div'} class="field fc fc-${c.l || 2}" data-fk="${p}:${c.k}"${c.se && !c.se[1](v[c.se[0]] || '') ? ' hidden' : ''}><span>${esc(c.rot)}${obr}</span>${dentro}${c.dica ? `<small class="fc-dica">${esc(c.dica)}</small>` : ''}</${rotulo ? 'label' : 'div'}>`;
  const mask = (t, d) => MASCARA[t] ? MASCARA[t](soDig(d)) : d;
  switch (c.t) {
    case 'sel': case 'uf': { const ops = c.t === 'uf' ? UFS : c.ops, cur = val || (c.t === 'uf' && p === 'tc' ? 'SP' : '');
      return cx(`<select ${att}><option value="">Escolha</option>${[...new Set([...ops, cur].filter(Boolean))].map(o => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`); }
    case 'simnao': return cx(`<div class="fc-sn" role="radiogroup" aria-label="${esc(c.rot)}">${[['sim', 'Sim'], ['nao', 'Não']].map(([x, t]) => `<label><input type="radio" name="${id}" value="${x}" ${val === x ? 'checked' : ''}> ${t}</label>`).join('')}</div>`, false);
    case 'area': return cx(`<textarea ${att} rows="4" maxlength="${c.max || 2000}">${esc(val)}</textarea>`);
    case 'data': return cx(`<input type="date" ${att} value="${esc(val)}">`);
    case 'email': return cx(`<input type="email" ${att} maxlength="160" value="${esc(val)}">`);
    case 'url': return cx(`<input type="url" ${att} maxlength="${c.max}" value="${esc(val)}">`);
    case 'qtd': return cx(`<input type="number" min="1" max="15" step="1" inputmode="numeric" ${att} value="${esc(val)}">`);
    case 'dec': return cx(`<input inputmode="decimal" ${att} maxlength="6" value="${esc(String(val).replace('.', ','))}">`);
    case 'idades': { const n = Math.min(15, Math.max(0, +v.filhos_qtd || 0)), ids = Array.isArray(val) ? val : [];
      return cx(`<div class="fc-idades" id="${id}">${n ? Array.from({ length: n }, (_, i) => `<label class="fc-idade"><span>${i + 1}º filho</span><input id="${id}-${i}" type="number" min="0" max="60" inputmode="numeric" value="${esc(ids[i] == null ? '' : ids[i])}" aria-label="Idade do ${i + 1}º filho"> <small>anos</small></label>`).join('') : '<p class="note" style="margin:0">Informe quantos filhos.</p>'}</div>`, false); }
    case 'tel': case 'cpf': case 'cep': case 'pis': case 'titulo': case 'dig':
      return cx(`<input inputmode="numeric" data-mask="${c.t}" ${att} maxlength="${c.t === 'dig' ? c.n : 20}" value="${esc(mask(c.t, val))}">`);
    default: return cx(`<input ${att} maxlength="${c.max || 120}" value="${esc(val)}">`);
  }
}
const camposDaEtapa = (s, p, v) => `<div class="fc-grid">${s.campos.map(c => c.sub ? `<h4 class="fc-sub">${esc(c.sub)}</h4>` : campoFicha(c, p, v)).join('')}</div>`;

/* leitura dos campos que estão à vista */
function valorCampo(p, k) {
  const c = defDe(k); if (!c) return '';
  if (c.t === 'simnao') { const r = document.querySelector(`input[name="${p}-${k}"]:checked`); return r ? r.value : ''; }
  if (c.t === 'idades') return $$(`[id^="${p}-${k}-"]`).map(i => i.value.trim());
  const el = document.getElementById(`${p}-${k}`); return el ? el.value : '';
}
const visivel = (p, c) => !c.se || c.se[1](valorCampo(p, c.se[0]) || '');
function lerFicha(p) { const v = {}; FICHA_DEFS.forEach(c => { v[c.k] = valorCampo(p, c.k); }); return v; }
// confere os campos (de uma etapa ou de todas); devolve [mensagem, chave] ou null
function problemaFicha(p, v, so, publico) {
  for (const c of FICHA_DEFS) {
    if (so && !so.includes(c.k)) continue;
    if (!visivel(p, c)) continue;
    const x = v[c.k], t = typeof x === 'string' ? x.trim() : x, d = soDig(t);
    if (publico && c.obr && !t) return [c.k === 'nome' ? 'Informe o nome completo.' : c.k === 'telefone' ? 'Informe o WhatsApp com DDD.' : c.k === 'area' ? 'Escolha a área de interesse.' : `Preencha: ${c.rot}.`, c.k];
    if (c.k === 'nome' && ((publico && t.split(/\s+/).length < 2) || t.length < 3)) return ['Informe o nome completo.', c.k];
    if (!t || (Array.isArray(t) && !t.some(Boolean))) continue;
    if (c.t === 'email' && !/^\S+@\S+\.\S+$/.test(t)) return ['Confira o e-mail.', c.k];
    if (c.t === 'tel') { const n = d.replace(/^55(?=\d{10,11}$)/, ''); if (n.length < 10 || n.length > 11) return [c.k === 'telefone' ? 'Informe o WhatsApp com DDD.' : 'Confira o outro telefone: DDD + número.', c.k]; }
    if (c.t === 'cep' && d.length !== 8) return ['O CEP tem 8 números.', c.k];
    if (c.t === 'cpf' && !cpfValido(d)) return ['Confira o CPF: o número não é válido.', c.k];
    if (c.t === 'pis' && !pisValido(d)) return ['Confira o PIS: o número não é válido.', c.k];
    if (c.t === 'titulo' && d.length !== 12) return ['O título de eleitor tem 12 números.', c.k];
    if (c.k === 'cnh_numero' && (d.length < 9 || d.length > 11)) return ['Confira o número da CNH.', c.k];
    if (c.t === 'dig' && c.k !== 'cnh_numero' && d.length > c.n) return [`Confira: ${c.rot}.`, c.k];
    if (c.k === 'altura') { const n = numBR(t), m = n > 3 ? n / 100 : n; if (!(m >= 1 && m <= 2.3)) return ['Confira a altura, em metros (ex.: 1,75).', c.k]; }
    if (c.k === 'peso') { const n = numBR(t); if (!(n >= 30 && n <= 250)) return ['Confira o peso, em quilos (ex.: 78).', c.k]; }
    if (c.k === 'filhos_qtd' && !(+t >= 1 && +t <= 15)) return ['Informe quantos filhos (de 1 a 15).', c.k];
    if (c.k === 'filhos_idades' && t.some(a => a !== '' && !(+a >= 0 && +a <= 60))) return ['Confira a idade dos filhos.', c.k];
    if (c.k === 'nascimento') { const a = (Date.now() - new Date(t + 'T12:00:00')) / 31557600000; if (!(a >= 14 && a <= 90)) return ['Confira a data de nascimento.', c.k]; }
  }
  return null;
}
// separa o que vai nas colunas e o que vai na ficha, só com o que está à vista
function montarFicha(p, v) {
  const base = {}, ficha = {};
  FICHA_DEFS.forEach(c => {
    let x = v[c.k]; if (!visivel(p, c)) x = c.base ? '' : undefined; if (x === undefined) return;
    if (typeof x === 'string') x = x.trim();
    if (['tel', 'cpf', 'cep', 'pis', 'titulo', 'dig'].includes(c.t)) x = soDig(x).replace(c.t === 'tel' ? /^55(?=\d{10,11}$)/ : /$^/, '');
    if (c.t === 'dec' && x) { let n = numBR(x); if (c.k === 'altura' && n > 3) n /= 100; x = String(n); }
    if (c.k === 'filhos_idades') x = (x || []).filter(a => a !== '').map(Number);
    if (c.base) base[c.k] = x || ''; else if (x !== '' && !(Array.isArray(x) && !x.length)) ficha[c.k] = x;
  });
  return { base, ficha };
}
function irAoCampo(p, k) {
  const c = defDe(k), el = c && c.t === 'simnao' ? document.querySelector(`input[name="${p}-${k}"]`) : document.getElementById(`${p}-${k}`) || $(`[id^="${p}-${k}-"]`);
  if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
}
// campos que aparecem conforme a resposta (cônjuge, CNH, filhos, chave PIX) e as idades dos filhos
function aplicarSe(p) {
  FICHA_DEFS.filter(c => c.se).forEach(c => { const w = $(`[data-fk="${p}:${c.k}"]`); if (w) w.hidden = !c.se[1](valorCampo(p, c.se[0]) || ''); });
}
function refazerIdades(p) {
  const box = document.getElementById(`${p}-filhos_idades`); if (!box) return;
  const antes = valorCampo(p, 'filhos_idades'), n = Math.min(15, Math.max(0, +valorCampo(p, 'filhos_qtd') || 0));
  const w = box.closest('.fc'); if (w) w.outerHTML = campoFicha(defDe('filhos_idades'), p, { filhos: valorCampo(p, 'filhos'), filhos_qtd: n, filhos_idades: antes });
}
// CEP: busca a rua, o bairro e a cidade (ViaCEP)
const cepsVistos = {};
async function buscarCEP(p) {
  const d = soDig(valorCampo(p, 'cep')); if (d.length !== 8 || cepsVistos[p] === d) return; cepsVistos[p] = d;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`); const j = await r.json(); if (j.erro) return;
    const por = { rua: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf };
    Object.entries(por).forEach(([k, x]) => { const el = document.getElementById(`${p}-${k}`); if (el && x && !el.value.trim()) { el.value = x; el.dispatchEvent(new Event('input', { bubbles: true })); } });
    const n = document.getElementById(`${p}-numero`); if (n && !n.value) n.focus();
  } catch (e) { /* sem internet ou CEP fora da base: a pessoa digita */ }
}
document.addEventListener('input', ev => {
  const t = ev.target; if (!t.id || !/^(tc|rf)-/.test(t.id)) return;
  const p = t.id.slice(0, 2);
  if (t.dataset.mask && MASCARA[t.dataset.mask]) { const fim = t.selectionStart === t.value.length; t.value = MASCARA[t.dataset.mask](soDig(t.value)); if (fim) t.setSelectionRange(t.value.length, t.value.length); }
  if (t.id === `${p}-cep`) buscarCEP(p);
  if (t.id === `${p}-filhos_qtd`) refazerIdades(p);
});
document.addEventListener('change', ev => {
  const t = ev.target, id = t.id || t.name || ''; if (!/^(tc|rf)-/.test(id)) return;
  const p = id.slice(0, 2); aplicarSe(p);
  if (id === `${p}-filhos`) refazerIdades(p);
});

/* ficha para ler (RH): só o que foi preenchido, por grupo */
function textoCampo(c, x, ficha) {
  if (x == null || x === '' || (Array.isArray(x) && !x.length)) return '';
  switch (c.t) {
    case 'simnao': return x === 'sim' ? 'Sim' : x === 'nao' ? 'Não' : esc(x);
    case 'data': return dataBR(String(x).slice(0, 10));
    case 'tel': return c.k === 'telefone' ? `<a href="https://wa.me/55${esc(soDig(x))}" target="_blank" rel="noopener">${esc(telFmt(x))}</a>` : esc(telFmt(x));
    case 'email': return `<a href="mailto:${esc(x)}">${esc(x)}</a>`;
    case 'url': return `<a href="${esc(/^https?:\/\//.test(x) ? x : 'https://' + x)}" target="_blank" rel="noopener nofollow">${esc(x)}</a>`;
    case 'cpf': case 'cep': case 'pis': case 'titulo': return esc(MASCARA[c.t](soDig(x)));
    case 'idades': return esc(x.map(a => a + (+a === 1 ? ' ano' : ' anos')).join(', '));
    case 'dec': return esc(String(x).replace('.', ',') + (c.k === 'altura' ? ' m' : ' kg'));
    case 'area': return `<span class="pre">${esc(x)}</span>`;
    default: return esc(x);
  }
}
function valoresDaCand(c) { const v = { ...(c.ficha || {}) }; BASE_K.forEach(k => { v[k] = c[k] == null ? '' : c[k]; }); if (v.area === 'A definir') v.area = ''; return v; }
function fichaParaLer(c) {
  const v = valoresDaCand(c);
  return FICHA.map(s => { const linhas = s.campos.filter(x => x.k && !['experiencia', 'mensagem'].includes(x.k)).map(x => [x.ler || x.rot, textoCampo(x, v[x.k])]).filter(x => x[1]);
    return linhas.length ? `<h4 class="cand-sec">${esc(s.tit)}</h4><dl class="cand-dl">${linhas.map(([k, t]) => `<div><dt>${esc(k)}</dt><dd>${t}</dd></div>`).join('')}</dl>` : ''; }).join('');
}
// colunas da planilha de currículos
const FICHA_CSV = FICHA_DEFS.filter(c => !c.base);
const csvFicha = (c, f) => { const x = (f || {})[c.k]; return x == null ? '' : Array.isArray(x) ? x.join(', ') : c.t === 'simnao' ? (x === 'sim' ? 'Sim' : 'Não') : c.t === 'data' ? dataBR(String(x).slice(0, 10)) : String(x); };
