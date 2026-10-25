#!/usr/bin/env python3
"""Converte vídeo floral sobre papel em VP9 com alfa real.

O arquivo gerado NÃO depende de canvas, shader, máscara CSS ou recorte espacial.
Todo o frame de origem é preservado; somente pixels do papel viram transparentes.
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np


def matte(frame):
    """Separação de fundo por GrabCut com sementes de cor e refinamento de silhueta."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    s = hsv[:, :, 1].astype(np.float32) / 255.0
    v = hsv[:, :, 2].astype(np.float32) / 255.0
    b, g, r = [x.astype(np.float32) / 255.0 for x in cv2.split(frame)]

    # Pétalas alaranjadas/vermelhas e caules verde-oliva são foreground confirmado.
    warm = (r > g * 1.12) & (r > b * 1.20) & (r > 0.32)
    stem = (g > r * 0.95) & (g > b) & (s > 0.15) & (v < 0.75)
    core = (warm & (s > 0.25)) | stem
    if not np.any(core):
        return np.zeros(frame.shape[:2], dtype=np.uint8)

    possible = ((s > 0.11) & (v < 0.92)) | (warm & (s > 0.10)) | stem
    paper = (s < 0.075) & (v > 0.72)

    label = np.full(frame.shape[:2], cv2.GC_PR_BGD, np.uint8)
    label[possible] = cv2.GC_PR_FGD
    label[paper] = cv2.GC_BGD
    label[core] = cv2.GC_FGD
    if not np.any(label == cv2.GC_BGD):
        label[0, :] = cv2.GC_BGD

    bg_model, fg_model = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(frame, label, None, bg_model, fg_model, 3, cv2.GC_INIT_WITH_MASK)
        alpha = np.where(
            (label == cv2.GC_FGD) | (label == cv2.GC_PR_FGD), 255, 0
        ).astype(np.uint8)
    except cv2.error:
        # Nunca retornar o retângulo opaco se a segmentação falhar.
        alpha = np.where(possible, 255, 0).astype(np.uint8)

    # Elimina grãos isolados do papel, sem retirar extremidades das pétalas.
    n, components, stats, _ = cv2.connectedComponentsWithStats(alpha)
    for i in range(1, n):
        component = components == i
        if stats[i, cv2.CC_STAT_AREA] < 12 or not np.any(core & component):
            alpha[component] = 0

    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE,
                             cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    return cv2.GaussianBlur(alpha, (3, 3), 0.6)


def build(source, target, poster, fps=18, max_width=540):
    source, target, poster = Path(source), Path(target), Path(poster)
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError("Não foi possível ler o vídeo floral de origem.")
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    target.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="to-papoulas-") as folder:
        idx = 0
        count = 0
        last_full = None
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            t = idx / source_fps
            idx += 1
            if t + 1e-5 < count / fps:
                continue
            height, width = frame.shape[:2]
            if width > max_width:
                target_width = max_width - (max_width % 2)
                new_height = int(round(height * target_width / width / 2)) * 2
                frame = cv2.resize(frame, (target_width, new_height),
                                   interpolation=cv2.INTER_AREA)
            a = matte(frame)
            rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
            rgba[:, :, 3] = a
            file = Path(folder) / f"frame_{count:05d}.png"
            if not cv2.imwrite(str(file), rgba):
                raise RuntimeError(f"Falha ao salvar {file}")
            if np.count_nonzero(a) > 0:
                last_full = rgba.copy()
            count += 1
        cap.release()
        if count < 2 or last_full is None:
            raise RuntimeError("A animação floral não gerou quadros transparentes válidos.")
        cv2.imwrite(str(poster), last_full)
        command = [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-framerate", str(fps), "-i", str(Path(folder) / "frame_%05d.png"),
            "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
            "-auto-alt-ref", "0", "-b:v", "0", "-crf", "26",
            "-deadline", "good", "-cpu-used", "4", str(target)
        ]
        subprocess.run(command, check=True)
        if target.stat().st_size < 10000:
            raise RuntimeError("Vídeo WebM transparente inválido.")
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "stream_tags=alpha_mode",
             "-of", "default=noprint_wrappers=1", str(target)],
            check=True, capture_output=True, text=True
        ).stdout
        if "alpha_mode=1" not in result:
            raise RuntimeError("VP9 foi codificado sem canal alfa real: " + result)
        print(f"OK: {count} quadros, WebM transparente {target.stat().st_size} bytes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("poster")
    args = parser.parse_args()
    build(args.source, args.target, args.poster)
