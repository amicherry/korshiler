/* ---------- Озвучка: реплика → id из voice/voice_lines.csv → out/<lang>/<id>.mp3 ----------
   Файлов может ещё не быть: тогда тихо остаётся «писк» текста. Ничего не переименовывать — id из таблицы. */
const VOICE = { cur: null, missing: new Set(), ok: new Set(), playing: false };
const vNorm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^0-9a-zа-яәіңғүұқөһ]+/g, '');
const VOICE_RX = { kz: [], ru: [] };
for (const lang of ['kz', 'ru']) for (const [tpl, id] of Object.entries(VOICE_TPL[lang] || {})) {
  const rx = tpl.toLowerCase().replace(/ё/g, 'е').replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[a-z]+\}/g, '(.+?)');
  VOICE_RX[lang].push([new RegExp('^' + rx + '$'), id]);
}
function voiceId(t, hero = false) {
  const lang = LANG === 'ru' ? 'ru' : 'kz', k = vNorm(t);
  if (hero && VOICE_HERO[lang][k]) return VOICE_HERO[lang][k];
  if (VOICE_IDS[lang][k]) return VOICE_IDS[lang][k];
  if (VOICE_HERO[lang][k]) return VOICE_HERO[lang][k];
  const low = String(t).toLowerCase().replace(/ё/g, 'е').trim();
  for (const [rx, id] of VOICE_RX[lang]) if (rx.test(low)) return id;
  return null;
}
function voiceStop() { if (VOICE.cur) { try { VOICE.cur.pause(); } catch (e) {} VOICE.cur = null; } VOICE.playing = false; }
function voicePlay(t, heroG = null) {   // heroG: 'f'/'m' — реплика героя, ищем в out/<lang>/hero_f или hero_m
  voiceStop();
  if (!SND.on || typeof Audio === 'undefined') return false;
  const id = voiceId(t, !!heroG); if (!id) return false;
  const src = `out/${LANG === 'ru' ? 'ru' : 'kz'}/${heroG ? 'hero_' + heroG + '/' : ''}${id}.mp3`;
  if (VOICE.missing.has(src)) return false;
  const a = new Audio(src); a.volume = .95; VOICE.cur = a;
  a.addEventListener('playing', () => { if (VOICE.cur === a) { VOICE.playing = true; VOICE.ok.add(src); } });
  a.addEventListener('ended', () => { if (VOICE.cur === a) VOICE.playing = false; });
  a.addEventListener('error', () => { VOICE.missing.add(src); if (VOICE.cur === a) { VOICE.playing = false; VOICE.cur = null; } });
  a.play().catch(() => { VOICE.playing = false; });
  return true;
}
