#!/usr/bin/env python3
"""Imitação local das três portas do Supabase usadas pelo site (/auth/v1, /rest/v1, /storage/v1) em cima de um
PostgreSQL de verdade, com as mesmas regras (RLS) do schema.sql. Serve também os arquivos do site.
Uso: emu.py <pasta do site> <porta> [banco]"""
import sys, os, re, json, subprocess, secrets, time, threading, mimetypes
from flask import Flask, request, Response, send_from_directory, abort
SITE, PORTA, BANCO = sys.argv[1], int(sys.argv[2]), (sys.argv[3] if len(sys.argv) > 3 else 'jcn_emu')
PSQL = ['psql', '-h', '/var/tmp/pgjcn', '-p', '5544', '-U', 'postgres', '-d', BANCO, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose']
ARQ = os.environ.get('EMU_ARQUIVOS', '/var/tmp/pgjcn/emu-arquivos'); os.makedirs(ARQ, exist_ok=True)
AUTOCONFIRMA = os.environ.get('EMU_AUTOCONFIRMA', '1') == '1'
VALIDADE = int(os.environ.get('EMU_VALIDADE', '3600'))
CHAVE = os.environ.get('EMU_CHAVE', 'sb_publishable_teste')
app = Flask(__name__); TOKENS = {}; REFRESH = {}; trava = threading.Lock()
LOG = []
ID = re.compile(r'^[a-z_][a-z0-9_]*$')

class ErroPG(Exception):
    def __init__(s, code, msg): s.code, s.msg = code, msg

def sql(q, v=None, papel=None, sub=None):
    """roda q (uma consulta que devolve um valor) dentro de uma transação, no papel indicado"""
    v = dict(v or {}); pre = 'begin;\n'
    if papel:
        v['_sub'] = sub or ''
        pre += f"select set_config('request.jwt.claim.sub', :'_sub', true) \\g /dev/null\nset local role {papel};\n"
    args = list(PSQL)
    for k, x in v.items(): args += ['-v', f'{k}={x}']
    r = subprocess.run(args + ['-f', '-'], input=pre + q + ';\ncommit;\n', capture_output=True, text=True)
    if r.returncode != 0:
        m = re.search(r'ERROR:\s+(\w{5}):\s+(.*)', r.stderr)
        raise ErroPG(m.group(1) if m else 'XX000', m.group(2).strip() if m else r.stderr.strip())
    return r.stdout.strip()

def quem():
    """papel e usuário do pedido, a partir do bilhete (como faz a porta de entrada do Supabase)"""
    if request.headers.get('apikey') != CHAVE and request.args.get('apikey') != CHAVE: abort(Response(json.dumps({'message': 'No API key found in request'}), 401, mimetype='application/json'))
    a = request.headers.get('Authorization', '')
    t = a.replace('Bearer ', '')
    if not a or t == CHAVE: return 'anon', None
    s = TOKENS.get(t)
    if not s or s['expira'] < time.time(): abort(Response(json.dumps({'code': 'PGRST301', 'message': 'JWT expired', 'msg': 'JWT expired'}), 401, mimetype='application/json'))
    return 'authenticated', s['uid']

def j(o, status=200): return Response(json.dumps(o, ensure_ascii=False) if not isinstance(o, str) else o, status, mimetype='application/json')
def erro_rest(e, papel):
    st = {'42501': 403 if papel == 'authenticated' else 401, '23505': 409, '23503': 409, '42P01': 404, '42883': 404}.get(e.code, 400)
    LOG.append((request.method, request.path, st, e.code, e.msg))
    return j({'code': e.code, 'details': None, 'hint': None, 'message': e.msg}, st)

# ------------------------------------------------------------------ auth
def sessao(uid, email):
    t, r = 'tk_' + secrets.token_urlsafe(24), 'rf_' + secrets.token_urlsafe(24)
    with trava: TOKENS[t] = {'uid': uid, 'expira': time.time() + VALIDADE, 'email': email}; REFRESH[r] = (uid, email)
    return {'access_token': t, 'token_type': 'bearer', 'expires_in': VALIDADE, 'refresh_token': r, 'user': {'id': uid, 'email': email, 'email_confirmed_at': '2026-01-01T00:00:00Z'}}

@app.get('/auth/v1/settings')
def a_settings():
    quem(); return j({'external': {'email': True}, 'disable_signup': False, 'mailer_autoconfirm': AUTOCONFIRMA})

@app.post('/auth/v1/signup')
def a_signup():
    quem(); b = request.get_json(force=True); email, senha = (b.get('email') or '').strip().lower(), b.get('password') or ''
    if not re.match(r'^[^@\s]+@[^@\s]+\.[a-z]{2,}$', email): return j({'code': 400, 'error_code': 'email_address_invalid', 'msg': f'Email address "{email}" is invalid'}, 400)
    if len(senha) < 6: return j({'code': 422, 'error_code': 'weak_password', 'msg': 'Password should be at least 6 characters.'}, 422)
    try:
        uid = sql("insert into auth.users (email, encrypted_password, email_confirmed_at) values (:'e', crypt(:'s', gen_salt('bf', 4)), case when :'c' = '1' then now() end) returning id", {'e': email, 's': senha, 'c': '1' if AUTOCONFIRMA else '0'})
    except ErroPG as e:
        if e.code == '23505': return j({'code': 422, 'error_code': 'user_already_exists', 'msg': 'User already registered'}, 422)
        raise
    uid = uid.split('\n')[0]
    if AUTOCONFIRMA: return j(sessao(uid, email))
    return j({'id': uid, 'email': email, 'confirmation_sent_at': '2026-01-01T00:00:00Z'})

@app.post('/auth/v1/token')
def a_token():
    quem(); b = request.get_json(force=True); g = request.args.get('grant_type')
    if g == 'password':
        r = sql("select id || '|' || email from auth.users where email = lower(:'e') and encrypted_password = crypt(:'s', encrypted_password) and email_confirmed_at is not null", {'e': b.get('email', ''), 's': b.get('password', '')})
        if not r: return j({'code': 400, 'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}, 400)
        uid, email = r.split('|'); return j(sessao(uid, email))
    if g == 'refresh_token':
        with trava: x = REFRESH.pop(b.get('refresh_token'), None)
        if not x: return j({'code': 400, 'error_code': 'refresh_token_not_found', 'msg': 'Invalid Refresh Token: Refresh Token Not Found'}, 400)
        return j(sessao(*x))
    return j({'msg': 'unsupported_grant_type'}, 400)

@app.put('/auth/v1/user')
def a_user():
    papel, uid = quem()
    if not uid: return j({'code': 401, 'msg': 'missing token'}, 401)
    s = (request.get_json(force=True) or {}).get('password')
    if s is not None:
        if len(s) < 6: return j({'code': 422, 'error_code': 'weak_password', 'msg': 'Password should be at least 6 characters.'}, 422)
        sql("update auth.users set encrypted_password = crypt(:'s', gen_salt('bf', 4)) where id = :'u'", {'s': s, 'u': uid})
    return j({'id': uid})

@app.post('/auth/v1/logout')
def a_logout():
    t = request.headers.get('Authorization', '').replace('Bearer ', '')
    with trava: TOKENS.pop(t, None)
    return Response('', 204)

# ------------------------------------------------------------------ rest
def filtros(args, v, pref='t.'):
    onde = []
    for k, bruto in args.items(multi=True):
        if k in ('select', 'order', 'limit', 'offset', 'on_conflict', 'columns', 'apikey'): continue
        if not ID.match(k): raise ErroPG('42703', f'coluna inválida {k}')
        op, _, val = bruto.partition('.')
        n = f'f{len(v)}'
        if op == 'eq': v[n] = val; onde.append(f"{pref}{k} = :'{n}'")
        elif op == 'neq': v[n] = val; onde.append(f"{pref}{k} <> :'{n}'")
        elif op in ('gt', 'gte', 'lt', 'lte'): v[n] = val; onde.append(f"{pref}{k} {dict(gt='>', gte='>=', lt='<', lte='<=')[op]} :'{n}'")
        elif op == 'is' and val == 'null': onde.append(f'{pref}{k} is null')
        elif op == 'in':
            itens = re.findall(r'"((?:[^"\\]|\\.)*)"|([^,()]+)', val.strip()[1:-1]); nomes = []
            for a, b2 in itens:
                n = f'f{len(v)}'; v[n] = a.replace('\\"', '"') if a or not b2 else b2; nomes.append(f":'{n}'")
            onde.append(f"{pref}{k} in ({', '.join(nomes) or 'null'})")
        else: raise ErroPG('PGRST100', f'filtro não suportado: {k}={bruto}')
    return (' where ' + ' and '.join(onde)) if onde else ''

def colunas(sel):
    if not sel or sel == '*': return '*'
    cs = sel.split(',')
    for c in cs:
        if not ID.match(c): raise ErroPG('PGRST100', 'select inválido')
    return ', '.join(cs)

@app.route('/rest/v1/rpc/<fn>', methods=['POST'])
def r_rpc(fn):
    papel, uid = quem()
    try:
        if not ID.match(fn): raise ErroPG('42883', 'função inválida')
        info = sql("select proretset::int || '|' || prorettype::regtype::text from pg_proc where proname = :'f' and pronamespace = 'public'::regnamespace", {'f': fn})
        if not info: raise ErroPG('42883', f'Could not find the function public.{fn}')
        conj, tipo = info.split('\n')[0].split('|'); b = request.get_json(force=True, silent=True) or {}; v = {}; ar = []
        tipos = dict(x.split('|') for x in sql("select unnest(proargnames) || '|' || unnest(proargtypes::regtype[]::text[]) from pg_proc where proname = :'f' and pronamespace = 'public'::regnamespace", {'f': fn}).split('\n') if '|' in x)
        for k, x in b.items():
            if not ID.match(k): raise ErroPG('42883', 'argumento inválido')
            if x is None: ar.append(f'{k} => null'); continue
            if isinstance(x, list) and tipos.get(k, '').endswith('[]'): v['a_' + k] = '{' + ','.join('"' + str(i).replace('\\', '\\\\').replace('"', '\\"') + '"' for i in x) + '}'; ar.append(f"{k} => :'a_{k}'"); continue
            v['a_' + k] = json.dumps(x, ensure_ascii=False) if isinstance(x, (dict, list)) else ('true' if x is True else 'false' if x is False else str(x))
            ar.append(f"{k} => :'a_{k}'")
        ch = f"public.{fn}({', '.join(ar)})"
        if conj == '1': return j(sql(f"select coalesce(json_agg(row_to_json(t)), '[]'::json) from {ch} t", v, papel, uid))
        if tipo == 'void': sql(f'select {ch}', v, papel, uid); return Response('', 204)
        r = sql(f'select to_json({ch})', v, papel, uid); return j(r or 'null')
    except ErroPG as e: return erro_rest(e, papel)

@app.route('/rest/v1/<tab>', methods=['GET', 'POST', 'PATCH', 'DELETE'])
def r_tab(tab):
    papel, uid = quem(); a = request.args; v = {}
    try:
        if not ID.match(tab): raise ErroPG('42P01', 'tabela inválida')
        T = f'public.{tab}'
        if request.method == 'GET':
            ordem = ''
            if a.get('order'):
                ps = []
                for o in a['order'].split(','):
                    c, _, d = o.partition('.')
                    if not ID.match(c) or d not in ('', 'asc', 'desc'): raise ErroPG('PGRST100', 'order inválido')
                    ps.append(f'{c} {d or "asc"}')
                ordem = ' order by ' + ', '.join(ps)
            lim = f" limit {int(a['limit'])}" if a.get('limit') else ''; off = f" offset {int(a['offset'])}" if a.get('offset') else ''
            return j(sql(f"select coalesce(json_agg(row_to_json(x)), '[]'::json) from (select {colunas(a.get('select'))} from {T} t{filtros(a, v)}{ordem}{lim}{off}) x", v, papel, uid))
        rep = 'return=representation' in request.headers.get('Prefer', '')
        if request.method == 'POST':
            b = request.get_json(force=True); linhas = b if isinstance(b, list) else [b]
            if not linhas: return j([], 201)
            cs = list(linhas[0].keys())
            for c in cs:
                if not ID.match(c): raise ErroPG('42703', 'coluna inválida')
            v['body'] = json.dumps(linhas, ensure_ascii=False); conf = ''
            if a.get('on_conflict'):
                ks = a['on_conflict'].split(',')
                for k in ks:
                    if not ID.match(k): raise ErroPG('42703', 'coluna inválida')
                if 'resolution=merge-duplicates' in request.headers.get('Prefer', ''):
                    resto = [c for c in cs if c not in ks]
                    conf = f" on conflict ({', '.join(ks)}) do " + ('update set ' + ', '.join(f'{c} = excluded.{c}' for c in resto) if resto else 'nothing')
            base = f"insert into {T} ({', '.join(cs)}) select {', '.join(cs)} from json_populate_recordset(null::{T}, :'body'::json){conf}"
            if rep: return j(sql(f"with n as ({base} returning *) select coalesce(json_agg(row_to_json(n)), '[]'::json) from n", v, papel, uid), 201)
            sql(base, v, papel, uid); return Response('', 201)
        if request.method == 'PATCH':
            b = request.get_json(force=True); cs = list(b.keys())
            for c in cs:
                if not ID.match(c): raise ErroPG('42703', 'coluna inválida')
            v['body'] = json.dumps(b, ensure_ascii=False)
            base = f"update {T} t set {', '.join(f'{c} = _n.{c}' for c in cs)} from json_populate_record(null::{T}, :'body'::json) _n{filtros(a, v)}"
            if rep: return j(sql(f"with n as ({base} returning t.*) select coalesce(json_agg(row_to_json(n)), '[]'::json) from n", v, papel, uid))
            sql(base, v, papel, uid); return Response('', 204)
        if request.method == 'DELETE':
            w = filtros(a, v)
            if not w: raise ErroPG('21000', 'DELETE requires a WHERE clause')
            base = f'delete from {T} t{w}'
            if rep: return j(sql(f"with n as ({base} returning t.*) select coalesce(json_agg(row_to_json(n)), '[]'::json) from n", v, papel, uid))
            sql(base, v, papel, uid); return Response('', 204)
    except ErroPG as e: return erro_rest(e, papel)

# ------------------------------------------------------------------ storage
def erro_st(codigo, erro, msg):
    LOG.append((request.method, request.path, codigo, erro, msg))
    return j({'statusCode': str(codigo), 'error': erro, 'message': msg}, 400)
def onde_fica(b, nome): return os.path.join(ARQ, b + '__' + re.sub(r'[^A-Za-z0-9._-]', '_', nome))

@app.post('/storage/v1/object/<b>/<path:nome>')
def s_enviar(b, nome):
    papel, uid = quem(); dados = request.get_data(); tipo = (request.headers.get('Content-Type') or '').split(';')[0]
    bk = sql("select coalesce(file_size_limit, 0) || '|' || coalesce(array_to_string(allowed_mime_types, ','), '') from storage.buckets where id = :'b'", {'b': b})
    if not bk: return erro_st(404, 'Bucket not found', 'Bucket not found')
    lim, tipos = bk.split('|')
    if int(lim) and len(dados) > int(lim): return erro_st(413, 'Payload too large', 'The object exceeded the maximum allowed size')
    if tipos and tipo not in tipos.split(','): return erro_st(415, 'invalid_mime_type', f'mime type {tipo} is not supported')
    try: sql("insert into storage.objects (bucket_id, name, owner, owner_id, metadata) values (:'b', :'n', nullif(:'u', '')::uuid, nullif(:'u', ''), json_build_object('mimetype', :'t', 'size', :'z')::jsonb)", {'b': b, 'n': nome, 'u': uid or '', 't': tipo, 'z': str(len(dados))}, papel, uid)
    except ErroPG as e:
        if e.code == '23505': return erro_st(409, 'Duplicate', 'The resource already exists')
        if e.code == '42501': return erro_st(403, 'Unauthorized', 'new row violates row-level security policy')
        return erro_st(500, 'DatabaseError', e.msg)
    open(onde_fica(b, nome), 'wb').write(dados)
    return j({'Key': f'{b}/{nome}', 'Id': secrets.token_hex(8)})

@app.get('/storage/v1/object/authenticated/<b>/<path:nome>')
def s_baixar(b, nome):
    papel, uid = quem()
    r = sql("select metadata->>'mimetype' from storage.objects where bucket_id = :'b' and name = :'n'", {'b': b, 'n': nome}, papel, uid)
    if not r: return erro_st(404, 'not_found', 'Object not found')
    return Response(open(onde_fica(b, nome), 'rb').read(), 200, mimetype=r)

@app.get('/storage/v1/object/public/<b>/<path:nome>')
def s_publico(b, nome):
    r = sql("select o.metadata->>'mimetype' from storage.objects o join storage.buckets k on k.id = o.bucket_id and k.public where o.bucket_id = :'b' and o.name = :'n'", {'b': b, 'n': nome})
    if not r: return erro_st(404, 'not_found', 'Object not found')
    return Response(open(onde_fica(b, nome), 'rb').read(), 200, mimetype=r)

@app.delete('/storage/v1/object/<b>/<path:nome>')
def s_apagar(b, nome):
    papel, uid = quem()
    r = sql("with d as (delete from storage.objects where bucket_id = :'b' and name = :'n' returning 1) select count(*) from d", {'b': b, 'n': nome}, papel, uid)
    if r != '1': return erro_st(404, 'not_found', 'Object not found')
    try: os.remove(onde_fica(b, nome))
    except OSError: pass
    return j({'message': 'Successfully deleted'})

# ------------------------------------------------------------------ apoio aos testes e arquivos do site
@app.get('/__emu/log')
def e_log():
    r = list(LOG); LOG.clear(); return j(r)

@app.route('/', defaults={'p': 'index.html'})
@app.route('/<path:p>')
def site(p):
    r = send_from_directory(SITE, p); r.headers['Cache-Control'] = 'no-store'; return r

@app.errorhandler(ErroPG)
def e_pg(e): return j({'code': e.code, 'message': e.msg, 'msg': e.msg}, 500)

if __name__ == '__main__':
    import logging; logging.getLogger('werkzeug').setLevel(logging.ERROR)
    app.run('127.0.0.1', PORTA, threaded=True)
