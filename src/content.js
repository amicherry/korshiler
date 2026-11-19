/* ============================================================
   КОНТЕНТ: тексты интерфейса, характеры жильцов, туры.
   В полной версии этот блок приходит с сервера (GET /content),
   поэтому всё описано данными, а не кодом.
   ============================================================ */
let LANG = loadStr('d67_lang', 'kz');
const LI = () => ({ kz: 0, ru: 1, en: 2 }[LANG] ?? 1);   // индекс языка для строк вида 'каз|рус|eng'
const L = (o) => (o && typeof o === 'object' && !Array.isArray(o)) ? (o[LANG] ?? o.ru) : o;

const UI = {
  title:      { kz: 'КӨРШІЛЕР', ru: 'СОСЕДИ', en: 'NEIGHBOURS' },
  subtitle:   { kz: 'Үйді бірге жөндейміз', ru: 'Чиним дом вместе', en: 'Fixing the house together' },
  by:         { kz: 'E-KNOT ойыны', ru: 'игра от E-KNOT', en: 'an E-KNOT game' },
  play:       { kz: 'ОЙНАУ', ru: 'ИГРАТЬ', en: 'PLAY' },
  cont:       { kz: 'ЖАЛҒАСТЫРУ', ru: 'ПРОДОЛЖИТЬ', en: 'CONTINUE' },
  settings:   { kz: 'БАПТАУЛАР', ru: 'НАСТРОЙКИ', en: 'SETTINGS' },
  hello:      { kz: 'Сәлем, ', ru: 'Привет, ', en: 'Hi, ' },
  lang:       { kz: 'ТІЛ', ru: 'ЯЗЫК', en: 'LANGUAGE' },
  sound:      { kz: 'ДЫБЫС', ru: 'ЗВУК', en: 'SOUND' },
  on:         { kz: 'ҚОСУЛЫ', ru: 'ВКЛ', en: 'ON' }, off: { kz: 'ӨШІРУЛІ', ru: 'ВЫКЛ', en: 'OFF' },
  reset:      { kz: 'ПРОГРЕСТІ ТАЗАЛАУ', ru: 'СБРОСИТЬ ПРОГРЕСС', en: 'RESET PROGRESS' },
  resetSure:  { kz: 'СЕНІМДІСІҢ БЕ? ТАҒЫ БАС', ru: 'ТОЧНО? НАЖМИ ЕЩЁ РАЗ', en: 'SURE? TAP AGAIN' },
  resetDone:  { kz: 'ТАЗАЛАНДЫ', ru: 'СБРОШЕНО', en: 'RESET DONE' },
  back:       { kz: 'АРТҚА', ru: 'НАЗАД', en: 'BACK' },
  creator:    { kz: 'КЕЙІПКЕР', ru: 'ПЕРСОНАЖ', en: 'CHARACTER' },
  name:       { kz: 'АТЫҢ', ru: 'ИМЯ', en: 'NAME' },
  body:       { kz: 'ЖЫНЫС', ru: 'ПОЛ', en: 'BODY' },
  bottom:     { kz: 'ТӨМЕНІ', ru: 'НИЗ', en: 'BOTTOM' },
  skin:       { kz: 'ТЕРІ', ru: 'КОЖА', en: 'SKIN' },
  hair:       { kz: 'ШАШ', ru: 'ПРИЧЁСКА', en: 'HAIR' },
  hairCol:    { kz: 'ШАШ ТҮСІ', ru: 'ЦВЕТ ВОЛОС', en: 'HAIR COLOUR' },
  top:        { kz: 'КИІМ', ru: 'ОДЕЖДА', en: 'CLOTHES' },
  topCol:     { kz: 'КИІМ ТҮСІ', ru: 'ЦВЕТ ОДЕЖДЫ', en: 'CLOTHES COLOUR' },
  hat:        { kz: 'БАС КИІМ', ru: 'ШАПКА', en: 'HAT' },
  ready:      { kz: 'ДАЙЫН', ru: 'ГОТОВО', en: 'DONE' },
  rotate:     { kz: 'Телефонды көлденең бұрыңыз', ru: 'Поверни телефон горизонтально', en: 'Turn your phone sideways' },
  knock:      { kz: 'ҚАҒУ', ru: 'СТУК', en: 'KNOCK' }, talk: { kz: 'СӨЙЛЕС', ru: 'ГОВОРИТЬ', en: 'TALK' }, next: { kz: 'ӘРІ', ru: 'ДАЛЕЕ', en: 'NEXT' }, stairs: { kz: 'САТЫ', ru: 'ЛЕСТНИЦА', en: 'STAIRS' },
  floor:      { kz: '-қабат', ru: ' этаж', en: ' floor' },
  apt:        { kz: 'пәтер', ru: 'кв.', en: 'apt' },
  meetingT:   { kz: '{n}-ЖИНАЛЫС', ru: 'СОБРАНИЕ №{n}', en: 'MEETING #{n}' },
  councilName:{ kz: 'Үй кеңесі', ru: 'Совет дома', en: 'House council' },
  councilDone:{ kz: 'Кеңес мүшелері {f}-қабатты аралап шықты: +{n} дауыс.', ru: 'Члены совета обошли {f} этаж: +{n} голосов.', en: 'Council members went round floor {f}: +{n} votes.' },
  lvShort:    { kz: 'Дең. ', ru: 'Ур. ', en: 'Lv ' },
  aptShort:   { kz: 'п. ', ru: 'кв. ', en: 'apt ' },
  qzMenu:     { kz: 'ТКШ білгірі — викторина', ru: 'Знаток ЖКХ — викторина', en: 'Housing expert — quiz' },
  qzMenuSub:  { kz: 'Сұрақтар, кедергілер, техпаспорт беттері', ru: 'Вопросы, преграды, страницы техпаспорта', en: 'Questions, obstacles, pages of the house passport' },
  qzPlay:     { kz: 'ОЙНАУ', ru: 'ИГРАТЬ', en: 'PLAY' },
  qzTitle:    { kz: 'ТЕХПАСПОРТ ҰРЛАНДЫ!', ru: 'ТЕХПАСПОРТ УКРАДЕН!', en: 'THE PASSPORT IS GONE!' },
  qzIntro:    { kz: 'Бюрократ Қағазбаев үйдің техпаспортын алып, беттерін подъезд дәліздеріне шашып тастады! Жүгір, кедергілерден секір (тап немесе бос орын). Есіктердің алдында — сұрақ: дұрыс есік бетті қайтарады. Қате болса, жол ұзарады. {n} бетті жина!', ru: 'Бюрократ Бумажкин унёс техпаспорт дома и раскидал страницы по коридорам подъезда! Беги, прыгай через преграды (тап или пробел). У дверей — вопрос: верная дверь возвращает страницу, неверная удлиняет путь. Собери {n} страниц!', en: 'Bureaucrat Paperkin took the house passport and scattered its pages around the stairwell! Run and jump over obstacles (tap or space). At the doors — a question: the right door returns a page, a wrong one makes the path longer. Collect {n} pages!' },
  qzGo:       { kz: 'КЕТТІК!', ru: 'ПОЕХАЛИ!', en: "LET'S GO!" },
  qzJump:     { kz: 'СЕКІРУ', ru: 'ПРЫЖОК', en: 'JUMP' },
  qzPath:     { kz: 'жол', ru: 'путь', en: 'path' },
  qzOk:       { kz: 'ДҰРЫС!', ru: 'ВЕРНО!', en: 'CORRECT!' },
  qzNo:       { kz: 'ҚАТЕ', ru: 'НЕВЕРНО', en: 'WRONG' },
  qzRight:    { kz: 'Бет табылды: {n}/{t}. +{c} ₸', ru: 'Страница найдена: {n}/{t}. +{c} ₸', en: 'Page found: {n}/{t}. +{c} ₸' },
  qzWrong:    { kz: 'Дұрыс жауап: {a}.', ru: 'Правильно: {a}.', en: 'Correct answer: {a}.' },
  qzLonger:   { kz: 'Жол ұзарды — бұл сұрақ кейін қайта келеді.', ru: 'Путь удлинился — этот вопрос вернётся позже.', en: 'The path got longer — this question will come back.' },
  qzDone:     { kz: 'ТЕХПАСПОРТ ЖИНАЛДЫ!', ru: 'ТЕХПАСПОРТ СОБРАН!', en: 'PASSPORT RESTORED!' },
  qzFirst:    { kz: 'Бірінші реттен дұрыс', ru: 'Верно с первой попытки', en: 'Right on first try' },
  qzWrongN:   { kz: 'Қате есіктер', ru: 'Неверных дверей', en: 'Wrong doors' },
  qzTitleGot: { kz: '«ТКШ білгірі» атағы мен белгісі — E-KNOT профиліңде!', ru: 'Звание и значок «Знаток ЖКХ» — в твоём профиле E-KNOT!', en: 'The “Housing expert” title and badge — in your E-KNOT profile!' },
  qzTitleNeed:{ kz: '«ТКШ білгірі» атағы үшін сұрақтардың {p} %-ына бірінші реттен дұрыс жауап бер.', ru: 'Для звания «Знаток ЖКХ» ответь верно с первой попытки на {p} % вопросов.', en: 'For the “Housing expert” title, get {p}% right on the first try.' },
  day:        { kz: 'КҮН', ru: 'ДЕНЬ', en: 'DAY' },
  yesShort:   { kz: 'ИӘ', ru: 'ЗА', en: 'YES' },
  turnShort:  { kz: 'ҚАТЫСТЫ', ru: 'ЯВКА', en: 'TURNOUT' },
  noQuorum:   { kz: 'КВОРУМ ЖОҚ', ru: 'КВОРУМА НЕТ', en: 'NO QUORUM' },
  rTurnout:   { kz: 'Дауыс бергендер', ru: 'Явка', en: 'Turnout' },
  hNeedChair: { kz: 'Кәдімгі жөндеуді ОСИ төрағасы шешеді: 2-жиналыста («Төрағаны сайлау») жеңіп ал.', ru: 'Обычный ремонт решает председатель ОСИ: выиграй собрание 2 «Выбор председателя».', en: 'Regular repairs are the chairman\'s call: win meeting 2 “Electing the chairman”.' },
  lkPrev:     { kz: '{n}-жиналыстан кейін ашылады', ru: 'Откроется после собрания {n}', en: 'Opens after meeting {n}' },
  lkFix:      { kz: 'Алдымен жөнде: {p}', ru: 'Сначала почини: {p}', en: 'Fix first: {p}' },
  lkFixCount: { kz: 'Алдымен «Менің ЖК»-да {n} жөндеу жаса', ru: 'Сначала сделай {n} ремонта в «Мой ЖК»', en: 'Do {n} repairs in “My block” first' },
  daysWord:   { kz: 'күн', ru: 'дней', en: 'days' },
  lvYes:      { kz: '{g} «иә»', ru: '{g} «за»', en: '{g} yes' },
  lvQuorum:   { kz: '{q} қатысу, «иә» > ½', ru: 'явка {q}, «за» > ½', en: 'turnout {q}, yes > ½' },
  meetingB: { kz: 'Күн тәртібі: {t}. Ереже: {r}.', ru: 'Повестка: {t}. Правило: {r}.', en: 'Agenda: {t}. Rule: {r}.' },
  pause:      { kz: 'ҮЗІЛІС', ru: 'ПАУЗА', en: 'PAUSE' },
  pauseNote:  { kz: 'Шықсаң, бұл жиналыс есептелмейді.', ru: 'Если выйти, это собрание не засчитается.', en: 'If you leave, this meeting won\'t count.' },
  resume:     { kz: 'ЖАЛҒАСТЫРУ', ru: 'ПРОДОЛЖИТЬ', en: 'CONTINUE' },
  quitLevel:  { kz: 'ДЕҢГЕЙДЕН ШЫҒУ', ru: 'ВЫЙТИ', en: 'LEAVE' },
  lift:       { kz: 'ЛИФТ', ru: 'ЛИФТ', en: 'LIFT' },
  liftBroken: { kz: 'Лифт істемейді', ru: 'Лифт не работает', en: 'The lift is broken' },
  budget:     { kz: 'Бюджет', ru: 'Бюджет', en: 'Budget' },
  meetings:   { kz: 'ЖИНАЛЫСТАР', ru: 'СОБРАНИЯ', en: 'MEETINGS' },
  bonusDay:   { kz: 'Күн бонусы', ru: 'Бонус дня', en: 'Daily bonus' },
  hHint:      { kz: 'Үйдегі белгіні бас: «!» — жөндеуге болады, «?» — алдымен жиналыс', ru: 'Нажми на значок: «!» — можно чинить, «?» — сначала собрание', en: 'Tap a marker: “!” — can fix, “?” — meeting first' },
  hNeedPrev:  { kz: 'Алдымен алдыңғы ақауды жөнде.', ru: 'Сначала исправь предыдущую проблему.', en: 'Fix the previous problem first.' },
  hNeedVote: { kz: 'Бұл — конструкцияны өзгерту: {n}-жиналыста 2/3 дауыс керек.', ru: 'Это изменение конструкции: нужно 2/3 голосов на собрании {n}.', en: 'This is a structural change: you need 2/3 of the votes at meeting {n}.' },
  hDecorLock: { kz: '{n} ақауды жөндегеннен кейін ашылады.', ru: 'Откроется, когда исправишь {n} проблемы.', en: 'Opens once you fix {n} problems.' },
  hDecorDesc: { kz: 'Ауланы әдемілейді: ЖК ұпайы +{n}', ru: 'Украшает двор: очки ЖК +{n}', en: 'Makes the yard nicer: block points +{n}' },
  hFix:       { kz: 'ЖӨНДЕУ', ru: 'ЧИНИТЬ', en: 'FIX' },
  hEarn:      { kz: 'БЮДЖЕТ ЖИНАУ', ru: 'ЗАРАБОТАТЬ', en: 'EARN' },
  hGoVote:    { kz: 'ЖИНАЛЫСҚА', ru: 'НА СОБРАНИЕ', en: 'TO THE MEETING' },
  hNoMoney:   { kz: 'Бюджет жетпейді', ru: 'Не хватает бюджета', en: 'Not enough budget' },
  hNoMoneyHint:{ kz: 'Өткен жиналыстарды қайта өткізіп, бюджет жина.', ru: 'Переиграй пройденные собрания, чтобы собрать бюджет.', en: 'Replay finished meetings to raise the budget.' },
  hFixedToast:{ kz: '«{p}» жөнделді! Көршілер енді басқа нәрсеге шағымданады.', ru: '«{p}» — готово! Соседи теперь жалуются на другое.', en: '“{p}” — done! Neighbours complain about something else now.' },
  hDecorToast:{ kz: 'Аула әдемірек болды!', ru: 'Двор стал красивее!', en: 'The yard looks nicer!' },
  lvLocked:   { kz: 'Алдыңғы ақауды жөндегенде ашылады', ru: 'Откроется после ремонта предыдущей проблемы', en: 'Opens after the previous problem is fixed' },
  lvGoal:     { kz: '{g} қолтаңба', ru: '{g} подписей', en: '{g} signatures' },
  toHouse:    { kz: 'МЕНІҢ ЖК', ru: 'МОЙ ЖК', en: 'MY BLOCK' },
  tabHouse:   { kz: 'ҮЗДІК ЖК', ru: 'ЛУЧШИЙ ЖК', en: 'BEST BLOCK' },
  winMeeting: { kz: 'ЖИНАЛЫС КЕЛІСТІ!', ru: 'СОБРАНИЕ ЗА!', en: 'THE MEETING SAYS YES!' },
  rBudget:    { kz: 'ЖК бюджетіне', ru: 'В бюджет ЖК', en: 'To the block budget' },
  rFirstWin:  { kz: 'Көршілер келісті! Енді «{p}» ақауын «Менің ЖК»-да жөндеуге болады.', ru: 'Соседи согласны! Теперь «{p}» можно починить в «Моём ЖК».', en: 'Neighbours agree! Now “{p}” can be fixed in “My block”.' },
  rReplay:    { kz: 'Бюджет толықты. «Менің ЖК»-ға бар.', ru: 'Бюджет пополнен. Загляни в «Мой ЖК».', en: 'Budget topped up. Check “My block”.' },
  signs:      { kz: 'ҚОЛ', ru: 'ПОДПИСИ', en: 'SIGNED' },
  votes:      { kz: 'ДАУЫС', ru: 'ГОЛОСА', en: 'VOTES' },
  tours:      { kz: 'ТУРЛАР', ru: 'ТУРЫ', en: 'TOURS' },
  tourName:   { t1: { kz: '1-тур: ОСИ құру', ru: 'Тур 1: Создаём ОСИ', en: 'Tour 1: Founding the OSI' }, t2: { kz: '2-тур: Антенна', ru: 'Тур 2: Антенна', en: 'Tour 2: Antenna' } },
  tourDesc:   { t1: { kz: '5 қабат · 10 қолтаңба жина', ru: '5 этажей · собери 10 подписей', en: '5 floors · collect 10 signatures' }, t2: { kz: '9 қабат · 100 пәтер · 51 дауыс', ru: '9 этажей · 100 квартир · 51 голос', en: '9 floors · 100 flats · 51 votes' } },
  locked:     { kz: 'Алдымен 1-турды өт', ru: 'Сначала пройди тур 1', en: 'Finish tour 1 first' },
  best:       { kz: 'Рекорд', ru: 'Рекорд', en: 'Best' },
  play2:      { kz: 'ОЙНАУ', ru: 'ИГРАТЬ', en: 'PLAY' },
  t2intro1:   { kz: 'Сенбі. Үйге ортақ антенна керек — жалпы жиналыс! 100 пәтердің 51-і «иә» деуі тиіс.', ru: 'Суббота. Дому нужна общая антенна — общее собрание! «За» должны 51 квартира из 100.', en: 'Saturday. The house needs a shared antenna — general meeting! 51 flats out of 100 must vote yes.' },
  t2intro2:   { kz: 'Өз подъезіңді өзің ара. Қалған екі подъезд E-KNOT-та онлайн дауыс береді: сенің подъезіңде «иә» көп болса, олар да белсенді.', ru: 'Свой подъезд обойди сам. Два других голосуют онлайн в E-KNOT: чем больше «за» в твоём подъезде, тем активнее и они.', en: 'Go round your own entrance. The other two vote online in E-KNOT: the more yes in yours, the more active they are.' },
  t2intro3:   { kz: 'Енот рассылкасы басқа подъездтерге де жетеді. Сәттілік!', ru: 'Рассылка енота дойдёт и до других подъездов. Удачи!', en: 'The raccoon\'s broadcast will reach the other entrances too. Good luck!' },
  remote:     { kz: 'Басқа подъездтер (E-KNOT онлайн)', ru: 'Другие подъезды (онлайн в E-KNOT)', en: 'Other entrances (online in E-KNOT)' },
  remoteToast:{ kz: 'E-KNOT-та онлайн дауыс: +{n}', ru: 'Онлайн-голоса в E-KNOT: +{n}', en: 'Online votes in E-KNOT: +{n}' },
  goalDone2:  { kz: '51 дауыс бар! Антенна болады. Турды аяқтауға болады.', ru: '51 голос есть! Антенне быть. Можно завершать тур.', en: '51 votes! The antenna is happening. You can finish the tour.' },
  win2:       { kz: 'АНТЕННА ОРНАТЫЛАДЫ!', ru: 'АНТЕННУ СТАВИМ!', en: 'THE ANTENNA IS GOING UP!' },
  lose2:      { kz: 'ДАУЫС ЖЕТПЕДІ', ru: 'ГОЛОСОВ НЕ ХВАТИЛО', en: 'NOT ENOUGH VOTES' },
  rOwn:       { kz: 'Өз подъезім', ru: 'Мой подъезд', en: 'My entrance' },
  rRemote:    { kz: 'Басқа подъездтер', ru: 'Другие подъезды', en: 'Other entrances' },
  rNext2:     { kz: 'Шатырда енді антенна тұр — менюдан қара!', ru: 'На крыше теперь антенна — посмотри в меню!', en: 'There\'s an antenna on the roof now — check the menu!' },
  ballot:     { kz: 'БЮЛЛЕТЕНЬ', ru: 'БЮЛЛЕТЕНЬ', en: 'BALLOT' },
  ballotTitle:{ kz: '1-ПОДЪЕЗД: ҚОЛ ЖИНАУ', ru: 'ПОДЪЕЗД 1: СБОР ПОДПИСЕЙ', en: 'ENTRANCE 1: SIGNATURES' },
  close:      { kz: 'ЖАБУ', ru: 'ЗАКРЫТЬ', en: 'CLOSE' },
  finish:     { kz: 'ТУРДЫ АЯҚТАУ', ru: 'ЗАВЕРШИТЬ ТУР', en: 'FINISH TOUR' },
  raccoon:    { kz: 'ЕНОТ', ru: 'ЕНОТ', en: 'ENOT' },
  yourDoor:   { kz: 'Бұл сенің пәтерің. Қазір үйге кіретін уақыт емес.', ru: 'Это твоя квартира. Сейчас не время отдыхать.', en: 'This is your flat. No time to rest now.' },
  st: {
    unknown:  { kz: 'сұралмаған', ru: 'не опрошен', en: 'not asked' }, away: { kz: 'үйде жоқ', ru: 'нет дома', en: 'not home' }, noanswer: { kz: 'ашпады', ru: 'не открыл', en: 'didn\'t open' },
    thinking: { kz: 'ойланып жүр', ru: 'думает', en: 'thinking' }, yes: { kz: 'ҚОЛ ҚОЙДЫ', ru: 'ПОДПИСАЛ', en: 'SIGNED' }, no: { kz: 'қарсы', ru: 'против', en: 'against' },
    online:   { kz: 'E-KNOT-та қояды', ru: 'подпишет в E-KNOT', en: 'will sign in E-KNOT' }, renter: { kz: 'жалға тұрады', ru: 'арендатор', en: 'tenant' }, me: { kz: 'сен', ru: 'ты', en: 'you' }
  },
  // меню разговора
  cExplain:   { kz: 'Түсіндіру', ru: 'Объяснить', en: 'Explain' },
  cArgs:      { kz: 'Дәлел ▸', ru: 'Аргумент ▸', en: 'Argument ▸' },
  cListen:    { kz: 'Тыңдау', ru: 'Выслушать', en: 'Listen' },
  cLater:     { kz: 'Кейін келемін', ru: 'Зайду позже', en: 'Come back later' },
  aFacts:     { kz: 'Деректер', ru: 'Факты', en: 'Facts' },
  aBenefit:   { kz: 'Пайда', ru: 'Выгода', en: 'Benefit' },
  aNeighbors: { kz: 'Көршілер', ru: 'Соседи', en: 'Neighbours' },
  aOnline:    { kz: 'E-KNOT арқылы', ru: 'Через E-KNOT', en: 'Via E-KNOT' },
  aBack:      { kz: '◂ Артқа', ru: '◂ Назад', en: '◂ Back' },
  heroExplain:{ kz: 'ОСИ болса, үйді өзіміз басқарамыз: жөндеу, шығын, бәрі біздің шешіміміз.', ru: 'С ОСИ мы сами управляем домом: ремонт, расходы — всё решаем мы.', en: 'With an OSI we run the house ourselves: repairs, spending — we decide everything.' },
  heroFacts:  { kz: 'Міне есеп: жарна айына 2000 ₸, барлық шығын E-KNOT-та көрініп тұрады.', ru: 'Вот расчёт: взнос 2000 ₸ в месяц, все расходы видны в E-KNOT.', en: 'Here\'s the maths: 2000 ₸ a month, and every expense is visible in E-KNOT.' },
  heroBenefit:{ kz: 'Шатыр, жарық, антенна — бәрін тез шешеміз. Өтінімді телефоннан жібересіз.', ru: 'Крыша, свет, антенна — решим быстро. Заявки — прямо с телефона.', en: 'Roof, lights, antenna — sorted quickly. Requests go straight from your phone.' },
  heroNeighbors:{ kz: 'Көршілердің {n}-і қол қойып қойды!', ru: 'Уже {n} соседей подписались!', en: '{n} neighbours have already signed!' },
  heroOnline: { kz: 'Қазір асықсаңыз, E-KNOT-та бір батырмамен қол қоя аласыз.', ru: 'Если спешите — подпишите в E-KNOT одной кнопкой.', en: 'In a hurry? Sign in E-KNOT with one tap.' },
  heroListen: { kz: 'Айтыңызшы, сізді не мазалайды?', ru: 'Расскажите, что вас беспокоит?', en: 'Tell me, what\'s bothering you?' },
  // пролог, обучение
  pushOSI:    { kz: 'Сіздің үйде ОСИ құрылмаған. ОСИ болмаса, жөндеу мен жақсарту мүмкін емес.', ru: 'В вашем доме не создано ОСИ. Без ОСИ ремонт и улучшения невозможны.', en: 'Your building has no OSI. Without one, repairs and improvements are impossible.' },
  heroIntro1: { kz: 'Иә... Үй құлайын деп тұр. Шатыр ағады, подъезде шам жоқ.', ru: 'Да уж... Дом разваливается. Крыша течёт, в подъезде темно.', en: 'Yeah... The house is falling apart. The roof leaks, the stairwell is dark.' },
  heroIntro2: { kz: 'Бастамашыл топқа {g} қолтаңба керек — {n} пәтердің 10 %-ы. Кеттік!', ru: 'Для инициативной группы нужно {g} подписей — это 10 % от {n} квартир. Погнали!', en: 'The initiative group needs {g} signatures — 10% of {n} flats. Let\'s go!' },
  tutTap:     { kz: 'Есікке немесе басқа қабатқа бас — кейіпкер өзі барады.', ru: 'Нажми на дверь или на другой этаж — герой дойдёт сам.', en: 'Tap a door or another floor — the hero will walk there.' },
  tut1:       { kz: 'Есікке жақындап, ҚАҒУ бас. Есік астындағы жарық — үйде біреу бар.', ru: 'Подойди к двери и нажми СТУК. Свет под дверью — кто-то дома.', en: 'Walk up to a door and press KNOCK. Light under the door — someone\'s home.' },
  tut2:       { kz: 'Сол жақта саты. ▲▼ арқылы қабат ауыстыр. Әр әрекет уақыт алады!', ru: 'Слева лестница: ▲▼ — сменить этаж. Каждое действие тратит время!', en: 'Stairs on the left: ▲▼ — change floor. Every action takes time!' },
  nobody:     { kz: 'Ешкім жоқ сияқты. Кейін қайта келуге болады.', ru: 'Похоже, никого нет. Можно зайти позже.', en: 'Looks like nobody\'s home. You can come back later.' },
  noOpen:     { kz: 'Ешкім ашпады... Тағы қағып көр.', ru: 'Никто не открыл... Попробуй ещё раз.', en: 'Nobody opened... Try again.' },
  goalDone: { kz: 'Қажетті дауыстар бар! Жиналысты аяқтауға немесе тағы жинауға болады.', ru: 'Нужные голоса есть! Можно завершить собрание или собрать ещё.', en: 'You have the votes you need! Finish the meeting or collect more.' },
  timeUp:     { kz: 'Уақыт бітті!', ru: 'Время вышло!', en: 'Time\'s up!' },
  helperDone: { kz: 'Мадина {f}-қабаттан {n} қолтаңба жинады!', ru: 'Мадина собрала {n} подписей на {f} этаже!', en: 'Madina collected {n} signatures on floor {f}!' },
  raccoonT:   { kz: 'ЕНОТ ТАРАТТЫ!', ru: 'ЕНОТ РАЗОСЛАЛ!', en: 'THE RACCOON SENT IT OUT!' },
  raccoonB:   { kz: 'Үйде жоқ көршілерге E-KNOT-та хабарлама кетті. Кейбірі онлайн қол қояды.', ru: 'Соседям, которых нет дома, ушло уведомление в E-KNOT. Часть подпишет онлайн.', en: 'Neighbours who aren\'t home got an E-KNOT notification. Some will sign online.' },
  noRaccoon:  { kz: 'Енот бұл турда көмектесіп қойды.', ru: 'Енот уже помог в этом туре.', en: 'The raccoon has already helped this tour.' },
  // итоги
  win:        { kz: 'СЕН ОСИ ТӨРАҒАСЫСЫҢ!', ru: 'ТЫ — ПРЕДСЕДАТЕЛЬ ОСИ!', en: 'YOU ARE THE OSI CHAIRMAN!' },
  lose: { kz: 'ДАУЫС ЖЕТПЕДІ', ru: 'ГОЛОСОВ НЕ ХВАТИЛО', en: 'NOT ENOUGH VOTES' },
  protocol:   { kz: 'ХАТТАМА №1', ru: 'ПРОТОКОЛ №1', en: 'MINUTES #1' },
  rSigned:    { kz: 'Қол қойғандар', ru: 'Подписали', en: 'Signed' },
  rOnline:    { kz: 'Онлайн, E-KNOT арқылы', ru: 'Онлайн через E-KNOT', en: 'Online via E-KNOT' },
  rSuspicious: { kz: 'Тым жылдам — сервер дауыстарды есептемеді. Әр көршімен шынымен сөйлесіңіз.', ru: 'Слишком быстро — сервер не засчитал голоса. Поговори с соседями по-настоящему.', en: 'Too fast — the server didn\'t count the votes. Really talk to your neighbours.' },
  rDoor:      { kz: 'Есік алдында қол қойды', ru: 'Подписали у дверей', en: 'Signed at the door' },
  rTotal:     { kz: 'Барлық дауыс', ru: 'Всего голосов', en: 'Total votes' },
  hudOnline:  { kz: '+{n} онлайн күтілуде', ru: '+{n} ждём онлайн', en: '+{n} expected online' },
  rAgainst:   { kz: 'Қарсы', ru: 'Против', en: 'Against' },
  rThinking:  { kz: 'Ойланып жүр', ru: 'Думают', en: 'Thinking' },
  rCoins:     { kz: 'Тиын', ru: 'Монеты', en: 'Coins' },
  rNext:      { kz: 'Келесі: 2-тур «Жалпы жиналыс» — антенна үшін 50%+1. Жақында!', ru: 'Дальше: тур 2 «Общее собрание» — 50%+1 за антенну. Скоро!', en: 'Next: tour 2 “General meeting” — 50%+1 for the antenna. Coming soon!' },
  rRetry:     { kz: 'Көршілер есінде сақтайды: келесі жолы оңайырақ болады.', ru: 'Соседи запомнят разговор: в следующий раз будет проще.', en: 'Neighbours will remember the talk: it\'ll be easier next time.' },
  rating:     { kz: 'РЕЙТИНГ', ru: 'РЕЙТИНГ', en: 'RATING' },
  tabComplex: { kz: 'МЕНІҢ ЖК', ru: 'МОЙ ЖК', en: 'MY BLOCK' }, tabCity: { kz: 'ҚАЛА', ru: 'ГОРОД', en: 'CITY' },
  you:        { kz: 'сіз', ru: 'вы', en: 'you' },
  noScore:    { kz: 'Сізде әлі ұпай жоқ — турды ойнаңыз!', ru: 'У вас ещё нет очков — сыграйте тур!', en: 'No points yet — play a tour!' },
  guestMode:  { kz: 'Қонақ режимі', ru: 'Гостевой режим', en: 'Guest mode' },
  guestNote:  { kz: 'Бонустар үшін ойынды E-KNOT қосымшасынан ашыңыз', ru: 'Для бонусов откройте игру из приложения E-KNOT', en: 'For bonuses, open the game from the E-KNOT app' },
  netFail:    { kz: 'Серверге қосылу мүмкін болмады', ru: 'Не удалось связаться с сервером', en: 'Couldn\'t reach the server' },
  netSaveFail:{ kz: 'Сақтау сәтсіз, кейін қайталаймыз', ru: 'Не сохранилось, повторим позже', en: 'Not saved, will retry later' },
  retry:      { kz: 'ҚАЙТАЛАУ', ru: 'ПОВТОРИТЬ', en: 'RETRY' },
  rScore:     { kz: 'Ұпай', ru: 'Очки', en: 'Points' },
  rRank:      { kz: 'ЖК-дағы орын', ru: 'Место в ЖК', en: 'Place in block' },
  rOffline:   { kz: 'Байланыс жоқ: нәтиже рейтингке кірмеді.', ru: 'Нет связи: результат не попал в рейтинг.', en: 'No connection: the result didn\'t reach the rating.' },
  rRewardSent: { kz: '+{n} ұпай және «{b}» белгісі — E-KNOT-та!', ru: '+{n} баллов и значок «{b}» — в E-KNOT!', en: '+{n} points and the “{b}” badge — in E-KNOT!' },
  rRewardGuest: { kz: '«{b}» белгісі мен +{n} ұпай күтіп тұр — ойынды E-KNOT қосымшасынан ашыңыз.', ru: 'Значок «{b}» и +{n} баллов ждут — откройте игру из приложения E-KNOT.', en: 'The “{b}” badge and +{n} points are waiting — open the game from the E-KNOT app.' },
  again:      { kz: 'ҚАЙТАЛАУ', ru: 'ЕЩЁ РАЗ', en: 'AGAIN' }, menu: { kz: 'МӘЗІР', ru: 'МЕНЮ', en: 'MENU' },
  // болтун и помощница
  talkerName: { kz: 'Жанат аға', ru: 'Жанат-ага', en: 'Uncle Zhanat' },
  talker1:    { kz: 'О, жаңа көрші! Тоқта-тоқта. Білесің бе, 2003 жылы осы баспалдақта...', ru: 'О, новый сосед! Стой-стой. Знаешь, в 2003 году на этой лестнице...', en: 'Oh, a new neighbour! Wait, wait. You know, back in 2003 on these very stairs...' },
  tListen:    { kz: 'Тыңдау (−3 мин)', ru: 'Выслушать (−3 мин)', en: 'Listen (−3 min)' },
  tLater:     { kz: '«Кейін айтасыз»', ru: '«Расскажете потом»', en: '“Tell me later”' },
  tChat:      { kz: '«Үй чатына жазыңыз»', ru: '«Напишите в чат дома»', en: '“Write in the chat”' },
  talkerListen:{ kz: '...міне, сондықтан жарық керек! Жарайды, бүкіл қабатқа айтамын: сен дұрыс адамсың.', ru: '...вот поэтому свет и нужен! Ладно, скажу всему этажу: ты нормальный.', en: '...and that\'s why we need the lights! Fine, I\'ll tell the whole floor you\'re alright.' },
  talkerLater:{ kz: 'Хм. Жастар әрқашан асығады.', ru: 'Хм. Молодёжь вечно спешит.', en: 'Hm. Young people, always in a rush.' },
  talkerChat: { kz: 'Чат? E-KNOT-та ма? Жарайды, сонда фото салайын.', ru: 'Чат? В E-KNOT? Ладно, выложу туда фотки.', en: 'A chat? In E-KNOT? Fine, I\'ll post photos there.' },
  helperName: { kz: 'Мадина', ru: 'Мадина', en: 'Madina' },
  helper1:    { kz: 'Сен қол жинап жүрсің бе? Мен де ОСИ-ді жақтаймын! {f}-қабатты өзім аралап шығайын ба?', ru: 'Ты собираешь подписи? Я тоже за ОСИ! Давай я сама обойду {f} этаж?', en: 'You\'re collecting signatures? I\'m for the OSI too! Shall I go round floor {f} myself?' },
  hYes:       { kz: 'Иә, рахмет!', ru: 'Да, спасибо!', en: 'Yes, thanks!' },
  hNo:        { kz: 'Өзім барамын', ru: 'Я сам(а)', en: 'I\'ll do it myself' },
  helperOk:   { kz: 'Келістік! Жарты сағатта хабарласамын.', ru: 'Договорились! Отпишусь минут через десять.', en: 'Deal! I\'ll report back in ten minutes.' },
  helperNo:   { kz: 'Жарайды, көмек керек болса — айт.', ru: 'Хорошо, если что — зови.', en: 'Okay, call me if you need me.' },
};

