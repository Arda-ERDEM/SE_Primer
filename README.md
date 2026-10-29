# SE Primer · Klinik Nöbet Konsolu (`YZM301 · 1. Hafta Ödevi`)

> **Kişiye uyum sağlayan kitap, bu kez yazılım mühendisi için:** Saat `08:00`’de poliklinik kapısında **300 hastanın** beklediği bir hastane randevu sistemi çöküşünde nöbetçi mühendis karar verir; uygulama o kararın **teknik sonucunu (Ne Oldu / Neden Oldu)** gösterir ve **Sokratik AI Tutor** cevabı ele vermeden ödünleşim (*trade-off*) soruları yöneltir.

---

## 🔗 Teslim Linkleri (Tek Repo · Üç Link · 100 Puan)

| Teslim Kalemi | Bağlantı (Link) | Durum |
| :--- | :--- | :---: |
| **1. GitHub Kaynak Kod Deposu** | [https://github.com/Arda-ERDEM/SE_Primer](https://github.com/Arda-ERDEM/SE_Primer) | ✅ Hazır |
| **2. Google AI Studio / Canlı Mobil Uygulama** | `[AI Studio Uygulama Linkinizi Buraya Ekleyin]` | ✅ Mobil Uyumlu (`390x844`) |
| **3. Cypress E2E 60 sn Demo Videosu** | `[Demo Video Linkinizi Buraya Ekleyin]` *(Yerel kayıt: `cypress/videos/se-primer-e2e.cy.ts.mp4`)* | ✅ Tüm Yollar E2E Testli |

---

## 🎯 Ürün Kararı: Yapmadığım 3 Özellik ve Tek Cümle Nedenleri (10 Puan)

1. **Kullanıcı Hesabı ve Bulut Oturum Girişi (Authentication):** Telefonda linke tıklayan oyuncunun kriz atmosferine sıfır sürtünmeyle (*zero-friction*) ilk 5 saniyede girmesini sağlamak ve odak noktasını kimlik doğrulama altyapısı yerine karar-sonuç muhakemesinde tutmak için kullanıcı girişi bilerek yapılmadı.
2. **İkinci Bölüm ve Çoklu Hastane Senaryoları:** Çok sayıda yüzeysel senaryo üretmek yerine, tek bir saat `08:00` randevu krizi üzerinde `Seviye × Rol × Hedef` (18 farklı anlatı permütasyonu) ve derin Sokratik nedensellik analizi sunmak pedagojik açıdan çok daha yüksek değer ürettiği için ikinci bölüm kapsam dışı bırakıldı.
3. **Çok Oyunculu (Multiplayer) Canlı Skor Tablosu ve Rekabet Liderliği:** Mühendislik etiği ve 6698 sayılı KVKK kararlarını "puan kasma yarışına" dönüştürmek, Sokratik AI Tutor ile kurulan içsel ödünleşim (*trade-off*) muhakemesini zayıflatacağı için rekabetçi skor tablosu eklenmedi.

---

## 📊 Puanlama Rubriği ve Kanıt Haritası (100 Puan)

| Rubrik Kalemi | Puan | Repodaki Kanıt Dosyası | Özet İçerik |
| :--- | :-: | :--- | :--- |
| **1. `spec.md`** | **20** | [`spec.md`](./spec.md) | Problem tanımı, kapsam içi/dışı, **5 BDD kabul örneği** (5. örnek arkadaş testindeki görünmez varsayım) ve Sommerville Bölüm 5 **Durum Makinesi & Akış Şeması**. |
| **2. Tasarım** | **15** | [`DESIGN.md`](./DESIGN.md) & [`stitch-screens/`](./stitch-screens/) | Google Stitch promptları, tasarım sistemi tokenları ve **3 mobil ekran** (`01-giris-ekrani.png`, `02-kriz-sahnesi.png`, `03-sonuc-raporu.png`). |
| **3. Çalışan Uygulama** | **20** | [`src/App.tsx`](./src/App.tsx), [`src/engine/stateMachine.ts`](./src/engine/stateMachine.ts) | Telefonda baştan sona oynanan, girişte 3 soruyla (`Seviye`, `Rol`, `Hedef`) kişiselleşen, her seçimden sonra *Ne Oldu / Neden Oldu* gösteren uygulama. |
| **4. Tutor Eval** | **25** | [`EVAL.md`](./EVAL.md) & [`eval/tutor_eval_20.json`](./eval/tutor_eval_20.json) | **20 öğrenci cevabı**, elle etiketleme (*Cevabı ele verdi mi?*), **hata türleri taksonomisi**, **oran ve örnek sayıları** (`%85` ham Sokratik uyum, `Spoiler Guard v2` ile `%100`). |
| **5. Cypress Demo** | **10** | [`cypress/e2e/se-primer-e2e.cy.ts`](./cypress/e2e/se-primer-e2e.cy.ts) | Tüm karar yollarını (`SON A · İYİ`, `SON B · KÖTÜ`, Acemi ipucu modu, Deneyimli 60sn sayacı, Tutor testi) doğrulayan E2E test koşusu ve 60 sn video. |
| **6. Ürün Kararı** | **10** | [`README.md` (Bu Bölüm)](#-ürün-kararı-yapmadığım-3-özellik-ve-tek-cümle-nedenleri-10-puan) | Yapılmayan 3 özellik ve her biri için tek cümlelik mühendislik ödünleşimi gerekçesi. |

---

## 📱 Üç Mobil Ekran Önizlemesi (`stitch-screens/`)

| 1. Giriş & 3 Kalibrasyon Sorusu | 2. Kriz Sahnesi & Sokratik Tutor | 3. Sonuç Raporu (SON A / SON B) |
| :---: | :---: | :---: |
| ![Giriş Ekranı](./stitch-screens/01-giris-ekrani.png) | ![Kriz Sahnesi](./stitch-screens/02-kriz-sahnesi.png) | ![Sonuç Raporu](./stitch-screens/03-sonuc-raporu.png) |

---

## 🚀 Kurulum, Çalıştırma ve Doğrulama Komutları

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. (İsteğe Bağlı) Gemini API anahtarınızı .env dosyasına ekleyin
# Anahtar girilmese dahi yerleşik Deterministik Sokratik Muhakeme Motoru ve Spoiler Guard kesintisiz çalışır.
cp .env.example .env

# 3. Mobil web uygulamasını başlatın (http://localhost:3000)
npm run dev

# 4. 25 Puanlık Sokratik Tutor Değerlendirmesini (20 Öğrenci Cevabı) terminalde doğrulayın
npm run eval:tutor

# 5. Cypress E2E testlerini koşun ve 60 sn demo videosu + ekran görüntülerini üretin
npm run cypress:run
```

---

## 📚 Kaynakça
1. Stephenson, N. (1995). *The Diamond Age: Or, A Young Lady’s Illustrated Primer*. Bantam Spectra.
2. Y Combinator (2026). *Requests for Startups, Güz 2026: "The Primer"* (A. Miklas).
3. GitHub (2025). *Spec Kit: Spec-Driven Development*. `github.com/github/spec-kit`
4. Google Labs. *Google Stitch (`stitch.withgoogle.com`) & Google AI Studio (`aistudio.google.com`)*.
5. Cypress Documentation. *End-to-End Testing, Screenshots and Videos*. `docs.cypress.io`
6. OpenAI (2025). *Introducing Study Mode (Socratic Tutor Behavior)*.
7. Ng, A. (2026). *The AI Engineering Skills Map*. DeepLearning.AI.
8. *6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK)* (2016). Resmî Gazete.
9. Sommerville, I. (2016). *Software Engineering (10th Ed.), Chapter 5: System Modeling (State Machines)*. Pearson.
