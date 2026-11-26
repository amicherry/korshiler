import json, glob, re
shell = open('src/shell.html').read()
# вопросы: по файлу на тур (quiz/quiz_N_<тур>.json) → один quiz.json; на сайте игра берёт свежий quiz.json
tours = {}
for f in sorted(glob.glob('quiz/quiz_[0-9]_*.json')):
    d = json.load(open(f))
    tours[d['tour']] = {'questionsPerRun': d.get('questionsPerRun', 5), 'questions': d['questions']}
quiz = {'version': 2, 'langs': ['kz', 'ru'], 'tours': tours, 'generalPerRun': 8}
open('quiz.json', 'w').write(json.dumps(quiz, ensure_ascii=False, indent=1))
# озвучка: текст реплики → id (voice/voice_lines.csv от Виталия); строки с {f} {up} {op} — шаблоны
import csv
def vnorm(t): return re.sub(r'[^0-9a-zа-яәіңғүұқөһ]+', '', t.lower().replace('ё', 'е'))
vids, vtpl = {'kz': {}, 'ru': {}}, {'kz': {}, 'ru': {}}
for row in [*csv.DictReader(open('voice/voice_lines.csv', encoding='utf-8-sig'), delimiter=';'), *csv.DictReader(open('voice/voice_extra.csv', encoding='utf-8-sig'), delimiter=';')]:   # таблица Виталия + реплики героя, которых в ней нет
    for lang in ('kz', 'ru'):
        t = row[lang].strip()
        if '{' in t: vtpl[lang][t] = row['id']
        else: vids[lang].setdefault(vnorm(t), row['id'])
voice_js = 'const VOICE_IDS = ' + json.dumps(vids, ensure_ascii=False) + ';\nconst VOICE_TPL = ' + json.dumps(vtpl, ensure_ascii=False) + ';\n'
order = ['engine', 'music', 'content', 'scen_texts', 'scen_glue', 'voice', 'api', 'art_head', 'art_world', 'art_night', 'art_portraits', 'game', 'interlude', 'prologue', 'house', 'inside']
js = voice_js + '\n'.join(open(f'src/{n}.js').read() for n in order)
js += '\nconst QUIZ_BUILTIN = ' + json.dumps(quiz, ensure_ascii=False) + ';\n' + open('src/quiz.js').read()
open('index.html', 'w').write(shell.replace('/*@@SCRIPT@@*/', js))
print('built', len(js), 'quiz', {k: len(v['questions']) for k, v in tours.items()})
