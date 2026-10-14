'use strict';
const IMG = __IMAGES__;      // nome da imagem -> arquivo na pasta img/
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
// Loja do site (consumidor final): preço = tabela JCN + acréscimo definido pela administração (20% de início)
const precoSite = p => { const a = (state.conteudo.loja || {}).acrescimo; if (!(p.preco > 0) || a == null) return p.vit != null ? p.vit : 0;      // visitante: o servidor entrega o preço pronto
  return Math.round(+((Number(p.preco) || 0) * (100 + (a == null ? 20 : Number(a) || 0))).toFixed(4)) / 100; };
const brl = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dataBR = iso => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('pt-BR') : '';
const TRANSP = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/* =====================================================================
   DADOS INICIAIS (catálogo Linha Colors, 2º semestre de 2025)
   No site final estes registros vivem no banco (ver schema.sql).
   ===================================================================== */
const SPEC_COLORS = {
  'Queimadores': '2 bocas simples e 2 duplas', 'L × A × P': '722,7 × 830 × 880,5 mm', 'Corpo': 'Aço carbono',
  'Grelha': 'Ferro fundido 30×30', 'Pintura': 'Eletrostática', 'Forno interno': '580,7 × 670,8 × 450,5 mm', 'Peso': '57 kg'
};
const COLORS = [
  ['mateus', 'Mateus', 'FG4FSDB-LAC', 'Laca Bege', '#F1E7BE', 'Lar doce lar',
    'A vida no campo é simples. Acordar pela manhã, preparar um café com leite, pão e manteiga. À tardezinha, ver o sol se pondo, aconchegar-se na varanda, uma viola a tocar e uma cesta repleta de biscoitos doces passando de mão em mão.\n\nVida boa!'],
  ['zeze', 'Zezé', 'FG4FSD-AMA', 'Amarelo', '#F9AC22', 'Ele não é apenas um fogão',
    'Quando a chama acende, é como se o tempo voltasse — e junto dele, o cheiro doce que vinha da cozinha da avó, as risadas leves, o barulho de passos apressados esperando o bolo ficar pronto.\n\nFeito de lembranças!'],
  ['helena', 'Helena', 'FG4FSD-LRJ', 'Laranja', '#F36421', 'Cuidar de si e de quem se ama!',
    'Tem o espírito de quem vive de portas abertas. O mesmo brilho de um almoço depois da caminhada no parque, de uma conversa sob o sol, do cheirinho leve de legumes grelhando. Ele celebra o prazer de comer bem, de compartilhar receitas simples e saudáveis com quem faz parte da nossa jornada.\n\nFeito para quem cozinha com alma e vive com energia.'],
  ['dirce', 'Dirce', 'FG4FSD-VER', 'Vermelho', '#ED202A', 'Cozinhar também é se apaixonar',
    'Cada chama desperta aquela sensação única do primeiro amor: intensa, viva, impossível de esquecer. Ele transforma o ato de cozinhar em um gesto de paixão, onde o sabor tem alma e o calor tem sentimento.'],
  ['idalina', 'Idalina', 'FG4FSD-PIK', 'Pink', '#CE289C', 'A vida é uma festa',
    'A casa se enche de alegria com as risadas da criançada, o cheiro doce que vem da cozinha e a mesa coberta de guloseimas. As tias ajudam nos preparos, a mãe assa o bolo…\n\nE onde tem brigadeiro, tem festa!'],
  ['rosa', 'Rosa', 'FG4FSD-ROS', 'Rosa Gold', '#B15F65', 'A diva da cozinha',
    'Tem mãos de fada, um toque moderno e um jeito delicado de encantar pelo sabor e pelas cores. Com ela, a casa está sempre cheia de amigos e familiares, cheia de alegria e de boas histórias à mesa.'],
  ['zilda', 'Zilda', 'FG4FSD-AZU', 'Azul Itatiaia', '#4FC3E8', 'O calor que conforta e faz o tempo desacelerar',
    'Traga de volta a leveza dos dias serenos — o riso da família reunida, o cheirinho de café recém-passado, o pão de queijo que chega junto com uma conversa boa em família.\n\nÉ o tipo de calor que não queima, acolhe. Um refúgio entre o sabor e a lembrança.'],
  ['meire', 'Meire', 'FG4FSD-BRA', 'Branco', '#F4F4F2', 'Ele é puro, essencial e eterno',
    'Ele carrega a elegância do que nunca sai de moda. Um clássico que combina com todos os estilos e histórias. Seu design limpo e atemporal traz leveza, harmonia e a sensação de recomeço a cada nova receita.\n\nSimples, mas cheio de presença, ele é o ponto de equilíbrio entre tradição e modernidade.'],
  ['bige', 'Bige', 'FG4FSB-CHU', 'Chumbo', '#425771', 'O coringa do bom gosto',
    'Ele tem aquela presença que harmoniza qualquer espaço — moderno, versátil e atemporal. É a peça que une tudo na cozinha: transmite segurança, maturidade e um toque de elegância que nunca sai de moda.\n\nCom ele, cada refeição ganha um ar de tranquilidade e sofisticação.'],
  ['carlos', 'Carlos', 'FG4FSD-PRE', 'Preto', '#231F20', 'Ele tem presença',
    'Elegante, intenso e cheio de atitude. Seu fogo traduz confiança, seu silêncio impõe respeito. É para quem cozinha com propósito, aprecia o equilíbrio entre força e sofisticação, entre o clássico e o moderno. Discreto, mas impossível de passar despercebido, ele transforma a cozinha em um palco de estilo e essência.'],
  ['lair', 'Lair', 'FG4FSD-VRD', 'Verde', '#75876F', 'Ele tem alma forte e espírito contemporâneo',
    'É o equilíbrio entre natureza e aço, entre o rústico e o moderno. Feito para quem encontra beleza na autenticidade e força nos detalhes. Na cozinha, impõe presença sem precisar dizer uma palavra.']
];

