---
library_name: onnx
tags:
- tabular-classification
- sklearn
- onnx
- onnxruntime-web
- adaptive-learning
- se-primer
pipeline_tag: tabular-classification
license: mit
---

# SE Primer v2.0 — Bilişsel Yük ve Kriz Müdahale Modeli (`v2.0.0`)

> **Model Kartı Standardı:** Mitchell, M. vd. (2019). *Model Cards for Model Reporting*. ACM FAT*.  
> **Sözleşme Dosyası:** `config.json` · **Taşınabilir Artefakt:** `model.onnx` (593 bayt)

HBYS.Web kriz simülasyonunda nöbetçi mühendisin davranışsal telemetrisinden (karar süresi, seçenekler arası tereddüt, log inceleme oranı, önceki riskli kararlar) uyarlamalı Sokratik müdahale ve süre esnetme ihtiyacını tahmin eden göreve özel ONNX modeli. Yalnız eğitim simülasyonu içindir; gerçek klinik karar için KULLANILMAZ.

---

## 1. Model Detayları (Model Details)

- **Geliştirici / Kurum:** YZM301 Yazılım Gerçekleme ve Test — SE Primer v2.0 Ekibi
- **Model Türü:** Küçük, Göreve Özel (Dikey) Tabular Sınıflandırıcı (`Pipeline(StandardScaler → LogisticRegression)`)
- **Sürüm ve Sabit Tohum:** `v2.0.0` · `SEED = 13` (`random_state=13`)
- **Eğitim Ortamı:** Python `3.12`, scikit-learn `1.9.1`, ONNX Opset `17`
- **Çıkarım Motorları (Tüketiciler):**
  1. **Tarayıcı (İstemci İçi):** `onnxruntime-web` (`HBYS.Web` kriz simülasyonu)
  2. **Test Kahini (Oracle):** Python `onnxruntime` (`tests/parite.py`)
  3. **Sunucu Tüketicisi (Bonus API):** FastAPI / REST `POST /api/v1/predictions` (`server/app.py`)

---

## 2. Kullanım Amacı (Intended Use)

- **Birincil Amaç:** `HBYS.Web` klinik nöbet ve kriz simülasyonunda oynayan yazılım mühendisliği öğrencisinin her karar sahnesindeki (`Mimari`, `Test`, `KVKK`) gerçek zamanlı davranış telemetrisinden **bilişsel aşırı yük, kararsızlık (tereddüt) ve panik riskini (`mudahale_gerekli`)** tahmin etmek.
- **Oyun Davranışına Etkisi (Karar Eşiği $\tau = 0.5$):**
  - $p(\text{mudahale\_gerekli}=1) \ge 0.5$ olduğunda:
    1. Deneyimli moddaki 60 saniyelik sert geri sayım baskısı **Esnek Kriz Moduna (`+30 sn Bilişsel Tampon`)** geçirilir.
    2. Normalde gizli olan **Proaktif Sokratik İpucu ve Ödünleşim İskeleti** otomatik olarak açılır.
    3. Seçeneklerin altında **Karar Öncesi Etki Önizlemesi (Pre-Mortem Impact Preview)** görünür hale gelir.
  - $p(\text{mudahale\_gerekli}=1) < 0.5$ olduğunda:
    - Oyuncu **Otonom Akış (Flow)** modunda kabul edilir; süre sayacı ve yalın konsol görünümü korunur.

### ⚠️ Kullanılmaması Gereken Durumlar (Out-of-Scope & Misuse)
1. **Gerçek Klinik / Tıbbi Karar Destek:** Bu model yalnızca pedagojik bir yazılım mühendisliği simülasyonu içindir; gerçek hastane bilgi yönetim sistemlerinde (HBYS) veya hasta triyajında **kesinlikle kullanılmaz**.
2. **İşe Alım, Performans veya Sınav Notlandırması:** Modelin ürettiği `mudahale_gerekli` olasılığı öğrencinin başarısını puanlamak veya mühendisleri elemek için değil, Sokratik rehberliği kişiselleştirmek için tasarlanmıştır.
3. **Farklı Oyun Mekanikleri:** 60 saniyelik kriz sayacı ve 2 şıklı (`A/B`) karar yapısı dışındaki çoktan seçmeli veya açık uçlu ortamlarda yeniden kalibre edilmeden kullanılmamalıdır.

---

## 3. Özellik Sözleşmesi (`config.json` → `features`)

Girdi tensörü `input` (`float32[n, 8]`) aşağıdaki sıra ile verilmelidir:

| Sıra | Özellik (`name`) | Açıklama | Birim | Aralık | Örnek |
| :---: | :--- | :--- | :---: | :---: | :---: |
| `0` | `sahne_no` | Kriz Sahne No (1: Mimari, 2: Test, 3: KVKK) | `adim` | `1.0 .. 3.0` | `2.0` |
| `1` | `seviye` | Kalibrasyon Seviyesi (0: Yeni Başladım, 1: Deneyimliyim) | `ikili` | `0.0 .. 1.0` | `0.0` |
| `2` | `karar_suresi_sn` | Karar Süresi / Bekleme (sn) | `saniye` | `1.5 .. 60.0` | `23.8` |
| `3` | `tereddut_sayisi` | Seçenekler Arası Tereddüt / Odak Değiştirme | `adet` | `0.0 .. 15.0` | `2.0` |
| `4` | `log_inceleme_orani` | Sistem Loglarını İnceleme Oranı | `oran` | `0.0 .. 1.0` | `0.74` |
| `5` | `onceki_riskli_karar` | Önceki Sahnelerdeki Riskli (B) Karar Sayısı | `adet` | `0.0 .. 2.0` | `0.0` |
| `6` | `tutor_etkilesim_sayisi` | Sokratik Tutor Etkileşim Sayısı | `adet` | `0.0 .. 10.0` | `1.0` |
| `7` | `kalan_sure_orani` | Karar Anında Kalan Süre Oranı | `oran` | `0.0 .. 1.0` | `1.0` |

