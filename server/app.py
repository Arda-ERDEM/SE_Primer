"""SE Primer v2.0 — Bonus Sunucu Tüketicisi (`server/app.py`).

Modelin gizli kalması gereken senaryolar için aynı `model/model.onnx` + `model/config.json`
sözleşmesini sunucu tarafında çalıştıran hafif HTTP/REST servisi (Render.com uyumlu).

Uç Noktalar:
  GET  /health               -> {"status": "ok", "version": "2.0.0", "model": ...}
  POST /api/v1/predictions   -> {"inputs": {...}} -> {"p": 0.993215, "class": 1, "proba": {...}}

Çalıştırma:
  python server/app.py --port 3100
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import numpy as np
import onnxruntime as ort

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

KOK_DIZIN = Path(__file__).resolve().parent.parent
MODEL_DIZINI = Path(os.environ.get("MODEL_DIR", str(KOK_DIZIN / "model")))
CONFIG_YOLU = MODEL_DIZINI / "config.json"
ONNX_YOLU = MODEL_DIZINI / "model.onnx"

CONFIG = json.loads(CONFIG_YOLU.read_text(encoding="utf-8"))
OTURUM = ort.InferenceSession(str(ONNX_YOLU), providers=["CPUExecutionProvider"])
OZELLIK_ADLARI = [f["name"] for f in CONFIG["features"]]
ESIK = float(CONFIG.get("threshold", 0.50))


def sunucu_tahmini_hesapla(girdi: dict) -> dict:
    """Sözleşmedeki özellik sırasına göre ONNX çıkarımı yapar ve olasılığı döner."""
    eksik = [ad for ad in OZELLIK_ADLARI if ad not in girdi]
    if eksik:
        raise ValueError(f"Eksik girdi özellikleri: {eksik}")

    vektor = np.array([[float(girdi[ad]) for ad in OZELLIK_ADLARI]], dtype=np.float32)
    cikti = OTURUM.run(["probabilities"], {"input": vektor})[0][0]
    p0 = float(cikti[0])
    p1 = float(cikti[1])
    sinif = 1 if p1 >= ESIK else 0

    return {
        "contract_version": CONFIG.get("version", "2.0.0"),
        "target": CONFIG["target"],
        "threshold": ESIK,
        "inputs": {ad: float(girdi[ad]) for ad in OZELLIK_ADLARI},
        "p": round(p1, 6),
        "class": sinif,
        "decision_label": CONFIG["class_labels"][str(sinif)],
        "proba": {
            CONFIG["class_labels"]["0"]: round(p0, 6),
            CONFIG["class_labels"]["1"]: round(p1, 6),
        },
    }


class TahminSunucusuHandler(BaseHTTPRequestHandler):
    def _cors_basliklari(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_yanit(self, kod: int, veri: dict) -> None:
        govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
        self.send_response(kod)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self._cors_basliklari()
        self.end_headers()
        self.wfile.write(govde)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors_basliklari()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/health", "/api/v1/health"):
            self._json_yanit(
                200,
                {
                    "status": "ok",
                    "service": "se-primer-v2-onnx-server",
                    "version": CONFIG.get("version", "2.0.0"),
                    "features": OZELLIK_ADLARI,
                    "threshold": ESIK,
                },
            )
            return
        self._json_yanit(404, {"error": "Bulunamadı"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/v1/predictions":
            self._json_yanit(404, {"error": "Geçersiz uç nokta. POST /api/v1/predictions kullanın."})
            return
        try:
            uzunluk = int(self.headers.get("Content-Length", "0"))
            istek = json.loads(self.rfile.read(uzunluk).decode("utf-8"))
            girdi = istek.get("inputs", istek)
            sonuc = sunucu_tahmini_hesapla(girdi)
            self._json_yanit(200, sonuc)
        except Exception as exc:
            self._json_yanit(400, {"error": str(exc)})

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="SE Primer v2.0 — ONNX Sunucu Tüketicisi (Bonus +10)")
    parser.add_argument("--host", default="0.0.0.0", help="Dinlenecek adres")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "3100")), help="Port (varsayılan: 3100)")
    args = parser.parse_args()

    sunucu = HTTPServer((args.host, args.port), TahminSunucusuHandler)
    print(f"✓ SE Primer v2.0 ONNX Sunucu Tüketicisi aktif → http://{args.host}:{args.port}/api/v1/predictions")
    try:
        sunucu.serve_forever()
    except KeyboardInterrupt:
        sunucu.server_close()


if __name__ == "__main__":
    main()
