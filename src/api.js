/* ============================================================
   API — связь игры с сервером E-KNOT.
   Пока настоящего бэкенда нет, запросы обслуживает заглушка MockServer:
   она ведёт себя как сервер (задержка, редкие ошибки сети, проверка
   результатов), а данные хранит в localStorage браузера.
   Когда появится сервер — в API_CONFIG.baseUrl ставится его адрес,
   и все те же запросы пойдут через fetch. Игру менять не нужно.
   Описание запросов: docs/API.md
   ============================================================ */
const API_CONFIG = {
  baseUrl: null,                 // например 'https://api.e-knot.kz/game/v1'
  latency: [150, 450],           // задержка ответа заглушки, мс
  failRate: .04,                 // доля «обрывов связи» в заглушке (?stable — без них)
};

/* ---------------- заглушка сервера ---------------- */
const MockServer = (() => {
  const DB_KEY = 'kn_server_db';
  const load = () => { try { return JSON.parse(loadStr(DB_KEY, '')) || null; } catch (e) { return null; } };
  const db = load() || { users: {}, profiles: {}, runs: {}, scores: {}, rewards: {} };
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
  const me = token => {
    if (!token) err(401, 'no_session');
    const u = db.users[token]; if (!u) err(401, 'bad_session'); return u;
  };

  const routes = {
    // вход: токен из приложения или гость (без бонусов)
    'POST /auth'({ body }) {
      const t = body.token && TOKENS[body.token];
      let user;
      if (t) user = { ...t, guest: false };
      else {
        const gid = body.deviceId || ('g-' + Math.floor(Math.random() * 1e9));
        user = { userId: gid, name: null, complex: { id: 'guest', name: null, city: 'Астана' }, apartment: null, guest: true };
      }
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
      const u = me(session); db.profiles[u.userId] = null; delete db.scores[u.userId]; db.rewards[u.userId] = []; commit(); return { ok: true };
    },
    'POST /tours/start'({ session, body }) {
      const u = me(session); const tour = TOURS[body.tourId]; if (!tour) err(404, 'no_tour');
      const runId = 'r-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
      db.runs[runId] = { userId: u.userId, tourId: tour.id, startedAt: Date.now(), finished: false }; commit();
      return { runId, startedAt: db.runs[runId].startedAt, tour: { id: tour.id, goal: tour.goal, floors: tour.floors, perFloor: tour.perFloor } };
    },
    // итог: сервер сам считает подписи по журналу событий и проверяет, что всё правдоподобно
    'POST /tours/finish'({ session, body }) {
      const u = me(session); const run = db.runs[body.runId];
      if (!run || run.userId !== u.userId) err(404, 'no_run');
      if (run.finished) return run.result;                                     // повторная отправка — тот же ответ
      const tour = TOURS[run.tourId], maxApt = tour.floors * tour.perFloor;
      const seconds = (Date.now() - run.startedAt) / 1000;
      const yes = new Map();
      for (const e of body.events || []) if (e.t === 'yes' && e.apt >= 1 && e.apt <= maxApt && e.apt !== tour.heroApt) yes.set(e.apt, e.via || 'door');
      const suspicious = seconds < 15 && yes.size > 3;                       // 10 подписей за 15 секунд не бывает
      const signatures = suspicious ? 0 : yes.size, online = [...yes.values()].filter(v => v === 'online').length;
      const success = signatures >= tour.goal;
      const score = signatures * 100 + online * 20 + (success ? 300 + Math.max(0, Math.round(600 - seconds) * 2) : 0);
      const coins = signatures * 5 + (success ? 25 : 0);
      const prof = db.profiles[u.userId] || (db.profiles[u.userId] = {});
      prof.coins = (prof.coins || 0) + coins;
      const prevBest = (db.scores[u.userId] || {}).best || 0, best = Math.max(prevBest, score);
      db.scores[u.userId] = { name: prof.name || u.name || 'Ойыншы', complex: u.complex.id, best };
      // бонусы в приложение — только вошедшим через E-KNOT и только за первую победу в туре
      let reward = null; db.rewards[u.userId] = db.rewards[u.userId] || [];
      if (success && !db.rewards[u.userId].some(r => r.tourId === tour.id)) {
        reward = { tourId: tour.id, points: 50, status: u.guest ? 'needs_login' : 'sent', at: Date.now() };
        if (!u.guest) { db.rewards[u.userId].push(reward); prof.rewardsTotal = (prof.rewardsTotal || 0) + reward.points; }
      }
      run.finished = true;
      run.result = { signatures, online, success, score, best, newBest: score > prevBest, coins, totalCoins: prof.coins, reward, suspicious };
      commit();
      return run.result;
    },
    'GET /leaderboard'({ session, query }) {
      const u = me(session); const scope = query.scope === 'city' ? 'city' : 'complex';
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
    const r = await request('POST', '/auth', { body: { token: q.get('token'), deviceId } });
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
};

// перенос старого сохранения (до появления заглушки сервера)
async function migrateOldSave() {
  const old = loadStr('d67_save', '');
  if (!old) return null;
  try { const p = JSON.parse(old); await API.save(p); saveStr('d67_save', ''); return p; } catch (e) { return null; }
}
