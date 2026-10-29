# SE Primer — Tasarım Sistemi ve Mobil Ekran Spesifikasyonu (`DESIGN.md`)

## 1. Mimari ve Görsel Tasarım Yaklaşımı

`HBYS.Primer.Web`, kamu ve özel hastanelerde kullanılan **Kurumsal Hastane Bilgi Yönetim Sistemi (HBYS) / Klasik Blazor Server & Bootstrap 4/5** arayüz standartlarını temel alır. Yapay zekâ şablonlarında sıkça görülen aşırı yuvarlatılmış neon kartlar ve koyu cam efektleri yerine; yüksek okunabilirlik sunan açık gri çalışma yüzeyi (`#f4f6f9`), keskin hatlı kurumsal paneller (`border-radius: 3px`), tablo tabanlı telemetri ızgaraları ve klasik Blazor üst gezinme çubuğu (`#052767` → `#3a0647`) tercih edilmiştir.

### 1.1. Renk Sistemi (Kurumsal Blazor / Bootstrap Tokenları)
| Token Adı | Hex Kodu | Kullanım Amacı |
| :--- | :--- | :--- |
| `blazor-header-start` | `#052767` | Üst gezinme çubuğu başlangıç rengi (Klasik .NET Blazor laciverti) |
| `blazor-header-end` | `#3a0647` | Üst gezinme çubuğu bitiş rengi (Klasik Blazor moru) |
| `canvas-bg` | `#f4f6f9` | Ana sayfa çalışma yüzeyi arka planı |
| `card-surface` | `#ffffff` | Form, karar ve rapor panelleri arka planı (`1px solid #ced4da`) |
| `card-header-bg` | `#f8f9fa` | Panel başlık şeridi arka planı |
| `primary-action` | `#1b6ec2` | Birincil aksiyon butonları, seçili radyo satırları ve odak kenarlıkları |
| `status-success` | `#198754` | `SON A · İYİ`, sağlıklı servis durumu, uyumlu KVKK denetimi (`#d1e7dd` zemin) |
| `status-warning` | `#ffc107` | Sokratik AI Tutor sorgu kutuları ve başlangıç rehberi (`#fff3cd` zemin) |
| `status-danger` | `#dc3545` | `SON B · KÖTÜ`, 300 hasta kuyruk alarmı, 60sn süre aşımı (`#f8d7da` zemin) |

### 1.2. Tipografi ve Mobil Ergonomi (`390 × 844 px`)
- **Arayüz Font Ailesi:** `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif` — Kurumsal masaüstü ve mobil web portallarında standart sistem tipografisi.
- **Günlük (Event Log) ve Komut Fontu:** `Consolas, "Courier New", monospace` — Sunucu logları, kabuk komutları ve zaman sayaçları için sabit genişlikli yazı tipi.
- **Form ve Tablo Düzeni:** Mobil ekranda (`390px` genişlik) yatay kaydırma gerektirmeyen sıkılaştırılmış `table-bordered` hücre yapısı ve tam genişlikli radyo seçim satırları.

---

## 2. Üç Mobil Ekran Spesifikasyonu (`stitch-screens/`)

### Ekran 1: Oturum Kalibrasyonu — Giriş Ekranı (`01-giris-ekrani.png`)
![Ekran 1 - Giriş ve Kalibrasyon](./stitch-screens/01-giris-ekrani.png)

- **İşlev:** Saat `08:00` arıza kaydını (`OLAY KAYDI #2026-0800`) bildirir ve anlatıyı uyarlayacak 3 zorunlu oturum parametresini (`Deneyim Seviyesi`, `Nöbetçi Mühendis Rolü`, `Birincil Kriz Hedefi`) standart radyo listesi panelleriyle alır.

### Ekran 2: Kriz Müdahale Sahnesi ve Sokratik AI Tutor (`02-kriz-sahnesi.png`)
![Ekran 2 - Kriz Sahnesi ve Sokratik Tutor](./stitch-screens/02-kriz-sahnesi.png)

- **İşlev:** Üst bölümde `Sistem Saati`, `Bekleyen Kuyruk (300 Hasta)` ve `KVKK Denetimi` tablosunu gösterir. `Deneyimliyim` modunda 60 saniyelik geri sayım sayacını çalıştırır; `Yeni Başladım` modunda sarı uyarı kutusu içinde başlangıç rehberini açar. Alt bölümde A/B mühendislik komutlarını, seçim sonrası **"Ne Oldu / Neden Oldu"** kök neden analizini ve cevabı vermeden soru soran **Sokratik AI Tutor** grup kutusunu barındırır.

### Ekran 3: Nöbet Sonuç Raporu — SON A ve SON B (`03-sonuc-raporu.png`)
![Ekran 3 - Sonuç Raporu](./stitch-screens/03-sonuc-raporu.png)

- **İşlev:** Simülasyon sonunda ulaşılan nihai durumu (`SON A · İYİ: 08:25 sistem ayakta, veri güvende` veya `SON B · KÖTÜ: Sistem ayakta ama KVKK ihlali`) kurumsal denetim tablosu ve 3 adımlık (`Karar 1 → Karar 2 → Karar 3`) kök neden dökümüyle raporlar.
