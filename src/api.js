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
   ?token=…&lang=kz|ru|en&name=…&level=3&tour=1&title=chairman&complex=ЖК%20Нұрлы
   Всё, кроме token, — только для отображения: правду о прогрессе знает сервер. */
const LAUNCH = (() => {
  const q = new URLSearchParams(location.search), s = (k, n) => { const v = (q.get(k) || '').trim(); return v ? v.slice(0, n) : null; };
  const int = (k, lo, hi) => { const v = parseInt(q.get(k), 10); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };
  const token = s('token', 512) || (/^#[A-Za-z0-9-]+$/.test(location.hash) ? location.hash.slice(1) : null);
  const lang = ['kz', 'ru', 'en'].includes(q.get('lang')) ? q.get('lang') : null;
  return { token, lang, name: s('name', 16), level: int('level', 0, 999), tour: int('tour', -1, 5), title: s('title', 32), complex: s('complex', 28) };
})();

const API_CONFIG = {
  baseUrl: null,                 // например 'https://api.e-knot.kz/game/v1'
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
      if (t) user = { ...t, guest: false };
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
      db.profiles[u.userId] = { ...p, coins: old.coins || 0, rewardsTotal: old.rewardsTotal || 0 }; commit();
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
      const suspicious = total < 3 || sec < total * 4;                         // 8 вопросов быстрее 32 секунд не пробежать
      // викторину можно проходить сколько угодно, но монеты — только за первые три прохождения в день
      const qd = today(); const profQ = db.profiles[u.userId] || (db.profiles[u.userId] = {}); if (profQ.quizDay !== qd) { profQ.quizDay = qd; profQ.quizRuns = 0; }
      profQ.quizRuns = (profQ.quizRuns || 0) + 1;
      const coins = suspicious || profQ.quizRuns > 3 ? 0 : clamp(body.coins | 0, 0, total * 10);
      const prof = db.profiles[u.userId] || (db.profiles[u.userId] = {}); prof.coins = (prof.coins || 0) + coins;
      let reward = null; db.rewards[u.userId] = db.rewards[u.userId] || [];
      const expert = !suspicious && total >= 5 && first / total >= .8;
      if (expert && !db.rewards[u.userId].some(r => r.badge === 'zhkh_expert')) {
        reward = { tourId: 'quiz', points: 100, badge: 'zhkh_expert', status: u.guest ? 'needs_login' : 'sent', at: Date.now() }; db.rewards[u.userId].push(reward); }
      commit(); return { coins, badge: expert ? 'zhkh_expert' : null, reward, suspicious, totalCoins: prof.coins, limit: !suspicious && profQ.quizRuns > 3 };
    },
    'POST /tours/finish'({ session, body }) {
      const u = me(session); const run = db.runs[body.runId];
      if (!run || run.userId !== u.userId) err(404, 'no_run');
      if (run.finished) return run.result;                                     // повторная отправка — тот же ответ
      const tour = TOURS[run.tourId], maxApt = tour.floors * tour.perFloor;
      const seconds = (Date.now() - run.startedAt) / 1000;
      // голос квартиры — последнее её событие «за» или «против»; «за» после «против» — передумал
      const vote = new Map(), via = new Map();
      for (const e of body.events || []) if ((e.t === 'yes' || e.t === 'no') && e.apt >= 1 && e.apt <= maxApt && e.apt !== tour.heroApt) {
        if (e.t === 'no' && vote.get(e.apt) === 'yes') continue;
        vote.set(e.apt, e.t); if (e.t === 'yes') via.set(e.apt, e.via || 'door'); }
      const yesN = [...vote.values()].filter(v => v === 'yes').length, noN = [...vote.values()].filter(v => v === 'no').length;
      const suspicious = seconds < 15 && yesN > 3;                           // 4+ голоса за 15 секунд не бывает
      const own = suspicious ? 0 : yesN, against = suspicious ? 0 : noN, online = suspicious ? 0 : [...via.values()].filter(v => v === 'online').length;
      const remote = 0, signatures = own;
      const out = voteOutcome(tour, own, against), success = out.ok;
      const score = signatures * 100 + online * 20 + (success ? 300 + Math.max(0, Math.round(600 - seconds) * 2) : 0);
      // бюджет: за первую победу на собрании — больше, за повтор — меньше; сверх нормы — доплата за подпись
      const H = house(u.userId), first = success && !H.won.includes(tour.id);
      // доплата сверх нормы — только за голоса, собранные лично у дверей, и не больше 10; онлайн и рассылка енота денег не дают
      const doorYes = [...via.entries()].filter(([a, v]) => vote.get(a) === 'yes' && ['door', 'helper', 'council'].includes(v)).length;
      const coins = success ? (first ? tour.reward.first : tour.reward.replay) + clamp(doorYes - tour.goal, 0, 10) * tour.reward.perExtra : Math.min(own, tour.goal) * 4;
      if (success && first) H.won.push(tour.id);
      const prof = db.profiles[u.userId] || (db.profiles[u.userId] = {});
      prof.coins = (prof.coins || 0) + coins;
      const prevBest = (db.scores[u.userId] || {}).best || 0, best = Math.max(prevBest, score);
      db.scores[u.userId] = { name: prof.name || u.name || 'Ойыншы', complex: u.complex.id, best };
      // бонусы в приложение — только вошедшим через E-KNOT и только за первую победу в туре
      let reward = null; db.rewards[u.userId] = db.rewards[u.userId] || [];
      if (success && !db.rewards[u.userId].some(r => r.tourId === tour.id)) {
        reward = { tourId: tour.id, points: 50 + tour.n * 10, badge: tour.badge, status: u.guest ? 'needs_login' : 'sent', at: Date.now() };
        if (!u.guest) { db.rewards[u.userId].push(reward); prof.rewardsTotal = (prof.rewardsTotal || 0) + reward.points; }
      }
      run.finished = true;
      run.result = { signatures, own, remote, online, against, turnout: out.turnout, need: out.need, success, first, score, best, newBest: score > prevBest, coins, totalCoins: prof.coins, reward, suspicious, problem: tour.problem,
        badges: success && first ? [tour.badge] : [] };
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
        if (H.fixed.length < dc.after) err(403, 'locked');
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
        const res = await fetch(API_CONFIG.baseUrl + path + qs, {
          method, headers: { 'Content-Type': 'application/json', ...(API.session ? { Authorization: 'Bearer ' + API.session } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) { const e = new Error('http_' + res.status); e.status = res.status; throw e; }
        return await res.json();
      } catch (e) {
        // сеть мигнула — повторяем с паузой; ошибки вроде 401/404 не повторяем
        if (e.status || i >= tries - 1) { NET.lastError = e; throw e; }
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
    const token = LAUNCH.token;
    const r = await request('POST', '/auth', { body: { token, deviceId, launch: { name: LAUNCH.name, complex: LAUNCH.complex, level: LAUNCH.level, tour: LAUNCH.tour, title: LAUNCH.title } } });
    this.session = r.session; this.user = r.user;
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
};

// перенос старого сохранения (до появления заглушки сервера)
async function migrateOldSave() {
  const old = loadStr('d67_save', '');
  if (!old) return null;
  try { const p = JSON.parse(old); await API.save(p); saveStr('d67_save', ''); return p; } catch (e) { return null; }
}

/* ---------- результат тура для приложения E-KNOT (docs/API.md, раздел 2) ---------- */
const CLIENT_VERSION = '1.5.0';
function buildResult(scene, r) {
  const T = scene.tour, res = Object.values(scene.res);
  const thinking = res.filter(x => x.status === 'thinking').length, notReached = res.filter(x => ['unknown', 'away', 'noanswer'].includes(x.status)).length;
  return {
    version: 1, game: 'korshiler', token: LAUNCH.token, runId: (scene.run && scene.run.runId) || ('local-' + Date.now()),
    tour: T.n - 1, tourCode: T.code, success: !!r.success, rule: T.rule === 'quorum' ? 'quorum_half_plus_one' : T.goal === PCT.twoThirds ? 'two_thirds_of_all' : T.goal === PCT.half ? 'half_plus_one_of_all' : 'tenth_of_all',
    apartments: APTS, votes: { yes: r.signatures, no: r.against ?? scene.against(), undecided: thinking, notReached, turnout: r.turnout ?? (r.signatures + scene.against()) },
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
