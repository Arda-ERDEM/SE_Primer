# HBYS.Web

**HBYS.Web**, kritik sağlık bilişimi altyapılarında görev yapan yazılım mühendislerinin kriz anındaki **ödünleşim (trade-off)** ve **nedensellik (causality)** muhakemesini simüle etmek üzere geliştirilmiş, deterministik sonlu durum makinesi (FSM) tabanlı bir karar destek ve Sokratik sorgulama sistemidir.

Mimari kurgu, Neal Stephenson’ın *The Diamond Age* eserindeki okuyucunun bağlamına uyum sağlayan etkileşimli rehber (*Primer*) kavramını, Ian Sommerville’in *Software Engineering (Bölüm 5: Durum Makineleri)* prensipleri ve 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) teknik tedbir standartlarıyla birleştirir.

---

## 1. Sistem Mimarisi ve Deterministik Durum Makinesi

Uygulama çekirdeği (`src/engine/stateMachine.ts`), kullanıcı arayüzü bileşenlerinden tamamen ayrıştırılmış deterministik bir durum makinesi $M = (S, \Sigma, \delta, s_0, F)$ olarak modellenmiştir:

- **Durum Kümesi ($S$):**
  - `S0_CALIBRATION`: Operatör parametrelerinin (`level`, `role`, `goal`) alındığı başlangıç durumu.
  - `S1_IN_PROGRESS`: Üç ardışık kriz aşamasının (`STAGE_1_ARCH`, `STAGE_2_TEST`, `STAGE_3_KVKK`) ve her seçim sonrası zorunlu kök neden inceleme alt-durumunun (`activeCausalReview`) işletildiği durum.
  - `S2_EPILOGUE`: Nihai sistem ve mevzuat denetim raporunun üretildiği uç durum kümesi ($F = \{\text{SON\_A\_IYI}, \text{SON\_B\_KOTU}\}$).
- **Girdi Alfabesi ($\Sigma$):**
  - Kalibrasyon vektörü $P = (\text{ExperienceTier}, \text{EngineeringRole}, \text{PrimaryGoal})$.
  - Karar operatörleri $C \in \{A, B\}$ ve zaman aşımı kesmesi $T_{\text{timeout}} \in \{\text{true}, \text{false}\}$.
- **Geçiş Fonksiyonu ($\delta$):**
  - Bir aşamada karar verildiğinde durum makinesi doğrudan bir sonraki aşamaya atlamaz; önce `activeCausalReview` alt-durumuna geçerek seçimin sistem telemetrisinde **ne sonuç doğurduğunu (What Happened)** ve **neden bu sonucun oluştuğunu (Why It Happened)** hesaplar. Yalnızca operatörün onayıyla bir sonraki karar aşamasına ilerlenir.

```
[S0_CALIBRATION]
       │ (Seviye × Rol × Hedef Kalibrasyonu)
       ▼
[STAGE_1_ARCH: Mimari Müdahale] ──(Seçim A/B veya 60sn Aşımı)──► [Kök Neden Analizi 1]
                                                                          │
       ┌──────────────────────────────────────────────────────────────────┘
       ▼
[STAGE_2_TEST: Doğrulama Kapısı] ──(Seçim A/B veya 60sn Aşımı)──► [Kök Neden Analizi 2]
                                                                          │
       ┌──────────────────────────────────────────────────────────────────┘
       ▼
[STAGE_3_KVKK: Veri Mahremiyeti] ──(Seçim A/B veya 60sn Aşımı)──► [Kök Neden Analizi 3]
                                                                          │
       ┌──────────────────────────────────────────────────────────────────┴──────────────────────┐
       ▼ (Karar 3 == A && Test == A)                                                             ▼ (Karar 3 == B || Test == B)
[SON A · İYİ: 08:25 Sistem Ayakta, Veri Güvende]                         [SON B · KÖTÜ: Sistem Ayakta Ama KVKK İhlali / Hasar]
```

---

## 2. Kişiselleştirme ve Anlatı Uyarlama Matrisi

Giriş ekranında alınan 3 kalibrasyon sorusu, statik bir etiket değişimi yapmak yerine `src/domain/incidentMatrix.ts` içerisindeki $2 \times 3 \times 3 = 18$ farklı anlatı ve kısıt kombinasyonunu dinamik olarak yapılandırır:

1. **Operatör Deneyim Seviyesi (`ExperienceTier`):**
   - `Yeni Başladım (novice)`: Her karar sahnesinde kavramsal çerçeveyi açıklayan başlangıç rehberi açık olarak sunulur; süre kısıtlaması uygulanmaz.
   - `Deneyimliyim (veteran)`: Hazır başlangıç rehberi gizlenir ve her karar sahnesinde **60 saniyelik geri sayım sayacı** başlatılır. Süre dolduğunda karar verilmemişse sistem panik/varsayılan riskli geçişi (`timedOut = true`) tetikler ve süre aşımının teknik maliyetini raporlar.