/* Outras linhas (catálogo geral): [id, categoria, nome curto, título, texto, 3 fatos, fotos, produto de bancada] */
const LINHAS = [
  ['ind5', 'industriais', 'Perfil 5', 'Fogões industriais Perfil 5',
    'Para pequenos estabelecimentos ou residências: aço carbono, grelhas 30×30 em ferro fundido de 6 dedos e pintura eletrostática. De 1 a 8 bocas, em baixa ou alta pressão.',
    [['Bocas', '1, 2, 3, 4, 6 e 8'], ['Grelha 30×30', 'ferro fundido ou aço carbono'], ['Forno', 'vendido à parte']], ['img:l_ind5'], false],
  ['ind7', 'industriais', 'Perfil 7', 'Fogões industriais Perfil 7',
    'Para grandes estabelecimentos, com a mesma construção em aço carbono e grelhas 30×30 de ferro fundido. De 1 a 8 bocas, em baixa ou alta pressão, com fornos em aço carbono.',
    [['Bocas', '1, 2, 3, 4, 6 e 8'], ['Grelha 30×30', 'ferro fundido'], ['Forno', 'vendido à parte']], ['img:l_ind7'], false],
  ['inox', 'industriais', 'Inox', 'Fogões em inox',
    'A linha industrial também sai em aço inox, no corpo e no forno, com bocas simples e duplas.',
    [['Na foto', '6 bocas com forno'], ['L × A × P', '1070 × 860 × 795 mm'], ['Peso', '65 kg']], ['img:l_inox'], false],
  ['alta', 'altapressao', 'Alta pressão', 'Fogões de alta pressão',
    'Retomada rápida para alimentos que precisam manter a temperatura. Modelos 20×20 e 30×30, com seis dedos de apoio, chapas de aço carbono e pintura eletrostática.',
    [['Grelhas', '20×20, 30×30 e 40×40'], ['Bocas', 'de 1 a 8'], ['Na foto', '4 bocas 30×30, FF016']], ['img:l_alta'], false],
  ['camping', 'camping', 'Camping', 'Fogões camping',
    'Fogão de mesa a gás com queimador de alta pressão, para caminhoneiros que precisam de praticidade na estrada e para quem gosta de acampar e cozinhar ao ar livre. Robusto, econômico e fácil de instalar.',
    [['Versões', 'aço carbono, inox, vermelho e azul Itatiaia'], ['Queimador', 'alta pressão'], ['Peso', '1,32 kg']], ['img:c_cmp-vermelho', 'img:c_cmp-azul'], true],
  ['chapa', 'chapeiras', 'Chapeiras', 'Chapeiras',
    'Para bares e lanchonetes prepararem lanches e porções quentes a gás. Estrutura em aço inox escovado, fácil de limpar, e chapa inteiriça de aço carbono SAE 1020, que retém o calor para selar bem a carne.',
    [['Modelos', 'Classic 450, 650, 850, 1050 e 1250'], ['Largura', 'de 45,5 a 125,5 cm'], ['Peso', 'de 16 a 48 kg']], ['img:l_chapa'], true],
  ['sand', 'sanduicheiras', 'Sanduicheiras', 'Sanduicheiras',
    'Para sanduíches quentes a gás. Prensa em aço carbono, que dá mais temperatura e qualidade ao alimento, corpo em aço inox, bandeja coletora de gordura e bordas sem emendas.',
    [['Modelos', '40, 60 e 80 cm, com ou sem prensa'], ['Chapa', 'aço 1/8 × 3,10 mm'], ['Peso', 'de 7 a 15 kg']], ['img:l_sand'], true],
  ['forno', 'fornos', 'Fornos', 'Fornos cavalete',
    'Forno de 115 litros sobre cavalete, em aço carbono com pintura eletrostática. Porta de vidro ou de inox.',
    [['Modelos', 'FF022TV e FF022'], ['L × A × P', '580 × 1190 × 930 mm'], ['Peso', '31 kg']], ['img:l_forno', 'img:l_forno2'], false],
  ['tacho', 'tacho', 'Tacho', 'Tacho fritador a gás',
    'Seis litros para frituras rápidas e uniformes. Queimador de alta pressão em caulim de 120 mm e tacho em aço carbono esmaltado.',
    [['Modelo', 'FRIT-40'], ['A × L × P', '90 × 45 × 50 cm'], ['Peso bruto', '9 kg']], ['img:l_tacho'], false],
  ['disco', 'disco', 'Discos', 'Discos de arado',
    'Para uma culinária mais rústica: preparo uniforme e sabor caseiro para carnes, legumes e receitas feitas no fogo. Aço carbono de 2 mm, com cabos de madeira.',
    [['Tamanhos', '30, 36, 40 e 47 cm'], ['Espessura', '2 mm'], ['Cabos', 'madeira']], ['img:c_dsc-fd003'], true],
  ['picador', 'picadores', 'Picadores', 'Picadores de legumes',
    'Para batatas em palito e legumes e frutas em palitos ou cubos. Lavável, desmontável e com base antiderrapante, lâmina em aço inox e molas de alta resistência.',
    [['Tamanhos', 'pequeno, médio e grande'], ['Corpo', 'alumínio fundido'], ['Facas', 'aço inox, padrão 10 mm']], ['img:l_picador'], true],
  ['engenho', 'engenho', 'Engenhos', 'Engenhos de cana',
    'Extraem caldo de cana para uso doméstico. Moendas em alumínio, engrenagens em ferro fundido e laterais em chapa de aço. O P60, de 3 rolos, produz em média 40 litros por hora.',
    [['Modelos', 'P30, 2 rolos, e P60, 3 rolos'], ['Peso', '5,1 kg e 9 kg'], ['Produção do P60', '40 litros por hora']], ['img:c_eng-p30', 'img:c_eng-p60'], true],
  ['mesa', 'mesas', 'Mesas', 'Mesas de panificação',
    'Tampo em aço inox, que não contamina os alimentos, não retém odores e é fácil de limpar. Estrutura em aço carbono com pintura eletrostática e pés emborrachados.',
    [['Modelos', 'MPI 1360, 1660 e 1860'], ['Versões', 'com ou sem paneleiro'], ['Tampo', 'aço inox 430']], ['img:l_mesa'], false],
  ['lanca', 'lanca', 'Lança-chamas', 'Lança-chamas e mangueiras',
    'O maçarico sapecador serve para sapecar carnes, aquecer ferragens e aplicar manta líquida. A mangueira de alta pressão, com registro de fechamento de gás, é feita para os fogões de alta pressão.',
    [['Lança-chamas', '1 m ou 2 m'], ['Bocal', 'zincado'], ['Mangueira', 'modelo KITAP']], ['img:l_lanca', 'img:l_mangueira'], true],
  ['banqueta', 'banquetas', 'Banquetas', 'Banquetas',
    'Banqueta alta com encosto, para bancadas, bares e áreas gourmet, e banqueta baixa com assento em napa, para pé de balcão. Pintura eletrostática e pés emborrachados, em preto ou branco.',
    [['Alta', '95 cm de altura, 4,2 kg'], ['Baixa', '45 cm de altura'], ['Cores', 'preto e branco']], ['img:c_bqa-pt', 'img:c_bqb-pt'], false],
  ['cabideiro', 'cabideiros', 'Cabideiros', 'Cabideiros',
    'Em aço carbono, para pendurar roupas, bolsas e acessórios em halls, quartos ou escritórios.',
    [['Altura', '1,5 m'], ['Largura', '23 cm'], ['Cores', 'branco e preto']], ['img:c_cab-br', 'img:c_cab-pt'], false]
];
const LINHAS_ANTES_2026 = {"engenho": "O P60 extrai caldo de cana para uso doméstico. Moendas em alumínio, engrenagens em ferro fundido e laterais em chapa de aço.", "disco": "Para uma culinária mais rústica: preparo uniforme e sabor caseiro para carnes, legumes e receitas feitas no fogo. Aço carbono de 2 mm, com cabos de madeira.", "banqueta": "Encosto e estrutura com pintura eletrostática, assento espumado e pés emborrachados."};   // textos da versão anterior: só são trocados se ninguém os editou
const FATOS_ANTES_TABELA = {   // destaques da versão anterior: só são trocados se ninguém os editou
  ind5: [['Na foto', '3 bocas com forno, FF102'], ['L × A × P', '1070 × 860 × 465 mm'], ['Peso', '41 kg']],
  ind7: [['Na foto', '4 bocas com forno, FF110TV'], ['L × A × P', '785 × 860 × 830 mm'], ['Peso', '54 kg']],
  alta: [['Na foto', '4 bocas, FF016'], ['L × A × P', '730 × 860 × 465 mm'], ['Peso', '24,5 kg']]
};
const linhasPadrao = () => LINHAS.map(([id, cat, curto, titulo, texto, fatos, fotos, bancada]) => ({ id, cat, curto, titulo, texto, fatos, fotos, bancada, ativo: true }));
function defaults() {
  // Tabela única (JCN, julho de 2026): um preço por produto. Zero significa "a definir".
  const produtos = COLORS.map(([id, nome, codigo, cor, hex, slogan, historia]) => ({
    id, cat: 'colors', nome, codigo, cor, hex, slogan, historia, specs: Object.entries(SPEC_COLORS),
    preco: PRECO_COLORS[id] || 0, grupo: '', grelha: '', sub: '', fornos: [], mostrar_preco: false, ativo: true, fotos: ['img:' + id]
  }));
  // demais itens (catalogo.js). Fogão com as duas grelhas = dois produtos com o mesmo grupo.
  // "fornos" = fornos avulsos que servem naquele fogão: a escolha é opcional e o forno entra no pedido como item à parte.
  const outros = CAT26.map(([id, cat, nome, codigo, cor, hex, txt, specs, foto, preco, grupo, grelha, sub, fk]) => ({
    id, cat, nome, codigo, cor, hex, slogan: '', historia: txt >= 0 ? CAT26_TEXTOS[txt] : '', specs: specs.map(x => x.slice()),
    preco, grupo, grelha, sub, fornos: fk ? FORNOS_POR[fk].slice() : [], mostrar_preco: false, ativo: true, fotos: foto ? ['img:c_' + foto] : []
  }));
  return {
    conteudo: {
      heroTitulo: 'Onze fogões com nome de gente.',
      heroTexto: 'A Linha Colors resgata a tradição e conecta gerações: aço carbono, grelhas de ferro fundido e forno de 100 litros, em onze cores com história.',
      txtG: 'Entre mármore, marcenaria e luz cênica, o Carlos entra de preto. Discreto, mas impossível de passar despercebido: transforma a cozinha em um palco de estilo e essência.',
      txtR: 'A mesma estrutura, outro clima. A Meire chega com café recém-passado e pão de queijo. É o tipo de calor que não queima, acolhe.',
      galeria: ['img:close_carlos', 'img:close_rosa', 'img:close_helena', 'img:cover'],
      linhas: linhasPadrao(), versaoLinhas: 3,
      pix: { chave: '', favorecido: '', banco: '' }
    },
    catalogo: { versao: 4, categorias: CATEGORIAS.map(([id, nome]) => ({ id, nome, ativa: true })), produtos: produtos.concat(outros) },
    usuarios: [], pedidos: [],
    arquivos: {}
  };
}

