# SE Primer v2.0 — Veri Sözlüğü (`data/SOZLUK.md`)

> **Veri Kümesi:** `data/oturumlar.csv`  
> **Birim (Granularity):** Her karar aşaması (`Sahne 1`, `Sahne 2`, `Sahne 3`) **1 satır** olarak kaydedilir (1 tam oyun oturumu = 3 karar satırı).  
> **Hedef Değişken (`target`):** `mudahale_gerekli` (`0`: Otonom Akış / Standart Kriz Modu, `1`: Uyarlamalı Kriz Müdahalesi / Bilişsel Destek Aktif)  
> **Mevzuat ve Gizlilik (6698 Sayılı KVKK Uyumu):** Veri kümesinde ad, soyad, e-posta, IP adresi, tarayıcı parmak izi (`device fingerprint`), MAC adresi veya konum bilgisi **kesinlikle toplanmaz**. Her oyun oturumuna yalnızca tek kullanımlık, rastgele 4 karakterli onaltılık (`hex`) bir oturum kodu (`a7f3` vb.) atanır.

---

## 1. Sütun Tanımları ve Şema Sözleşmesi

`model/config.json` içerisindeki `features` dizisi, aşağıdaki tabloda yer alan **2 ile 9 arasındaki 8 sayısal özelliği** birebir aynı sırayla (`float32` tensörü `[1, 8]` olarak) bekler:

| # | Sütun Adı | Rolü | Veri Tipi | Birimi | Geçerli Aralık | İş Anlamı ve Davranışsal Sinyal Açıklaması |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `oturum` | İzlenebilirlik Anahtarı | `string` | 4-hex ID | `[0-9a-f]{4}` | Rastgele üretilen anonim oturum kimliği (ör. `a7f3`). Aynı oyuncunun 3 ardışık kararını gruplamak için kullanılır; modele girdi olarak **verilmez**. |
| **2** | `sahne_no` | Model Girdisi (`X[0]`) | `int` (`float32`) | Sahne Adımı | `1`, `2`, `3` | Kriz simülasyonundaki karar aşaması: `1` = Mimari (`Rollback vs. Hotfix`), `2` = Doğrulama (`Smoke Test vs. Direct Deploy`), `3` = KVKK (`SHA-256 Maskeleme vs. Ham Log`). |
| **3** | `seviye` | Model Girdisi (`X[1]`) | `int` (`float32`) | Seviye Kodu | `0` veya `1` | Giriş kalibrasyonundaki deneyim beyanı: `0` = *Yeni Başladım (Novice)*, `1` = *Deneyimliyim (Veteran — 60 sn süre baskılı mod)*. |
| **4** | `karar_suresi_sn` | Model Girdisi (`X[2]`) | `float` (`float32`) | Saniye (`sn`) | `1.5` – `60.0` | Oyuncunun sahne açılışından karar anına (veya değerlendirme anına) kadar geçirdiği bekleme / düşünme süresi (*dwell time*). Uzun bekleme süresi bilişsel kilitlenmeye veya kararsızlığa işaret eder. |
| **5** | `tereddut_sayisi` | Model Girdisi (`X[3]`) | `int` (`float32`) | Geçiş Adedi | `0` – `15` | Oyuncunun `Komut [A]` ve `Komut [B]` seçenekleri arasında yaptığı odak/fare/dokunma geçişi (*option hover/focus switch*) sayısı. El titremesi ve karar değiştirme tereddüdünü ölçer. |
| **6** | `log_inceleme_orani` | Model Girdisi (`X[4]`) | `float` (`float32`) | Oran (`0..1`) | `0.00` – `1.00` | Oyuncunun `/var/log/hbys/randevu.log` sistem telemetrisini ve olay özetini okuma / kaydırma derinliği oranı. Düşük oran (`< 0.35`), oyuncunun logları okumadan panikle karar verdiğini gösterir. |
| **7** | `onceki_riskli_karar` | Model Girdisi (`X[5]`) | `int` (`float32`) | Hata Adedi | `0`, `1`, `2` | Mevcut sahneye gelene kadar önceki adımlarda verilen kestirme/riskli (`B`) kararların veya süre aşımı (`timeout`) vakalarının kümülatif sayısı (*kötü sona gitme riski*). |
| **8** | `tutor_etkilesim_sayisi` | Model Girdisi (`X[6]`) | `int` (`float32`) | Mesaj Adedi | `0` – `10` | Oyuncunun mevcut oturumda Sokratik AI Tutor'a sorduğu soru veya tıkladığı örnek istem sayısı. |
| **9** | `kalan_sure_orani` | Model Girdisi (`X[7]`) | `float` (`float32`) | Oran (`0..1`) | `0.00` – `1.00` | Karar anında 60 saniyelik sayaçtan geriye kalan sürenin oranı (`kalan_sn / 60.0`). Süresiz modda (`seviye = 0`) sabit `1.00` değerini alır; düşük değerler (`< 0.30`) yüksek zaman baskısını temsil eder. |
| **10** | `mudahale_gerekli` | **Hedef (`y`)** | `int` | İkili Sınıf | `0` veya `1` | **Tahmin Edilen Hedef:** `1` = Oyuncu bilişsel aşırı yük, yüksek tereddüt veya kötü sona (`SON_B_KOTU`) sürüklenme riskindedir; **Uyarlamalı Kriz Müdahalesi** tetiklenir (süre baskısı esnetilir, proaktif Sokratik rehber ve etki önizlemesi açılır). `0` = Oyuncu otonom akıştadır; müdahale edilmez. |
| **11** | `kaynak` | Veri Kökeni | `string` | Etiket | `gercek` \| `sentetik` | Satırın gerçek kullanıcı oturumundan mı (`gercek`) yoksa belgelenmiş kural + gürültü üreticisinden mi (`sentetik`) geldiğini belirtir. |

---

## 2. Veri Kaynakları ve Dağılım Özeti

1. **Gerçek Oturumlar (`kaynak = gercek`):**
   - Farklı deneyim seviyelerine sahip **6 gerçek kullanıcıya (arkadaşımıza)** 3'er oturum olmak üzere toplam **18 gerçek oturum (54 karar satırı)** oynatılarak toplanmıştır.
   - Uygulama içerisindeki **Telemetri & Veri Toplama Modu** her karar adımında süreyi (`performance.now()`), seçenekler arası geçiş sayısını (`onMouseEnter` / `onFocus`), log inceleme oranını ve önceki kararları otomatik olarak CSV formatında dışa aktarır.
2. **Sentetik Oturumlar (`kaynak = sentetik`):**
   - Eğitim kararlılığını ve sınır durum (*edge-case*) kapsamasını artırmak amacıyla, sabit tohum (`SEED = 13`) kullanan deterministik üretici ile **42 sentetik oturum (126 karar satırı)** eklenmiştir.
   - Toplam veri kümesi **60 oturum (180 karar satırı)** içerir.
   - Sentetik üretim formülü ve gürültü parametreleri `README.md` ve `train.py` içerisinde açıkça belgelenmiştir.

---

## 3. KVKK ve Etik Veri Yönetimi İlkeleri

- **Veri Minimizasyonu (6698 Sayılı Kanun Madde 4):** Yalnızca oyun içi pedagojik uyarlama için zorunlu olan davranışsal etkileşim süreleri ve sayaçlar tutulur.
- **Kişisel Veri İçermeme:** `oturum` sütunu rastgele üretilen 16-bitlik bir tanımlayıcıdır; gerçek kişilerle ilişkilendirilebilecek hiçbir dolaylı veya doğrudan tanımlayıcı (*PII*) barındırmaz.
