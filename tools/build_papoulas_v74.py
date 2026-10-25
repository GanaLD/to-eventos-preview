#!/usr/bin/env python3
"""Recompose user's original 6s watercolor animation for TO Eventos.

No generated/repeated petals, no mirrored textures, no rectangular feathered
video border. Key only the watercolor pigment against the paper reference and
recompose on the site off-white (#F4F4F2). The few original edge blooms taper
organically to the page color rather than ending at hard canvas boundaries.
Original source remains unchanged in site/assets/media/animacao-papoulas.mp4.
"""
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1] / "site" / "assets" / "media"
source = root / "animacao-papoulas.mp4"
output = root / "papoulas-seamless-v74.mp4"
width, height = 540, 960
paper = subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "error",
    "-i", str(source), "-frames:v", "1", "-vf",
    f"scale={width}:{height}", "-f", "rawvideo",
    "-pix_fmt", "rgb24", "-"
], check=True, stdout=subprocess.PIPE).stdout
background_paper = np.frombuffer(paper[:width*height*3], dtype=np.uint8).reshape(height,width,3).astype(np.float32)
background = np.array([244,244,242],dtype=np.float32)

x = np.arange(width)
edge = np.minimum(np.clip(x/92,0,1),np.clip((width-1-x)/95,0,1))
edge = (edge*edge*(3-2*edge)).reshape(1,width)

reader = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(source),
    "-vf", f"fps=24,scale={width}:{height}:flags=lanczos",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-"
],stdout=subprocess.PIPE)
writer = subprocess.Popen([
    "ffmpeg","-y","-hide_banner","-loglevel","error",
    "-f","rawvideo","-pix_fmt","rgb24","-s",f"{width}x{height}",
    "-r","24","-i","-","-vf","setpts=1.4*PTS,fps=24",
    "-an","-c:v","libx264","-preset","veryfast","-crf","20",
    "-pix_fmt","yuv420p","-movflags","+faststart",str(output)
],stdin=subprocess.PIPE)

num_frames = 0
while True:
    data=reader.stdout.read(width*height*3)
    if len(data)!=width*height*3: break
    color=np.frombuffer(data,dtype=np.uint8).reshape(height,width,3).astype(np.float32)
    saturation=color.max(axis=2)-color.min(axis=2)
    difference=np.max(np.abs(color-background_paper),axis=2)
    alpha=np.clip((difference-22)/22,0,1)*np.clip((saturation-3)/14,0,1)*edge
    composite=(color*alpha[...,None]+background*(1-alpha[...,None])).clip(0,255).astype(np.uint8)
    painting=Image.fromarray(composite).resize((450,800),Image.Resampling.BILINEAR)
    frame=np.full((height,width,3),background,dtype=np.uint8)
    frame[80:880,45:495]=np.asarray(painting)
    writer.stdin.write(frame.tobytes())
    num_frames+=1

reader.stdout.close()
reader.wait()
writer.stdin.close()
if writer.wait()!=0 or num_frames<120 or output.stat().st_size<100000:
    raise SystemExit("Floral video render failed")
print(f"Generated {output.name}: {num_frames} source frames, {output.stat().st_size} bytes")