let state = null;                         // montado em dados.js a partir do banco
const caps = { dl: null };
function atualizarLinhas() {
  const c = state.conteudo, v = c.versaoLinhas || 1; if (v >= 3) return;
  const novas = linhasPadrao(), igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  novas.forEach(n => {
    const i = c.linhas.findIndex(l => l.id === n.id);
    if (i >= 0) {
      const l = c.linhas[i];
      if (v < 2 && LINHAS_ANTES_2026[n.id] && l.texto === LINHAS_ANTES_2026[n.id]) c.linhas[i] = { ...n, ativo: l.ativo };
      else if (FATOS_ANTES_TABELA[n.id] && igual(l.fatos, FATOS_ANTES_TABELA[n.id])) c.linhas[i] = { ...l, fatos: n.fatos };
      if (n.id === 'alta' && c.linhas[i].cat === 'industriais') c.linhas[i].cat = 'altapressao';
      return;
    }
    if (n.id === 'camping') { const k = c.linhas.findIndex(l => l.id === 'alta'); return c.linhas.splice(k >= 0 ? k + 1 : c.linhas.length, 0, n); }
    if (n.id === 'cabideiro') c.linhas.push(n);
  });
  c.versaoLinhas = 3;
}
function redesenhar() {
  const a = document.activeElement;                                   // não tira o campo de quem está digitando
  if (!$('#site').hidden) {
    renderSite();
    if (ui.drawer && !(a && a.matches && a.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select') && a.closest('#overlay')) && typeof renderDrawer === 'function') renderDrawer();
    return;
  }
  if (a && a.matches && a.matches('input:not([type=checkbox]):not([type=file]),textarea,select') && a.closest('#app,#overlay')) return;
  if (typeof refresh === 'function') refresh();
}
function paraB64(blob) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); }); }
function reduzirImagem(file, ladoMax = 1000, limite = Files.LIM) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      let q = .84, lado = ladoMax;
      const tentar = () => {
        const k = Math.min(1, lado / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { if (b && b.size > limite && lado > 420) { lado -= 160; q -= .06; tentar(); } else { URL.revokeObjectURL(url); b ? ok(b) : no(new Error('imagem')); } }, 'image/jpeg', q);
      };
      tentar();
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}
function src(ref) {
  if (!ref) return TRANSP;
  if (ref.startsWith('img:')) return IMG[ref.slice(4)] || TRANSP;
  if (ref.startsWith('pub:')) return SB.publico(ref.slice(4));
  if (ref.startsWith('file:')) return Files.urlSync(ref.slice(5));
  return TRANSP;
}
let toastT;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3800);
}

