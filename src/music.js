/* ============================================================
   МУЗЫКА: чиптюн/лоу-фай на WebAudio, без файлов.
   Три темы: calm (меню, пролог, «Мой ЖК»), tour (обход подъезда), quiz (викторина).
   Играет, только когда включён звук; стартует после первого касания (так требуют браузеры).
   ============================================================ */
const MUS = { track: null, want: null, step: 0, next: 0, timer: null, out: null };
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const CH_ = { Am7: [57, 60, 64, 67], Fmaj7: [53, 57, 60, 64], Cmaj7: [48, 52, 55, 59], G6: [55, 59, 62, 64], Dm7: [50, 53, 57, 60], G7: [55, 59, 62, 65], Em7: [52, 55, 59, 62], Am: [57, 60, 64], F: [53, 57, 60], C: [48, 52, 55], G: [55, 59, 62] };
const _ = null;
const TRACKS = {
  // спокойная ночная тема: арпеджио, мягкий бас, мелодия в ля-миноре
  calm: { bpm: 76, prog: ['Am7', 'Fmaj7', 'Cmaj7', 'G6'], lead: 'triangle', leadVol: .5, hats: false,
    mel: [[76, _, 74, 72, _, 69, _, _], [72, _, 74, 76, _, 79, _, 76], [76, _, _, 74, 72, _, 74, _], [74, _, 72, _, 69, _, _, _],
          [81, _, 79, 76, _, 74, _, _], [76, _, 79, _, 81, _, 79, _], [76, _, 74, _, 72, 74, _, _], [69, _, _, _, _, _, _, _]] },
  // обход: чуть быстрее, хэты на слабых долях, бас ходит восьмыми
  tour: { bpm: 100, prog: ['Dm7', 'G7', 'Cmaj7', 'Am7'], lead: 'square', leadVol: .28, hats: true, walk: true,
    mel: [[74, _, 77, _, 76, 74, 72, _], [71, _, 74, _, 79, _, 77, _], [76, _, 72, _, 67, _, 72, 74], [76, _, _, 72, _, _, _, _],
          [74, 76, 77, _, 81, _, 79, 77], [79, _, 77, _, 74, _, 71, _], [72, _, 76, _, 79, _, 76, 74], [72, _, _, _, 69, _, _, _]] },
  // викторина: бодро, как аркада
  quiz: { bpm: 132, prog: ['Am', 'F', 'C', 'G'], lead: 'square', leadVol: .3, hats: true, walk: true,
    mel: [[81, _, 81, 79, 76, _, 74, 76], [77, _, 76, 74, 72, _, 74, _], [76, _, 79, _, 84, _, 83, 79], [79, _, 76, _, 74, _, _, _],
          [81, 79, 81, _, 84, _, 81, _], [77, 76, 74, _, 72, _, 74, _], [76, 79, 84, _, 83, 79, 76, _], [74, _, 71, _, 69, _, _, _]] },
};
const MUSIC_BY_SCENE = { title: 'calm', creator: 'calm', prologue: 'calm', house: 'calm', levels: 'calm', result: 'calm', leaderboard: 'calm', tour: 'tour', quiz: 'quiz' };
function musicFor(sceneName) { MUS.want = MUSIC_BY_SCENE[sceneName] || MUS.want; musicTick(); }
function musicOut() {
  const ac = SND.ac; if (!ac) return null;
  if (!MUS.out) { const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; g.gain.value = 0; g.connect(f); f.connect(ac.destination); MUS.out = g; }
  return MUS.out;
}
function note(type, freq, t, dur, vol) {
  const ac = SND.ac, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012);
  g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(musicOut()); o.start(t); o.stop(t + dur + .05);
}
function hat(t, vol) {
  const ac = SND.ac, n = Math.floor(ac.sampleRate * .04), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = vol;
  s.buffer = b; s.connect(f); f.connect(g); g.connect(musicOut()); s.start(t);
}
function musicTick() {
  const ac = SND.ac; if (!ac) return;
  const out = musicOut(), on = SND.on && MUS.want && !document.hidden;
  // плавно глушим при выключенном звуке; смена темы — с начала такта
  out.gain.setTargetAtTime(on ? .055 : 0, ac.currentTime, .3);
  if (!on) return;
  if (MUS.track !== MUS.want) { MUS.track = MUS.want; MUS.step = 0; MUS.next = Math.max(MUS.next, ac.currentTime + .1); }
  const T = TRACKS[MUS.track], e = 60 / T.bpm / 2;          // восьмая
  while (MUS.next < ac.currentTime + .35) {
    const s = MUS.step, bar = Math.floor(s / 8) % T.mel.length, i = s % 8, ch = CH_[T.prog[bar % T.prog.length]], t = MUS.next;
    // бас: корень аккорда октавой ниже (на «ходьбе» — корень/квинта восьмыми)
    if (i === 0 || i === 4 || (T.walk && i % 2 === 0)) note('triangle', midi(ch[0] - 12 + (T.walk && i % 4 === 2 ? 7 : 0)), t, e * (T.walk ? 1.6 : 3.6), .55);
    // арпеджио аккорда
    note('triangle', midi(ch[[0, 1, 2, 3, 2, 1, 2, 3][i] % ch.length] + 12), t, e * 1.8, .16);
    // мелодия
    const m = T.mel[bar][i]; if (m) note(T.lead, midi(m), t, e * 1.9, T.leadVol * .32);
    if (T.hats && i % 2 === 1) hat(t, .05);
    MUS.next += e; MUS.step++;
  }
}
setInterval(musicTick, 120);
document.addEventListener('visibilitychange', musicTick);