/* ---------- характеры жильцов ---------- */
/* likes: насколько каждый аргумент меняет настрой (0–100). onlineOk: соглашается подписать в приложении */
const ARCH = {
  apa: { mood: 45, deaf: .1, voice: 380, onlineOk: false, listen: 26,
    likes: { explain: 8, facts: -2, benefit: 4, neighbors: 14, online: -6 },
    look: { skin: '#d9a77c', hair: 'scarf', hairCol: '#9c9a96', top: 'shirt', topCol: '#7d4f8a', hat: 'scarf', scarfCol: '#c8414a', old: true, body: 'f', bottom: 'skirt', skirtCol: '#4a3a52' },
    lines: {
      greet: { kz: 'Ой, балам, кімсің? Тағы бір жиналыс па?', ru: 'Ой, балам, ты кто? Опять какое-то собрание?', en: 'Oh, dear, who are you? Another meeting again?' },
      again: { kz: 'Қайта келдің бе? Шай ішесің бе?', ru: 'Опять пришёл? Чаю будешь?', en: 'Back again? Will you have some tea?' },
      good:  { kz: 'Ә-ә, солай ма... Онда дұрыс шығар.', ru: 'А-а, вот как... Тогда, наверно, правильно.', en: 'Ah, I see... Then it\'s probably right.' },
      meh:   { kz: 'Түсінбедім ғой, балам.', ru: 'Не поняла я, балам.', en: 'I didn\'t get it, dear.' },
      bad:   { kz: 'Мен ол цифрларды түсінбеймін!', ru: 'Я в этих цифрах не понимаю!', en: 'I don\'t understand these numbers!' },
      story: { kz: 'Подъездте шам жанбайды. Кеше баспалдақта құлап қала жаздадым...', ru: 'В подъезде свет не горит. Вчера чуть не упала на лестнице...', en: 'The stairwell light is out. I nearly fell on the stairs yesterday...' },
      yes:   { kz: 'Жарайды, қол қояйын. Тек шамды жөндеңдер!', ru: 'Ладно, подпишу. Только свет почините!', en: 'Fine, I\'ll sign. Just fix the lights!' },
      no:    { kz: 'Жоқ. Мен ештеңеге қол қоймаймын.', ru: 'Нет. Ничего я подписывать не буду.', en: 'No. I\'m not signing anything.' },
      think: { kz: 'Сауледен сұрап көрейін, кейін кел.', ru: 'У Сауле спрошу, потом зайди.', en: 'I\'ll ask Saule, come back later.' },
      noOnline: { kz: 'Телефонмен бе? Немерем келгенде ғана...', ru: 'Через телефон? Только когда внук приедет...', en: 'On the phone? Only when my grandson visits...' },
    } },
  student: { mood: 40, deaf: .55, voice: 520, onlineOk: true, listen: 6,
    likes: { explain: 4, facts: 6, benefit: 12, neighbors: 6, online: 0 },
    look: { skin: '#e8b892', hair: 'short', hairCol: '#2b2420', top: 'hoodie', topCol: '#3f6f8c', headphones: true },
    lines: {
      greet: { kz: 'А? Кешіріңіз, құлаққап... Не болды?', ru: 'А? Сорян, наушники... Что такое?', en: 'Huh? Sorry, headphones... What is it?' },
      again: { kz: 'Тағы сіз бе? Қысқаша айтыңызшы.', ru: 'Опять вы? Давайте коротко.', en: 'You again? Keep it short.' },
      good:  { kz: 'Хм, бұл шынымен ыңғайлы.', ru: 'Хм, это реально удобно.', en: 'Hm, that\'s actually handy.' },
      meh:   { kz: 'Мм, жарайды...', ru: 'Ну, окей...', en: 'Well, okay...' },
      bad:   { kz: 'Маған бұл қызық емес.', ru: 'Мне это не особо интересно.', en: 'Not really my thing.' },
      story: { kz: 'Wi-Fi подъезде мүлдем жоқ. Онлайн сабақта үнемі үзіледі.', ru: 'В подъезде вообще не ловит. На онлайн-парах всё виснет.', en: 'No signal in the stairwell at all. My online classes keep freezing.' },
      yes:   { kz: 'Окей, қол қоямын. Тек интернетті ұмытпаңыз!', ru: 'Окей, подпишу. Только про интернет не забудьте!', en: 'Okay, I\'ll sign. Just don\'t forget the internet!' },
      no:    { kz: 'Жоқ, рахмет. Маған бәрібір, жақында көшемін.', ru: 'Не, спасибо. Мне всё равно скоро съезжать.', en: 'Nah, thanks. I\'m moving out soon anyway.' },
      think: { kz: 'Ойланайын. Сілтеме жіберіңізші.', ru: 'Подумаю. Скиньте ссылку.', en: 'I\'ll think about it. Send me a link.' },
      online:{ kz: 'E-KNOT бар ма? Супер, қазір сонда басамын.', ru: 'Есть в E-KNOT? Супер, ща там нажму.', en: 'It\'s in E-KNOT? Great, I\'ll tap it there.' },
    } },
  mom: { mood: 50, deaf: .15, voice: 460, onlineOk: true, listen: 10,
    likes: { explain: 6, facts: 4, benefit: 16, neighbors: 9, online: 0 },
    look: { skin: '#e3ad86', hair: 'bun', hairCol: '#4a2e22', top: 'shirt', topCol: '#c79a3b' },
    lines: {
      greet: { kz: 'Тыныш, бала ұйықтап жатыр! Тез айтыңыз.', ru: 'Тише, ребёнок спит! Быстро говорите.', en: 'Quiet, the baby\'s asleep! Make it quick.' },
      again: { kz: 'Иә, иә, қысқаша.', ru: 'Да-да, коротко.', en: 'Yes, yes, quickly.' },
      good:  { kz: 'Балалар үшін бұл маңызды.', ru: 'Для детей это важно.', en: 'That matters for the kids.' },
      meh:   { kz: 'Түсінікті, бірақ уақытым жоқ.', ru: 'Понятно, но мне некогда.', en: 'I see, but I\'m busy.' },
      bad:   { kz: 'Маған қазір мұның керегі жоқ.', ru: 'Мне сейчас не до этого.', en: 'I can\'t deal with this now.' },
      story: { kz: 'Подъезд қараңғы, коляскамен шығу қорқынышты.', ru: 'В подъезде темно, с коляской страшно спускаться.', en: 'It\'s dark in the stairwell, scary to go down with the pram.' },
      yes:   { kz: 'Жарайды, қайда қол қою керек?', ru: 'Хорошо, где подписать?', en: 'Okay, where do I sign?' },
      no:    { kz: 'Жоқ, бізге басқа мәселе жетеді.', ru: 'Нет, нам своих проблем хватает.', en: 'No, we have enough problems of our own.' },
      think: { kz: 'Күйеуім келгенде ақылдасайық.', ru: 'Муж придёт — посоветуемся.', en: 'My husband\'s coming — we\'ll talk it over.' },
      online:{ kz: 'Е, телефоннан ыңғайлырақ. Кешке қоямын.', ru: 'О, с телефона удобнее. Вечером подпишу.', en: 'Oh, the phone is easier. I\'ll sign tonight.' },
    } },
  grump: { mood: 22, deaf: .1, voice: 170, onlineOk: false, listen: 10,
    likes: { explain: -4, facts: 22, benefit: 5, neighbors: -6, online: -8 },
    look: { skin: '#d6a07a', hair: 'bald', hairCol: '#6e6a66', top: 'shirt', topCol: '#5d6b5a', glasses: true, beard: true, old: true },
    lines: {
      greet: { kz: 'Тағы не керек? Мен ешқандай ОСИ-ге сенбеймін.', ru: 'Чего опять? Не верю я ни в какие ОСИ.', en: 'What now? I don\'t believe in any OSI.' },
      again: { kz: 'Сен әлі жүрсің бе?', ru: 'Ты ещё ходишь?', en: 'Still going around?' },
      good:  { kz: 'Хм. Цифрлар... нақты екен.', ru: 'Хм. Цифры... конкретные.', en: 'Hm. Numbers... specific ones.' },
      meh:   { kz: 'Бос сөз.', ru: 'Пустые слова.', en: 'Empty words.' },
      bad:   { kz: 'Көршілер не десе, сол ма? Мен өз басыммен ойлаймын!', ru: 'Соседи то, соседи сё. Я своей головой думаю!', en: 'Neighbours this, neighbours that. I think for myself!' },
      story: { kz: 'Бұрынғы КСК ақшаны жеп кетті. Енді ешкімге сенбеймін.', ru: 'Прошлое КСК деньги проело. Больше никому не верю.', en: 'The old KSK ate the money. I don\'t trust anyone anymore.' },
      yes:   { kz: 'Есеп ашық болса... жарайды. Бірақ бақылап отырамын!', ru: 'Раз отчёт открытый... ладно. Но я буду следить!', en: 'If the report is open... fine. But I\'ll be watching!' },
      no:    { kz: 'Жоқ! Есікті жап!', ru: 'Нет! Закрой дверь!', en: 'No! Close the door!' },
      think: { kz: 'Есепті көрмейінше, ештеңе айтпаймын.', ru: 'Пока отчёт не увижу, ничего не скажу.', en: 'I won\'t say a thing until I see the report.' },
      noOnline: { kz: 'Ол телефондарыңа сенбеймін!', ru: 'Не доверяю я этим вашим телефонам!', en: 'I don\'t trust those phones of yours!' },
    } },
  business: { mood: 35, deaf: .2, voice: 260, onlineOk: true, listen: -6,
    likes: { explain: 3, facts: 16, benefit: 14, neighbors: 2, online: 0 },
    look: { skin: '#e0ae88', hair: 'short', hairCol: '#1b1a21', top: 'jacket', topCol: '#2b2a33' },
    lines: {
      greet: { kz: 'Бір минутым бар. Не ұсынасыз?', ru: 'У меня минута. Что предлагаете?', en: 'I have a minute. What\'s the offer?' },
      again: { kz: 'Иә? Тез.', ru: 'Да? Быстро.', en: 'Yes? Quickly.' },
      good:  { kz: 'Ақылға қонымды.', ru: 'Разумно.', en: 'Makes sense.' },
      meh:   { kz: 'Нақтырақ.', ru: 'Конкретнее.', en: 'Be specific.' },
      bad:   { kz: 'Мен әңгіме тыңдауға келген жоқпын.', ru: 'Я не байки слушать вышел.', en: 'I didn\'t come out for stories.' },
      story: { kz: 'Уақыт — ақша. Келесі.', ru: 'Время — деньги. Дальше.', en: 'Time is money. Go on.' },
      yes:   { kz: 'Келістік. Қажет болса, демеушілік те жасаймын.', ru: 'Договорились. Если надо — и спонсором буду.', en: 'Deal. I can even sponsor it if needed.' },
      no:    { kz: 'Маған тиімсіз.', ru: 'Мне невыгодно.', en: 'Doesn\'t pay off for me.' },
      think: { kz: 'Сметаны жіберіңіз, қарап шығамын.', ru: 'Скиньте смету, посмотрю.', en: 'Send me the estimate, I\'ll look.' },
      online:{ kz: 'Онлайн? Жақсы, жиналыссыз — керемет.', ru: 'Онлайн? Отлично, без собраний — идеально.', en: 'Online? Great — no meetings, perfect.' },
    } },
  night: { mood: 30, deaf: .45, voice: 210, onlineOk: true, sleeper: true, listen: 12,
    likes: { explain: 2, facts: 4, benefit: 6, neighbors: 4, online: 0 },
    look: { skin: '#cf9a72', hair: 'short', hairCol: '#3a2a20', top: 'shirt', topCol: '#9aa0a5', beard: true },
    lines: {
      greet: { kz: 'Ммм... мен түнгі ауысымнан келдім. Не керек?', ru: 'Ммм... я с ночной смены. Чего надо?', en: 'Mmm... I\'m off a night shift. What do you want?' },
      again: { kz: 'Тағы оятасың ба...', ru: 'Опять будишь...', en: 'Waking me up again...' },
      good:  { kz: 'Иә... дұрыс айтасың.', ru: 'Да... дело говоришь.', en: 'Yeah... that makes sense.' },
      meh:   { kz: 'Ұйқым келеді...', ru: 'Спать хочу...', en: 'I want to sleep...' },
      bad:   { kz: 'Ұйқымды бөлгенің жетпей ме?', ru: 'Мало того что разбудил?', en: 'As if waking me wasn\'t enough?' },
      story: { kz: 'Күндіз жөндеу жүрсе, мүлдем ұйықтай алмаймын.', ru: 'Если днём ремонт — вообще не высплюсь.', en: 'If the repairs are in the daytime, I\'ll never sleep.' },
      yes:   { kz: 'Жарайды, қол қояйын да ұйықтайын.', ru: 'Ладно, подпишу и спать.', en: 'Fine, I\'ll sign and go to bed.' },
      no:    { kz: 'Жоқ. Есікті жап.', ru: 'Нет. Дверь закрой.', en: 'No. Close the door.' },
      think: { kz: 'Ұйықтап алайын, кейін.', ru: 'Высплюсь — потом.', en: 'After I sleep.' },
      online:{ kz: 'Телефонға жібер, оянғанда қоямын.', ru: 'Скинь в телефон, проснусь — подпишу.', en: 'Send it to my phone, I\'ll sign when I wake up.' },
    } },
  renter: { mood: 50, deaf: .2, voice: 400, renter: true,
    likes: {}, look: { skin: '#e8b892', hair: 'long', hairCol: '#a5503c', top: 'hoodie', topCol: '#7fc4a8' },
    lines: {
      greet: { kz: 'Сәлем! Мен жалға тұрамын, қол қоя алмаймын. Иесі E-KNOT-та бар, соған жазыңыз.', ru: 'Привет! Я снимаю квартиру, подписать не могу. Хозяин есть в E-KNOT — напишите ему.', en: 'Hi! I rent this flat, I can\'t sign. The owner is in E-KNOT — message them.' },
      again: { kz: 'Иесіне жаздыңыз ба?', ru: 'Хозяину написали?', en: 'Did you message the owner?' },
    } },
};

