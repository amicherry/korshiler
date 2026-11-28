/* ============================================================
   API — связь игры с сервером E-KNOT.
   Пока настоящего бэкенда нет, запросы обслуживает заглушка MockServer:
   она ведёт себя как сервер (задержка, редкие ошибки сети, проверка
   результатов), а данные хранит в localStorage браузера.
   Когда появится сервер — в API_CONFIG.baseUrl ставится его адрес,
   и все те же запросы пойдут через fetch. Игру менять не нужно.
   Описание запросов: docs/API.md
   ============================================================ */
/* ---------- параметры запуска из приложения E-KNOT (docs/API.md, раздел 1) ----------
   ?token=…&lang=kz|ru&name=…&level=3&tour=1&title=chairman&complex=ЖК%20Нұрлы
   Всё, кроме token, — только для отображения: правду о прогрессе знает сервер. */
const LAUNCH = (() => {
  const q = new URLSearchParams(location.search), s = (k, n) => { const v = (q.get(k) || '').trim(); return v ? v.slice(0, n) : null; };
  const int = (k, lo, hi) => { const v = parseInt(q.get(k), 10); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
  const token = s('token', 512) || (/^#[A-Za-z0-9-]+$/.test(location.hash) ? location.hash.slice(1) : null);
  const lang = ['kz', 'ru'].includes(q.get('lang')) ? q.get('lang') : null;
  return { token, lang, name: s('name', 16), level: int('level', 0, 999), tour: int('tour', -1, 6), title: s('title', 32), complex: s('complex', 28) };
})();

/* ---------- Telegram Mini App ----------
   Внутри Telegram: вход только после «Поделиться номером» (WebApp.requestContact).
   Серверу уходят initData (подпись Telegram) и ответ requestContact — настоящий сервер проверяет их токеном бота.
   Вне Telegram (обычный браузер) — как раньше: гость или токен приложения E-KNOT. */
const TG = (() => { try { const w = window.Telegram && window.Telegram.WebApp; return w && w.initData ? w : null; } catch (e) { return null; } })();
// отступы Telegram в CSS-пикселях: строка состояния, полоса кнопок, ширина зоны кнопки от края экрана
function tgInsets() {
  if (!TG || !document.documentElement.classList.contains('tg')) return null;
  const css = n => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) || 0;
  const safe = (TG.safeAreaInset && TG.safeAreaInset.top) || css('--tg-safe-area-inset-top');
  const content = (TG.contentSafeAreaInset && TG.contentSafeAreaInset.top) || css('--tg-content-safe-area-inset-top');
  return { safe, content, pill: 140 };
}
const TG_T = {
  kz: { text: 'Ойнау үшін Telegram-дағы телефон нөміріңмен кір. Нөмір E-KNOT профиліне ғана керек.', btn: 'НӨМІРМЕН КІРУ', note: 'Нөмірсіз ойын ашылмайды.', again: 'Нөмір жіберілмеді. Қайта көріңіз.', old: 'Telegram-ды жаңартыңыз — бұл нұсқа нөмірмен кіруді қолдамайды.' },
  ru: { text: 'Чтобы играть, войди по номеру телефона из Telegram. Номер нужен только для профиля E-KNOT.', btn: 'ВОЙТИ ПО НОМЕРУ', note: 'Без номера игра не откроется.', again: 'Номер не отправлен. Попробуй ещё раз.', old: 'Обнови Telegram — эта версия не умеет входить по номеру.' },
};
async function tgLogin() {
  if (!TG) return null;
  try { TG.ready(); TG.expand(); document.documentElement.classList.add('tg'); setTimeout(fit, 60);
    // Telegram меняет размеры окна и «безопасные» отступы (повернули телефон, включили весь экран) — подгоняем игру
    for (const ev of ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged']) try { TG.onEvent(ev, () => setTimeout(fit, 60)); } catch (e) {}
    if (TG.isVersionAtLeast('7.7')) TG.disableVerticalSwipes();          // свайп по игре не должен закрывать окно
    if (TG.isVersionAtLeast('6.1')) { TG.setHeaderColor('#15161c'); TG.setBackgroundColor('#15161c'); }
    if (TG.isVersionAtLeast('8.0') && /android|iphone|ipad/i.test(navigator.userAgent)) TG.requestFullscreen();
  } catch (e) {}
  const u = TG.initDataUnsafe && TG.initDataUnsafe.user || {}, key = 'kn_tg_phone_' + u.id;
  const lang = LAUNCH.lang || (loadStr('d67_lang', '') || (u.language_code === 'ru' ? 'ru' : 'kz')), T = TG_T[lang === 'ru' ? 'ru' : 'kz'];
  if (!LAUNCH.lang && !loadStr('d67_lang', '')) LAUNCH.lang = lang === 'ru' ? 'ru' : 'kz';
  const saved = loadStr(key, ''); if (saved) { try { return { user: u, ...JSON.parse(saved) }; } catch (e) {} }
  const box = document.getElementById('tgauth'), btn = document.getElementById('tgBtn'), txt = document.getElementById('tgText'), note = document.getElementById('tgNote');
  txt.textContent = T.text; btn.textContent = T.btn; note.textContent = T.note; box.hidden = false;
  if (!TG.isVersionAtLeast('6.9')) { note.textContent = T.old; btn.hidden = true; return new Promise(() => {}); }
  return new Promise(done => {
    btn.onclick = () => TG.requestContact((ok, res) => {
      if (!ok) { note.textContent = T.again; try { TG.HapticFeedback.notificationOccurred('error'); } catch (e) {} return; }
      const c = res && res.responseUnsafe && res.responseUnsafe.contact || {};
      const info = { phone: c.phone_number || null, contact: res && res.response || null };   // contact — строка с подписью Telegram для проверки на сервере
      saveStr(key, JSON.stringify(info)); box.hidden = true; done({ user: u, ...info });
      if (!tgWriteOK()) setTimeout(() => tgWriteAsk(), 600);   // сразу после номера — разрешение боту писать (сертификаты, новости)
    });
  });
}

// разрешение боту писать игроку: без него бот не сможет прислать сертификат и напоминания
function tgWriteOK() { if (!TG) return false; const u = TG.initDataUnsafe && TG.initDataUnsafe.user || {}; return !!u.allows_write_to_pm || loadStr('kn_tg_write', '') === 'yes'; }
function tgWriteAsk(cb) {
  if (!TG || !TG.isVersionAtLeast || !TG.isVersionAtLeast('6.9')) return cb && cb(false);
  try { TG.requestWriteAccess(ok => { saveStr('kn_tg_write', ok ? 'yes' : 'no'); if (API.session) API.tgWrite(ok).catch(() => {}); cb && cb(ok); }); } catch (e) { cb && cb(false); }
}

const API_CONFIG = {
  // адрес настоящего сервера. Пусто — работает заглушка. Задать можно тремя способами (без пересборки):
  //   1) здесь строкой; 2) window.KORSHILER_API в index.html до игры; 3) в ссылке ?api=https://… (для проверки)
  baseUrl: (() => { try { const q = new URLSearchParams(location.search).get('api') || window.KORSHILER_API || null;
    return q && /^https:\/\//.test(q) ? q.replace(/\/+$/, '') : null; } catch (e) { return null; } })(),
  timeoutMs: 12000,               // ответа нет дольше — считаем, что связь пропала, и повторяем
  latency: [150, 450],           // задержка ответа заглушки, мс
  failRate: .04,                 // доля «обрывов связи» в заглушке (?stable — без них)
};

/* ---------------- заглушка сервера ---------------- */
const MockServer = (() => {
  const DB_KEY = 'kn_server_db';
  const load = () => { try { return JSON.parse(loadStr(DB_KEY, '')) || null; } catch (e) { return null; } };
  const db = load() || {};
  for (const k of ['users', 'profiles', 'runs', 'scores', 'rewards', 'houses']) db[k] = db[k] || {};
  const commit = () => saveStr(DB_KEY, JSON.stringify(db));

  // тестовые жители: так приложение E-KNOT передало бы токен в ссылке (?token=demo)
  const TOKENS = {
    demo:  { userId: 'u-1001', name: 'Әмина', complex: { id: 'c-17', name: 'ЖК «Нұрлы»', city: 'Астана' }, apartment: 13 },
    demo2: { userId: 'u-1002', name: 'Арман', complex: { id: 'c-17', name: 'ЖК «Нұрлы»', city: 'Астана' }, apartment: 7 },
  };
  // соседи и горожане для таблицы рекордов (как будто уже играли)
  const FAKE = [
    ['Динара', 'c-17', 1460], ['Ерлан', 'c-17', 1310], ['Роза апа', 'c-17', 980], ['Тимур', 'c-17', 870], ['Әсел', 'c-17', 640],
    ['Нұрлан', 'c-04', 1720], ['Ольга', 'c-04', 1180], ['Бақыт', 'c-09', 1590], ['Мадина', 'c-09', 1240], ['Асхат', 'c-21', 1390], ['Жанар', 'c-21', 760],
  ];
  const err = (status, code) => { const e = new Error(code); e.status = status; e.code = code; throw e; };
  // дом игрока: отремонтированные проблемы, украшения, выигранные собрания, бонус дня
  const house = id => db.houses[id] || (db.houses[id] = { fixed: [], decor: [], won: [], claimDay: null });
  const houseScore = H => H.fixed.reduce((s, id) => s + PROBLEMS.find(p => p.id === id).pts, 0) + H.decor.reduce((s, id) => s + DECOR.find(d => d.id === id).pts, 0);
  const today = () => new Date().toISOString().slice(0, 10);
  const houseView = (u) => { const H = house(u.userId), prof = db.profiles[u.userId] || {}, score = houseScore(H);
    return { fixed: H.fixed, decor: H.decor, won: H.won, coins: prof.coins || 0, score, bonus: Math.floor(score / 10), claimable: H.claimDay !== today() && score > 0 }; };
  const unlocked = (u, n) => tourOpen(LEVELS[n - 1], house(u.userId)).ok;   // те же правила, что в игре (content.js)
  const FAKE_HOUSES = [['ЖК «Нұрлы»', 'Динара', 'c-17', 880], ['ЖК «Нұрлы»', 'Ерлан', 'c-17', 640], ['ЖК «Нұрлы»', 'Роза апа', 'c-17', 360],
    ['ЖК «Самал»', 'Нұрлан', 'c-04', 1250], ['ЖК «Самал»', 'Ольга', 'c-04', 520], ['ЖК «Көктем»', 'Бақыт', 'c-09', 1010], ['ЖК «Арай»', 'Асхат', 'c-21', 760]];
  const me = token => {
    if (!token) err(401, 'no_session');
    const u = db.users[token]; if (!u) err(401, 'bad_session'); return u;
  };

  const routes = {
    // вход: токен из приложения или гость (без бонусов)
    'POST /auth'({ body }) {
      const t = body.token && TOKENS[body.token], Lp = body.launch || {};
      let user;
      if (body.tg) {
        // Telegram: настоящий сервер проверяет подпись initData и contact токеном бота; заглушка верит на слово
        let tu = {}; try { tu = JSON.parse(new URLSearchParams(body.tg.initData).get('user') || '{}'); } catch (e) {}
        user = { userId: 'tg-' + (tu.id || hashStr(body.tg.initData).toString(36)), name: (tu.first_name || '').slice(0, 12) || null, phone: body.tg.phone || null,
                 complex: { id: 'c-tg', name: Lp.complex || 'E-KNOT', city: 'Астана' }, apartment: null, guest: false, telegram: true };
      }
      else if (t) user = { ...t, guest: false };
      else if (body.token) {
        // любой другой токен — как будто его выдал сервер E-KNOT: имя и ЖК приходят параметрами запуска
        const cid = 'c-' + hashStr(Lp.complex || 'eknot').toString(36);
        user = { userId: 'app-' + hashStr(body.token).toString(36), name: Lp.name || null, complex: { id: cid, name: Lp.complex || 'E-KNOT', city: 'Астана' }, apartment: null, guest: false };
      }
      else {
        const gid = body.deviceId || ('g-' + Math.floor(Math.random() * 1e9));
        user = { userId: gid, name: null, complex: { id: 'guest', name: null, city: 'Астана' }, apartment: null, guest: true };
      }
      if (!user.guest) { user.level = Lp.level ?? null; user.title = Lp.title || null;
        // прогресс из приложения: туры до tour включительно уже пройдены
        if (Lp.tour != null && Lp.tour >= 0) { const H = house(user.userId); for (let i = 0; i <= Lp.tour; i++) if (!H.won.includes(LEVELS[i].id)) H.won.push(LEVELS[i].id); } }
      const session = 's-' + user.userId;
      db.users[session] = user; db.profiles[user.userId] = db.profiles[user.userId] || null; commit();
      return { session, user };
    },
    'GET /profile'({ session }) { const u = me(session); return { profile: db.profiles[u.userId] }; },
    'PUT /profile'({ session, body }) {
      const u = me(session); const p = body.profile || {};
      // сервер не даёт игре самой себе начислить монеты: их меняет только итог тура
      const old = db.profiles[u.userId] || {};
      db.profiles[u.userId] = { ...p, coins: old.coins || 0, rewardsTotal: old.rewardsTotal || 0, quizPaid: old.quizPaid || {}, quizBest: old.quizBest || {} }; commit();   // серверные поля (оплата квизов) клиент не перезаписывает
      return { ok: true };
    },
    'DELETE /profile'({ session }) {
      const u = me(session); db.profiles[u.userId] = null; delete db.scores[u.userId]; db.rewards[u.userId] = []; delete db.houses[u.userId]; commit(); return { ok: true };
    },
    'POST /tours/start'({ session, body }) {
      const u = me(session); const tour = TOURS[body.tourId]; if (!tour) err(404, 'no_tour');
      // перепрыгнуть нельзя: собрание открывается, только когда предыдущая проблема исправлена
      if (!unlocked(u, tour.n)) err(403, 'locked');
      const runId = 'r-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
      db.runs[runId] = { userId: u.userId, tourId: tour.id, startedAt: Date.now(), finished: false }; commit();
      return { runId, startedAt: db.runs[runId].startedAt, tour: { id: tour.id, goal: tour.goal, floors: tour.floors, perFloor: tour.perFloor } };
    },
    // итог: сервер сам считает подписи по журналу событий и проверяет, что всё правдоподобно
    // викторина: монеты в бюджет ЖК и значок «Знаток ЖКХ» (80 % верных с первой попытки)
    'POST /quiz/finish'({ session, body }) {
      const u = me(session), total = clamp(body.total | 0, 0, 30), first = clamp(body.firstTry | 0, 0, total), sec = +body.seconds || 0;
      const second = clamp(body.second | 0, 0, total - first), hard = clamp(body.hardFirst | 0, 0, first), tour = TOURS[body.tourId] || null;
      const suspicious = total < 3 || sec < total * 4;                         // 5 вопросов быстрее 20 секунд не пробежать
      const prof = db.profiles[u.userId] || (db.profiles[u.userId] = {}); prof.quizPaid = prof.quizPaid || {}; prof.quizBest = prof.quizBest || {};
      // «знания экономят деньги»: +20 000 ₸ за верный ответ с первой попытки, +5 000 со второй, расчётный +50 000 — только за первый проход квиза тура
      const paidBefore = !!(tour && prof.quizPaid[tour.id]);
      const trips = clamp(body.trips | 0, 0, 200);   // споткнулся о преграду — −1 000 ₸
      const coins = suspicious || !tour || paidBefore ? 0 : Math.max(0, (first - hard) * 20000 + hard * 50000 + second * 5000 - trips * 1000);
      if (tour && !suspicious) { prof.quizPaid[tour.id] = true; prof.quizBest[tour.id] = Math.max(prof.quizBest[tour.id] || 0, first / Math.max(1, total)); }
      prof.coins = (prof.coins || 0) + coins;
      let reward = null; db.rewards[u.userId] = db.rewards[u.userId] || [];
      // значок «Знаток ЖКХ» — за все 7 квизов перед турами (каждый ≥ 80 %)
      const expert = !suspicious && LEVELS.every(l => (prof.quizBest[l.id] || 0) >= .8);
      if (expert && !db.rewards[u.userId].some(r => r.badge === 'zhkh_expert')) {
        reward = { tourId: 'quiz', points: 100, badge: 'zhkh_expert', status: u.guest ? 'needs_login' : 'sent', at: Date.now() }; db.rewards[u.userId].push(reward); }
      commit(); return { coins, badge: expert ? 'zhkh_expert' : null, reward, suspicious, totalCoins: prof.coins, paidBefore };
    },
    'POST /tours/finish'({ session, body }) {
      const u = me(session); const run = db.runs[body.runId];
      if (!run || run.userId !== u.userId) err(404, 'no_run');
      if (run.finished) return run.result;                                     // повторная отправка — тот же ответ
      const tour = TOURS[run.tourId], maxApt = tour.floors * tour.perFloor;
      const seconds = (Date.now() - run.startedAt) / 1000;
      // голос квартиры — последнее её событие «за», «против» или «воздержался»; «за» после «против» — передумал. Кладовые не голосуют
      const vote = new Map(), via = new Map();
      for (const e of body.events || []) if (['yes', 'no', 'abstain'].includes(e.t) && e.apt >= 1 && e.apt <= maxApt && e.apt !== tour.heroApt && !isStorage(e.apt)) {
        if (e.t !== 'yes' && vote.get(e.apt) === 'yes') continue;
        vote.set(e.apt, e.t); via.set(e.apt, e.via || 'door'); }
      const cnt = t => [...vote.values()].filter(v => v === t).length, yesN = cnt('yes'), noN = cnt('no'), abN = cnt('abstain');
      const suspicious = seconds < 15 && yesN > 3;                           // 4+ голоса за 15 секунд не бывает
      const own = suspicious ? 0 : yesN, against = suspicious ? 0 : noN, abstain = suspicious ? 0 : abN;
      const appVia = ['online', 'notify', 'call', 'redial', 'chat', 'owner'];
      const online = suspicious ? 0 : [...via.entries()].filter(([a, v]) => vote.get(a) === 'yes' && appVia.includes(v)).length;
      const signatures = own;
      const out = voteOutcome(tour, own, against, abstain), success = out.ok;
      // очки — только для рейтинга (за голоса у дверей больше, чем за онлайн)
      const score = signatures * 100 + online * 20 + (success ? 300 + Math.max(0, Math.round(600 - seconds) * 2) : 0);
      // деньги за победу «с неба» не падают: бюджет полугодия (взносы, повышение, аренда) приходит один раз — после первой победы в туре
      const H = house(u.userId), first = success && !H.won.includes(tour.id);
      const coins = first ? tour.income : 0;
      if (first) { H.won.push(tour.id);
        // решение собрания выполнено: летник, вышка, лифт, крыша (и подвал) появляются сами
        for (const p of PROBLEMS) if (p.kind === 'construction' && p.tour === tour.id && !H.fixed.includes(p.id)) H.fixed.push(p.id); }
      const prof = db.profiles[u.userId] || (db.profiles[u.userId] = {});
      prof.coins = (prof.coins || 0) + coins;
      const prevBest = (db.scores[u.userId] || {}).best || 0, best = Math.max(prevBest, score);
      db.scores[u.userId] = { name: prof.name || u.name || 'Ойыншы', complex: u.complex.id, best };
      // бонусы в приложение — только вошедшим через E-KNOT и только за первую победу в туре
      let reward = null; db.rewards[u.userId] = db.rewards[u.userId] || [];
      if (success && !db.rewards[u.userId].some(r => r.tourId === tour.id)) {
        reward = { tourId: tour.id, points: 50 + tour.n * 10, badge: tour.badge, badges: tour.badges || [tour.badge], status: u.guest ? 'needs_login' : 'sent', at: Date.now() };
        if (!u.guest) { db.rewards[u.userId].push(reward); prof.rewardsTotal = (prof.rewardsTotal || 0) + reward.points; }
      }
      run.finished = true;
      run.result = { signatures, own, online, against, abstain, turnout: out.turnout, need: out.need, success, first, score, best, newBest: score > prevBest, coins, totalCoins: prof.coins, reward, suspicious, problem: tour.problem,
        badges: success && first ? (tour.badges || [tour.badge]) : [] };
      commit();
      return run.result;
    },
    'GET /house'({ session }) { return houseView(me(session)); },
    // покупка ремонта или украшения: сервер проверяет порядок, одобрение собрания и бюджет
    'POST /house/buy'({ session, body }) {
      const u = me(session), H = house(u.userId), prof = db.profiles[u.userId] || (db.profiles[u.userId] = {});
      const pi = PROBLEMS.findIndex(p => p.id === body.id), dc = DECOR.find(d => d.id === body.id);
      let cost;
      if (pi >= 0) {
        const p = PROBLEMS[pi];
        if (H.fixed.includes(p.id)) err(409, 'already');
        const ok = canFix(p, H); if (!ok.ok) err(403, ok.why === 'chair' ? 'not_chairman' : 'no_vote');
        cost = p.cost;
      } else if (dc) {
        if (H.decor.includes(dc.id)) err(409, 'already');
        cost = dc.cost;
      } else err(404, 'no_item');
      if ((prof.coins || 0) < cost) err(402, 'no_money');
      prof.coins -= cost; (pi >= 0 ? H.fixed : H.decor).push(body.id);
      db.scores[u.userId] = { ...(db.scores[u.userId] || { name: prof.name || u.name || 'Ойыншы', complex: u.complex.id, best: 0 }), house: houseScore(H) };
      commit(); return houseView(u);
    },
    // бонус дня в приложение — от того, насколько хорош дом
    'POST /house/claim'({ session }) {
      const u = me(session), H = house(u.userId), v = houseView(u);
      if (!v.claimable) err(409, 'claimed');
      H.claimDay = today(); db.rewards[u.userId] = db.rewards[u.userId] || [];
      const reward = { tourId: 'daily', points: v.bonus, status: u.guest ? 'needs_login' : 'sent', at: Date.now() };
      if (!u.guest) db.rewards[u.userId].push(reward);
      commit(); return { reward, house: houseView(u) };
    },
    'GET /leaderboard'({ session, query }) {
      const u = me(session);
      if (query.scope === 'house') {   // лучший ЖК: по состоянию дома — из них выбирают победителей розыгрыша
        const rows = FAKE_HOUSES.map(([complex, name, cid, best]) => ({ name: complex + ' · ' + name, best }));
        const mineScore = houseScore(house(u.userId)); const nm = (db.profiles[u.userId] || {}).name || u.name || 'Ойыншы';
        rows.push({ name: (u.complex.name || 'ЖК') + ' · ' + nm, best: mineScore, me: true });
        rows.sort((a, b) => b.best - a.best);
        const list = rows.map((r, i) => ({ rank: i + 1, name: r.name, best: r.best, me: !!r.me }));
        return { scope: 'house', top: list.slice(0, 8), mine: list.find(r => r.me) };
      }
      const scope = query.scope === 'city' ? 'city' : 'complex';
      const rows = FAKE.map(([name, complex, best]) => ({ name, complex, best }));
      for (const [id, s] of Object.entries(db.scores)) rows.push({ ...s, me: id === u.userId });
      let list = rows.filter(r => scope === 'city' || r.complex === u.complex.id || r.me);
      list.sort((a, b) => b.best - a.best);
      list = list.map((r, i) => ({ rank: i + 1, name: r.name, best: r.best, me: !!r.me }));
      return { scope, complexName: u.complex.name, top: list.slice(0, 8), mine: list.find(r => r.me) || null };
    },
    // Telegram: игрок разрешил/запретил боту писать ему (сертификаты, напоминания)
    'POST /tg/write'({ session, body }) { const u = me(session); u.tgWrite = !!body.allowed; commit(); return { ok: true, allowed: u.tgWrite }; },
    'GET /rewards'({ session }) { const u = me(session); return { rewards: db.rewards[u.userId] || [], guest: u.guest }; },
  };

  return {
    debugDB: () => db,   // только для автотестов
    async handle(method, path, { session, body, query }) {
      const [lo, hi] = API_CONFIG.latency; await wait(lo + Math.random() * (hi - lo));
      if (!/[?&]stable/.test(location.search) && Math.random() < API_CONFIG.failRate) err(0, 'network');
      const fn = routes[method + ' ' + path]; if (!fn) err(404, 'no_route');
      // как настоящий сервер: отдаём копию, а не ссылку на свои данные
      return JSON.parse(JSON.stringify(fn({ session, body: body || {}, query: query || {} })));
    },
  };
})();

/* ---------------- клиент: одна функция для заглушки и для настоящего сервера ---------------- */
const NET = { pending: 0, lastError: null };
async function request(method, path, { body, query } = {}, tries = 3) {
  NET.pending++;
  try {
    for (let i = 0; ; i++) {
      try {
        if (!API_CONFIG.baseUrl) return await MockServer.handle(method, path, { session: API.session, body, query });
        const qs = query ? '?' + new URLSearchParams(query) : '';
        const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = ctl && setTimeout(() => ctl.abort(), API_CONFIG.timeoutMs);
        let res;
        try {
          res = await fetch(API_CONFIG.baseUrl + path + qs, {
            method, signal: ctl && ctl.signal,
            headers: { 'Content-Type': 'application/json', 'X-Client': 'korshiler/' + CLIENT_VERSION, ...(API.session ? { Authorization: 'Bearer ' + API.session } : {}) },
            body: body ? JSON.stringify(body) : undefined,
          });
        } finally { if (tm) clearTimeout(tm); }
        if (!res.ok) {   // ошибка сервера: код из тела { error: 'no_money' } — как у заглушки
          let code = 'http_' + res.status; try { const j = await res.json(); if (j && j.error) code = j.error; } catch (_) {}
          const e = new Error(code); e.status = res.status; e.code = code;
          // сессия истекла — один раз входим заново и повторяем запрос
          if (res.status === 401 && path !== '/auth' && !API.reauthing) { API.reauthing = true; try { await API.auth(); } finally { API.reauthing = false; } continue; }
          throw e;
        }
        return res.status === 204 ? {} : await res.json();
      } catch (e) {
        // сеть мигнула или сервер 5xx — повторяем с паузой; ошибки вроде 400/403/404/409 не повторяем
        if ((e.status && e.status < 500) || i >= tries - 1) { NET.lastError = e; throw e; }
        await wait(400 * (i + 1));
      }
    }
  } finally { NET.pending--; }
}

const API = {
  session: null, user: null,
  async auth() {
    const q = new URLSearchParams(location.search);
    let deviceId = loadStr('kn_device', ''); if (!deviceId) { deviceId = 'g-' + Math.floor(Math.random() * 1e9); saveStr('kn_device', deviceId); }
    // токен из ссылки приложения: ?token=demo (или #demo — так работает и опубликованная страница)
    const token = LAUNCH.token, tg = await tgLogin();
    const r = await request('POST', '/auth', { body: { token, deviceId, tg: tg && { initData: TG.initData, contact: tg.contact, phone: tg.phone }, launch: { name: LAUNCH.name, complex: LAUNCH.complex, level: LAUNCH.level, tour: LAUNCH.tour, title: LAUNCH.title } } });
    this.session = r.session; this.user = r.user;
    if (TG && tgWriteOK()) this.tgWrite(true).catch(() => {});
    return { ...r.user, fromApp: !r.user.guest };
  },
  async load() { return (await request('GET', '/profile')).profile; },
  async save(profile) { return request('PUT', '/profile', { body: { profile } }); },
  async reset() { return request('DELETE', '/profile'); },
  async tourStart(tourId) { return request('POST', '/tours/start', { body: { tourId } }); },
  async tourFinish(run, events) { return request('POST', '/tours/finish', { body: { runId: run && run.runId, events } }, 4); },
  async leaderboard(scope) { return request('GET', '/leaderboard', { query: { scope } }); },
  async rewards() { return request('GET', '/rewards'); },
  async house() { return request('GET', '/house'); },
  async quizFinish(b) { return request('POST', '/quiz/finish', { body: b }, 4); },
  async buy(id) { return request('POST', '/house/buy', { body: { id } }); },
  async claim() { return request('POST', '/house/claim'); },
  async tgWrite(allowed) { return request('POST', '/tg/write', { body: { allowed: !!allowed } }); },
};

// перенос старого сохранения (до появления заглушки сервера)
async function migrateOldSave() {
  const old = loadStr('d67_save', '');
  if (!old) return null;
  try { const p = JSON.parse(old); await API.save(p); saveStr('d67_save', ''); return p; } catch (e) { return null; }
}

/* ---------- результат тура для приложения E-KNOT (docs/API.md, раздел 2) ---------- */
const CLIENT_VERSION = '1.6.0';
function buildResult(scene, r) {
  const T = scene.tour, res = Object.values(scene.res);
  const thinking = res.filter(x => x.status === 'thinking').length, notReached = res.filter(x => ['unknown', 'away', 'noanswer'].includes(x.status)).length;
  return {
    version: 1, game: 'korshiler', token: LAUNCH.token, runId: (scene.run && scene.run.runId) || ('local-' + Date.now()),
    tour: T.n - 1, tourCode: T.code, success: !!r.success, rule: T.rule === 'quorum' ? 'quorum_half_plus_one' : T.goal === PCT.twoThirds ? 'two_thirds_of_all' : T.goal === PCT.half ? 'half_plus_one_of_all' : 'tenth_of_all',
    apartments: APTS, protocol: T.n === 1 ? '1' : 'EKN-0' + T.n, eknotShare: scene.appShare ? scene.appShare() : 0,
    votes: { yes: r.signatures, no: r.against ?? scene.against(), abstain: r.abstain ?? scene.abstained(), undecided: thinking, notReached, turnout: r.turnout ?? (r.signatures + scene.against()) },
    required: { yes: r.need || T.goal, turnout: T.quorum || null }, daysUsed: scene.day(), daysLimit: T.days,
    score: r.score ?? null, firstWin: !!r.first, badges: r.badges || [], startedAt: new Date(scene.startedAt).toISOString(), finishedAt: new Date().toISOString(),
    lang: LANG, clientVersion: CLIENT_VERSION, offline: !!r.offline, events: scene.events.map(e => ({ t: e.t, apt: e.apt, via: e.via || 'door' })),
  };
}
// в приложение (WebView) — сразу; ошибок моста не бывает «наружу», игра продолжает работать
function notifyApp(type, payload) {
  const msg = JSON.stringify({ type, payload });
  const tries = [() => window.ReactNativeWebView.postMessage(msg), () => window.webkit.messageHandlers.eknot.postMessage(msg), () => window.EKnot.postMessage(msg)];
  let sent = false; for (const f of tries) { try { f(); sent = true; break; } catch (e) {} }
  try { if (window.parent && window.parent !== window) { window.parent.postMessage({ type: 'korshiler:' + type, payload }, '*'); sent = true; } } catch (e) {}
  window.KORSHILER_LAST = { type, payload, sent };
  return sent;
}
const inApp = () => !!(window.ReactNativeWebView || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.eknot) || window.EKnot);
// на настоящий сервер — с повтором при следующем запуске, если связь оборвалась (по runId сервер засчитает один раз)
async function sendResultToServer(payload) {
  if (!API_CONFIG.baseUrl || !payload.token) return;
  const q = JSON.parse(loadStr('kn_pending', '[]')).filter(p => p.runId !== payload.runId); q.push(payload); saveStr('kn_pending', JSON.stringify(q.slice(-20)));
  await flushResults();
}
async function flushResults() {
  if (!API_CONFIG.baseUrl) return;
  let q = JSON.parse(loadStr('kn_pending', '[]'));
  for (const p of [...q]) {
    try { await fetch(API_CONFIG.baseUrl + '/game/korshiler/result', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + p.token }, body: JSON.stringify(p) }).then(r => { if (!r.ok) throw new Error(r.status); });
      q = q.filter(x => x.runId !== p.runId); } catch (e) { break; }
  }
  saveStr('kn_pending', JSON.stringify(q));
}
