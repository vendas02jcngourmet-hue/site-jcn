# Monta a pasta do site (dist/) para subir no cPanel: index.html, app.js, estilo.css, config.js, img/ e .htaccess
import json, os, base64, re, shutil, sys, hashlib
R = os.path.dirname(os.path.abspath(__file__)); S = R + '/src'; D = os.environ.get('OUT', R + '/dist')
URL = os.environ.get('SB_URL', 'https://kazrmgbqrfanhbtdxidi.supabase.co'); CHAVE = os.environ.get('SB_CHAVE', 'sb_publishable_a9MtS1WxDXpsGPR6z4B3Rg_TvdUqdr8')
DOMINIO = os.environ.get('DOMINIO_LOGINS', '')
shutil.rmtree(D, ignore_errors=True); os.makedirs(D + '/img')
EXT = {'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/gif': 'gif'}
imgs = json.load(open(S + '/images.json')); mapa = {}
for k, v in imgs.items():
    m = re.match(r'data:([^;]+);base64,(.*)', v, re.S); assert m, k
    nome = re.sub(r'[^A-Za-z0-9_-]', '-', k) + '.' + EXT[m.group(1)]
    open(f'{D}/img/{nome}', 'wb').write(base64.b64decode(m.group(2))); mapa[k] = 'img/' + nome
ler = lambda n: open(f'{S}/{n}', encoding='utf-8').read()
open(f'{D}/img/index.html', 'w').write('')            # a pasta de imagens não lista os arquivos
# o site público não leva a tabela de preços no arquivo: os valores vêm do banco, conforme o login de quem abre
import subprocess
catalogo = subprocess.check_output(['node', '-e', """
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');
const o=new Function(s+';return {CAT26_TEXTOS,PRECO_COLORS,CAT26,FORNOS_POR,CATEGORIAS};')();
o.CAT26.forEach(r=>{r[9]=0;}); o.PRECO_COLORS={};
console.log('/* Catálogo JCN 2026: textos e fichas (sem preços) */\\n'+Object.keys(o).map(k=>'const '+k+' = '+JSON.stringify(o[k])+';').join('\\n'));
""", S + '/catalogo.js'], text=True)
js = "'use strict';\n" + '\n'.join([catalogo, ler('site.js').replace("'use strict';\n", '', 1).replace('__IMAGES__', json.dumps(mapa)), ler('supa.js'),
     ler('app.js').replace("'use strict';\n", '', 1), ler('loja.js'), ler('vitrine.js'), ler('financeiro.js'), ler('dados.js'), ler('init.js')])
js = '(function(){\n' + js + '\n})();\n'
css = ler('style.css')
v = hashlib.sha1((js + css).encode()).hexdigest()[:8]            # muda o nome a cada versão: o navegador não fica com arquivo velho
open(f'{D}/app.{v}.js', 'w', encoding='utf-8').write(js); open(f'{D}/estilo.{v}.css', 'w', encoding='utf-8').write(css)
open(f'{D}/config.js', 'w', encoding='utf-8').write(f"""// Endereço e chave PÚBLICA do projeto no Supabase. Esta chave pode ficar à vista: quem protege os dados são as regras do banco.
// Nunca coloque aqui a chave secreta (sb_secret_...), a service_role nem a senha do banco.
window.CONFIG = {{
  url: {json.dumps(URL)},
  chave: {json.dumps(CHAVE)},
  dominio_dos_logins: {json.dumps(DOMINIO)},      // em branco = usa o domínio do próprio site. Serve só para formar o endereço interno das lojas (loja-nome@dominio); nenhum e-mail é enviado
  segundos_entre_atualizacoes: 30
}};
""")
host = re.sub(r'^https?://', '', URL).rstrip('/'); esquema = URL.split('://')[0]
csp = (f"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
       f"img-src 'self' data: blob: {esquema}://{host}; connect-src 'self' {esquema}://{host}; frame-src blob:; object-src 'self' blob:; base-uri 'self'; form-action 'self'")
