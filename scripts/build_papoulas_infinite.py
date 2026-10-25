#!/usr/bin/env python3
"""Gera o vídeo original das papoulas em fundo infinito da cor da seção.

NÃO remove pixels, NÃO cria alpha, NÃO aplica blur, máscara ou recorte:
o vídeo todo permanece opaco. Apenas neutraliza tonalidades do papel e
acrescenta uma margem OFF-WHITE em cada lado para afastar as pétalas da borda.
"""
import argparse
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np


def remap_background(frame):
    """Equaliza apenas tons pouco saturados do papel; preserva pétalas e caules."""
    # #F4F4F2 da seção em BGR. O MP4 é opaco: 100% dos pixels continuam presentes.
    offwhite = np.array([242., 244., 244.], dtype=np.float32)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1].astype(np.float32) / 255.
    lum = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.

    # Papoulas vermelhas/laranjas e caules verdes permanecem intactos.
    # Não é canal alfa: cor da imagem SEMPRE é opaca.
    vivid = np.clip((sat - .065) / .145, 0., 1.)
    dark_subject = np.clip((.65 - lum) / .23, 0., 1.)
    foreground = np.maximum(vivid, dark_subject)
    foreground = foreground * foreground * (3. - 2. * foreground)

    img = frame.astype(np.float32)
    composited = offwhite[None, None, :] * (1. - foreground[:, :, None]) + img * foreground[:, :, None]
    return np.clip(np.rint(composited), 0, 255).astype(np.uint8)


def build(source, output, max_side=960, target_fps=18):
    source = Path(source)
    output = Path(output)
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError(f'Não foi possível abrir o vídeo autoral {source}')
    source_fps = cap.get(cv2.CAP_PROP_FPS)
    if not source_fps or source_fps <= 0:
        raise RuntimeError('FPS inválido no vídeo original')
    source_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    source_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    original_duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / source_fps
    scale = min(1., max_side / float(max(source_width, source_height)))
    w = max(2, int(round(source_width * scale / 2)) * 2)
    h = max(2, int(round(source_height * scale / 2)) * 2)

    # padding externo aumenta área do VÍDEO, sem cortar nenhuma pétala.
    padding = .115
    px = int(round(w * padding / 2)) * 2
    py = int(round(h * padding / 2)) * 2
    full_w, full_h = w + px * 2, h + py * 2
    bg = (242, 244, 244)  # BGR de #F4F4F2, o mesmo CSS.

    output.parent.mkdir(parents=True, exist_ok=True)
    args = [
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'bgr24',
        '-s', f'{full_w}x{full_h}', '-r', str(target_fps),
        '-i', 'pipe:0', '-an', '-c:v', 'libx264',
        '-preset', 'faster', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(output)
    ]
    proc = subprocess.Popen(args, stdin=subprocess.PIPE)
    n = 0
    source_index = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            timestamp = source_index / source_fps
            source_index += 1
            if timestamp < n / target_fps - 1.0 / (2.0 * source_fps):
                continue
            if frame.shape[:2] != (h, w):
                frame = cv2.resize(frame, (w, h), interpolation=cv2.INTER_AREA)
            core = remap_background(frame)
            extended = cv2.copyMakeBorder(core, py, py, px, px, cv2.BORDER_CONSTANT, value=bg)
            assert extended.shape[1] == full_w and extended.shape[0] == full_h
            assert tuple(extended[0, 0]) == bg
            proc.stdin.write(extended.tobytes())
            n += 1
    except (BrokenPipeError, OSError):
        proc.kill()
        raise RuntimeError('Erro no ffmpeg ao gerar o vídeo floral contínuo')
    finally:
        cap.release()
        if proc.stdin:
            proc.stdin.close()

    if proc.wait() != 0:
        raise RuntimeError('Falha na codificação MP4 do vídeo floral')
    if n < 3 or output.stat().st_size < 10000:
        raise RuntimeError('Vídeo floral gerado inválido')

    # Inspeciona a codificação e duração, sem depender de um teste de string.
    probe = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height,duration',
         '-of', 'csv=p=0', str(output)], capture_output=True, text=True, check=True
    ).stdout.strip()
    print(f'OK: vídeo sem corte: {n} quadros, original {source_width}x{source_height}, '
          f'novo {full_w}x{full_h}, {original_duration:.2f}s, ffprobe={probe}')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    build(args.source, args.output)
