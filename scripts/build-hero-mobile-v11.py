#!/usr/bin/env python3
"""Monta o HERO 9:16 só com letras e barras reais do MP4 16:9 original.
Não espelha, repete, rasteriza fonte nova nem usa gerador de conteúdo.
Fonte: motion-hero.mp4 do próprio projeto, 1920x1080, 24 fps.
"""
import cv2
import numpy as np
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'site/assets/media/motion-hero.mp4'
TARGET=ROOT/'site/assets/media/motion-hero-mobile.mp4'
cap=cv2.VideoCapture(str(SOURCE))
fps=cap.get(cv2.CAP_PROP_FPS)
frames=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
assert cap.isOpened() and abs(fps-24)<.1 and frames>=235, 'Video master incorreto'
W,H=720,1280
base=np.zeros((H,W,3),np.uint8)
# Valor cromático amostrado no original, sem inventar um novo laranja.
base[:]=(13,87,241)  # BGR == #F1570D

def composite(canvas,src,x,y,w,mode):
    h=round(src.shape[0]*w/src.shape[1])
    frame=cv2.resize(src,(w,h),interpolation=cv2.INTER_AREA)
    if mode=='white':
        # Apenas o lettering BRANCO original, inclusive antialiasing.
        b=frame[:,:,0].astype(np.float32)
        alpha=np.clip((b-18)/225,0,1)
    elif mode=='text':
        # Texto preto + versões brancas de entrada na mesma animação.
        b=frame[:,:,0].astype(np.float32)
        g=frame[:,:,1].astype(np.float32)
        alpha=np.maximum(np.clip((b-20)/215,0,1),np.clip((80-g)/70,0,1))
    else:
        # Barras pretas originais, amostradas UMA vez do centro do frame.
        g=frame[:,:,1].astype(np.float32)
        alpha=np.clip((75-g)/69,0,1)
    xx=max(0,x);yy=max(0,y);xx2=min(W,x+w);yy2=min(H,y+h)
    if xx>=xx2 or yy>=yy2:return
    overlay=frame[yy-y:yy2-y,xx-x:xx2-x].astype(np.float32)
    aa=alpha[yy-y:yy2-y,xx-x:xx2-x,None]
    canvas[yy:yy2,xx:xx2]=(overlay*aa+canvas[yy:yy2,xx:xx2].astype(np.float32)*(1-aa)).astype(np.uint8)

cmd=['ffmpeg','-hide_banner','-loglevel','error','-y',
     '-f','rawvideo','-pix_fmt','bgr24','-s','720x1280','-r','24','-i','-',
     '-an','-c:v','libx264','-preset','veryfast','-crf','19',
     '-pix_fmt','yuv420p','-g','6','-keyint_min','6','-sc_threshold','0',
     '-movflags','+faststart',str(TARGET)]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
count=0
try:
    while True:
        ok,frame=cap.read()
        if not ok:break
        canvas=base.copy()
        # Barras, título, assinatura e barras inferiores: áreas não repetidas.
        composite(canvas,frame[100:285,600:1320],0,0,720,'black')
        composite(canvas,frame[275:885,193:958],40,190,640,'white')
        composite(canvas,frame[335:782,942:1790],32,747,655,'text')
        composite(canvas,frame[915:1080,600:1320],0,1115,720,'black')
        p.stdin.write(canvas.tobytes())
        count+=1
finally:
    cap.release()
    if p.stdin:p.stdin.close()
ret=p.wait()
if ret or count<235 or TARGET.stat().st_size<200000:
    sys.exit('Falha ao exportar composição 9:16: '+str((ret,count)))
print('HERO PORTRAIT OK',count,'frames',TARGET.stat().st_size,'bytes')
