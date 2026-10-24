#!/usr/bin/env python3
"""Deriva composição 9:16 da animação original sem espelhar pixels nem recriar letras.

Reorganiza exclusivamente dois recortes autorais do MESMO frame em áreas
verticais. Não gera textura sintética e não altera o master 16:9.
"""
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site/assets/media/motion-hero.mp4"
TARGET = ROOT / "site/assets/media/motion-hero-mobile.mp4"

def metadata():
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=width,height,avg_frame_rate:format=duration",
        "-of", "json", str(SOURCE)
    ], text=True)
    value = json.loads(out)
    stream = next(s for s in value["streams"] if "width" in s)
    return int(stream["width"]), int(stream["height"]), float(value["format"]["duration"])

def even(n):
    return max(2, int(n) // 2 * 2)

def crop(w, h, x, y, width, height):
    X=even(w*x); Y=even(h*y)
    W=even(w*width); H=even(h*height)
    if X+W>w or Y+H>h:
        raise ValueError("crop além do quadro original")
    return f"crop={W}:{H}:{X}:{Y}"

w,h,duration=metadata()
if abs(w/h-16/9)>.05 or duration<2:
    raise RuntimeError(f"Fonte inesperada: {w}x{h}; {duration:.3f}s")

# Preserva as duas hierarquias originais da animação, sem redesenhar lettering.
# O recorte não pega as barras pretas da borda original.
left=crop(w,h,.065,.280,.470,.540)
right=crop(w,h,.470,.305,.505,.480)

# Feather alfa espacial para fundir a cor do vídeo com seu próprio laranja;
# não é blur da marca, duplicação, espelhamento ou alteração do texto.
a="255*max(0\\,min(1\\,min(X/26\\,min((W-X)/26\\,min(Y/28\\,(H-Y)/28)))))"
def panel(input_tag, region, out_tag):
    return (f"[{input_tag}]{region},"
            f"scale=590:-2:flags=lanczos,format=rgba,"
            f"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='{a}'[{out_tag}]")

graph=(
    "[0:v]fps=30,split=2[l][r];"
    +panel("l",left,"upper")+";"
    +panel("r",right,"lower")+";"
    "[1:v][upper]overlay=(W-w)/2:196:shortest=1:format=auto[composed];"
    "[composed][lower]overlay=(W-w)/2:666:shortest=1:format=auto,"
    "format=yuv420p[out]"
)

TARGET.parent.mkdir(parents=True,exist_ok=True)
cmd=[
    "ffmpeg","-hide_banner","-loglevel","error","-y",
    "-i",str(SOURCE),
    "-f","lavfi","-i",f"color=c=0xff6108:s=720x1280:r=30:d={duration:.4f}",
    "-filter_complex",graph,
    "-map","[out]","-an","-t",f"{duration:.4f}",
    "-c:v","libx264","-preset","medium","-crf","19",
    "-pix_fmt","yuv420p","-r","30","-g","6","-keyint_min","6",
    "-sc_threshold","0","-movflags","+faststart",
    str(TARGET)
]
print("FONTE",f"{w}x{h}",f"{duration:.3f}s",flush=True)
subprocess.run(cmd,check=True)
w2,h2,d2=metadata_target=None,None,None
probe=json.loads(subprocess.check_output([
    "ffprobe","-v","error","-show_entries",
    "stream=width,height:format=duration","-of","json",str(TARGET)
],text=True))
stream=probe["streams"][0]
w2=int(stream["width"]);h2=int(stream["height"])
d2=float(probe["format"]["duration"])
assert (w2,h2)==(720,1280), (w2,h2)
assert abs(d2-duration)<.1, (duration,d2)
assert TARGET.stat().st_size>100_000
print("VERTICAL",f"{w2}x{h2}",f"{d2:.3f}s",f"{TARGET.stat().st_size/1024/1024:.2f} MiB",flush=True)