/* ещё варианты реплик: первый вариант — в ARCH, остальные здесь. У каждого жильца
   свой «характерный» вариант приветствия, истории, ответа; реакции — вперемешку */
const LINE_VARIANTS = {"apa": {"greet": [{"kz": "Кім бұл кешкі уақытта? А, көршінің баласы ма?", "ru": "Кто это на ночь глядя? А, соседский, что ли?"}, {"kz": "Кір, кір, балам, есік алдында тұрма. Не шаруа?", "ru": "Заходи, балам, не стой в дверях. Что за дело?"}], "again": [{"kz": "Тағы сен бе? Бауырсақ пісірдім, ал.", "ru": "Опять ты? Баурсаков напекла, бери."}, {"kz": "Келдің бе? Мен ойланып отыр едім.", "ru": "Пришёл? А я как раз думала."}], "good": [{"kz": "Бұрын да бірге жиналатынбыз ғой...", "ru": "Раньше-то мы тоже вместе собирались..."}, {"kz": "Сен дұрыс бала екенсің.", "ru": "Хороший ты, видно, человек."}], "meh": [{"kz": "Ақырын айт, балам, құлағым нашар.", "ru": "Помедленнее, балам, слышу плохо."}, {"kz": "Мм... әрі қарай айтшы.", "ru": "Мм... дальше рассказывай."}], "bad": [{"kz": "Ой, бас айналды. Қарапайым тілмен айтшы.", "ru": "Ой, голова кругом. Попроще скажи."}, {"kz": "Компьютер, қосымша... бізге қайдан?", "ru": "Компьютеры, приложения... куда нам."}], "story": [{"kz": "Шатыр ағады. Жаңбыр жауса, тазаларды қоямын.", "ru": "Крыша течёт. Как дождь — тазики ставлю."}, {"kz": "Бұрын аулада гүл егетінбіз. Қазір бәрі тастап кетті.", "ru": "Раньше во дворе цветы сажали. Теперь всем всё равно."}], "yes": [{"kz": "Қол қояйын. Марқұм шалым да осыны айтатын.", "ru": "Подпишу. Мой покойный старик тоже так говорил."}, {"kz": "Жарайды, балам. Көршілер үшін.", "ru": "Ладно, балам. Ради соседей."}], "no": [{"kz": "Жоқ, балам. Бізге бұрынғысы жетеді.", "ru": "Нет, балам. Нам и по-старому хватает."}, {"kz": "Қартайғанда басымды қатырмаңдар.", "ru": "Не морочьте старухе голову."}], "think": [{"kz": "Ұлым телефон соғады, сұрайын.", "ru": "Сын позвонит — спрошу."}, {"kz": "Түнде ойланайын, ертең кел.", "ru": "Ночью подумаю, завтра приходи."}]}, "student": {"greet": [{"kz": "О, сәлем. Курьер деп ойладым. Не керек?", "ru": "О, привет. Думал, курьер. Чего надо?"}, {"kz": "Йо. Тек тез, дедлайн жанып жатыр.", "ru": "Йо. Только быстро, дедлайн горит."}], "again": [{"kz": "А, сіз ғой. Ойлап көрдім, айтыңыз.", "ru": "А, это вы. Я подумал(а), рассказывайте."}, {"kz": "Тағы бір раунд? Жарайды.", "ru": "Ещё раунд? Ладно."}], "good": [{"kz": "Ок, бұл логикалық.", "ru": "Ок, это логично."}, {"kz": "Мәселен, чатта да айтуға болады ғой.", "ru": "Ну, это же и в чате можно обсудить."}], "meh": [{"kz": "Әзірге түсініксіз.", "ru": "Пока не очень понятно."}, {"kz": "Хм. Ал маған одан не?", "ru": "Хм. А мне с этого что?"}], "bad": [{"kz": "Бұл бумерлердің тақырыбы ғой.", "ru": "Это какая-то тема для бумеров."}, {"kz": "Қағаз? Шын ба?", "ru": "Бумажки? Серьёзно?"}], "story": [{"kz": "Подъездтегі шам жыпылықтайды, кешке телефон фонарымен жүремін.", "ru": "Свет в подъезде мигает, вечером хожу с фонариком телефона."}, {"kz": "Велосипедімді ұрлап кетті. Камера жоқ қой.", "ru": "У меня велик украли. Камер-то нет."}], "yes": [{"kz": "Ок, қол қойдым. Сторис салып жіберемін.", "ru": "Ок, подписал(а). Ещё в сторис закину."}, {"kz": "Жарайды, мен үшін де жақсы ғой.", "ru": "Ладно, мне ведь тоже лучше."}], "no": [{"kz": "Жоқ, маған бұл кринж.", "ru": "Не, мне это кринж."}, {"kz": "Мен тек жалға... яғни, кейін. Жоқ.", "ru": "Я вообще временно тут. Нет."}], "think": [{"kz": "Ата-анама жазайын, пәтер солардікі.", "ru": "Родителям напишу, квартира их."}, {"kz": "Сессиядан кейін, жарай ма?", "ru": "После сессии, ладно?"}]}, "mom": {"greet": [{"kz": "Иә? Кешіріңіз, плитада тамақ тұр.", "ru": "Да? Извините, у меня на плите всё."}, {"kz": "Сәлеметсіз бе. Балаларға қатысты ма?", "ru": "Здравствуйте. Это что-то про детей?"}], "again": [{"kz": "Ә, сіз. Балаларды жатқыздым, тыңдаймын.", "ru": "А, вы. Детей уложила, слушаю."}, {"kz": "Тағы да? Жарайды, кіріңіз.", "ru": "Опять? Ладно, заходите."}], "good": [{"kz": "Ойын алаңы да жөнделсе ғой...", "ru": "Вот бы и детскую площадку починили..."}, {"kz": "Иә, бұл бізге керек.", "ru": "Да, это нам нужно."}], "meh": [{"kz": "Мм, тағы не бар?", "ru": "Мм, а что ещё?"}, {"kz": "Түсіндім, бірақ ақшасы қанша?", "ru": "Поняла, а по деньгам сколько?"}], "bad": [{"kz": "Маған уәде емес, нәтиже керек.", "ru": "Мне не обещания нужны, а результат."}, {"kz": "Сосын бәрін ұмытып кетесіздер.", "ru": "А потом вы всё забудете."}], "story": [{"kz": "Ауладағы әткеншек сынған, балалар құлап қалды.", "ru": "Качели во дворе сломаны, дети падали."}, {"kz": "Кіреберістің есігі ауыр, коляскамен өзім шыға алмаймын.", "ru": "Дверь в подъезд тяжёлая, с коляской сама не выйду."}], "yes": [{"kz": "Балалар үшін — әрине!", "ru": "Ради детей — конечно!"}, {"kz": "Иә. Тек ойын алаңын ұмытпаңыз.", "ru": "Да. Только про площадку не забудьте."}], "no": [{"kz": "Жоқ, қазір ештеңеге уақытым жоқ.", "ru": "Нет, мне сейчас ни до чего."}, {"kz": "Тағы жарна? Жоқ, кешіріңіз.", "ru": "Опять взносы? Нет, извините."}], "think": [{"kz": "Ата-енемнен сұрайын.", "ru": "Со свекровью посоветуюсь."}, {"kz": "Демалыс күні оралыңыз.", "ru": "Вернитесь в выходные."}]}, "grump": {"greet": [{"kz": "Қоңырау бар ғой, неге тарсылдатасың?", "ru": "Звонок есть, чего колотишь?"}, {"kz": "Ал. Тағы бір «жақсы өмір» сатушысы.", "ru": "Ну. Ещё один продавец «светлого будущего»."}], "again": [{"kz": "Қайтадан? Табанды екенсің.", "ru": "Снова? Упорный."}, {"kz": "Жарайды, бір минут береймін.", "ru": "Ладно, минуту дам."}], "good": [{"kz": "Мұны бірінші айту керек еді.", "ru": "Вот с этого и надо было начинать."}, {"kz": "Құжат бар ма? Онда басқа әңгіме.", "ru": "Документы есть? Тогда другой разговор."}], "meh": [{"kz": "Әлі сендірмедің.", "ru": "Пока не убедил."}, {"kz": "Бұны мен 90-жылдары естігем.", "ru": "Я это ещё в девяностые слышал."}], "bad": [{"kz": "Әдемі сөз — бос сөз.", "ru": "Красивые слова — пустые слова."}, {"kz": "Онлайн, онлайн... Өмір бәрі экранда ма?", "ru": "Онлайн, онлайн... Вся жизнь в экране?"}], "story": [{"kz": "Мен бұл үйде 40 жыл тұрамын. Бір жөндеу көрген жоқпын.", "ru": "Я в этом доме сорок лет. Ни одного ремонта не видел."}, {"kz": "Жертөлеге су толды, ешкім жауап бермейді.", "ru": "Подвал затопило, никто не отвечает."}], "yes": [{"kz": "Мейлі. Бірақ есепті өзім тексеремін.", "ru": "Пусть. Но отчёт я сам проверю."}, {"kz": "Жарайды. Бірінші рет біреу нақты сөйледі.", "ru": "Ладно. Первый раз кто-то по делу говорит."}], "no": [{"kz": "Жоқ дедім! Келесі жолы милиция шақырам.", "ru": "Сказал нет! В следующий раз милицию вызову."}, {"kz": "Мені алдай алмайсың.", "ru": "Меня не проведёшь."}], "think": [{"kz": "Жиналыс протоколын әкел, сосын.", "ru": "Протокол собрания принеси, тогда."}, {"kz": "Көрерміз. Мен асықпаймын.", "ru": "Посмотрим. Я не тороплюсь."}]}, "business": {"greet": [{"kz": "Иә? Мен қоңырауда отырмын, қысқа.", "ru": "Да? Я на созвоне, коротко."}, {"kz": "Сәлеметсіз бе. Мәселе неде?", "ru": "Добрый вечер. В чём вопрос?"}], "again": [{"kz": "Тағы сіз. Жаңа ақпарат бар ма?", "ru": "Снова вы. Есть новые данные?"}, {"kz": "Жарайды, екі минут.", "ru": "Ладно, две минуты."}], "good": [{"kz": "Мұны есептеуге болады.", "ru": "Это можно посчитать."}, {"kz": "Иә, басқару ашық болса — жақсы.", "ru": "Да, прозрачное управление — это хорошо."}], "meh": [{"kz": "Ал сандары қандай?", "ru": "А цифры какие?"}, {"kz": "Жалпы сөздер.", "ru": "Общие слова."}], "bad": [{"kz": "Эмоция маған әсер етпейді.", "ru": "Эмоции на меня не работают."}, {"kz": "Бұл бизнес-жоспар емес.", "ru": "Это не бизнес-план."}], "story": [{"kz": "Көлік тұрағы жоқ. Әр кеш — квест.", "ru": "Парковки нет. Каждый вечер — квест."}, {"kz": "Пәтер бағасы түсіп жатыр, подъезд ұят.", "ru": "Цена квартиры падает — подъезд стыдно показать."}], "yes": [{"kz": "Қол қойдым. Есепті ай сайын күтемін.", "ru": "Подписал. Жду отчёт каждый месяц."}, {"kz": "Жарайды. Пәтер құны да өседі.", "ru": "Хорошо. И квартира подорожает."}], "no": [{"kz": "Тәуекелі көп. Жоқ.", "ru": "Рисков много. Нет."}, {"kz": "Қазір емес. Жоқ.", "ru": "Не сейчас. Нет."}], "think": [{"kz": "Заңгерге көрсетейін.", "ru": "Юристу покажу."}, {"kz": "Поштама жіберіңіз.", "ru": "Пришлите на почту."}]}, "night": {"greet": [{"kz": "(есінеп) Иә-ә... кім?", "ru": "(зевает) Да-а... кто?"}, {"kz": "Қазір сағат нешеде? Не болды?", "ru": "Который час? Что случилось?"}], "again": [{"kz": "Сен бе... жарайды, тыңдаймын.", "ru": "Ты... ладно, слушаю."}, {"kz": "Кофе іштім, енді айта бер.", "ru": "Кофе выпил, теперь говори."}], "good": [{"kz": "Мм, бұл дұрыс-ау.", "ru": "Мм, вроде дело."}, {"kz": "Тыныш болса — мен келісем.", "ru": "Если будет тихо — я за."}], "meh": [{"kz": "Не дедің? Қайтала.", "ru": "Что? Повтори."}, {"kz": "Ммм...", "ru": "Ммм..."}], "bad": [{"kz": "Мұны ұйқылы басым түсінбейді.", "ru": "Сонная голова такое не варит."}, {"kz": "Түнде жұмыс, күнде сендер... ", "ru": "Ночью работа, днём вы..."}], "story": [{"kz": "Жоғарыдағылар түнде жиһаз жылжытады. Бір ай бойы.", "ru": "Сверху по ночам мебель двигают. Уже месяц."}, {"kz": "Подъезд есігі жабылмайды, түнде бөтен адамдар кіреді.", "ru": "Дверь в подъезд не закрывается, ночью чужие заходят."}], "yes": [{"kz": "Қай жерге? Мұнда ма? Болды. Түн жақсы.", "ru": "Где? Тут? Всё. Спокойной ночи."}, {"kz": "Жарайды, домофон жөнделсе — қоямын.", "ru": "Ладно, если домофон починят — подписываю."}], "no": [{"kz": "Ұйықтауға рұқсат беріңдерші. Жоқ.", "ru": "Дайте поспать. Нет."}, {"kz": "Жоқ. Тарсылдатпа.", "ru": "Нет. Не стучи."}], "think": [{"kz": "Кешке, ауысымға дейін кел.", "ru": "Вечером приходи, до смены."}, {"kz": "Миым ұйықтап жатыр. Кейін.", "ru": "Мозг спит. Потом."}]}, "renter": {"greet": [{"kz": "Мен мұнда уақытша тұрамын. Иесі — Алматыда, E-KNOT арқылы жазыңыз.", "ru": "Я тут временно. Хозяйка в Алматы — пишите ей через E-KNOT."}]}};
for (const a in LINE_VARIANTS) for (const k in LINE_VARIANTS[a]) ARCH[a].lines[k] = [ARCH[a].lines[k], ...LINE_VARIANTS[a][k]];
// реплики, которые зависят от этажа: про «соседей сверху» на последнем этаже не говорят,
// а про протекающую крышу — только там. top — вариант для верхнего этажа, low — для остальных
function floorAware(arch, key, needle, alt, field) {
  const v = ARCH[arch].lines[key].find(x => x.ru.includes(needle)); if (v) v[field] = alt;
}
floorAware('night', 'story', 'мебель двигают', { kz: 'Шатыр ағады. Түнде тамшы тамып, ұйықтатпайды.', ru: 'Крыша течёт. Ночью капает — спать не даёт.', en: 'The roof leaks. It drips at night — I can\'t sleep.' }, 'top');
floorAware('apa', 'story', 'Крыша течёт', { kz: 'Жоғарыдағылар су ағызып жіберді, төбем дақ-дақ.', ru: 'Сверху залили, потолок весь в пятнах.', en: 'Flooded from above, the ceiling is all stains.' }, 'low');
// апа и мам в доме больше всех — им по четыре варианта
ARCH.apa.lines.greet.push({ kz: "Әй, кім? Көзілдірігімді таппай тұрмын...", ru: "Ой, кто там? Очки никак не найду..." });
ARCH.apa.lines.story.push({ kz: "Үйдің айналасында орындық та жоқ. Демалатын жер жоқ.", ru: "Во дворе ни одной лавочки. Присесть негде." });
ARCH.apa.lines.yes.push({ kz: "Қол қояйын. Немерелерім жақсы үйде өссін.", ru: "Подпишу. Пусть внуки в хорошем доме растут." });
ARCH.apa.lines.think.push({ kz: "Көршім Күләштен сұрайын.", ru: "У соседки спрошу." });
ARCH.apa.lines.again.push({ kz: "Ой, сен бе, кел, кел.", ru: "Ой, ты, заходи, заходи." });
ARCH.mom.lines.greet.push({ kz: "Сәлем! Тек дауыстамаңыз, кішкентай енді ұйықтады.", ru: "Привет! Только не шумите, мелкий только уснул." });
ARCH.mom.lines.story.push({ kz: "Подъезд иісі... балалармен өту қиын.", ru: "Запах в подъезде... с детьми проходить тяжело." });
ARCH.mom.lines.yes.push({ kz: "Иә, қол қоямын. Көршілермен бірге жақсырақ.", ru: "Да, подпишу. С соседями вместе лучше." });
ARCH.mom.lines.think.push({ kz: "Кешке чатқа жазыңыз, оқимын.", ru: "Вечером в чат напишите, прочитаю." });
ARCH.mom.lines.again.push({ kz: "Иә, тыңдап тұрмын.", ru: "Да, слушаю." });

