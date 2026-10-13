# Gera sql/atualizacao-1.sql (para rodar no Supabase que já tem o schema.sql) e o schema.sql completo (instalação do zero)
import json, subprocess, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat = json.loads(subprocess.check_output(['node', '-e', '''
const fs=require('fs');const s=fs.readFileSync(process.argv[1]+'/src/catalogo.js','utf8');
const t=fs.readFileSync(process.argv[1]+'/src/site.js','utf8');
const o=new Function(s+';return {CAT26};')();
const m=t.match(/const COLORS = \\[[\\s\\S]*?\\n\\];/)[0];
const c=new Function(m+';return COLORS;')();
console.log(JSON.stringify({cat26:o.CAT26.map(r=>({nome:r[2],codigo:r[3],foto:r[8]})),colors:c.map(r=>({id:r[0],codigo:r[2]}))}));
''', R]))
q = lambda s: "'" + s.replace("'", "''") + "'"
linhas = [f"({q(c['codigo'])}, '', {q('img:' + c['id'])})" for c in cat['colors']]
linhas += [f"({q(r['codigo'])}, {q('' if r['codigo'] else r['nome'])}, {q('img:c_' + r['foto'])})" for r in cat['cat26'] if r['foto']]
fotos = ',\n  '.join(linhas)
SQL = f'''-- =====================================================================
-- JCN GOURMET — ATUALIZAÇÃO 1 DO BANCO (site real)
-- Rode no Supabase: SQL Editor, cole tudo, botão Run.
-- Pode rodar mais de uma vez sem estragar nada.
-- =====================================================================

-- 1. FOTOS DO CATÁLOGO
-- As fotos que vieram do catálogo ficam na pasta img/ do site; a referência começa com "img:".
-- As fotos enviadas depois pelo painel ficam no Storage (bucket "publico").
insert into fotos_produto (produto_id, caminho, ordem)
select p.id, v.caminho, 0
from (values
  {fotos}
) as v (codigo, nome, caminho)
join produtos p on (v.codigo <> '' and p.codigo = v.codigo) or (v.codigo = '' and p.codigo is null and p.nome = v.nome)
where not exists (select 1 from fotos_produto f where f.produto_id = p.id);

'''
SQL += open(R + '/sql/parte2.sql', encoding='utf-8').read()
open(R + '/sql/atualizacao-1.sql', 'w', encoding='utf-8').write(SQL)
print('atualizacao-1.sql', len(SQL) // 1024, 'KB,', len(linhas), 'fotos')
