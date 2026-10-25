#!/usr/bin/env python3
"""HeroScroll 9:16: reconstrução editorial fiel dos DOIS grupos da marca original.
Não duplica barras pretas nem refaz tipografia. Extrai grupos da animação-fonte
16:9, remove exclusivamente seu fundo laranja e compõe sobre o mesmo tom plano.
Sem espelhamento, sem "bleed", sem reflexos ou painéis retangulares.
"""
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
src=ROOT/'site/assets/media/motion-hero.mp4'
dst=ROOT/'site/assets/media/motion-hero-mobile.mp4'

def probe(file):
    return json.loads(subprocess.check_output([
        'ffprobe','-v','error','-show_entries',
        'stream=width,height,avg_frame_rate,codec_name:format=duration',
        '-of','json',str(file)],text=True))

m=probe(src)
v=next(s for s in m['streams'] if 'width' in s)
w,h=int(v['width']),int(v['height'])
duration=float(m['format']['duration'])
if abs(w/h-16/9)>.05 or not 5<duration<30:
    raise ValueError(f'Vídeo de origem não esperado: {w}x{h} duration={duration}')

def even(n):return int(n)//2*2
def region(x1,y1,x2,y2):
    return (even(w*x2)-even(w*x1),even(h*y2)-even(h*y1),even(w*x1),even(h*y1))

# Bordas autorais (fileiras/faixas) estão FORA das caixas.
# Recortes estreitos evitam trazer letras de outro grupo ou barras laterais.
left =region(.066,.255,.493,.825)
right=region(.515,.330,.882,.812)
def crop(r):return f'crop={r[0]}:{r[1]}:{r[2]}:{r[3]}'
# Key removendo SOMENTE o laranja do backing, preservando os pixels
# e a animação das letras brancas/pretas do vídeo original.
def panel(tag,r,out,mode):
    common=(f'[{tag}]{crop(r)},')
    if mode=='white':
        # A parte superior contém SOMENTE tipografia branca. Rejeitar
        # tanto o laranja quanto o preto das barras decorativas do master.
        # A alpha ramp preserva o antialiasing da letra original.
        alpha="255*max(0\\,min(1\\,(r(X\\,Y)+g(X\\,Y)+b(X\\,Y)-540)/185))"
        return (common+'scale=556:-2:flags=lanczos,format=rgba,'
                f"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='{alpha}',"
                f'format=yuva420p[{out}]')
    # Parte inferior inclui letras pretas e brancas do mesmo frame.
    # Crop menor elimina bordas; escala reduzida não corta a legenda.
    return (common+'scale=530:-2:flags=lanczos,format=rgba,'
            'colorkey=0xff6108:0.20:0.07,'
            f'format=yuva420p[{out}]')

graph=(
    '[0:v]fps=30,split=2[la][ra];'
    +panel('la',left,'white','white')+';'
    +panel('ra',right,'black','mixed')+';'
    '[1:v][white]overlay=(W-w)/2:158:shortest=1:format=auto[stage];'
    '[stage][black]overlay=(W-w)/2:680:shortest=1:format=auto,'
    'format=yuv420p[out]'
)
cmd=[
    'ffmpeg','-hide_banner','-loglevel','warning','-y',
    '-i',str(src),
    '-f','lavfi','-i',f'color=c=0xff6108:s=720x1280:r=30:d={duration:.4f}',
    '-filter_complex',graph,'-map','[out]','-an',
    '-t',f'{duration:.4f}','-c:v','libx264',
    '-preset','medium','-crf','17','-pix_fmt','yuv420p',
    '-r','30','-g','6','-keyint_min','6','-sc_threshold','0',
    '-movflags','+faststart',str(dst)]
print('FONTE',w,h,'duration',duration,'left',left,'right',right,flush=True)
subprocess.run(cmd,check=True)
out=probe(dst)
v2=next(s for s in out['streams'] if 'width' in s)
assert (int(v2['width']),int(v2['height']))==(720,1280),v2
assert abs(float(out['format']['duration'])-duration)<.15
print('OK HERO 9:16',dst.stat().st_size,'bytes',flush=True)
