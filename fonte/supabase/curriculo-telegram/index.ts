// Função do Supabase "curriculo-telegram": recebe do banco a foto ou o arquivo mandado no grupo do RH,
// baixa do Telegram, guarda na pasta privada "rh" e cadastra o currículo no site.
// O código do robô e o segredo ficam no cofre do Supabase: aqui não há nenhuma chave escrita.
const URL_SB = Deno.env.get('SUPABASE_URL')!;
const CHAVE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = (caminho: string, init: RequestInit = {}) =>
  fetch(URL_SB + caminho, { ...init, headers: { apikey: CHAVE, Authorization: 'Bearer ' + CHAVE, ...(init.headers || {}) } });
const rpc = async (fn: string, args: unknown) => {
  const r = await sb('/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + ': ' + (await r.text()));
  return r.json();
};
const TIPOS: Record<string, string> = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

Deno.serve(async (req) => {
  const cfg = await rpc('tg_cv_config', {});
  if (!cfg?.segredo || req.headers.get('x-jcn-segredo') !== cfg.segredo) return new Response('negado', { status: 401 });
  const m = await req.json();
  try {
    const ext = String(m.nome_arquivo || '').split('.').pop()!.toLowerCase();
    const mime = Object.values(TIPOS).includes(m.mime) ? m.mime : TIPOS[ext];
    if (!mime) throw new Error('mande o currículo em foto, PDF ou Word.');
    if (m.tamanho && m.tamanho > 10 * 1024 * 1024) throw new Error('o arquivo passa de 10 MB.');
    const f = await (await fetch(`https://api.telegram.org/bot${cfg.token}/getFile?file_id=${encodeURIComponent(m.file_id)}`)).json();
    if (!f.ok) throw new Error('o Telegram não entregou o arquivo (' + (f.description || 'erro') + ').');
    const bin = await (await fetch(`https://api.telegram.org/file/bot${cfg.token}/${f.result.file_path}`)).arrayBuffer();
    const extFinal = Object.entries(TIPOS).find(([, t]) => t === mime)![0];
    const caminho = `curriculos/telegram/${m.chat_id}-${m.message_id}.${extFinal}`.replace(/^curriculos\/telegram\/-/, 'curriculos/telegram/g');
    const up = await sb(`/storage/v1/object/rh/${caminho}`, { method: 'POST', headers: { 'Content-Type': mime, 'x-upsert': 'true' }, body: bin });
    if (!up.ok) throw new Error('não foi possível guardar o arquivo (' + (await up.text()).slice(0, 120) + ').');
    const r = await rpc('cv_do_telegram', { p: { ...m, caminho, mime } });
    return Response.json(r);
  } catch (e) {
    await rpc('cv_telegram_erro', { p_chat: m.chat_id, p_msg: String((e as Error).message || e) }).catch(() => {});
    return new Response(String(e), { status: 200 });
  }
});
