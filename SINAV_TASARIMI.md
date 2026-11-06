# Düşünce Egzersizi: "Sizinle Uyumlanan Sınav Tasarımı" (`SINAV_TASARIMI.md`)

> **Ders:** YZM301 · Yazılım Gerçekleme ve Test — Vize Hazırlık Düşünce Egzersizi (1 Sayfa Sınırı)  
> **Temel Kavramlar:** Doğrulama vs. Geçerleme (*Verification vs. Validation — Sommerville Bl. 8*), Test Kahini (*Test Oracle*), Diferansiyel Test (*Differential Testing*), Karakterizasyon Testi (*Characterization Test*), Regresyon Testi, Kayan Nokta Hata Toleransı ($\epsilon = 10^{-4}$).

---

## 1. Nasıl Tasarlardım? — "Dallanan Kriz Kağıdı" (Ezberi Değil Muhakemeyi Ölçen Uyarlamalı Klasik Sınav)

Geleneksel klasik sınavlar *"Diferansiyel test nedir? Tanımlayınız"* diye sorar ve tanımı ezberleyen öğrenciye tam puan verir. Oysa `The Primer` nasıl oyuncunun davranışına uyum sağlıyorsa, kapalı kitap bir klasik yazılım mühendisliği sınavı da **öğrencinin kendi kurduğu mimari karara uyum sağlamalıdır**:
- Sınav kağıdı tek bir gerçek üretim krizini anlatır ve **Aşama 1**'de öğrenciye kendi dağıtım/test stratejisini seçtirir (*"İstemci İçi ONNX mi, Sunucu Arkası API mi?"*).
- **Aşama 2 ve Aşama 3'teki sorular öğrencinin Aşama 1'deki seçimine göre çatallanır:** Hangi yolu seçerse seçsin "bedava doğru cevap" yoktur; öğrenci kendi seçtiği mimarinin doğurduğu **ödünleşimi (trade-off)**, test kahinini ve hata toleransını savunmak zorundadır.

---

## 2. Özgün 1 Sayfalık Klasik Vize Sınav Sorusu

### 📄 SORU: "Gece 03:00 — Acil Servis Triyaj Modeli Göçü ve Kaybolan Ondalıklar" (100 Puan)

Bir devlet hastanesinin acil servisinde 10 yıldır çalışan, kaynak kodu kısmen kayıp eski bir C++ triyaj kural motoru (`LegacyTriage.dll`) yerine, aynı girdi şemasıyla eğitilmiş `593 bayt` boyutunda yeni bir `triage_v2.onnx` modeli devreye alınacaktır. Gece nöbetindeki başmühendis sizsiniz.

1. **[Aşama 1 · Mevcut Davranışı Mühürlemek ve Kahin Seçimi — 25p]**  
   Yeni modeli devreye almadan önce, dökümantasyonu olmayan eski `LegacyTriage.dll` sisteminin mevcut davranışını korumak ve yeni `triage_v2.onnx` modelinin hem Python eğitim ortamında hem de hastanedeki tabletlerde (`onnxruntime-web`) aynı sonucu verdiğini kanıtlamak için elinizde **300 gerçek anonim hasta girdisi** var.  
   **(a)** Eski sistemin ne yaptığını belgelemek için yazacağınız test türü ile, Python ve tablet çıktısını bu 300 girdi üzerinde karşılaştıran test türünü adlandırıp **Test Kahini (Oracle)** rollerini ayırt ediniz.  
   **(b)** Tablet (`float32` WASM) çıktısı `0.677142`, Python (`float64`) çıktısı `0.677089` geldiğinde `assert(p_tablet == p_python)` yazan stajyerin testi kırılıyor. Bu testi neden `==` ile yazamayacağımızı ve **Hata Toleransı ($\epsilon = 10^{-4}$)** sınırını neye göre belirleyeceğimizi açıklayınız.

