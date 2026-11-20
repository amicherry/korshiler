import sys
shell=open('src/shell.html').read()
import json
quiz=json.load(open('quiz.json'))   # вопросы викторины: встроенная копия (на сайте игра берёт свежий quiz.json)
js='\n'.join(open(f'src/{n}.js').read() for n in ['engine','music','content','api','art_head','art_world','art_night','art_portraits','game','prologue','house'])
js+='\nconst QUIZ_BUILTIN = '+json.dumps(quiz, ensure_ascii=False)+';\n'+open('src/quiz.js').read()
open('index.html','w').write(shell.replace('/*@@SCRIPT@@*/',js))
print('built', len(js))