2. **Nöbetçi Mühendis Rolü (`EngineeringRole`):**
   - `Sistem Mimarisi (arch)`: Veritabanı şema evrimi (`nullable` sütun uyumu), ORM sorgu kilitleri ve yabancı anahtar (*foreign key*) kısıtlarına odaklanan olay açıklamaları ve analizler üretir.
   - `Güvenirlik Mühendisi (sre)`: Konteyner sağlığı (`OOMKilled`), MTTR süresi, dağıtım boru hattı (`CI/CD`) ve `REDIS_SSL_VERIFY` yapılandırma bayraklarına odaklanan telemetri üretir.
   - `Veri Güvenliği ve Uyum (secops)`: Yetkilendirme katmanı, denetim izi (*audit log*) ve 6698 sayılı KVKK Madde 6 / Madde 12 yükümlülüklerine odaklanan teknik analizler üretir.
3. **Birincil Kriz Hedefi (`PrimaryGoal`):**
   - `Kesintisiz Hizmet (uptime)`, `Veri Bütünlüğü (integrity)` ve `Regülasyon & KVKK Uyumu (compliance)` seçimine göre her sahnenin risk vurgusu ve Sokratik Tutor’un referans aldığı ödünleşim ekseni güncellenir.

---

## 3. Klinik Kriz Senaryosu ve Nedensellik Kuralları

Simülasyon, saat `08:00`’de poliklinik girişlerinde **300 hastanın** kayıt beklediği merkezi hastane randevu servisi (`HBYS-CORE v2.4.0`) çöküşünü konu alır:

| Aşama | Seçenek A (Mühendislik Disiplini) | Seçenek B (Kestirme / Riskli Müdahale) | Teknik Nedensellik Özeti |
| :--- | :--- | :--- | :--- |
| **Karar 1 · Mimari** | `Eski sürüme geri dön` (`v2.3.4` Rollback) | `Canlıda yama yap` (`v2.4.0` Production Hotfix) | Gece eklenen `triage_note` sütunu boş geçilebilir (`NULL`) olduğundan `v2.3.4` sürümüne geri dönmek geriye dönük uyumluluğu bozmadan bağlantı havuzunu rahatlatır. Canlıda derlemesiz yama ise ORM önbelleğinde yarış durumu (*race condition*) yaratır. |
| **Karar 2 · Test** | `Önce kısa test koş` (60 sn Smoke Test) | `Hemen yayına al` (`--force-no-verify`) | 60 saniyelik duman testi, hazırlanan paketteki `REDIS_SSL_VERIFY` ortam değişkeni uyuşmazlığını canlıya çıkmadan yakalar. Testin atlanması ise canlı ortamda 12 dakikalık ek kilitlenmeye yol açar. |
| **Karar 3 · KVKK** | `Maskele` (`SHA-256` Pseudonymization) | `Ekibe olduğu gibi at` (Ham Log Paylaşımı) | Hata dökümündeki hasta adı, T.C. kimlik numarası ve ICD-10 tanı kodlarının `SHA-256` ile tekil özet (`patient_hash_8f9a`) hâline getirilmesi hem hatanın izlenmesini sağlar hem de özel nitelikli sağlık verisini korur. Ham log paylaşımı ise doğrudan 6698 sayılı KVKK Madde 12 ihlali doğurur. |

---

## 4. Sokratik AI Tutor ve `Spoiler Guard v2` Mimarisi

Standart büyük dil modelleri, kullanıcı doğrudan cevap istediğinde veya aciliyet belirttiğinde doğru şıkkı söyleme eğilimindedir. `src/services/socraticMentor.ts` modülü bunu önlemek için iki katmanlı bir mimari uygular:

1. **Sokratik Sistem İstemi ve Bağlamsal Bilgi Bankası:** Hem Google Gemini (`gemini-2.5-flash`) entegrasyonunda hem de çevrimdışı/deterministik Sokratik motorda, doğrudan şık dikte edilmesi yasaklanmış; yalnızca ödünleşim (*trade-off*) sorgulatan karşı-soru üretimi tanımlanmıştır.
2. **Çıktı Denetleyici (`inspectAndSanitizeTutorReply`):** Üretilen her yanıt kullanıcıya gösterilmeden önce düzenli ifade (regex) ve yapısal denetimden geçirilir:
   - Yanıt içerisinde `"A şıkkı"`, `"B şıkkı"`, `"A'yı seç"`, `"eski sürüme geri dönmelisin"` gibi doğrudan yönlendirici ifadeler taranır (`ERR_DIRECT_SPOILER` ve `ERR_IMPLICIT_LEADING` koruması).
   - Yanıtın bir Sokratik soru cümlesiyle (`?`) bitip bitmediği kontrol edilir (`ERR_NO_QUESTION` koruması).
   - İhlal tespit edildiği anda yanıt bloke edilerek ilgili aşamanın güvenli Sokratik karşı-sorusuna dönüştürülür.

