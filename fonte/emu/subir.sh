#!/bin/sh
# uso: subir.sh  -> liga o PostgreSQL local (se preciso), recria o banco jcn_emu com schema.sql + atualizacao-1.sql e cria as contas de teste
R=/home/claude/real
P="psql -h /var/tmp/pgjcn -p 5544 -U postgres -v ON_ERROR_STOP=1 -q -X"
pg_isready -h /var/tmp/pgjcn -p 5544 -q || runuser -u postgres -- /usr/lib/postgresql/16/bin/pg_ctl -D /var/tmp/pgjcn/data -l /var/tmp/pgjcn/log -o "-p 5544 -k /var/tmp/pgjcn -c listen_addresses=''" -w start >/dev/null
$P -d postgres -c "drop database if exists jcn_emu" -c "drop database if exists jcn" 2>&1 | grep -v "does not exist, skipping"
for r in anon authenticated service_role; do $P -d postgres -c "drop role if exists $r" 2>&1 | grep -v "does not exist, skipping"; done
$P -d postgres -c "create database jcn_emu" && $P -d jcn_emu -f $R/emu/stub.sql && $P -d jcn_emu -f ${SCHEMA:-$R/sql/schema-instalado.sql} >/dev/null && { [ -n "$SEM_ATUALIZACAO" ] || { $P -d jcn_emu -f $R/sql/atualizacao-1.sql >/dev/null && $P -d jcn_emu -f $R/sql/atualizacao-2.sql >/dev/null && $P -d jcn_emu -f $R/sql/atualizacao-3.sql >/dev/null && $P -1 -d jcn_emu -f $R/sql/atualizacao-4.sql >/dev/null && $P -d jcn_emu -f $R/emu/stub-extras.sql >/dev/null && grep -v "^create extension" $R/sql/atualizacao-5.sql | $P -1 -d jcn_emu >/dev/null && $P -1 -d jcn_emu -f $R/sql/atualizacao-6.sql >/dev/null; }; } && $P -d jcn_emu -f $R/emu/contas.sql && echo "BANCO OK"