/* =====================================================================
   CENAS EM TRAÇO (elevações) — desenhadas por código, animadas no scroll
   viewBox 1600×900, piso em y=800, fogão em x 650–950
   ===================================================================== */
const el = (tag, attrs, d = 0, cls = 'ln') => `<${tag} class="${cls}" pathLength="1" style="--d:${d.toFixed(3)}" ${attrs}/>`;
const L = (x1, y1, x2, y2, d, c) => el('line', `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`, d, c);
const R = (x, y, w, h, d, c, rx = 0) => el('rect', `x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`, d, c);
const C = (cx, cy, r, d, c) => el('circle', `cx="${cx}" cy="${cy}" r="${r}"`, d, c);
const P = (dd, d, c) => el('path', `d="${dd}"`, d, c);
const F = (x, y, w, h, d, o = .06) => `<rect class="fl" style="--d:${d};--o:${o}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

function cenaGourmet() {
  let b = '', m = '', f = '';
  /* fundo: marcenaria alta com fornos embutidos e adega */
  b += F(100, 40, 460, 760, .04, .05) + R(100, 40, 460, 760, .02, 'ln bold') + L(100, 780, 560, 780, .1, 'ln thin');
  b += L(250, 40, 250, 780, .08) + L(400, 40, 400, 780, .1) + L(175, 40, 175, 780, .14, 'ln thin') + L(168, 380, 168, 450, .18) + L(182, 380, 182, 450, .18);
  [300, 430].forEach((y, i) => { b += R(262, y, 126, 112, .16 + i * .03, 'ln', 4) + R(276, y + 34, 98, 62, .2 + i * .03, 'ln thin', 3) + L(276, y + 18, 374, y + 18, .22 + i * .03, 'ln bold'); });
  b += L(250, 160, 400, 160, .18, 'ln thin') + L(250, 280, 400, 280, .18, 'ln thin') + L(250, 560, 400, 560, .22, 'ln thin') + L(250, 670, 400, 670, .24, 'ln thin') + L(300, 615, 350, 615, .28) + L(300, 725, 350, 725, .3);
  b += R(414, 100, 132, 620, .18, 'ln', 3);
  for (let k = 0; k < 9; k++) { const y = 160 + k * 62; b += L(414, y, 546, y, .22 + k * .015, 'ln thin'); for (let j = 0; j < 4; j++) b += C(434 + j * 31, y - 13, 10, .26 + k * .015 + j * .006, 'ln thin'); }
  /* coifa e painel de mármore atrás do fogão */
  b += P('M740 0 V150 M860 0 V150', .2) + P('M690 150 H910 L940 196 H660 Z', .24, 'ln bold') + L(672, 208, 928, 208, .3, 'ln thin');
  b += F(560, 230, 560, 248, .22, .045) + R(560, 230, 560, 248, .22);
  b += P('M560 300 C640 280 700 350 790 330 S930 250 1010 300 S1080 270 1120 285', .3, 'ln thin') + P('M600 478 C640 420 720 430 760 380 S860 330 900 230', .34, 'ln thin')
    + P('M820 478 C850 440 930 450 980 400 S1060 380 1120 340', .38, 'ln thin') + P('M690 230 C700 262 742 268 760 312', .4, 'ln thin') + P('M560 400 C590 392 610 420 650 410', .42, 'ln thin');
  /* prateleiras iluminadas */
  [250, 345].forEach((y, i) => { b += R(1150, y, 400, 8, .32 + i * .04) + L(1162, y + 15, 1538, y + 15, .56, 'ln thin'); });
  b += P('M1180 250 v-46 h10 v-14 h8 v14 h10 v46', .42) + P('M1224 250 v-60 h8 v-16 h8 v16 h8 v60', .44) + P('M1300 222 a36 28 0 0 0 72 0 Z', .46) + R(1420, 226, 96, 24, .48, 'ln thin') + R(1432, 204, 78, 22, .5, 'ln thin');
  b += P('M1178 345 h60 M1184 337 h48 M1190 329 h36', .48) + P('M1290 345 v-34 a16 16 0 0 1 32 0 v34', .5) + P('M1400 345 l8 -30 h34 l8 30', .52) + P('M1425 315 C1410 290 1400 286 1392 268 M1425 315 C1428 286 1440 280 1446 262 M1425 315 C1444 300 1458 300 1466 286', .56, 'ln thin');
  /* bancadas ao lado do fogão */
  m += F(556, 478, 88, 16, .3, .14) + R(556, 478, 88, 16, .3, 'ln bold') + R(562, 494, 76, 286, .32) + L(562, 590, 638, 590, .36, 'ln thin') + L(562, 686, 638, 686, .38, 'ln thin');
  m += F(956, 478, 170, 16, .3, .14) + R(956, 478, 170, 16, .32, 'ln bold') + R(962, 494, 160, 286, .34) + L(1042, 494, 1042, 780, .38, 'ln thin') + L(962, 570, 1122, 570, .4, 'ln thin');
  m += P('M1062 478 V420 C1062 388 1102 388 1102 420 V434', .44, 'ln bold') + L(1050, 478, 1076, 478, .44);
  /* ilha em mármore com acabamento em cascata, banquetas e pendentes */
  f += `<rect x="1120" y="470" width="540" height="330" style="fill:var(--paper);opacity:clamp(0,calc((var(--draw,0) - .38) * 3),1)"/>`;
  f += F(1120, 470, 540, 330, .4, .06) + R(1120, 470, 540, 22, .4, 'ln bold') + R(1120, 470, 22, 330, .42, 'ln bold') + L(1142, 780, 1660, 780, .46, 'ln thin');
  f += P('M1142 560 C1220 540 1260 620 1340 600 S1480 520 1660 560', .5, 'ln thin') + P('M1200 800 C1230 740 1300 730 1330 680 S1420 640 1450 492', .54, 'ln thin') + P('M1500 800 C1520 760 1580 740 1660 700', .56, 'ln thin') + P('M1142 700 C1170 690 1180 720 1210 716', .58, 'ln thin');
  const banqueta = (x, d) => R(x, 612, 84, 10, d, 'ln bold solid', 5) + P(`M${x + 8} 612 V566 H${x + 76} V612`, d + .02, 'ln solid') + L(x + 10, 622, x + 2, 800, d + .04) + L(x + 74, 622, x + 82, 800, d + .04) + L(x + 6, 724, x + 78, 724, d + .06, 'ln thin');
  f += banqueta(1230, .56) + banqueta(1410, .6);
  [[1250, 230], [1390, 180], [1530, 250]].forEach(([x, y], i) => {
    f += `<polygon class="cone" points="${x - 34},${y + 40} ${x + 34},${y + 40} ${x + 130},470 ${x - 130},470"/>` + L(x, 0, x, y, .5 + i * .04) + P(`M${x - 34} ${y + 40} a34 40 0 0 1 68 0 Z`, .56 + i * .04, 'ln bold solid');
  });
  return `<g class="back">${b}</g><g class="mid">${m}</g><g class="front">${f}</g>`;
}

function cenaResidencial() {
  let b = '', m = '', f = '';
  /* armário alto, janela com cortinas (como na capa do catálogo) */
  b += R(60, 90, 150, 250, .04, 'ln bold') + L(135, 90, 135, 340, .1, 'ln thin') + C(125, 300, 4, .14) + C(145, 300, 4, .14);
  b += L(232, 104, 592, 104, .06, 'ln bold') + C(226, 104, 6, .1) + C(598, 104, 6, .1);
  b += R(272, 130, 280, 290, .08, 'ln bold') + L(412, 130, 412, 420, .14) + L(272, 275, 552, 275, .16) + R(258, 420, 308, 10, .18);
  b += P('M250 104 C262 200 240 300 258 440 H304 C292 330 314 220 302 104 Z', .2, 'ln solid') + P('M268 110 C276 220 262 320 274 436', .26, 'ln thin') + P('M286 110 C296 220 280 330 290 438', .28, 'ln thin');
  b += P('M574 104 C562 200 584 300 566 440 H520 C532 330 510 220 522 104 Z', .22, 'ln solid') + P('M556 110 C548 220 562 320 550 436', .28, 'ln thin') + P('M538 110 C528 220 544 330 534 438', .3, 'ln thin');
  /* azulejos, relógio e prateleira com potes */
  for (let x = 620; x <= 1180; x += 40) b += L(x, 238, x, 478, .2 + (x - 620) / 3000, 'ln thin');
  for (let y = 238; y <= 478; y += 40) b += L(620, y, 1180, y, .24 + (y - 238) / 2000, 'ln thin');
  b += C(1000, 338, 6, .5) + P('M1000 324 q6 7 0 14 q-6 -7 0 -14 M1000 352 q6 -7 0 -14 M986 338 q7 -6 14 0 q-7 6 -14 0 M1014 338 q-7 -6 -14 0', .52, 'ln thin');
  b += C(720, 160, 36, .3, 'ln bold solid') + L(720, 160, 720, 136, .38) + L(720, 160, 738, 170, .38) + C(720, 160, 2.5, .4);
  b += R(1010, 196, 300, 8, .3) + P('M1034 204 v26 l26 -26', .34, 'ln thin') + P('M1286 204 v26 l-26 -26', .34, 'ln thin');
  [[1030, 44, 60], [1084, 40, 46], [1134, 44, 70], [1190, 36, 40], [1236, 36, 40]].forEach(([x, w, h], i) => { b += R(x, 196 - h, w, h, .38 + i * .02, 'ln', 4) + R(x + 4, 188 - h, w - 8, 8, .4 + i * .02, 'ln thin', 2); });
  /* bancadas e armários baixos */
  m += F(76, 478, 568, 12, .3, .14) + R(76, 478, 568, 12, .3, 'ln bold') + R(84, 490, 556, 290, .32);
  for (let i = 1; i < 5; i++) { const x = 84 + i * 111.2; m += L(x, 490, x, 780, .36 + i * .01, 'ln thin') + C(x - 16, 522, 4, .4); }
  m += C(624, 522, 4, .42) + P('M412 478 V440 C412 418 444 418 444 438', .42, 'ln bold');
  m += P('M120 478 l6 -34 h44 l6 34 Z', .44, 'ln solid') + P('M148 444 C130 410 120 400 110 380 M148 444 C150 400 160 390 170 366 M148 444 C170 420 186 416 196 400', .48);
  m += F(956, 478, 240, 12, .32, .14) + R(956, 478, 240, 12, .32, 'ln bold') + R(964, 490, 224, 290, .34) + L(1076, 490, 1076, 780, .38, 'ln thin') + C(1062, 522, 4, .42) + C(1090, 522, 4, .42);
  /* café passado e pão de queijo */
  m += P('M1002 478 l-6 -38 h44 l-6 38 Z', .5, 'ln solid') + P('M992 414 h56 l-12 26 h-32 Z', .52, 'ln solid') + P('M1040 448 q16 4 6 22', .54, 'ln thin');
  m += L(1096, 478, 1176, 478, .54, 'ln bold') + P('M1104 478 a10 9 0 0 1 20 0 M1124 478 a10 9 0 0 1 20 0 M1144 478 a10 9 0 0 1 20 0 M1114 469 a10 9 0 0 1 20 0 M1134 469 a10 9 0 0 1 20 0', .58);
  /* mesa redonda de pé central, cadeiras e pendente */
  f += `<polygon class="cone" points="1345,310 1465,310 1600,556 1210,556"/>` + L(1405, 0, 1405, 252, .5) + P('M1345 310 C1345 250 1465 250 1465 310 Z', .56, 'ln bold solid');
  f += R(1240, 556, 330, 14, .5, 'ln bold solid', 7) + P('M1396 570 V720 C1396 760 1330 770 1310 800 M1414 570 V720 C1414 760 1480 770 1500 800 M1405 724 V800', .56);
  f += P('M1353 530 a52 26 0 0 0 104 0 Z', .6, 'ln solid') + C(1385, 520, 12, .64) + C(1410, 516, 13, .66) + C(1433, 522, 11, .68);
  const cadeira = (x, s, d) => P(`M${x} 800 L${x + 4 * s} 640 L${x - 8 * s} 428`, d, 'ln bold') + R(Math.min(x, x + 92 * s), 634, 92, 10, d + .02, 'ln bold solid', 4) + L(x + 88 * s, 644, x + 92 * s, 800, d + .04, 'ln bold') + L(x + 3 * s, 730, x + 90 * s, 730, d + .06, 'ln thin')
    + P(`M${x - 4 * s} 500 h${14 * s} M${x - 6 * s} 464 h${14 * s}`, d + .06);
  f += cadeira(1196, 1, .6) + cadeira(1612, -1, .64);
  return `<g class="back">${b}</g><g class="mid">${m}</g><g class="front">${f}</g>`;
}
function cenaSobreFogao() {
  /* chaleira e panela sobre as grelhas (só na cozinha residencial) */
  let k = '';
  k += P('M700 492 C690 470 700 446 725 446 C750 446 760 470 750 492 Z', .6, 'ln bold solid') + P('M751 474 l22 -14', .64, 'ln bold') + P('M708 450 C708 424 742 424 742 450', .66) + C(725, 442, 4, .66, 'ln solid');
  k += `<g class="steam">` + P('M780 452 c-8 -14 8 -22 0 -36 M794 446 c-8 -14 8 -22 0 -36', .7, 'ln thin') + `</g>`;
  k += R(845, 462, 70, 30, .62, 'ln bold solid', 3) + L(838, 462, 922, 462, .64, 'ln bold') + P('M872 462 v-8 h16 v8', .66) + L(838, 474, 828, 474, .66) + L(922, 474, 932, 474, .66);
  return k;
}

const DETALHES = [
  ['Grelhas de ferro fundido', 'Quatro grelhas de 30 × 30 em ferro fundido, uma por boca.'],
  ['Bocas simples e duplas', 'Dois queimadores simples e dois duplos.'],
  ['Painel e manípulos', 'Sete manípulos alinhados no painel frontal, na cor do fogão.'],
  ['Estrutura em aço carbono', 'Corpo em aço carbono de alta resistência com pintura eletrostática.'],
  ['Forno de 100 litros', 'Forno embutido, com 580,7 × 670,8 × 450,5 mm por dentro.'],
  ['Pés emborrachados', 'Nas quatro colunas, como em toda a linha.']
];
const OFFS = [-215, -135, -88, -40, 0];
const LBL_Y = [293, 352, 405, 476, 627, 781];

function montarPalco() {
  $('#sceneG').innerHTML = cenaGourmet();
  $('#sceneR').innerHTML = cenaResidencial();
  $('#onStove').innerHTML = cenaSobreFogao();
  $('#stZ').setAttribute('href', IMG.zilda_hi);
  $('#stC').setAttribute('href', IMG.carlos_hi);
  $('#stM').setAttribute('href', IMG.meire_hi);
  $$('#slices image').forEach(i => i.setAttribute('href', IMG.meire_hi));       // vista explodida: Meire
  $('#cu1').src = IMG.close_rosa; $('#cu2').src = IMG.close_helena; $('#cu3').src = IMG.close_carlos;
  // chamas: duas bocas visíveis de frente
  const chama = (x) => `<path class="flame" d="M${x} 522 c-5 -7 -4 -16 0 -24 c4 8 5 17 0 24Z" fill="#3F7FE0"/><path class="flame" d="M${x} 522 c-2 -4 -2 -8 0 -12 c2 4 2 8 0 12Z" fill="#CFE6FF"/>`;
  let fl = ''; [725, 875].forEach(cx => { for (let i = -4; i <= 4; i++) fl += chama(cx + i * 7.5); });
  $('#flames').innerHTML = fl;
  // rótulos da vista explodida (dentro do grupo do fogão para acompanhar a escala)
  const labels = $('#labels');
  labels.innerHTML = DETALHES.map((d, i) => `<g data-l="${i}"><path class="lead" d="M958 ${LBL_Y[i]} H992"/><circle cx="958" cy="${LBL_Y[i]}" r="3" fill="var(--navy)"/><text class="lbl" x="1000" y="${LBL_Y[i] + 6}">${esc(d[0])}</text></g>`).join('');
  $('#details').innerHTML = DETALHES.map((d, i) => `<li data-i="${i}">${esc(d[0])}<span>${esc(d[1])}</span></li>`).join('');
  // faixas
  const cs = COLORS;
  $('#stripes').innerHTML = cs.map(c => `<button class="stripe" style="background:${c[4]}" ${c[0] === 'meire' || c[0] === 'mateus' ? 'data-light' : ''} data-act="ver-modelo" data-id="${c[0]}" aria-label="Ver ${esc(c[1])}, ${esc(c[3])}"></button>`).join('');
  $('#stripeNames').innerHTML = cs.map(c => `<button data-act="ver-modelo" data-id="${c[0]}" tabindex="-1" style="--tc:${lum(c[4]) > 150 ? '#231F20' : '#F6F5F0'}">${esc(c[1])}</button>`).join('');
}

/* ---- motor de scroll: uma variável p (0–1) controla tudo ---- */
const pal = {};
function prepararScroll() {
  pal.stage = $('.stage'); pal.pin = $('#pin'); pal.stripes = $$('.stripe'); pal.g = $('#sceneG'); pal.r = $('#sceneR'); pal.on = $('#onStove');
  pal.stove = $('#stove'); pal.stZ = $('#stZ'); pal.stC = $('#stC'); pal.stM = $('#stM'); pal.slices = $('#slices'); pal.sl = $$('#slices .slice'); pal.flames = $('#flames');
  pal.dims = $('#dims'); pal.dimH = $('#dimH'); pal.labels = $('#labels'); pal.lb = $$('#labels g'); pal.det = $$('#details li');
  pal.pG = $('#plateG'); pal.pR = $('#plateR'); pal.pX = $('#plateX');
  pal.lines = $('#linhas'); pal.belt = $('#belt'); pal.ticks = $('#lticks');
  let raf = 0;
  const pedir = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; quadro(); }); };
  addEventListener('scroll', pedir, { passive: true }); addEventListener('resize', pedir);
  quadro();
}
function progresso() {
  const r = pal.stage.getBoundingClientRect(); const total = r.height - innerHeight;
  return total > 0 ? clamp(-r.top / total) : 0;
}
function par(g, t, k) { const [b, m, f] = g.children; if (!b) return; b.style.transform = `translateX(${(-14 * t * k).toFixed(2)}px)`; m.style.transform = `translateX(${(4 * t * k).toFixed(2)}px)`; f.style.transform = `translateX(${(34 * t * k).toFixed(2)}px)`; }
function quadro() {
  if ($('#site').hidden) return;
  quadroLinhas();
  const p = progresso(), S = pal.pin.style;
  const vh = pal.pin.clientHeight, vw = pal.pin.clientWidth;
  const un = Math.min(vh / 900, vw / 680);                                              // 1 unidade do SVG em px; em telas estreitas a cena encolhe para mostrar mais cozinha
  S.setProperty('--svgh', (un * 900).toFixed(1) + 'px');
  // hero
  S.setProperty('--heroText', (1 - seg(p, .015, .075)).toFixed(3));
  const h = seg(p, .045, .15);
  pal.stripes.forEach((s, i) => { s.style.transform = `scaleY(${(1 - ease(clamp(h * 1.5 - i / 10 * .5))).toFixed(3)})`; });
  $('#stripeNames').style.visibility = p > .08 ? 'hidden' : 'visible';
  // escala do fogão: maior no hero, natural nas cozinhas, um pouco maior na vista explodida
  const cabe = (vw * .82) / (300 * un);
  const kx = 1, sHero = Math.min(1.5, cabe), sExp = Math.min(1.2, cabe);
  const e = ease(seg(p, .8, .88));
  let s = lerp(sHero, 1, ease(seg(p, .07, .2))); s = lerp(s, sExp, e);
  const meio = vw / un / 2;                                                            // metade da largura visível, em unidades
  const xo = vw >= 900 ? clamp(Math.min(270, meio - 150 * sHero - 30), 0, 270) * (1 - ease(seg(p, .06, .2))) : 0;
  pal.stove.setAttribute('transform', `translate(${(800 + xo).toFixed(1)} ${800 - 28 * e}) scale(${s.toFixed(4)}) translate(-800 -800)`);
  // cozinha gourmet
  const dG = seg(p, .15, .34), oG = p < .13 ? 0 : 1 - seg(p, .41, .46);
  pal.g.style.setProperty('--draw', dG.toFixed(3)); pal.g.style.setProperty('--op', oG.toFixed(3)); pal.g.style.display = oG ? '' : 'none';
  par(pal.g, seg(p, .15, .46) - .5, 1);
  // ordem: Zilda (azul) na abertura, Carlos (preto) na cozinha gourmet, Meire (branco) na cozinha de casa e na vista explodida
  const m = ease(seg(p, .47, .53)), c = ease(seg(p, .14, .2)) * (m >= .999 ? 0 : 1);
  pal.stC.setAttribute('opacity', c.toFixed(3));
  // cozinha residencial
  const dR = seg(p, .48, .66), oR = p < .46 ? 0 : 1 - seg(p, .71, .76);
  pal.r.style.setProperty('--draw', dR.toFixed(3)); pal.r.style.setProperty('--op', oR.toFixed(3)); pal.r.style.display = oR ? '' : 'none';
  pal.on.style.setProperty('--draw', dR.toFixed(3)); pal.on.style.setProperty('--op', oR.toFixed(3)); pal.on.style.display = oR ? '' : 'none';
  par(pal.r, seg(p, .48, .76) - .5, 1);
  // vista explodida
  S.setProperty('--grid', (seg(p, .74, .8) * .9).toFixed(3));
  pal.dims.setAttribute('opacity', seg(p, .755, .795).toFixed(3));
  pal.dimH.setAttribute('opacity', (1 - seg(p, .8, .83)).toFixed(3));
  const aberto = e > .001;
  pal.slices.setAttribute('visibility', aberto ? 'visible' : 'hidden');
  pal.stZ.setAttribute('visibility', aberto || c >= .999 || m >= .999 ? 'hidden' : 'visible');
  pal.stM.setAttribute('opacity', m.toFixed(3)); pal.stM.setAttribute('visibility', aberto || m < .001 ? 'hidden' : 'visible');
  const ativo = p > .815 ? Math.min(5, Math.floor(seg(p, .815, .995) * 6)) : -1;
  const fatiaDe = [0, -1, 1, 2, 3, 4][ativo] ?? -2;   // "Bocas" (1) não é uma fatia: são as chamas
  pal.sl.forEach((g, i) => {
    g.setAttribute('transform', `translate(0 ${(OFFS[i] * e * kx).toFixed(2)})`);
    g.style.opacity = (ativo < 0 || fatiaDe === i || (ativo === 1 && i < 2) || (ativo === 3 && i >= 1)) ? 1 : .4;
  });
  pal.flames.setAttribute('transform', `translate(0 ${(OFFS[1] * e * kx).toFixed(2)})`);
  pal.flames.setAttribute('opacity', ativo === 1 ? 1 : 0);
  pal.labels.setAttribute('opacity', seg(p, .86, .9).toFixed(3));
  pal.lb.forEach((g, i) => g.setAttribute('opacity', i === ativo ? 1 : .4));
  pal.det.forEach((li, i) => li.classList.toggle('on', i === ativo));
  S.setProperty('--cu', seg(p, .81, .87).toFixed(3)); S.setProperty('--par', seg(p, .78, 1).toFixed(3));
  // carimbos
  pal.pG.classList.toggle('on', p > .2 && p < .42);
  pal.pR.classList.toggle('on', p > .53 && p < .72);
  pal.pX.classList.toggle('on', p > .8);
}

/* =====================================================================
   SITE PÚBLICO (lê tudo do estado: o que o admin edita aparece aqui)
   ===================================================================== */
const ui = { modelo: 'zilda', drawer: null, view: null, portal: 'vendas', erro: '', carrinho: null, checkout: null, acesso: null, catLoja: '', sacola: null, compra: null, catSite: 'colors', buscaSite: '' };
const cat = id => state.catalogo.categorias.find(c => c.id === id);
const prod = id => state.catalogo.produtos.find(p => p.id === id);
const colors = () => state.catalogo.produtos.filter(p => p.cat === 'colors' && p.ativo);
const lum = hex => { const n = parseInt(String(hex || '#888').replace('#', ''), 16); return ((n >> 16) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000; };
const fundoDe = hex => lum(hex) > 232 ? '#D3D2D2' : lum(hex) < 48 ? '#8E8C86' : hex;   // branco e preto precisam de um fundo que deixe o fogão aparecer
const claro = hex => { const n = parseInt(String(hex || '#888').replace('#', ''), 16); const r = n >> 16, g = n >> 8 & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 232; };

function renderSite() {
  const c = state.conteudo;
  $('#heroTitle').textContent = c.heroTitulo; $('#heroText').textContent = c.heroTexto;
  $('#txtG').textContent = c.txtG; $('#txtR').textContent = c.txtR;
  $('#gallery').innerHTML = c.galeria.map(r => `<figure class="${r === 'img:cover' ? 'wide' : ''}"><img loading="lazy" src="${src(r)}" alt="${r === 'img:cover' ? 'Família tomando café na cozinha, com um fogão Colors ao fundo' : 'Detalhe das grelhas e dos queimadores'}"></figure>`).join('');
  renderLinhas();
  if (typeof renderVitrine === 'function') renderVitrine();            // loja do consumidor final, depois de tudo
}

/* ---- outras linhas: uma "esteira" de painéis que anda com o scroll ---- */
const linhasAtivas = () => state.conteudo.linhas.filter(l => l.ativo && (cat(l.cat) || { ativa: true }).ativa);
function renderLinhas() {
  const ls = linhasAtivas(), sec = $('#linhas');
  sec.hidden = !ls.length; if (!ls.length) return;
  sec.style.height = ((ls.length - 1) * 90 + 100) + 'vh';
  $('#belt').innerHTML = ls.map((l, i) => `<article class="lp${l.bancada ? ' bench' : ''}${l.fotos.length > 1 ? ' duo' : ''}" aria-label="${esc(l.titulo)}">
    ${l.bancada ? '<div class="lp-bench"></div>' : ''}
    <div class="lp-prod">${l.fotos.slice(0, 2).map(r => `<img ${i ? 'loading="lazy"' : ''} src="${src(r)}" alt="${esc(l.titulo)}">`).join('')}</div>
    <div class="lp-text"><h3>${esc(l.titulo)}</h3><p>${esc(l.texto)}</p>
      <dl class="lp-facts">${l.fatos.filter(f => f[0] || f[1]).map(f => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl></div>
  </article>`).join('');
  $('#lindex').innerHTML = ls.map((l, i) => `<button data-act="linha" data-i="${i}">${esc(l.curto || l.titulo)}</button>`).join('');
  pal.lp = $$('#belt .lp'); pal.li = $$('#lindex button'); pal.lAtual = -1;
  if (pal.stage) quadro();
}
function quadroLinhas() {
  const sec = pal.lines; if (!sec || sec.hidden || !pal.lp || !pal.lp.length) return;
  const r = sec.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
  const total = r.height - innerHeight, q = total > 0 ? clamp(-r.top / total) : 0, N = pal.lp.length;
  const pos = q * (N - 1), i = Math.min(N - 1, Math.floor(pos)), c = i + ease(seg(pos - i, .3, 1));   // cada painel fica parado um trecho antes de andar
  const w = pal.belt.clientWidth;
  pal.belt.style.transform = `translate3d(${(-c * w).toFixed(1)}px,0,0)`;
  pal.ticks.style.backgroundPositionX = (-c * w).toFixed(1) + 'px';
  pal.lp.forEach((p, k) => { const d = k - c, perto = Math.abs(d) < 1.15; p.style.visibility = perto ? '' : 'hidden'; if (perto) p.style.setProperty('--d', d.toFixed(3)); });
  const a = Math.round(c);
  if (a !== pal.lAtual) {
    pal.lAtual = a; pal.li.forEach((b, k) => b.setAttribute('aria-current', k === a));
    $('#lcount').textContent = (a + 1) + ' de ' + N;
    const b = pal.li[a], nav = b.parentNode; nav.scrollLeft = b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2;
  }
}
function irParaLinha(i) {
  const sec = pal.lines, N = pal.lp.length; if (N < 2) return sec.scrollIntoView();
  scrollTo({ top: sec.offsetTop + (sec.offsetHeight - innerHeight) * Math.min(1, (i + .08) / (N - 1)), behavior: 'auto' });
}
// faixa colorida da abertura: leva à loja e abre a ficha daquele fogão
function irParaModelo(id) {
  const p = prod(id) || state.catalogo.produtos.find(x => x.leg === id), loja = $('#loja');
  if (loja && !loja.hidden) {
    loja.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    if (p && p.ativo && typeof naVitrine === 'function' && naVitrine().some(x => x.id === p.id)) { ui.drawer = { tipo: 'ficha', ids: [p.id], ctx: 'site', pub: true, sel: null, forno: '', qtd: 1 }; renderDrawer(); }
  } else $('#galeria').scrollIntoView();
}
