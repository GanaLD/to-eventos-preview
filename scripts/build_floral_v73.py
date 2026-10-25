#!/usr/bin/env python3
"""Produce an uncropped reveal of the ORIGINAL TO Eventos flower illustration.

The existing source MP4 permanently cuts petals at its right edge; masking that
MP4 cannot reconstruct its missing pixels. This uses the original FULL transparent
bouquet asset instead (no generative changes or stretched flowers).
"""
import argparse
import subprocess
import numpy as np
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--source',default='site/assets/media/papoulas-preview.webp')
parser.add_argument('--output',default='site/assets/media/animacao-papoulas-inteiras-v73.mp4')
parser.add_argument('--fps',type=int,default=24)
parser.add_argument('--duration',type=float,default=6.6)
arg=parser.parse_args()
W,H=720,1280
im=Image.open(arg.source).convert('RGBA')
bbox=im.getchannel('A').getbbox()
assert bbox is not None and im.width>=200
im=im.crop(bbox)
scale=min(.83,(W-170)/im.width,(H-360)/im.height)
w,h=round(im.width*scale),round(im.height*scale)
im=im.resize((w,h),Image.Resampling.LANCZOS)
offset=((W-w)//2,(H-h)//2)
layer=Image.new('RGBA',(W,H),(0,0,0,0))
layer.alpha_composite(im,offset)
pixels=np.asarray(layer).astype(np.float32)
alpha=pixels[:,:,3]/255.
color=pixels[:,:,:3]
bg=np.array([244.,244.,242.],dtype=np.float32)
y,x=np.ogrid[:H,:W]

def smooth(v):
    v=np.clip(v,0.,1.)
    return v*v*(3.-2.*v)

def ellipse(cx,cy,rx,ry):
    return np.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2)

flower_specs=[
 (258,445,150,165,2.0,3.7),
 (585,474,175,165,2.5,4.25),
 (454,199,235,180,3.15,5.15)
]
regions=[]
for cx,cy,rx,ry,start,end in flower_specs:
    cx=offset[0]+(cx-bbox[0])*scale
    cy=offset[1]+(cy-bbox[1])*scale
    dist=ellipse(cx,cy,rx*scale*1.22,ry*scale*1.24).astype(np.float32)
    regions.append((smooth((1.15-dist)/.24).astype(np.float32),dist,start,end))
region=np.maximum.reduce([item[0] for item in regions])
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo',
     '-pix_fmt','rgb24','-s:v',f'{W}x{H}','-r',str(arg.fps),
     '-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','19',
     '-pix_fmt','yuv420p','-movflags','+faststart',arg.output]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
    frame_count=round(arg.fps*arg.duration)
    for frame_number in range(frame_count):
        t=frame_number/arg.fps
        # Grow stems from bottom. Every flower retains original geometry.
        progress=smooth((t-.2)/1.95)
        head=H+70-progress*(H-440)
        stems=smooth((y-head+28)/56).astype(np.float32)
        bloom=np.zeros((H,W),dtype=np.float32)
        for shape,dist,start,end in regions:
            if t<=start:
                continue
            growth=smooth((t-start)/(end-start))
            radial=smooth((growth*1.23-dist+.12)/.2).astype(np.float32)
            bloom=np.maximum(bloom,shape*radial)
        mask=np.clip(stems*(1-region)+bloom,0.,1.)
        blend=(alpha*mask)[:,:,None]
        pixels_out=np.clip(bg[None,None,:]*(1-blend)+color*blend,0.,255).astype(np.uint8)
        proc.stdin.write(pixels_out.tobytes())
finally:
    proc.stdin.close()
    if proc.wait()!=0:
        raise RuntimeError('ffmpeg failed to encode original floral animation')
print(f'Original petals preserved: {W}x{H}, bouquet {w}x{h}, centered {offset}, frames={frame_count}')