/* общие ответы, если у характера нет своей реплики */
const GENERIC = {
  noOnline: { kz: 'Жоқ, онлайн маған ыңғайсыз.', ru: 'Нет, онлайн мне неудобно.', en: 'No, online isn\'t convenient for me.' },
  already:  { kz: 'Мен қол қойдым ғой!', ru: 'Я же уже подписал(а)!', en: 'But I already signed!' },
  againNo:  { kz: 'Айттым ғой — жоқ.', ru: 'Я же сказал(а) — нет.', en: 'I already said no.' },
  bye:      { kz: 'Жарайды, кейін келіңіз.', ru: 'Хорошо, заходите потом.', en: 'Okay, drop by later.' },
  storyDone:{ kz: 'Бәрін айтып қойдым ғой.', ru: 'Я уже всё рассказал(а).', en: 'I\'ve already told you everything.' },
};

const NAMES = {
  apa: ['Күләш апа', 'Роза апа', 'Бибігүл апа', 'Сәуле апа', 'Нина Ивановна', 'Гүлжан апа', 'Зәуреш апа', 'Галина Петровна', 'Ақмарал апа', 'Мария Степановна', 'Күлпаш апа', 'Нағима апа'], grump: ['Мұрат ата', 'Виктор Петрович', 'Серік аға', 'Қайрат ата', 'Бауыржан аға', 'Николай Иванович', 'Жомарт ата', 'Ахмет аға', 'Валерий Палыч', 'Төлеген ата', 'Сергей Михайлович', 'Ербол аға', 'Омар ата', 'Геннадий'],
  student: ['Арман', 'Әсел', 'Тимур', 'Дана', 'Мадина', 'Даня', 'Нұрсұлтан', 'Аяна', 'Ерасыл', 'Жансая', 'Максим'], mom: ['Айгерім', 'Динара', 'Жанар', 'Ольга', 'Салтанат', 'Мөлдір', 'Гүлнар', 'Индира', 'Света', 'Әйгерім', 'Назерке', 'Лаура'],
  business: ['Ерлан', 'Бақыт', 'Ринат', 'Асхат', 'Талғат', 'Тимур Серікұлы', 'Арсен', 'Олжас'], night: ['Дәурен', 'Нұрлан', 'Болат', 'Андрей', 'Ержан', 'Самат', 'Руслан', 'Ғалым'], renter: ['Камила', 'Алина', 'Илья', 'Аружан', 'Даурен', 'Диас', 'Соня', 'Ақбота'],
};

