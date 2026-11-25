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

// обиженная апа: «обижена на всех», но если выслушать — оттаивает. Тексты написаны в игре (не из файла Виталия) — на согласование
ARCH.obida = { mood: 16, deaf: .2, voice: 230, onlineOk: false, paperOnly: true, listen: 24,
  likes: { explain: 3, facts: -2, benefit: 6, neighbors: -10, online: -8 },
  look: { body: 'f', skin: '#d9a98a', hair: 'bun', hairCol: '#b8b4ae', top: 'jacket', topCol: '#5a3a4a', glasses: true, old: true, bottom: 'skirt', skirtCol: '#2e2a36' },
  lines: {
    greet: { kz: 'Ә, есіңе түстім бе? Он бес жыл ешкім кірмеді, қол керек болғанда ғана «апа, апа»!', ru: 'А, вспомнили про меня? Пятнадцать лет никто не заходил, а как подписи — так сразу «апа, апа»!' },
    again: { kz: 'Тағы сен бе. Мен әлі өткендегіден өкпелі жүрмін.', ru: 'Опять ты. Я ещё с прошлого раза обиженная.' },
    good:  [{ kz: 'Мейлі... әйтеуір біреу адамша түсіндірді.', ru: 'Ну... хоть кто-то по-человечески объяснил.' }],
    meh:   [{ kz: 'Бәрі солай дейді. Сосын қоқыс менің есігімнің алдында.', ru: 'Все так говорят. А потом мусор у моей двери.' }],
    bad:   [{ kz: 'Көршілер ме?! 2009 жылы кілемшемді алып кеткендер ме?', ru: 'Соседи?! Это те, что в 2009-м мой коврик унесли?' }],
    story: { kz: 'Жоғарыдан су ағызады, төменнен темекі шегеді, жиналыста бір рет те сұрамады. Сол үшін өкпелідім. Бәріне.', ru: 'Сверху заливают, снизу курят, а на собрании меня ни разу не спросили. Вот и обиделась. На всех.' },
    yes:   { kz: 'Жарайды, қол қоямын. Бірақ хаттамаға жазыңдар: «Апа дұрыс айтқан».', ru: 'Ладно, подпишу. Но в протоколе напишите: «Апа была права».' },
    no:    { kz: 'Жоқ! Бәріне айт: мен өкпеледім!', ru: 'Нет! И передай всем: я обиделась!' },
    think: { kz: 'Ойланамын. Өкпе бір күнде кетпейді.', ru: 'Подумаю. Обиды не проходят за один день.' },
    noOnline: { kz: 'Телефонмен дауыс беремін бе? Немерем онсыз да хабарласпайды!', ru: 'Чтобы я в телефоне голосовала? Мне и так внук не звонит!' },
  } };
NAMES_MAIN.obida = ['Роза апай', 'Күлән апай', 'Зина апай'];
