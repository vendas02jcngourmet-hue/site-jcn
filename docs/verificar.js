/* Página de conferência: testa, do navegador de quem abre, se o site está falando com o banco e se as travas estão valendo.
   Não grava nada. A parte do login é opcional e serve para conferir a conta de administrador. */
(function () {
  'use strict';
  var C = window.CONFIG || {}, U = String(C.url || '').replace(/\/+$/, ''), K = C.chave || '';
  var lista = document.getElementById('lista'), resumo = document.getElementById('resumo');
  function chamar(caminho, op) {
    op = op || {}; var h = { apikey: K, Authorization: 'Bearer ' + (op.token || K) };
    if (op.body) h['Content-Type'] = 'application/json';
    return fetch(U + caminho, { method: op.method || 'GET', headers: h, body: op.body ? JSON.stringify(op.body) : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { } return { ok: r.ok, status: r.status, j: j }; }); });
  }
  function linha(estado, titulo, texto) {
    var li = document.createElement('li'); li.className = estado;
    var b = document.createElement('b'); b.textContent = (estado === 'ok' ? 'Certo' : estado === 'aviso' ? 'Atenção' : 'Falta') + ': ' + titulo;
    var p = document.createElement('p'); p.textContent = texto;
    li.appendChild(b); li.appendChild(p); lista.appendChild(li); return estado;
  }
  function contar(tabela, token) { return chamar('/rest/v1/' + tabela + '?select=*&limit=1000', { token: token }).then(function (r) { return r.ok && Array.isArray(r.j) ? r.j.length : -r.status; }); }
  var feitos = [];
  function passo(p) { return p.then(function (e) { feitos.push(e); }, function () { feitos.push(linha('erro', 'sem resposta', 'O navegador não conseguiu falar com o servidor neste teste. Confira a internet e o endereço em config.js.')); }); }

  function geral() {
    lista.innerHTML = ''; feitos = []; resumo.textContent = 'Conferindo…';
    if (!U || !K) { linha('erro', 'config.js', 'O arquivo config.js não foi encontrado ou está sem o endereço e a chave do Supabase. Envie o config.js junto com os outros arquivos.'); resumo.textContent = 'Falta o config.js.'; return Promise.resolve(); }
    if (/secret|service_role/i.test(K) || /^eyJ/.test(K) && /c2VydmljZV9yb2xl/.test(K)) linha('erro', 'chave errada em config.js', 'A chave em config.js parece ser a chave SECRETA. Troque agora pela chave pública (publishable) e gere outra chave secreta no Supabase.');
    return passo(Promise.resolve(location.protocol === 'https:' ? linha('ok', 'site com cadeado (HTTPS)', 'O endereço abre com https://.') : linha('aviso', 'site sem cadeado', 'Este endereço abriu sem https://. No cPanel, ative o certificado SSL (AutoSSL ou Let\'s Encrypt) para o domínio.')))
      .then(function () { return passo(contar('categorias').then(function (n) { return n > 0 ? linha('ok', 'o site fala com o banco', n + ' categorias lidas do Supabase.') : linha('erro', 'o site não leu o banco', n === 0 ? 'O banco respondeu, mas está vazio: rode o arquivo schema.sql no Supabase (SQL Editor).' : 'O Supabase respondeu com erro ' + (-n) + '. Confira o endereço e a chave em config.js.'); })); })
      .then(function () { return passo(contar('produtos').then(function (n) { return n > 0 ? linha('ok', 'catálogo no banco', n + ' produtos ativos.') : linha('erro', 'catálogo vazio', 'Nenhum produto encontrado: rode o schema.sql no Supabase.'); })); })
      .then(function () { return passo(contar('vitrine').then(function (n) { return n > 0 ? linha('ok', 'loja do site com preços', n + ' produtos à venda para o consumidor.') : linha('aviso', 'loja do site sem produtos', 'A loja está fechada ou sem preços. Abra em Área restrita, Site e galeria.'); })); })
      .then(function () { return passo(Promise.all([contar('fotos_produto'), chamar('/rest/v1/rpc/email_do_login', { method: 'POST', body: { p_login: 'conferencia' } })]).then(function (r) { return r[0] > 0 && r[1].ok ? linha('ok', 'atualização 1 do banco', 'Fotos cadastradas (' + r[0] + ') e funções de login instaladas.') : linha('erro', 'atualização 1 do banco', 'Rode o arquivo atualizacao-1.sql no Supabase (SQL Editor, colar tudo, Run).'); })); })
      .then(function () {
        var fechadas = ['precos', 'pedidos', 'itens_pedido', 'perfis', 'configuracoes', 'catalogo_loja', 'anexos', 'parcelas_boleto'];
        return passo(Promise.all(fechadas.map(function (t) { return contar(t); })).then(function (ns) {
          var abertas = fechadas.filter(function (t, i) { return ns[i] > 0; });
          return abertas.length ? linha('erro', 'dados reservados à vista', 'Um visitante sem login conseguiu ler: ' + abertas.join(', ') + '. Rode de novo o schema.sql e o atualizacao-1.sql e me avise.') : linha('ok', 'dados reservados fechados', 'Sem login, ninguém lê tabela de preços, pedidos, contas, chave PIX nem comprovantes.');
        }));
      })
      .then(function () { return passo(chamar('/auth/v1/settings').then(function (r) {
          if (!r.ok || !r.j) return linha('erro', 'login', 'O serviço de login do Supabase não respondeu (erro ' + r.status + ').');
          if (r.j.disable_signup) return linha('erro', 'criação de logins desligada', 'No Supabase: Authentication, Sign In / Providers, ligue "Allow new users to sign up".');
          return r.j.mailer_autoconfirm ? linha('ok', 'criação de logins pelo painel', 'O painel consegue criar vendedores, representantes e lojas.') : linha('erro', 'confirmação de e-mail ligada', 'No Supabase: Authentication, Sign In / Providers, Email, desligue "Confirm email" e salve. Sem isso o painel não cria logins.');
        })); })
      .then(function () { return passo(chamar('/storage/v1/object/public/publico/conferencia.jpg').then(function (r) {
          var m = JSON.stringify(r.j || '');
          return /bucket/i.test(m) && /not found/i.test(m) ? linha('erro', 'pasta de fotos', 'A pasta "publico" não existe no Storage: rode o schema.sql no Supabase.') : linha('ok', 'pasta de fotos e de comprovantes', 'O Storage do Supabase respondeu.');
        })); })
      .then(function () {
        var e = feitos.filter(function (x) { return x === 'erro'; }).length, a = feitos.filter(function (x) { return x === 'aviso'; }).length;
        resumo.textContent = e ? e + (e > 1 ? ' itens precisam' : ' item precisa') + ' de ajuste. Veja abaixo o que fazer em cada um.' : a ? 'Tudo funcionando, com ' + a + ' ponto' + (a > 1 ? 's' : '') + ' de atenção.' : 'Tudo certo por aqui.';
        resumo.className = e ? 'erro' : a ? 'aviso' : 'ok';
      });
  }

  document.getElementById('form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = document.getElementById('email').value.trim().toLowerCase(), senha = document.getElementById('senha').value, out = document.getElementById('conta');
    out.innerHTML = ''; var dizer = function (estado, t) { var p = document.createElement('p'); p.className = estado; p.textContent = t; out.appendChild(p); };
    if (!email || !senha) return dizer('erro', 'Informe o e-mail e a senha.');
    dizer('', 'Conferindo…');
    chamar('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: senha } }).then(function (r) {
      out.innerHTML = '';
      if (!r.ok) return dizer('erro', /confirm/i.test(JSON.stringify(r.j)) ? 'Este usuário existe, mas o e-mail não está confirmado. No Supabase: Authentication, Users, abra o usuário e confirme o e-mail (ou apague e crie de novo marcando "Auto Confirm User").' : 'E-mail ou senha não conferem. Confira em Supabase, Authentication, Users, se o usuário existe; se esqueceu a senha, redefina por lá.');
      var t = r.j.access_token, id = r.j.user.id;
      return chamar('/rest/v1/perfis?select=nome,papel,ativo&id=eq.' + id, { token: t }).then(function (p) {
        var eu = p.ok && p.j && p.j[0];
        if (!eu) dizer('erro', 'O login funciona, mas esta conta ainda não tem perfil. Rode no SQL Editor o comando do passo "Tornar a sua conta administradora" do roteiro.');
        else if (!eu.ativo) dizer('erro', 'A conta existe, mas está desativada.');
        else if (eu.papel !== 'admin') dizer('aviso', 'Login certo. Esta conta é de ' + eu.papel + ', não de administrador.');
        else return Promise.all([contar('precos', t), contar('configuracoes', t)]).then(function (n) {
          dizer('ok', 'Conta de administrador pronta: ' + eu.nome + '. Tabela de preços lida com ' + n[0] + ' valores. Pode entrar pelo botão "Área restrita" do site.');
        });
      }).then(function () { return chamar('/auth/v1/logout?scope=local', { method: 'POST', token: t }); });
    }).catch(function () { out.innerHTML = ''; dizer('erro', 'Sem resposta do servidor. Confira a internet.'); });
  });
  document.getElementById('de-novo').addEventListener('click', geral);
  geral();
})();