/* ---------- дом, жалобы и уровни ----------
   Дом один на всю игру: 9 этажей, на этаже 6 квартир (3 слева от лестницы и лифта, 3 справа).
   Каждый уровень — собрание жильцов по очередной жалобе. Победа на собрании даёт бюджет
   и одобрение ремонта; сам ремонт покупается на карте ЖК. Следующее собрание открывается,
   только когда предыдущая проблема исправлена — перепрыгнуть нельзя. */
const HOUSE = { floors: 13, perFloor: 8, heroApt: 53 };   // 104 квартиры; герой — 7 этаж
const TITLES = {
  resident: { kz: 'Тұрғын', ru: 'Житель', en: 'Resident' }, activist: { kz: 'Белсенді', ru: 'Активист', en: 'Activist' },
  chairman: { kz: 'ОСИ төрағасы', ru: 'Председатель ОСИ', en: 'Chairman' }, council: { kz: 'Кеңес мүшесі', ru: 'Член совета', en: 'Council member' },
  zhkh_expert: { kz: 'ТКШ білгірі', ru: 'Знаток ЖКХ', en: 'Housing expert' },
};
const BADGES = {
  initiative_group:      { kz: 'Бастамашыл топ', ru: 'Инициативная группа', en: 'Initiative group' },
  chairman_elected:      { kz: 'Төраға сайланды', ru: 'Избран председателем', en: 'Chairman elected' },
  council_elected:       { kz: 'Үй кеңесі', ru: 'Совет дома', en: 'House council' },
  tariff_approved:       { kz: 'Тарифті бекітті', ru: 'Утвердил тариф', en: 'Tariff approved' },
  construction_approved: { kz: '2/3 дауыс', ru: 'Решение 2/3', en: 'Two-thirds decision' },
  zhkh_expert:           { kz: 'ТКШ білгірі', ru: 'Знаток ЖКХ', en: 'Housing expert' },
  all_tours:             { kz: 'Барлық тур өтті', ru: 'Прошёл все туры', en: 'All tours passed' },
};