html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>JCN Gourmet — Fogões Linha Colors, industriais e acessórios</title>
<meta name="description" content="JCN Gourmet, fábrica em Catanduva, SP: fogões da Linha Colors, fogões industriais, fornos, chapeiras e acessórios. Compre direto da fábrica.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;1,400&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,700;1,800&family=Tangerine:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="estilo.{v}.css">
</head>
<body>
{ler('body.html')}
<noscript><p style="padding:24px">Este site precisa de JavaScript ligado no navegador.</p></noscript>
<script src="config.js"></script>
<script src="app.{v}.js"></script>
</body>
</html>
'''
open(f'{D}/index.html', 'w', encoding='utf-8').write(html)
# página de conferência (verificar.html): confere a ligação com o banco e as travas, sem gravar nada
open(f'{D}/verificar.js', 'w', encoding='utf-8').write(ler('verificar.js'))
open(f'{D}/verificar.html', 'w', encoding='utf-8').write(f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' {esquema}://{host}; object-src 'none'; base-uri 'self'; form-action 'self'">
<title>JCN Gourmet — Conferência do site</title>
<style>
:root{{color-scheme:light dark;--fundo:#F6F5F0;--tinta:#1E2433;--fraco:#5B6272;--cartao:#fff;--borda:#D8D6CE;--ok:#1E7A46;--aviso:#9A6200;--erro:#B3261E;--azul:#233B72}}
@media (prefers-color-scheme:dark){{:root{{--fundo:#12172A;--tinta:#ECEAE2;--fraco:#A9AFBF;--cartao:#1B2240;--borda:#343C5C;--ok:#6FD39A;--aviso:#F0B954;--erro:#FF8A80;--azul:#9DB4F0}}}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--fundo);color:var(--tinta);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:28px 16px 60px}} h1{{font-size:1.6rem;margin:0 0 4px;color:var(--azul)}} h2{{font-size:1.15rem;margin:32px 0 8px}}
.sub{{color:var(--fraco);margin:0 0 20px}} #resumo{{font-weight:600;padding:12px 14px;border:1px solid var(--borda);border-radius:8px;background:var(--cartao);margin:0 0 14px}}
ul{{list-style:none;padding:0;margin:0;display:grid;gap:8px}} li{{background:var(--cartao);border:1px solid var(--borda);border-left-width:5px;border-radius:8px;padding:10px 14px}}
li p{{margin:2px 0 0;color:var(--fraco)}} .ok{{border-left-color:var(--ok)}} .aviso{{border-left-color:var(--aviso)}} .erro{{border-left-color:var(--erro)}}
li.ok b,#resumo.ok,p.ok{{color:var(--ok)}} li.aviso b,#resumo.aviso,p.aviso{{color:var(--aviso)}} li.erro b,#resumo.erro,p.erro{{color:var(--erro)}}
form{{display:grid;gap:10px;grid-template-columns:1fr 1fr auto;align-items:end;background:var(--cartao);border:1px solid var(--borda);border-radius:8px;padding:14px}}
label{{display:grid;gap:4px;font-size:.9rem;color:var(--fraco)}} input{{font:inherit;padding:9px 10px;border:1px solid var(--borda);border-radius:6px;background:var(--fundo);color:var(--tinta);min-width:0}}
button{{font:inherit;font-weight:600;padding:10px 16px;border-radius:6px;border:1px solid var(--azul);background:var(--azul);color:#fff;cursor:pointer}} button.leve{{background:transparent;color:var(--azul)}}
@media (prefers-color-scheme:dark){{button{{color:#12172A}} button.leve{{color:var(--azul)}}}}
#conta p{{margin:10px 0 0;font-weight:600}} a{{color:var(--azul)}} @media (max-width:620px){{form{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<main>
  <h1>Conferência do site</h1>
  <p class="sub">Esta página testa se o site publicado está falando com o banco de dados e se as travas de segurança estão valendo. Ela só lê: não grava nem apaga nada.</p>
  <p id="resumo" role="status">Conferindo…</p>
  <ul id="lista"></ul>
  <p style="margin:14px 0 0"><button type="button" class="leve" id="de-novo">Conferir de novo</button> &nbsp; <a href="./">Abrir o site</a></p>
  <h2>Conferir a conta de administrador (opcional)</h2>
  <p class="sub">Digite o e-mail e a senha do usuário que você criou no Supabase. A página só confere e sai em seguida; a senha não é guardada.</p>
  <form id="form" autocomplete="off">
    <label>E-mail<input id="email" type="email" autocomplete="username"></label>
    <label>Senha<input id="senha" type="password" autocomplete="current-password"></label>
    <button>Conferir conta</button>
  </form>
  <div id="conta" role="status"></div>
  <noscript><p>Esta página precisa de JavaScript ligado.</p></noscript>
</main>
<script src="config.js"></script>
<script src="verificar.js"></script>
</body>
</html>
''')
open(f'{D}/.htaccess', 'w').write('''# JCN Gourmet: regras do servidor (Apache / cPanel)
<IfModule mod_rewrite.c>
RewriteEngine On
# sempre em HTTPS
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Strict-Transport-Security "max-age=31536000" env=HTTPS
# os arquivos com código no nome nunca mudam: podem ficar guardados no navegador
<FilesMatch "\\.[0-9a-f]{8}\\.(js|css)$">
Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
<FilesMatch "\\.(webp|png|jpg|svg)$">
Header set Cache-Control "public, max-age=2592000"
</FilesMatch>
<FilesMatch "^(index\\.html|verificar\\.html|verificar\\.js|config\\.js)$">
Header set Cache-Control "no-cache"
</FilesMatch>
</IfModule>
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
''')
tam = sum(os.path.getsize(os.path.join(p, f)) for p, _, fs in os.walk(D) for f in fs)
print(f'{D}: app.{v}.js {len(js)//1024} KB, estilo {len(css)//1024} KB, {len(mapa)} imagens, total {tam//1024} KB')