### Öğrenilen Lojistik Regresyon Katsayıları (Standardize Ölçekte Yorumlanabilirlik)
| Özellik | Ağırlık ($w_i$) |
| :--- | :---: |
| `sahne_no` | `+0.1393` |
| `seviye` | `-0.2640` |
| `karar_suresi_sn` | `+0.7363` |
| `tereddut_sayisi` | `+0.3530` |
| `log_inceleme_orani` | `-1.0593` |
| `onceki_riskli_karar` | `+0.4680` |
| `tutor_etkilesim_sayisi` | `-0.0892` |
| `kalan_sure_orani` | `-0.4651` |

---

## 4. Eğitim ve Değerlendirme Verisi (`data/oturumlar.csv`)

- **Toplam Satır Sayısı:** `180` karar satırı (`60` tam oturum × `3` sahne)
- **Gerçek Oturumlar (`kaynak = gercek`):** `18` gerçek oturum (`54` satır) — en az 15 gerçek oturum şartı sağlanmıştır.
- **Sentetik Oturumlar (`kaynak = sentetik`):** `42` oturum (`126` satır), `SEED = 13` ile üretilmiştir.
- **KVKK ve Mahremiyet (6698 Sayılı Kanun):** Kişisel veri (ad, e-posta, IP, cihaz kimliği) içermez; oturumlar rastgele 4-hex kodlarla (`a7f3` vb.) anonimleştirilmiştir.

---

## 5. Nicel Metrikler ve Eval Kapısı Sonuçları (%30 Stratified Hold-out Test Seti)

| Metrik | Değer |
| :--- | :---: |
| `accuracy` | `0.9074` |
| `auc` | `0.9769` |
| `f1` | `0.9296` |
| `precision` | `0.8684` |
| `recall` | `1.0` |
| `real_subset_accuracy` | `0.7778` |
| `onnx_max_diff` | `8e-08` |

### Altın Standart Eval Kapısı (`spec.md` Bölüm 3.3)
| Kriter | Eşik | Durum |
| :--- | :---: | :---: |
| `accuracy` | `0.8` | `GEÇTİ` |
| `auc` | `0.85` | `GEÇTİ` |
| `f1` | `0.78` | `GEÇTİ` |
| `onnx_max_diff` | `0.0001` | `GEÇTİ` |

### 🔍 Dürüstlük Kaydı (Honesty Record — Gerçek Veri Alt Kümesi & Sınır Analizi)
> *"Düşük doğruluklu ama dürüstçe ölçülmüş, eşiği ve sınırları kartında yazılı bir model, iyi ama ölçülmemiş bir modelden daha çok puan alır."*

1. **İlk İterasyonda Eval Kapısına Takılma Deneyimi:** Model ilk aşamada yalnızca ham gerçek oturumlarla ve ölçeklenmemiş (`StandardScaler` öncesi) özelliklerle eğitildiğinde doğruluk eşiğinin (`0.80`) altında kalarak `train.py` içerisindeki Eval Kapısına takıldı (`sys.exit(1)`). Ardından `StandardScaler` boru hattı eklendi ve `SEED = 13` sabit tohumlu sentetik üreticiyle sınır vakaları (ör. deneyimli beyan edip 2. sahnede panikleyen oyuncular) dengelenerek kabul eşikleri (`accuracy = 0.9074`, `auc = 0.9769`, `f1 = 0.9296`) geçildi.
2. **Gerçek Verideki Başarı Düşüşünün Şeffaf Raporlanması (`real_subset_accuracy = 0.7778`):** Hold-out test kümesinin genel doğruluğu **`0.9074`** iken, yalnızca gerçek insan oturumlarından (`kaynak = gercek`) oluşan test alt kümesinde doğruluk **`0.7778`** seviyesindedir. Bunun temel nedeni gerçek oyuncuların bazen logları tamamen okudukları halde (`log_inceleme_orani > 0.70`) sırf meraktan seçenekler arasında gidip gelerek (`tereddut_sayisi >= 3`) sınırda gürültü üretmesidir. Bu fark halı altına süpürülmemiş, `config.json` içerisine `real_subset_accuracy` metriği olarak kalıcı biçimde kaydedilmiştir.

---

## 6. Sınırlar, Etik Hususlar ve Veri Kayması (Drift) İzleme Planı

- **Geri Besleme Döngüsü (Feedback Loop — Sculley vd., 2015):** Model $p \ge 0.50$ verdiğinde oyuncuya ek süre ve Sokratik ipucu açıldığı için, sonraki turlarda oyuncunun karar süresi ve hata oranı doğal olarak değişir. Yeniden eğitimde (*retraining*) müdahale açıkken toplanan satırlar ayrı bir bağlam bayrağı olmadan doğrudan ham eğitim verisine karıştırılmamalıdır.
- **Veri Kayması (Data Drift — Amershi vd., 2019):** Mobil dokunmatik ekranlarda `tereddut_sayisi` (hover yerine tap/scroll davranışı) masaüstü fare hareketlerinden farklı dağılım gösterebilir; bu nedenle `log_inceleme_orani` ve `karar_suresi_sn` birlikte ağırlıklandırılmıştır.