const PROBLEMS = [
  { id: 'light', cost: 150, pts: 100,
    name: { kz: 'Подъездегі жарық', ru: 'Свет в подъезде', en: 'Stairwell lights' },
    desc: { kz: 'Шамдар жыпылықтайды, кешке баспалдақ қараңғы.', ru: 'Лампы мигают, вечером на лестнице темно.', en: 'The lamps flicker, the stairs are dark in the evening.' },
    lines: [
      { kz: 'Подъездте шам жоқ, кешке телефон фонарымен жүремін.', ru: 'В подъезде темно, вечером хожу с фонариком телефона.', en: 'It\'s dark in the stairwell, I use my phone torch at night.' },
      { kz: 'Кеше баспалдақта сүрініп құлай жаздадым — көрінбейді ғой!', ru: 'Вчера чуть не упала на лестнице — ничего же не видно!', en: 'I nearly fell on the stairs yesterday — you can\'t see a thing!' },
      { kz: 'Шам күні бойы жыпылықтайды, басым ауырады.', ru: 'Лампа весь день мигает, голова от неё болит.', en: 'The lamp flickers all day, it gives me a headache.' },
      { kz: 'Қараңғыда балаларды жалғыз жібергім келмейді.', ru: 'В темноте детей одних отпускать страшно.', en: 'I\'m scared to let the kids go alone in the dark.' } ] },
  { id: 'door', cost: 250, pts: 120,
    name: { kz: 'Домофон мен кіреберіс есігі', ru: 'Домофон и входная дверь', en: 'Intercom and front door' },
    desc: { kz: 'Есік жабылмайды, бөтен адамдар кіреді.', ru: 'Дверь не закрывается, заходят чужие.', en: 'The door won\'t close, strangers walk in.' },
    lines: [
      { kz: 'Кіреберіс есігі жабылмайды, түнде бөтен адамдар кіреді.', ru: 'Входная дверь не закрывается, ночью заходят чужие.', en: 'The front door won\'t close, strangers come in at night.' },
      { kz: 'Домофон бір жыл бойы істемейді. Курьер есік алдында тұрады.', ru: 'Домофон год не работает. Курьер стоит под дверью.', en: 'The intercom\'s been broken for a year. Couriers wait outside.' },
      { kz: 'Қыста есік ашық — подъезд мұздай.', ru: 'Зимой дверь нараспашку — в подъезде ледник.', en: 'In winter the door\'s wide open — the stairwell is freezing.' },
      { kz: 'Есік ауыр, коляскамен өзім шыға алмаймын.', ru: 'Дверь тяжёлая, с коляской сама не выйду.', en: 'The door is heavy, I can\'t get out with the pram.' } ] },
  { id: 'roof', cost: 400, pts: 140, floors: [11, 13],
    name: { kz: 'Шатыр', ru: 'Крыша', en: 'Roof' },
    desc: { kz: 'Жаңбыр жауса, жоғарғы қабаттарды су басады.', ru: 'Как дождь — верхние этажи заливает.', en: 'Every time it rains, the top floors flood.' },
    lines: [
      { kz: 'Шатыр ағады. Жаңбыр жауса, тазаларды қоямын.', ru: 'Крыша течёт. Как дождь — тазики ставлю.', en: 'The roof leaks. When it rains, I put out basins.' },
      { kz: 'Төбемде дақ-дақ, тұсқағазым түсіп жатыр.', ru: 'Потолок в пятнах, обои отходят.', en: 'Stains on the ceiling, the wallpaper is peeling.' },
      { kz: 'Түнде тамшы тамады — ұйықтай алмаймын.', ru: 'Ночью капает — уснуть не могу.', en: 'It drips at night — I can\'t fall asleep.' },
      { kz: 'Шатырдан су подъезге де ағады, баспалдақ тайғақ.', ru: 'С крыши течёт и в подъезд, ступеньки скользкие.', en: 'It leaks from the roof into the stairwell, the steps are slippery.' } ] },
  { id: 'basement', cost: 550, pts: 160,
    name: { kz: 'Жертөле мен құбырлар', ru: 'Подвал и трубы', en: 'Basement and pipes' },
    desc: { kz: 'Құбыр ағады, жертөледе егеуқұйрықтар.', ru: 'Трубы текут, в подвале крысы.', en: 'The pipes leak, there are rats in the basement.' },
    lines: [
      { kz: 'Жертөледе егеуқұйрықтар! Кеше подъезде көрдім.', ru: 'В подвале крысы! Вчера в подъезде видела.', en: 'Rats in the basement! I saw one in the stairwell yesterday.' },
      { kz: 'Құбыр ағып жатыр, подъезде дымқыл иіс.', ru: 'Трубы текут, в подъезде сырой запах.', en: 'The pipes leak, the stairwell smells damp.' },
      { kz: 'Ыстық су әрең келеді — құбырлар ескі.', ru: 'Горячая вода еле идёт — трубы старые.', en: 'Hot water barely runs — the pipes are old.' },
      { kz: 'Жертөлені су басқан, ешкім жауап бермейді.', ru: 'Подвал затопило, никто не отвечает.', en: 'The basement flooded, nobody answers.' } ] },
  { id: 'playground', cost: 700, pts: 180,
    name: { kz: 'Балалар алаңы', ru: 'Детская площадка', en: 'Playground' },
    desc: { kz: 'Әткеншек сынған, балалар ойнайтын жер жоқ.', ru: 'Качели сломаны, детям негде играть.', en: 'The swings are broken, the kids have nowhere to play.' },
    lines: [
      { kz: 'Ауладағы әткеншек сынған, балалар құлап қалды.', ru: 'Качели во дворе сломаны, дети падали.', en: 'The swings in the yard are broken, kids have fallen off.' },
      { kz: 'Балалар подъезде ойнайды — ауланда ештеңе жоқ.', ru: 'Дети играют в подъезде — во дворе ничего нет.', en: 'The kids play in the stairwell — there\'s nothing in the yard.' },
      { kz: 'Құмсалғыш баяғыда жоқ, тек тот басқан темір.', ru: 'Песочницы давно нет, одно ржавое железо.', en: 'The sandbox is long gone, just rusty metal.' },
      { kz: 'Немерелер келгенде, апаратын жер жоқ.', ru: 'Внуки приезжают — их и сводить некуда.', en: 'My grandkids visit — there\'s nowhere to take them.' } ] },
  { id: 'lift', cost: 900, pts: 220, kind: 'construction', tour: 'L6',
    name: { kz: 'Лифт', ru: 'Лифт', en: 'Lift' },
    desc: { kz: 'Он үш қабат, ал лифт бір жыл тұр.', ru: 'Тринадцать этажей, а лифт стоит уже год.', en: 'Thirteen floors, and the lift has been dead for a year.' },
    lines: [
      { kz: 'Лифт бір жыл тұр. Жоғары жаяу шығамын.', ru: 'Лифт год стоит. Наверх пешком хожу.', en: 'The lift\'s been dead for a year. I walk all the way up.' },
      { kz: 'Коляскамен лифтсіз — азап.', ru: 'С коляской без лифта — мучение.', en: 'Without a lift, the pram is torture.' },
      { kz: 'Тізем ауырады, баспалдақпен шығу қиын.', ru: 'Колени болят, по лестнице тяжело.', en: 'My knees hurt, the stairs are hard.' },
      { kz: 'Азық-түлікті жоғары өзім көтеремін, лифт жоқ.', ru: 'Продукты наверх сама таскаю, лифта же нет.', en: 'I carry the groceries up myself — there\'s no lift.' } ] },
  { id: 'antenna', cost: 1100, pts: 240, kind: 'construction', tour: 'L5',
    name: { kz: 'Ортақ антенна', ru: 'Общая антенна', en: 'Shared antenna' },
    desc: { kz: 'Теледидар мен интернет нашар, әркім өз тарелкасын іледі.', ru: 'Плохое ТВ и интернет, каждый вешает свою тарелку.', en: 'Bad TV and internet, everyone hangs their own dish.' },
    lines: [
      { kz: 'Теледидар шуылдайды, футболды көре алмаймын.', ru: 'Телевизор шипит, футбол не посмотреть.', en: 'The TV hisses, you can\'t watch football.' },
      { kz: 'Интернет жоғалады — үйден жұмыс істеймін ғой!', ru: 'Интернет пропадает — я же из дома работаю!', en: 'The internet keeps dropping — I work from home!' },
      { kz: 'Фасад тарелкалардан көрінбейді. Ұят.', ru: 'Фасада не видно из-за тарелок. Стыдно.', en: 'You can\'t see the facade for the dishes. Embarrassing.' },
      { kz: 'Ортақ антенна болса, бәріне арзан болар еді.', ru: 'С общей антенной всем было бы дешевле.', en: 'A shared antenna would be cheaper for everyone.' } ] },
  { id: 'sign', cost: 1300, pts: 300,
    name: { kz: '«Бәрі жақсы болады» жазуы', ru: 'Вывеска «Всё будет хорошо»', en: '“Everything will be fine” sign' },
    desc: { kz: 'Шатырдағы жазу сөнген — үй мұңды көрінеді.', ru: 'Надпись на крыше погасла — дом выглядит грустно.', en: 'The sign on the roof went out — the house looks sad.' },
    lines: [
      { kz: 'Шатырдағы жазу сөніп қалған. Бұрын бүкіл аудан көретін.', ru: 'Надпись на крыше погасла. Раньше весь район видел.', en: 'The sign on the roof went out. The whole district used to see it.' },
      { kz: '«Бәрі жақсы болады» — ал жанбайды. Күлкілі.', ru: '«Всё будет хорошо» — а не горит. Смешно.', en: '“Everything will be fine” — and it\'s not even lit. Funny.' },
      { kz: 'Жазу жанса, үйдің көңілі көтерілер еді.', ru: 'Зажгли бы надпись — и дому веселее.', en: 'Light the sign up — the house would feel happier.' },
      { kz: 'Немерем «әже, жазу неге жанбайды?» деп сұрайды.', ru: 'Внук спрашивает: «Бабушка, почему надпись не горит?»', en: 'My grandson asks: “Grandma, why isn\'t the sign lit?”' } ] },
];

