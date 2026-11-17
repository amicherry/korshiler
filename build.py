import sys
shell=open('src/shell.html').read()
js='\n'.join(open(f'src/{n}.js').read() for n in ['engine','content','api','art_head','art_world','art_night','art_portraits','game','house'])
open('index.html','w').write(shell.replace('/*@@SCRIPT@@*/',js))
print('built', len(js))
