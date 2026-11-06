"""SE Primer v2.0 — Diferansiyel Parite Testi ve Test Kahini / Oracle Betiği (`tests/parite.py`).

Aynı `model/model.onnx` ve `model/config.json` sözleşmesini tüketen farklı ortamların
(`tests/parite.json` içindeki 5 referans girdi üzerinde) hata toleransı `1e-4` (10^-4)
dahilinde birebir aynı olasılığı ürettiğini doğrular:
  1. Python ONNX Runtime (Test Kahini / Oracle)
  2. Python scikit-learn Pipeline (`model.joblib`)
  3. Sunucu Tüketicisi (`server/app.py` — HTTP POST `/api/v1/predictions`, Bonus +10)

Kullanım:
  python tests/parite.py
"""
from __future__ import annotations

import json
import sys
import threading
import urllib.request
from http.server import HTTPServer
from pathlib import Path

import joblib
import numpy as np
import onnxruntime as ort
import pandas as pd

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

KOK_DIZIN = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK_DIZIN))

from server.app import TahminSunucusuHandler  # noqa: E402

MODEL_DIZINI = KOK_DIZIN / "model"
PARITE_JSON_YOLU = KOK_DIZIN / "tests" / "parite.json"
TOLERANS = 1e-4


def gecici_sunucu_baslat() -> tuple[HTTPServer, str]:
    """Bonus sunucu tüketicisini (`server/app.py`) rastgele boş bir portta başlatır."""
    sunucu = HTTPServer(("127.0.0.1", 0), TahminSunucusuHandler)
    port = sunucu.server_port
    is_parcacigi = threading.Thread(target=sunucu.serve_forever, daemon=True)
    is_parcacigi.start()
    return sunucu, f"http://127.0.0.1:{port}/api/v1/predictions"


def sunucudan_tahmin_al(url: str, girdi: dict) -> float:
    veri = json.dumps({"inputs": girdi}).encode("utf-8")
    istek = urllib.request.Request(
        url,
        data=veri,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(istek, timeout=5) as yanit:
        sonuc = json.loads(yanit.read().decode("utf-8"))
        return float(sonuc["p"])


def main() -> None:
    if not PARITE_JSON_YOLU.exists():
        sys.exit(f"✗ {PARITE_JSON_YOLU} bulunamadı. Önce: python train.py")

    config = json.loads((MODEL_DIZINI / "config.json").read_text(encoding="utf-8"))
    parite_veri = json.loads(PARITE_JSON_YOLU.read_text(encoding="utf-8"))
    ozellik_sirasi = config["features"]
    ozellik_adlari = [f["name"] for f in ozellik_sirasi]

    if ozellik_adlari != parite_veri["feature_order"]:
        sys.exit("✗ Sözleşme uyuşmazlığı: config.json ve parite.json özellik sırası farklı!")

    oturum = ort.InferenceSession(str(MODEL_DIZINI / "model.onnx"), providers=["CPUExecutionProvider"])
    sklearn_model = joblib.load(MODEL_DIZINI / "model.joblib")

    sunucu, sunucu_url = gecici_sunucu_baslat()
    try:
        print("=" * 92)
        print("SE PRIMER v2.0 — DİFERANSİYEL PARİTE TESTİ (PYTHON ORACLE vs. SKLEARN vs. SUNUCU API)")
        print(f"Hata Toleransı (ε): {TOLERANS:.1e} | Karar Eşiği (τ): {config['threshold']}")
        print("=" * 92)
        print(
            f"{'Senaryo ID':<30} | {'Oracle (JSON)':<13} | {'ONNX (Py)':<11} | {'Sunucu API':<11} | {'Maks |Δ|':<10} | {'Durum'}"
        )
        print("-" * 92)

        maks_genel_fark = 0.0
        for vaka in parite_veri["cases"]:
            girdi = vaka["input"]
            p_beklenen = float(vaka["p_oracle"])

            # 1. Python ONNX Runtime (Oracle)
            x_np = np.array([[float(girdi[ad]) for ad in ozellik_adlari]], dtype=np.float32)
            p_onnx = float(oturum.run(["probabilities"], {"input": x_np})[0][0][1])

            # 2. Python scikit-learn Pipeline
            x_df = pd.DataFrame([{ad: float(girdi[ad]) for ad in ozellik_adlari}])
            p_sklearn = float(sklearn_model.predict_proba(x_df)[0][1])

            # 3. Sunucu HTTP API Tüketicisi (Bonus +10)
            p_sunucu = sunucudan_tahmin_al(sunucu_url, girdi)

            fark_onnx = abs(p_onnx - p_beklenen)
            fark_sklearn = abs(p_sklearn - p_beklenen)
            fark_sunucu = abs(p_sunucu - p_beklenen)
            maks_vaka_farki = max(fark_onnx, fark_sklearn, fark_sunucu)
            maks_genel_fark = max(maks_genel_fark, maks_vaka_farki)

            sinif_onnx = 1 if p_onnx >= config["threshold"] else 0
            sinif_uyumlu = sinif_onnx == int(vaka["expected_class"])
            gecti = (maks_vaka_farki < TOLERANS) and sinif_uyumlu

            durum_str = "✓ GEÇTİ" if gecti else "✗ KALDI"
            print(
                f"{vaka['id']:<30} | {p_beklenen:<13.6f} | {p_onnx:<11.6f} | {p_sunucu:<11.6f} | {maks_vaka_farki:<10.2e} | {durum_str}"
            )

            if not gecti:
                sys.exit(
                    f"✗ Parite hatası ({vaka['id']}): maks fark {maks_vaka_farki:.2e} >= {TOLERANS:.1e}"
                )

        print("-" * 92)
        print(
            f"✓ TÜM 5 REFERANS GİRDİ DOĞRULANDI (Maksimum Mutlak Sapma: {maks_genel_fark:.2e} < {TOLERANS:.1e})"
        )
    finally:
        sunucu.shutdown()
        sunucu.server_close()


if __name__ == "__main__":
    main()
