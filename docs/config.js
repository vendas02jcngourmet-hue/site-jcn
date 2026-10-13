// Endereço e chave PÚBLICA do projeto no Supabase. Esta chave pode ficar à vista: quem protege os dados são as regras do banco.
// Nunca coloque aqui a chave secreta (sb_secret_...), a service_role nem a senha do banco.
window.CONFIG = {
  url: "https://kazrmgbqrfanhbtdxidi.supabase.co",
  chave: "sb_publishable_a9MtS1WxDXpsGPR6z4B3Rg_TvdUqdr8",
  dominio_dos_logins: "",      // em branco = usa o domínio do próprio site. Serve só para formar o endereço interno das lojas (loja-nome@dominio); nenhum e-mail é enviado
  segundos_entre_atualizacoes: 30
};