2. **[Aşama 2 · Sizinle Uyumlanan Mimari Karar (İki Yoldan BİRİNİ Seçip Yanıtlayın) — 35p]**  
   - **YOL A (Modeli Tablete Göm / Tarayıcıda Çalıştır):** İnternet kesildiğinde acil servis durmaz ve hasta verisi tabletten çıkmaz (KVKK). *Peki saldırgan tabletten `triage_v2.onnx` dosyasını çalarsa veya modelde acil bir ağırlık hatası çıkarsa **Sürüm Sabitleme (Version Pinning)** ve **Geri Alma (Rollback)** krizini nasıl yönetirsiniz?*  
   - **YOL B (Modeli Hastane Sunucusunda Tut / İnce İstemci):** Model gizli kalır ve tek komutla geri alınır. *Peki hastane Wi-Fi ağı çöktüğünde acil triyajın durmaması ve dışarıdan 10.000 sorgu atan birinin **Model Çıkarma (REA)** yapmaması için hangi mimari ödünleşimi kurarsınız?*

3. **[Aşama 3 · Doğrulama (Verification) Geçti Ama Geçerleme (Validation) Çöktü! — 40p]**  
   300 girdilik parite testiniz `%100` geçti ($|\Delta p| < 10^{-4}$), önceki sürümün 20 uçtan uca (**Regresyon**) testi de yeşil yandı. Modeli doğrudan tüm hastaneye açmak yerine önce **Gölge Dağıtım (Shadow)** ve `%5` **Kanarya (Canary)** ile açtınız. Sabah fark ettiniz ki: Model teknik olarak kusursuz çalışıyor ama doktorlar modelin verdiği uyarıları ekranın ortasında açıldığı için kapatıp hiç okumuyor!  
   Sommerville'in **Doğrulama (Verification)** ve **Geçerleme (Validation)** ayrımını kullanarak; *"Tüm testleri geçen bir model neden üretimde başarısız oldu?"* sorusunu yanıtlayınız.

---

## 3. Beklenen Temel Kavramlar ve Çeldiriciler (Değerlendirme Anahtarı)

| Alt Soru | Beklenen Öz Kavram (Tam Puan Gerekçesi) | Klasik Çeldirici / Kavram Yanılgısı (Puan Kırma Nedeni) |
| :--- | :--- | :--- |
| **1(a) Kahin & Test Türleri** | Eski dökümantasyonsuz sistemi kaydetmek **Karakterizasyon Testidir** (mevcut çıktı kahin olur). Aynı `model.onnx`'i Python ve tablette 300 girdide kıyaslamak **Diferansiyel Testtir (Parite Testi)**; burada Python referans ortamı **Test Kahini (Oracle)** rolündedir. | Her iki teste de genel olarak "birim testi" veya "regresyon testi" deyip **Test Kahini (Oracle)** kaynağının nereden geldiğini açıklayamamak. |
| **1(b) Hata Toleransı ($\epsilon$)** | IEEE 754 `float64` (Python/C) ile `float32` (WASM/mobil) matris çarpımı yuvarlama farkları nedeniyle bit-birebir eşitlik (`==`) beklenemez; karar eşiğini ($\tau = 0.50$) değiştirmeyecek $|\Delta p| < 10^{-4}$ toleransı tanımlanmalıdır. | Toleransı `0.10` gibi aşırı geniş seçip sınır yakınındaki ($p=0.49 \leftrightarrow 0.55$) sınıf kararlarının değişmesine göz yummak veya `==` kullanmakta ısrar etmek. |
| **2. Mimari Ödünleşim & Rollout** | Seçtiği yolun zayıf karnını kabul etmek (Gecikme vs. KVKK vs. Model Gizliliği) ve `resolve/main` yerine commit SHA sabitlemesi ile **Shadow → Canary → Rollback** zincirini kurmak. | *"Hem internet hiç gerekmez, hem model %100 gizli kalır, hem de cihazda çalışır"* diyerek fiziksel/mimari ödünleşimi (*trade-off*) reddetmek. |
| **3. Verification vs. Validation** | **Doğrulama (*Verification — "Are we building the product right?"*):** 300 parite testi ve regresyon testlerinin geçmesi modelin spesifikasyona uygun kodlandığını kanıtlar. **Geçerleme (*Validation — "Are we building the right product?"*):** Doktorların gerçek iş akışında uyarıyı kapatması, ürünün gerçek kullanıcı ihtiyacını karşılamadığını gösterir. | Doğrulama ile geçerlemeyi birbirine karıştırmak veya *"Eğitim doğruluğu (%95) yüksekse geçerleme de tamamlanmıştır"* yanılgısına düşmek. |
