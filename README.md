# Site JCN Gourmet

- `docs/` — o site publicado (GitHub Pages lê esta pasta). Não editar à mão: é gerado.
- `fonte/` — código do site (`src/`), montagem (`build.py`), banco (`sql/`) e testes locais (`emu/`, `testes/`).

Para gerar de novo: `OUT=docs python3 fonte/build.py`.
O site fala com o Supabase só pela chave pública; quem protege os dados são as regras do banco (`fonte/sql`).
As senhas que aparecem em `fonte/testes` e `fonte/emu` são de um banco de teste local, não do site.
