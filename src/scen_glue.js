/* ============================================================
   СКЛЕЙКА сценариев (src/scen_texts.js — тексты от E-KNOT, менять только через Виталия)
   с механикой игры: недостающие поля новых типов, выбор сценария по туру, имена.
   ============================================================ */
// новые типы: настрой, вкусы и внешность, которых нет в файле текстов
Object.assign(ARCH.novosel, { look: { body: 'f', hair: 'long', hairCol: '#4a2e22', top: 'shirt', topCol: '#a86a7a' }, deaf: .1 });
Object.assign(ARCH.notowner, { mood: 50, deaf: .45, listen: 0, likes: { explain: 0, facts: 0, benefit: 0, neighbors: 0, online: 0 }, look: { body: 'm', hair: 'short', top: 'hoodie' } });
Object.assign(ARCH.shady, { mood: 10, listen: 0, likes: { explain: 0, facts: 0, benefit: 0, neighbors: 0, online: 0 }, look: { body: 'm', hair: 'short', top: 'leather', topCol: '#2b2a33' } });
Object.assign(ARCH.renter, { mood: 60, deaf: .3, listen: 0, likes: { explain: 0, facts: 0, benefit: 0, neighbors: 0, online: 0 }, look: { body: 'f', hair: 'long', top: 'hoodie' } });
// голосуют только на бумаге (с тура 2): обзвон ставит им отметку 📄, к ним идёт герой
for (const a of ['apa', 'ata', 'grump']) { ARCH[a].paperOnly = true; ARCH[a].onlineOk = false; }
// ата: «бата» — при «за» соседи его этажа и рядом добрее
ARCH.ata.bata = 6;

// сценарий жильца в этом туре (или null — тогда обычные реплики характера)
function scenFor(arch, tour) { return (SCEN[arch] || []).find(s => s.tour === tour.scen) || null; }
// имена жильцов: основные имена героев из утверждённого списка, остальным — по полу и возрасту
function namePool(a, look) {
  if (NAMES_MAIN[a]) return NAMES_MAIN[a];
  const young = ['notowner', 'renter', 'it'].includes(a);
  return look.body === 'f' ? (young ? NAME_POOL.youngF : NAME_POOL.adultF) : (young ? NAME_POOL.youngM : NAME_POOL.adultM);
}
// одна строка из варианта: объект {kz, ru} или массив вариантов (по номеру)
function pickLine(v, i = 0) { if (!v) return null; return Array.isArray(v) ? v[((i % v.length) + v.length) % v.length] : v; }
