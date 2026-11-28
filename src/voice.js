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
// Голос играет через Web Audio (как музыка): на iPhone новый <audio> вне касания не стартует,
// а Web Audio после первого касания играет всегда — и в беззвучном режиме тоже (см. audioUnlock).
const VBUF = new Map();   // src → Promise<AudioBuffer>, держим последние ~40
function voiceLoad(src) {
  if (VBUF.has(src)) { const p = VBUF.get(src); VBUF.delete(src); VBUF.set(src, p); return p; }
  const p = fetch(src).then(r => { if (!r.ok) { const e = new Error('missing'); e.missing = true; throw e; } return r.arrayBuffer(); })
    .then(buf => new Promise((res, rej) => SND.ac.decodeAudioData(buf, res, rej)));
  VBUF.set(src, p); if (VBUF.size > 40) VBUF.delete(VBUF.keys().next().value);
  p.catch(e => { VBUF.delete(src); if (e && e.missing) VOICE.missing.add(src); });
  return p;
}
function voiceStop() { VOICE.seq = (VOICE.seq || 0) + 1; if (VOICE.cur) { try { VOICE.cur.stop ? VOICE.cur.stop() : VOICE.cur.pause(); } catch (e) {} VOICE.cur = null; } VOICE.playing = false; }
function voiceSrc(t, heroG) { const id = voiceId(t, !!heroG); return id ? `out/${LANG === 'ru' ? 'ru' : 'kz'}/${heroG ? 'hero_' + heroG + '/' : ''}${id}.mp3` : null; }
function voicePlay(t, heroG = null) {   // heroG: 'f'/'m' — реплика героя, ищем в out/<lang>/hero_f или hero_m
  voiceStop();
  if (!SND.on || !SND.vox) return false;
  const src = voiceSrc(t, heroG); if (!src || VOICE.missing.has(src)) return false;
  return voicePlaySrc(src);
}
function voicePlaySrc(src) {
  const seq = VOICE.seq;
  // Web Audio — когда страница с сервера (fetch работает) и контекст создан; иначе — обычный <audio>
  if (SND.ac && location.protocol !== 'file:') {
    audioUnlock();
    voiceLoad(src).then(buf => {
      if (seq !== VOICE.seq || !SND.on || !SND.vox) return;
      const s = SND.ac.createBufferSource(), g = SND.ac.createGain(); g.gain.value = .95;
      s.buffer = buf; s.connect(g); g.connect(SND.ac.destination);
      s.onended = () => { if (VOICE.cur === s) { VOICE.playing = false; VOICE.cur = null; } };
      VOICE.cur = s; VOICE.playing = true; VOICE.ok.add(src); s.start();
    }).catch(() => { if (seq === VOICE.seq) VOICE.playing = false; });
    return true;
  }
  if (typeof Audio === 'undefined') return false;
  const a = new Audio(src); a.volume = .95; a.setAttribute('playsinline', ''); VOICE.cur = a;
  a.addEventListener('playing', () => { if (VOICE.cur === a) { VOICE.playing = true; VOICE.ok.add(src); } });
  a.addEventListener('ended', () => { if (VOICE.cur === a) VOICE.playing = false; });
  a.addEventListener('error', () => { VOICE.missing.add(src); if (VOICE.cur === a) { VOICE.playing = false; VOICE.cur = null; } });
  a.play().catch(() => { VOICE.playing = false; });
  return true;
}
// кнопка «Проверить звук»: щелчок + реплика апа из первого собрания
function soundTest() { audioUnlock(); sfx.stamp(); setTimeout(() => { voiceStop(); if (SND.on && SND.vox) voicePlaySrc(`out/${LANG === 'ru' ? 'ru' : 'kz'}/apa_init_greet.mp3`); }, 450); }
