#!/usr/bin/env python3
"""Rebuild a clean growing-poppies film from the original complete transparent
TO Eventos artwork. No AI reconstruction, crop, feather, fake edges or scaling
of individual petals. The entire untouched artwork is visible at the end.
"""
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/'site/assets/media/papoulas-preview.webp'
OUTPUT=ROOT/'site/assets/media/papoulas-completas-v8.mp4'
src=Image.open(INPUT).convert('RGBA')
W,H=720,1280
image_w=700
image_h=round(src.height*image_w/src.width)
resized=np.asarray(src.resize((image_w,image_h),Image.Resampling.LANCZOS))
rgba=np.zeros((H,W,4),dtype=np.uint8)
top=(H-image_h)//2
left=(W-image_w)//2
rgba[top:top+image_h,left:left+image_w]=resized
rgb=rgba[:,:,:3].astype(np.float32)
alpha=(rgba[:,:,3].astype(np.float32)/255.0)
background=np.array([244,244,242],dtype=np.float32)
x=np.arange(W,dtype=np.float32)[None,:]
y=np.arange(H,dtype=np.float32)[:,None]
frames=180 # 7.5s × 24fps
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y',
  '-f','rawvideo','-pixel_format','rgb24',
  '-video_size',f'{W}x{H}','-framerate','24','-i','-',
  '-an','-c:v','libx264','-preset','fast','-crf','19',
  '-pix_fmt','yuv420p','-movflags','+faststart',str(OUTPUT)]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
    for frame in range(frames):
        t=frame/24.0
        p=float(np.clip((t-0.35)/6.20,0.0,1.0))
        p=p*p*(3.0-2.0*p)
        edge=1130.0-(1130.0-200.0)*p
        watercolor=11.0*np.sin(x/44.0+t*.6)+6.0*np.sin(x/113.0-t*.4)
        progressive=np.clip((y-edge-watercolor+24.0)/49.0,0.0,1.0)
        # Final image is the source pixels without any cropping or filtering.
        finish=float(np.clip((t-6.6)/0.28,0.0,1.0))
        revealed=np.maximum(progressive,finish)
        a=(alpha*revealed)[:,:,None]
        output=np.ascontiguousarray(
            np.clip(background[None,None,:]*(1.0-a)+rgb*a,0,255).astype(np.uint8)
        )
        proc.stdin.write(output.tobytes())
finally:
    proc.stdin.close()
    code=proc.wait()
if code!=0 or OUTPUT.stat().st_size<50000:
    raise RuntimeError('TO Eventos botanical render failed')
print('Papoulas completas V8:',OUTPUT,OUTPUT.stat().st_size,'bytes,',W,'x',H)