// украшения двора: без собрания, просто за бюджет; открываются по мере прохождения
const DECOR = [
  { id: 'bench',   cost: 60,  pts: 20, after: 1, name: { kz: 'Орындықтар', ru: 'Лавочки', en: 'Benches' } },
  { id: 'flowers', cost: 80,  pts: 25, after: 2, name: { kz: 'Гүлзар', ru: 'Клумбы', en: 'Flower beds' } },
  { id: 'trees',   cost: 120, pts: 35, after: 3, name: { kz: 'Ағаштар', ru: 'Деревья', en: 'Trees' } },
  { id: 'lamps',   cost: 160, pts: 40, after: 4, name: { kz: 'Аула шамдары', ru: 'Фонари во дворе', en: 'Yard lamps' } },
  { id: 'parking', cost: 200, pts: 45, after: 5, name: { kz: 'Көлік тұрағы', ru: 'Парковка', en: 'Parking' } },
];

/* ---------- туры: решения ОСИ по правилам голосования ----------
   Дом в игре — 104 квартиры (13 этажей × 8). Пороги — от всех квартир дома:
   0 инициативная группа — 10 % «за»; 1 председатель и 2 совет — явка 50 %+1, из голосовавших 50 %+1 «за»;
   3 тариф — 50 %+1 «за» от всех; 4–5 изменение конструкции — 2/3 «за» от всех.
   Обычный ремонт (свет, дверь, крыша…) голосования не требует — решает председатель.
   Время тура — 60 игровых дней. */
