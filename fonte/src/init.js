/* ---------- início ---------- */
state = inicial();
montarPalco(); renderSite(); prepararScroll(); prepararTrabalhe();
try { ui.view = sessionStorage.getItem('jcn-tela') || null; } catch (e) { }
// a sessão caiu no servidor (senha trocada, conta desativada, muito tempo sem uso): volta para a tela de login
SB.aoPerderSessao = () => {
  if (!sessao) return;
  sessao = null; state.usuarios = []; state.pedidos = []; state.arquivos = {}; ui.erro = 'Sua sessão terminou. Entre de novo.';
  fecharDrawer(); if (!$('#app').hidden) renderApp();
  carregarCatalogo().then(carregarConteudo).then(redesenhar).catch(() => { });
};
(async () => {
  let naArea = false; try { naArea = sessionStorage.getItem('jcn-area') === '1'; } catch (e) { }
  try {
    if (await SB.sessaoValida()) {                       // a pessoa já tinha entrado neste aparelho
      await carregarContas();
      const u = state.usuarios.find(x => x.id === SB.id && x.ativo);
      if (u) {
        sessao = u.id; await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]); ligarRelogio();
        if (naArea) abrirApp(); else redesenhar();
        return;
      }
      await SB.sair(); state.usuarios = [];
    }
    await carregarCatalogo(); await Promise.all([carregarConteudo(), carregarPedidos()]);
    redesenhar(); ligarRelogio();
  } catch (e) { toast(e && e.rede ? e.message : 'Não foi possível carregar os dados agora. Atualize a página em alguns instantes.'); }
})();
