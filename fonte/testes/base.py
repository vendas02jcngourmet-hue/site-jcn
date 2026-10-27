# apoio aos testes: recria o banco local, monta o site apontando para a imitação do Supabase e abre o navegador
from playwright.sync_api import sync_playwright
import subprocess, sys, time, json, os, urllib.request
R = os.environ.get('JCN_RAIZ', '/home/claude/real'); PORTA = int(os.environ.get('PORTA', '8791')); B = f'http://127.0.0.1:{PORTA}/'; FX = '/home/claude/work/fx/'
DIST = '/tmp/claude-0/-home-claude/90de04ff-9fd3-52fc-9db3-a4982247f63f/scratchpad/dist-teste'
PSQL = ['psql', '-h', '/var/tmp/pgjcn', '-p', '5544', '-U', 'postgres', '-d', 'jcn_emu', '-X', '-At', '-v', 'ON_ERROR_STOP=1']
F = []
def ok(c, m):
    print(('OK   ' if c else 'FALHA') + ' ' + m, flush=True)
    if not c: F.append(m)
def banco(q):
    r = subprocess.run(PSQL + ['-c', q], capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr)
    return r.stdout.strip()
def subir(env=None):
    r = subprocess.run([R + '/emu/subir.sh'], capture_output=True, text=True, env=dict(os.environ, **(env or {}))); assert 'BANCO OK' in r.stdout, r.stdout + r.stderr
    e = dict(os.environ, SB_URL=B.rstrip('/'), SB_CHAVE='sb_publishable_teste', DOMINIO_LOGINS='jcn.test', OUT=DIST)
    subprocess.run([sys.executable, R + '/build.py'], env=e, check=True, capture_output=True)
    srv = subprocess.Popen([sys.executable, R + '/emu/emu.py', DIST, str(PORTA)], env=dict(os.environ, **(env or {})), stdout=subprocess.DEVNULL, stderr=open('/tmp/claude-0/-home-claude/90de04ff-9fd3-52fc-9db3-a4982247f63f/scratchpad/emu.err', 'w'))
    for _ in range(50):
        try: urllib.request.urlopen(B + 'config.js', timeout=1); break
        except Exception: time.sleep(.2)
    return srv
def recusas():
    return json.load(urllib.request.urlopen(B + '__emu/log'))
def pagina(br, w=1440, h=900, **kw):
    cx = br.new_context(viewport={'width': w, 'height': h}, **kw); pg = cx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(B) or r.request.url.startswith('blob:') or r.request.url.startswith('data:') else r.abort())
    it = pg.inner_text; pg.inner_text = lambda *a, **k: it(*a, **k).replace('\xa0', ' ')
    return pg, errs
def entrar(pg, aba, ident, senha):
    if pg.is_hidden('#app') or pg.locator('.login').count() == 0: pg.click('.site-head [data-act=abrir-login]'); pg.wait_for_timeout(150)
    pg.click(f'[data-portal={aba}][role=tab]'); pg.fill('#lgEmail', ident); pg.fill('#lgSenha', senha); pg.press('#lgSenha', 'Enter')
    try: pg.wait_for_selector('.side nav, .err', timeout=8000)
    except Exception: pass
    pg.wait_for_timeout(200)
def sair(pg):
    pg.click('[data-act=sair]'); pg.wait_for_selector('.login', timeout=8000); pg.wait_for_timeout(300)
def toast(pg): return pg.inner_text('.toast') if pg.locator('.toast:not([hidden])').count() else ''
def nav(pg): return [x.split('\n')[0] for x in pg.locator('.side nav button').all_inner_texts()]
def ir(pg, view):
    pg.click(f'[data-act=nav][data-view={view}]'); pg.wait_for_timeout(250)
def parado(pg, ms=450):
    """espera a gravação terminar (o site grava e relê em seguida)"""
    pg.wait_for_timeout(ms)
    try: pg.wait_for_load_state('networkidle', timeout=6000)
    except Exception: pass
    pg.wait_for_timeout(150)

NAO_RESTO = """(() => { const e = document.querySelector('.tc-etapa:not([hidden])'); e.querySelectorAll('.fc-sn').forEach(g => { if (!g.closest('[hidden]') && !g.querySelector('input:checked')) { const r = g.querySelector('input[value=nao]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }); })()"""
def nao_no_resto(pg): pg.evaluate(NAO_RESTO); pg.wait_for_timeout(100)

def fechar_orc(pg, cliente, cidade='', forma='pix', dias=(), comprovante=None):
    """o que antes era "Lançar pedido": monta o orçamento (com os itens já escolhidos no catálogo) e fecha; o pedido vai para o faturamento"""
    ir(pg, 'orcamentos'); pg.fill('[data-oc=nome]', cliente)
    if cidade: pg.fill('[data-oc=cidade]', cidade)
    pg.click('[data-act=oe-salvar]'); parado(pg, 900); pg.click('[data-act=oe-fechar]'); pg.wait_for_timeout(250)
    if forma == 'boleto':
        pg.check('input[name=fcforma][value=boleto]'); pg.wait_for_timeout(200)
        for d in dias: pg.check(f'[data-act=fc-dia][data-d="{d}"]'); pg.wait_for_timeout(150)
    pg.click('[data-act=oe-fechar-ok]'); parado(pg, 1200)
    msg = toast(pg); ir(pg, 'pedidos')
    if comprovante:
        pg.click(f'tr:has-text("{cliente}") [data-act=abrir-pedido]'); pg.wait_for_timeout(300); pg.set_input_files('[data-file=comp-pedido]', comprovante); parado(pg, 900); pg.click('.drawer .x'); pg.wait_for_timeout(200)
    return msg