const APTS = HOUSE.floors * HOUSE.perFloor;                                // 104
const PCT = { tenth: Math.ceil(APTS * .1), half: Math.floor(APTS / 2) + 1, twoThirds: Math.ceil(APTS * 2 / 3) };   // 11, 53, 70
const TOUR_DEFS = [
  { code: 'initiative',   rule: 'yes',    goal: PCT.tenth,     duration: 90,  raccoon: 2, hard: 0,   badge: 'initiative_group',
    title: { kz: 'Бастамашыл топ', ru: 'Инициативная группа', en: 'Initiative group' },
    ruleText: { kz: 'пәтерлердің 10 %-ы «иә» — {g} қолтаңба', ru: '10 % квартир «за» — {g} подписей', en: '10% of flats say yes — {g} signatures' },
    winT: { kz: 'БАСТАМАШЫЛ ТОП ҚҰРЫЛДЫ!', ru: 'ИНИЦИАТИВНАЯ ГРУППА ЕСТЬ!', en: 'INITIATIVE GROUP FORMED!' },
    winNote: { kz: 'Енді төрағаны сайлау керек — 2-жиналыс ашылды.', ru: 'Теперь нужно выбрать председателя — открыто собрание 2.', en: 'Now elect a chairman — meeting 2 is open.' } },
  { code: 'chairman',     rule: 'quorum', goal: Math.floor(PCT.half / 2) + 1, quorum: PCT.half, duration: 200, raccoon: 5, hard: .04, badge: 'chairman_elected',
    title: { kz: 'Төрағаны сайлау', ru: 'Выбор председателя', en: 'Electing the chairman' },
    ruleText: { kz: 'кемінде {q} пәтер дауыс береді, жартысынан көбі «иә»', ru: 'голосуют не меньше {q} квартир, из них больше половины «за»', en: 'at least {q} flats vote, more than half say yes' },
    winT: { kz: 'СЕН ОСИ ТӨРАҒАСЫСЫҢ!', ru: 'ТЫ — ПРЕДСЕДАТЕЛЬ ОСИ!', en: 'YOU ARE THE CHAIRMAN!' },
    winNote: { kz: 'Кәдімгі жөндеуді (шам, есік, шатыр…) енді жиналыссыз өзің шешесің — «Менің ЖК».', ru: 'Обычный ремонт (свет, дверь, крыша…) теперь решаешь сам, без собрания — в «Мой ЖК».', en: 'Regular repairs (light, door, roof…) are now your call, no meeting needed — in “My block”.' } },
  { code: 'council',      rule: 'quorum', goal: Math.floor(PCT.half / 2) + 1, quorum: PCT.half, duration: 200, raccoon: 5, hard: .07, badge: 'council_elected', needFix: ['light'],
    title: { kz: 'Үй кеңесін сайлау', ru: 'Выбор совета дома', en: 'Electing the house council' },
    ruleText: { kz: 'кемінде {q} пәтер дауыс береді, жартысынан көбі «иә»', ru: 'голосуют не меньше {q} квартир, из них больше половины «за»', en: 'at least {q} flats vote, more than half say yes' },
    winT: { kz: 'ҮЙ КЕҢЕСІ САЙЛАНДЫ!', ru: 'СОВЕТ ДОМА ИЗБРАН!', en: 'HOUSE COUNCIL ELECTED!' },
    winNote: { kz: 'Тағы екі жөндеу жаса — көршілер тарифке сенеді.', ru: 'Сделай ещё пару ремонтов — и соседи поверят в тариф.', en: 'Do a couple more repairs — then neighbours will trust the tariff.' } },
  { code: 'tariff',       rule: 'yes',    goal: PCT.half,      duration: 210, raccoon: 5, hard: .12, badge: 'tariff_approved', needFixCount: 3,
    title: { kz: 'Тарифті бекіту', ru: 'Утверждение тарифа', en: 'Approving the tariff' },
    ruleText: { kz: 'барлық пәтердің 50 %+1-і «иә» — {g} дауыс', ru: '50 %+1 от всех квартир «за» — {g} голосов', en: '50%+1 of all flats say yes — {g} votes' },
    winT: { kz: 'ТАРИФ БЕКІТІЛДІ!', ru: 'ТАРИФ УТВЕРЖДЁН!', en: 'TARIFF APPROVED!' },
    winNote: { kz: 'Үйдің тұрақты бюджеті бар. Енді — ортақ антенна.', ru: 'У дома есть постоянный бюджет. Дальше — общая антенна.', en: 'The house now has a steady budget. Next — a shared antenna.' } },
  { code: 'construction', rule: 'yes',    goal: PCT.twoThirds, duration: 270, raccoon: 7, hard: .1,  badge: 'construction_approved', problem: 'antenna',
    title: { kz: 'Шатырға антенна', ru: 'Антенна на крышу', en: 'Antenna on the roof' },
    ruleText: { kz: 'конструкцияны өзгерту: барлық пәтердің 2/3-і «иә» — {g} дауыс', ru: 'изменение конструкции: 2/3 квартир «за» — {g} голосов', en: 'structural change: 2/3 of flats say yes — {g} votes' },
    winT: { kz: 'АНТЕННА БОЛАДЫ!', ru: 'АНТЕННЕ БЫТЬ!', en: 'THE ANTENNA IS APPROVED!' },
    winNote: { kz: 'Антеннаны «Менің ЖК»-да орнат.', ru: 'Поставь антенну в «Мой ЖК».', en: 'Install the antenna in “My block”.' } },
  { code: 'lift',         rule: 'yes',    goal: PCT.twoThirds, duration: 270, raccoon: 7, hard: .14, badge: 'all_tours', problem: 'lift', needFix: ['antenna'],
    title: { kz: 'Лифтті ауыстыру', ru: 'Замена лифта', en: 'Replacing the lift' },
    ruleText: { kz: 'конструкцияны өзгерту: барлық пәтердің 2/3-і «иә» — {g} дауыс', ru: 'изменение конструкции: 2/3 квартир «за» — {g} голосов', en: 'structural change: 2/3 of flats say yes — {g} votes' },
    winT: { kz: 'ЖАҢА ЛИФТ БОЛАДЫ!', ru: 'НОВОМУ ЛИФТУ БЫТЬ!', en: 'A NEW LIFT IS COMING!' },
    winNote: { kz: 'Барлық жиналыс өтті! Лифтті «Менің ЖК»-да орнат.', ru: 'Все собрания пройдены! Поставь лифт в «Мой ЖК».', en: 'All meetings passed! Install the lift in “My block”.' } },
];
const LEVELS = TOUR_DEFS.map((d, i) => ({
  ...d, id: 'L' + (i + 1), n: i + 1, problem: d.problem || null,
  floors: HOUSE.floors, perFloor: HOUSE.perFloor, heroApt: HOUSE.heroApt,
  start: 0, secPerMin: 3, days: 60,
  awayShare: .22 + i * .02,
  talkerFloor: [3, 5, 4, 9, 2, 6][i], helperAfter: 3, helperFloor: [10, 11, 12, 9, 11, 12][i],
  reward: { first: [200, 320, 380, 620, 800, 900][i], replay: [60, 110, 130, 200, 260, 300][i], perExtra: 8 + i * 3 },
  mix: (() => {
    const total = APTS - 1, h = d.hard;
    const share = { apa: .2 - h * .3, mom: .2 - h * .3, student: .18 - h * .2, business: .12, grump: .1 + h * .5, night: .1 + h * .2, renter: .1 + h * .1 };
    const out = []; for (const a in share) for (let k = 0; k < Math.round(share[a] * total); k++) out.push(a);
    while (out.length < total) out.push('mom'); return out.slice(0, total);
  })(),
}));
/* Правила доступа — общие для игры и сервера: H = { won: [...туры], fixed: [...ремонты] } */
const ORDINARY = () => PROBLEMS.filter(p => p.kind !== 'construction');
function tourOpen(t, H) {
  const i = t.n - 1;
  if (i > 0 && !H.won.includes(LEVELS[i - 1].id)) return { ok: false, why: 'prev', need: LEVELS[i - 1] };
  for (const id of t.needFix || []) if (!H.fixed.includes(id)) return { ok: false, why: 'fix', need: PROBLEMS.find(p => p.id === id) };
  if (t.needFixCount && ORDINARY().filter(p => H.fixed.includes(p.id)).length < t.needFixCount) return { ok: false, why: 'fixCount', n: t.needFixCount };
  return { ok: true };
}
// можно ли чинить: обычный ремонт — после избрания председателем, конструкция — после своего собрания
function canFix(p, H) {
  if (H.fixed.includes(p.id)) return { ok: false, why: 'done' };
  const t = p.kind === 'construction' ? TOURS[p.tour] : TOURS.L2;
  if (!H.won.includes(t.id)) return { ok: false, why: p.kind === 'construction' ? 'vote' : 'chair', tour: t };
  return { ok: true };
}
// итог голосования по правилам тура: yes — «за», no — «против»
function ruleText(t) { return L(t.ruleText).replace('{g}', t.goal).replace('{q}', t.quorum || ''); }
function voteOutcome(t, yes, no) {
  const turnout = yes + no;
  if (t.rule === 'quorum') { const need = Math.max(t.goal, Math.floor(turnout / 2) + 1); return { ok: turnout >= t.quorum && yes >= need, need, turnout }; }
  return { ok: yes >= t.goal, need: t.goal, turnout };
}
const TOURS = Object.fromEntries(LEVELS.map(l => [l.id, l]));

/* ---------- характеры жильцов ---------- */
/* likes: насколько каждый аргумент меняет настрой (0–100). onlineOk: соглашается подписать в приложении */