### Değerlendirme (Evaluation) Bulguları (`N = 20`)
`eval/tutor_eval_20.json` ve `EVAL.md` dosyalarında belgelenen 20 farklı öğrenci girdisi (doğrudan kopya isteme, *prompt injection*, yanlış mühendislik varsayımı, 60sn süre baskısı paniği, kavram sorgulama) üzerindeki elle etiketleme sonuçları:
- **`PASS_SOCRATIC`:** 17 örnek (`%85.0`) — Cevabı ele vermeden Sokratik karşı-soru üretti.
- **`ERR_DIRECT_SPOILER`:** 1 örnek (`%5.0`) — Ham modelde aşırı zaman baskısı ifadesinde şık sızıntısı (`Spoiler Guard v2` ile engellendi).
- **`ERR_IMPLICIT_LEADING`:** 1 örnek (`%5.0`) — Ham modelde doğru tahmini aşırı onaylayarak şık dikte etme (`Spoiler Guard v2` ile engellendi).
- **`ERR_NO_QUESTION`:** 1 örnek (`%5.0`) — Cevabı ele vermeden salt tanım yapıp soru sormama (`Spoiler Guard v2` ile soru zorunluluğu eklendi).

---

## 5. Ürün Kararı: Kapsam Dışı Bırakılan 3 Özellik ve Nedenleri

1. **Kullanıcı Hesabı ve Oturum Girişi (Authentication):** Operatörün simülasyonu açtığı ilk saniyede kriz ortamına sıfır sürtünmeyle (*zero-friction*) girmesini sağlamak ve mühendislik odağını kimlik doğrulama altyapısı yerine karar-sonuç muhakemesinde tutmak için kullanıcı girişi bilerek yapılmadı.
2. **İkinci Bölüm ve Çoklu Hastane Senaryoları:** Yüzeysel çoklu senaryolar üretmek yerine, tek bir kritik randevu sistemi çöküşü üzerinde 18 farklı anlatı permütasyonu (`Seviye × Rol × Hedef`) ve derin kök neden analizi sunmak pedagojik açıdan daha yüksek değer ürettiği için ikinci bölüm kapsam dışı bırakıldı.
3. **Çok Oyunculu (Multiplayer) Rekabetçi Skor Tablosu:** Mühendislik etiği ve 6698 sayılı KVKK kararlarını hız odaklı bir puan yarışına dönüştürmek, Sokratik AI Tutor ile kurulan içsel ödünleşim muhakemesini zayıflatacağı için rekabetçi liderlik tablosu eklenmedi.

---

## 6. Dizin Yapısı ve Doğrulama Komutları

```text
├── spec.md                              # Problem, kapsam dışı, 5 BDD kabul örneği ve FSM şeması
├── DESIGN.md                            # Kurumsal Blazor/HBYS tasarım sistemi ve 3 mobil ekran
├── EVAL.md                              # 20 öğrenci cevabı, elle etiketleme ve hata türleri raporu
├── eval/
│   ├── tutor_eval_20.json               # Yapılandırılmış 20'lik değerlendirme veri seti
│   └── run_tutor_eval.mjs               # Otomatik Spoiler Guard ve metrik doğrulama betiği
├── stitch-screens/                      # 3 mobil ekran görüntüsü (Giriş, Kriz Sahnesi, Sonuç)
├── cypress/
│   ├── e2e/se-primer-e2e.cy.ts          # Tüm karar yollarını doğrulayan uçtan uca (E2E) testler
│   └── videos/se-primer-e2e.cy.ts.mp4   # Otomatik kaydedilen E2E test koşusu videosu
└── src/
    ├── engine/stateMachine.ts           # Sommerville Bölüm 5 sonlu durum makinesi çekirdeği
    ├── domain/incidentMatrix.ts         # Seviye × Rol × Hedef anlatı ve telemetri matrisi
    ├── services/socraticMentor.ts       # Sokratik AI Tutor ve Spoiler Guard v2 denetleyicisi
    └── components/                      # Kurumsal Blazor/Bootstrap arayüz bileşenleri
```

### Çalıştırma ve Test
```bash
# Bağımlılıkların kurulumu
npm install

# Geliştirme sunucusunu başlatma (http://localhost:3000)
npm run dev

# Üretim derlemesi ve tip kontrolü
npm run build

# 20'lik Sokratik Tutor değerlendirme setini doğrulama
npm run eval:tutor

# Tüm karar yollarını Cypress ile uçtan uca (E2E) test etme
npm run cypress:run
```
