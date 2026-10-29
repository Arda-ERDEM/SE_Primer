import {
  CalibrationProfile,
  ChoiceOptionKey,
  DecisionRecord,
  DecisionStageId,
  EngineeringRole,
  ExperienceTier,
  PrimaryGoal,
  TelemetrySnapshot,
} from '../engine/stateMachine';

export interface RoleMetadata {
  id: EngineeringRole;
  title: string;
  shortBadge: string;
  focusDescription: string;
}

export interface GoalMetadata {
  id: PrimaryGoal;
  title: string;
  shortBadge: string;
  focusDescription: string;
}

export interface LevelMetadata {
  id: ExperienceTier;
  title: string;
  badge: string;
  adaptationRule: string;
}

export const EXPERIENCE_LEVELS: LevelMetadata[] = [
  {
    id: 'novice',
    title: 'Yeni Başladım',
    badge: 'Açık Rehber Modu',
    adaptationRule: 'Her kararda otomatik Sokratik başlangıç ipucu görürsün; süre sınırı olmadan muhakeme yürütürsün.',
  },
  {
    id: 'veteran',
    title: 'Deneyimliyim',
    badge: '60sn Stres Baskısı',
    adaptationRule: 'Her kararda 60 saniyelik geri sayım sayacı çalışır; hazır ipucu gizlidir, yalnızca Tutor ile tartışarak ipucu açabilirsin.',
  },
];

export const ENGINEERING_ROLES: RoleMetadata[] = [
  {
    id: 'arch',
    title: 'Sistem Mimarisi (Backend)',
    shortBadge: 'Mimari & DB',
    focusDescription: 'Veritabanı şema evrimi, mikroservis bağımlılıkları ve işlem (transaction) tutarlılığı odaklı anlatı.',
  },
  {
    id: 'sre',
    title: 'Güvenirlik Mühendisi (SRE)',
    shortBadge: 'SRE & DevOps',
    focusDescription: 'MTTR (Ortalama Onarım Süresi), dağıtım boru hattı (CI/CD), konteyner sağlığı ve kuyruk gecikmesi odaklı anlatı.',
  },
  {
    id: 'secops',
    title: 'Veri Güvenliği & Uyum (SecOps)',
    shortBadge: 'Güvenlik & KVKK',
    focusDescription: 'Özel nitelikli sağlık verisi mahremiyeti, denetim izi (audit log) ve 6698 sayılı KVKK uyumu odaklı anlatı.',
  },
];

export const PRIMARY_GOALS: GoalMetadata[] = [
  {
    id: 'uptime',
    title: 'Kesintisiz Hizmet (Uptime)',
    shortBadge: 'Hız & Erişim',
    focusDescription: 'Kapıda bekleyen 300 hastanın kuyruğunu en hızlı ve kesintisiz şekilde eritmeye odaklanır.',
  },
  {
    id: 'integrity',
    title: 'Veri Bütünlüğü (Zero Loss)',
    shortBadge: 'Sıfır Kayıp',
    focusDescription: 'Randevu ve poliklinik kayıtlarında tek bir satır bile çakışma veya veri bozulması yaşanmamasına odaklanır.',
  },
  {
    id: 'compliance',
    title: 'Regülasyon & KVKK Uyumu',
    shortBadge: 'Tam Uyum',
    focusDescription: 'Kriz anında dahi hasta mahremiyetinden ve yasal sorumluluk sınırlarından taviz vermemeye odaklanır.',
  },
];

export interface StageOptionSpec {
  key: ChoiceOptionKey;
  shortTitle: string;
  subtitle: string;
  commandPreview: string;
}

export interface StageSpec {
  id: DecisionStageId;
  stepNumber: number;
  badge: string;
  headline: string;
  baseSituation: string;
  roleNarratives: Record<EngineeringRole, string>;
  goalStakes: Record<PrimaryGoal, string>;
  terminalLogLines: string[];
  noviceStarterHint: string;
  defaultSocraticQuestion: string;
  quickStudentPrompts: string[];
  options: [StageOptionSpec, StageOptionSpec];
}

export const INCIDENT_STAGES: Record<DecisionStageId, StageSpec> = {
  STAGE_1_ARCH: {
    id: 'STAGE_1_ARCH',
    stepNumber: 1,
    badge: 'KARAR 1 · MİMARİ',
    headline: '08:00, randevu sistemi çöktü. Nöbetçi sensin.',
    baseSituation:
      'Dün gece 02:30’da merkezi hastane randevu servisinin v2.4.0 sürümü canlıya alındı. Sabah 08:00 itibarıyla poliklinik girişlerinde 300 hasta kayıt bekliyor ancak sistem HTTP 502 ve veritabanı bağlantı kilidi (deadlock) dönüyor.',
    roleNarratives: {
      arch: 'Mimari perspektifinden: v2.4.0 sürümünde `appointments` tablosuna yeni bir indeks ve `triyaj_kodu` alanı eklendiğini, ancak ORM sorgularının kilitlendiğini görüyorsun.',
      sre: 'SRE perspektifinden: Kubernetes pod’ları her 40 saniyede bir `OOMKilled` ile yeniden başlıyor; CPU kullanımı %98 ve API geçidi zaman aşımına düşüyor.',
      secops: 'SecOps perspektifinden: Çöken servis, kimlik doğrulama jetonlarını (JWT) doğrulayamadığı için poliklinik ekranlarında açık oturum hataları üretiyor.',
    },
    goalStakes: {
      uptime: 'Hedefin Kesintisiz Hizmet: Her geçen dakika poliklinik koridorundaki 300 hastanın bekleme süresini katlıyor.',
      integrity: 'Hedefin Veri Bütünlüğü: Gece 02:30’dan beri yazılan 412 acil randevu kaydının şema uyumsuzluğuyla ezilme riski var.',
      compliance: 'Hedefin KVKK & Uyum: Onaysız ve denetimsiz bir müdahale, değişiklik yönetimi (change management) kayıtlarını geçersiz kılabilir.',
    },
    terminalLogLines: [
      '08:00:04 [CRIT] hbys-randevu-api (v2.4.0): ConnectionPoolExhaustedException (active=200/200)',
      '08:00:07 [WARN] db-migration-check: Schema version v2026_10_29 (nullable column added: triage_note)',
      '08:00:09 [ALRT] queue-monitor: Poliklinik kayıt kuyruğunda 300 hasta bekliyor (SLA Aşımı!)',
    ],
    noviceStarterHint:
      'Başlangıç İpucu (Yeni Başlayan): Kriz anında "bilinen sağlam sürüme dönmek" (Rollback) ile "çöken kodun üstüne canlıda yama yazmak" (Hotfix) arasında temel bir fark vardır. Önce veritabanı tablosunun eski sürümle uyumlu olup olmadığını sorgula.',
    defaultSocraticQuestion:
      'Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?',
    quickStudentPrompts: [
      'Saat 08:00, 300 hasta bekliyor! Direkt A şıkkını mı seçeyim B’yi mi?',
      'Canlıda yama yaparsam daha hızlı çözülmez mi?',
      'Eski sürüme dönersem gece alınan randevulara ne olur?',
    ],
    options: [
      {
        key: 'A',
        shortTitle: 'A) Eski sürüme geri dön',
        subtitle: 'Bilinen son kararlı paket olan v2.3.4 imajına geri sar (Rollback).',
        commandPreview: 'kubectl rollout undo deployment/hbys-randevu-api --to-revision=234',
      },
      {
        key: 'B',
        shortTitle: 'B) Canlıda yama yap',
        subtitle: 'Çalışan v2.4.0 sunucusu üzerinde sorgu kilidini elle yamamayı dene (Hotfix).',
        commandPreview: 'vim /srv/hbys-prod/AppointmentRepository.ts && pm2 reload all',
      },
    ],
  },

  STAGE_2_TEST: {
    id: 'STAGE_2_TEST',
    stepNumber: 2,
    badge: 'KARAR 2 · TEST',
    headline: 'Paket hazır, ancak koridorda uğultu büyüyor.',
    baseSituation:
      'İlk mimari müdahalenin ardından dağıtım paketi hazırlandı. Başhekimlik dahili hattan arayarak "Hastalar bankolara yükleniyor, 1 saniye bile beklemeyin hemen açın!" diyor. Önünde 60 saniyelik otomatik duman testi (smoke test) adımı var.',
    roleNarratives: {
      arch: 'Mimari perspektifinden: Hazırladığın paketin `patient_slots` tablosundaki yabancı anahtar (foreign key) kısıtlarıyla çakışıp çakışmadığı henüz doğrulanmadı.',
      sre: 'SRE perspektifinden: Dağıtım boru hattındaki `smoke-test-suite` aşaması sadece 60 saniye sürüyor ve Redis önbellek bağlantısını doğruluyor.',
      secops: 'SecOps perspektifinden: Hızlı geçiş sırasında yetkilendirme ara katmanının (auth middleware) devre dışı kalmadığından emin olunması gerekiyor.',
    },
    goalStakes: {
      uptime: 'Hedefin Kesintisiz Hizmet: 60 saniye test beklemek mi, yoksa hatalı paketle sistemi 25 dakika daha kilitlemek mi?',
      integrity: 'Hedefin Veri Bütünlüğü: Doğrulanmamış paket canlı veritabanına ilk yazma işlemini yaptığında bozuk kayıtlar üretebilir.',
      compliance: 'Hedefin KVKK & Uyum: Doğrulama testi atlanan sürümlerde erişim kontrol listesi (ACL) sızıntıları yaşanabilir.',
    },
    terminalLogLines: [
      '08:09:12 [INFO] ci-pipeline: Candidate artifact ready for production rollout.',
      '08:09:15 [WARN] env-validator: REDIS_SSL_VERIFY flag mismatch detected in staging template.',
      '08:09:18 [WAIT] gatekeeper: Run 60s Smoke Test [A] or Force Bypass to Production [B]?',
    ],
    noviceStarterHint:
      'Başlangıç İpucu (Yeni Başlayan): "Duman testi (Smoke Test)", sistemin tüm detaylarını değil, yalnızca temel hayati fonksiyonlarının (veritabanı bağlantısı, randevu oluşturma) çökmeden çalıştığını 60 saniyede kontrol eden emniyet sübabıdır.',
    defaultSocraticQuestion:
      '1 dakika kazanmak için testi atladığında, gözden kaçan tek bir yapılandırma hatasının 300 hastaya maliyeti ne olur?',
    quickStudentPrompts: [
      '60 saniye bile önemliyken neden kısa test koşalım ki?',
      'Kısa test (smoke test) tam olarak neyi kontrol eder?',
      'İpucu ver, burada doğru cevap A mı?',
    ],
    options: [
      {
        key: 'A',
        shortTitle: 'A) Önce kısa test koş',
        subtitle: '60 saniyelik otomatik duman testini (Smoke Test) çalıştırıp öyle yayına al.',
        commandPreview: 'npm run test:smoke -- --env=preprod && deploy --verified',
      },
      {
        key: 'B',
        shortTitle: 'B) Hemen yayına al',
        subtitle: 'Test aşamasını baypas et (`--force-no-verify`) ve paketi anında canlıya bas.',
        commandPreview: 'deploy --prod --force-no-verify --skip-smoke',
      },
    ],
  },

  STAGE_3_KVKK: {
    id: 'STAGE_3_KVKK',
    stepNumber: 3,
    badge: 'KARAR 3 · KVKK',
    headline: 'Son viraj: Hata logunda gerçek hasta adları ve tanı kodları var!',
    baseSituation:
      'Servis ayağa kalkmak üzereyken 3 poliklinik kaydında zaman aşımı hatası yakaladın. Yan ekipteki geliştiriciler hatayı incelemek için senden `error_dump_0817.log` dosyasını ortak mesajlaşma kanalına (Slack/Teams) atmanı istiyor. Logun içinde hastaların açık adı, T.C. kimlik numarası ve ICD-10 tanı kodları yer alıyor.',
    roleNarratives: {
      arch: 'Mimari perspektifinden: Hata ayıklama için aslında yalnızca `appointment_id` ve `request_trace_id` alanları yeterli; gerçek hasta kimliği teknik bir gereklilik değil.',
      sre: 'SRE perspektifinden: Merkezi loglama hattında PII maskeleme filtresi (`redact-pii.sh`) hazır bekliyor ve çalıştırılması yalnızca birkaç saniye sürüyor.',
      secops: 'SecOps perspektifinden: 6698 sayılı KVKK Madde 6 kapsamında tanı ve sağlık bilgileri "Özel Nitelikli Kişisel Veri"dir; şifresiz ortak kanala atılması doğrudan veri ihlalidir.',
    },
    goalStakes: {
      uptime: 'Hedefin Kesintisiz Hizmet: Logu maskelemek 20 saniye alır, ancak ham veriyi sızdırmak hastanenin tüm sistemlerinin denetim için kapatılmasına yol açabilir.',
      integrity: 'Hedefin Veri Bütünlüğü: Anonimleştirme (`SHA-256` hash) yapıldığında kayıt tekilliği korunur, hem hata çözülür hem mahremiyet bozulmaz.',
      compliance: 'Hedefin KVKK & Uyum: Bu karar doğrudan 6698 sayılı Kanun Madde 12 (Veri Güvenliği Yükümlülükleri) sınavındır.',
    },
    terminalLogLines: [
      '08:17:02 [DUMP] error_dump_0817.log (342 lines) -> Contains: tc_no, hasta_adi, icd10_tani_kodu',
      '08:17:05 [CHAT] #dev-acil-kanal: "Log dosyasını buraya sürükle bırak, hemen bakalım!"',
      '08:17:08 [SEC] kvkk-guard: Special Category Health Data (PII/PHI) detected in outbound buffer.',
    ],
    noviceStarterHint:
      'Başlangıç İpucu (Yeni Başlayan): Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca sağlık verileri en sıkı korunan verilerdir. Bir hatayı çözmek için hastanın gerçek ismine değil, maskelenmiş (anonim) işlem koduna ihtiyacın vardır.',
    defaultSocraticQuestion:
      'Hatayı yakalamak için hastanın gerçek adına mı ihtiyacın var, yoksa maskelenmiş tekil bir kimlik kodu (hash) aynı işi görür mü?',
    quickStudentPrompts: [
      'Logları sadece kendi ekip kanalımıza atıyoruz, yine de maskelemek gerekir mi?',
      'Hasta adını maskelersem hatayı nasıl bulacağım?',
      'Bana son karar için ufak bir kopya ver, iyi sona nasıl ulaşırım?',
    ],
    options: [
      {
        key: 'A',
        shortTitle: 'A) Maskele',
        subtitle: 'Hasta adı, T.C. ve tanı alanlarını anonimleştirip (`[MASKED_PII]`) öyle paylaş.',
        commandPreview: 'cat error_dump_0817.log | pii-scrubber --hash-id > safe_dump.log',
      },
      {
        key: 'B',
        shortTitle: 'B) Ekibe olduğu gibi at',
        subtitle: 'Zaman kaybetmemek için ham log dosyasını tüm hasta bilgileriyle ortak kanala yükle.',
        commandPreview: 'curl -F file=@error_dump_0817.log https://chat.internal/hooks/dev-general',
      },
    ],
  },
};

export function buildDecisionOutcome(
  stageId: DecisionStageId,
  chosenKey: ChoiceOptionKey,
  profile: CalibrationProfile,
  currentTelemetry: TelemetrySnapshot,
  timedOut: boolean = false
): DecisionRecord {
  const stage = INCIDENT_STAGES[stageId];
  const optionSpec = stage.options.find((o) => o.key === chosenKey)!;

  const rolePrefix: Record<EngineeringRole, string> = {
    arch: '[Mimari Analiz]',
    sre: '[SRE Telemetri Analizi]',
    secops: '[SecOps & Denetim Analizi]',
  };

  if (stageId === 'STAGE_1_ARCH') {
    if (chosenKey === 'A') {
      return {
        stageId,
        stageTitle: stage.badge,
        chosenKey: 'A',
        chosenLabel: optionSpec.shortTitle,
        timedOut,
        whatHappened:
          'Sistem 90 saniye içinde bilinen kararlı v2.3.4 imajına geri döndü. Veritabanı şemasında dün gece eklenen sütun `NULL` (boş geçilebilir) olduğu için geriye dönük uyumluluk bozulmadı ve bağlantı havuzu (connection pool) normale döndü.',
        whyItHappened:
          'Kriz anında kök nedeni tam bilinmeyen bir hatayı canlıda yamamaya çalışmak yerine, deterministik ve test edilmiş son kararlı sürüme (Rollback) dönmek belirsizliği ortadan kaldırdı ve MTTR süresini minimize etti.',
        roleSpecificInsight: `${rolePrefix[profile.role]} Geriye dönük uyumlu (expand-contract) şema tasarımı sayesinde v2.3.4 kodu yeni sütunu görmezden gelerek 412 gece kaydını sıfır kayıpla okumaya devam etti.`,
        telemetryDelta: {
          clockAfter: '08:09',
          waitingPatientsAfter: 180,
          stabilityScoreAfter: 72,
          kvkkBreached: false,
        },
      };
    } else {
      return {
        stageId,
        stageTitle: stage.badge,
        chosenKey: 'B',
        chosenLabel: optionSpec.shortTitle,
        timedOut,
        whatHappened: timedOut
          ? '60 saniyelik karar süresi dolduğu için panik halinde canlı sunucuda doğaçlama yama (Hotfix) denendi. Yama sırasında sözdizimi uyuşmazlığı oluştu ve 2 uygulama sunucusu daha devre dışı kaldı; kuyruk 340 hastaya çıktı.'
          : 'Canlı ortamda (Production) yapılan hızlı yama ilk sorguyu açsa da ORM önbelleğinde yarış durumu (race condition) tetikledi; poliklinik ekranlarında çift randevu satırları oluşmaya başladı.',
        whyItHappened:
          'Stres altında derleme ve kod gözden geçirme (code review) süreçlerini atlayarak canlı sunucuda kod değiştirmek, mevcut arızanın üzerine öngörülemeyen yeni yan etkiler ekledi.',
        roleSpecificInsight: `${rolePrefix[profile.role]} Canlı sunucuda elle yapılan değişiklik konteyner imajıyla (immutable infrastructure) senkronize olmadığı için pod yeniden başladığında yama silindi ve kararsızlık sürdü.`,
        telemetryDelta: {
          clockAfter: '08:12',
          waitingPatientsAfter: 340,
          stabilityScoreAfter: 45,
          kvkkBreached: false,
        },
      };
    }
  }

  if (stageId === 'STAGE_2_TEST') {
    if (chosenKey === 'A') {
      return {
        stageId,
        stageTitle: stage.badge,
        chosenKey: 'A',
        chosenLabel: optionSpec.shortTitle,
        timedOut,
        whatHappened:
          '60 saniyelik duman testi (Smoke Test) koşuldu ve canlıya çıkmadan hemen önce `REDIS_SSL_VERIFY` ortam değişkenindeki yapılandırma hatasını yakaladı! Hata 15 saniyede düzeltilip paket güvenle yayına alındı.',
        whyItHappened:
          'Yalnızca 1 dakikalık otomatik doğrulama yatırımı, hatalı yapılandırmanın canlı ortama sızıp tüm randevu oturumlarını ikinci kez çökertmesini önledi.',
        roleSpecificInsight: `${rolePrefix[profile.role]} Duman testi, kritik sağlık kontrolü ('/healthz' ve '/api/v1/slot-lock') uç noktalarını doğrulayarak dağıtım güvenliğini garanti altına aldı.`,
        telemetryDelta: {
          clockAfter: '08:17',
          waitingPatientsAfter: 65,
          stabilityScoreAfter: 92,
          kvkkBreached: false,
        },
      };
    } else {
      return {
        stageId,
        stageTitle: stage.badge,
        chosenKey: 'B',
        chosenLabel: optionSpec.shortTitle,
        timedOut,
        whatHappened: timedOut
          ? '60 saniye içinde karar verilemediği için başhekimin baskısıyla test adımı atlanarak paket doğrudan canlıya basıldı. Gözden kaçan Redis SSL hatası yüzünden randevu servisi 12 dakika boyunca tekrar kilitlendi!'
          : 'Testi atlayarak kazandığını sandığın 60 saniye, `REDIS_SSL_VERIFY` uyumsuzluğunun canlıda patlamasıyla 12 dakikalık ek kesintiye dönüştü; hasta kuyruğu 380 kişiye ulaştı.',
        whyItHappened:
          'Doğrulama (verification) adımını zaman kaybı olarak görmek, basit bir yapılandırma uyuşmazlığının canlı ortamda tam ölçekli bir kesintiye dönüşmesine neden oldu.',
        roleSpecificInsight: `${rolePrefix[profile.role]} Doğrulanmamış dağıtım sırasında yarım kalan veritabanı işlemleri (uncommitted transactions) kuyruk bütünlüğünü bozdu.`,
        telemetryDelta: {
          clockAfter: '08:21',
          waitingPatientsAfter: 380,
          stabilityScoreAfter: 50,
          kvkkBreached: false,
        },
      };
    }
  }

  // STAGE_3_KVKK
  if (chosenKey === 'A') {
    const previousTestPassed = currentTelemetry.stabilityScore >= 70;
    return {
      stageId,
      stageTitle: stage.badge,
      chosenKey: 'A',
      chosenLabel: optionSpec.shortTitle,
      timedOut,
      whatHappened:
        'Log dosyasındaki hasta adları, T.C. kimlik numaraları ve ICD-10 tanı kodları `SHA-256` ile maskelenerek (`patient_hash_8f9a`) paylaşıldı. Ekip aynı tekil hash üzerinden hatayı 4 dakikada çözdü; saat 08:25 itibarıyla hiçbir kişisel veri sızmadı.',
      whyItHappened:
        'Hata ayıklama (debugging) için gerçek kişi kimliğine değil, kayıtlar arası ilişkiyi koruyan anonimleştirilmiş tekil anahtara (pseudonymization) ihtiyaç olduğu doğru analiz edildi.',
      roleSpecificInsight: `${rolePrefix[profile.role]} 6698 sayılı KVKK Madde 6 ve Madde 12 kapsamındaki teknik tedbir yükümlülüğü eksiksiz yerine getirildi; denetim izi temiz kaldı.`,
      telemetryDelta: {
        clockAfter: '08:25',
        waitingPatientsAfter: previousTestPassed ? 0 : 120,
        stabilityScoreAfter: previousTestPassed ? 100 : 68,
        kvkkBreached: false,
      },
    };
  } else {
    return {
      stageId,
      stageTitle: stage.badge,
      chosenKey: 'B',
      chosenLabel: optionSpec.shortTitle,
      timedOut,
      whatHappened: timedOut
        ? '60 saniyelik süre dolunca log dosyası maskelenmeden otomatik olarak genel kanala düştü. Teknik hata çözülüp sistem 08:25’te ayağa kalksa da 342 hastanın kimlik ve teşhis verileri yetkisiz kişilere ve bulut sunucularına sızdı!'
        : 'Ekip logu hemen okuyup hatayı düzeltti ve sistem ayağa kalktı; ANCAK 342 hastanın T.C. kimlik numarası ve özel nitelikli tanı bilgisi genel sohbet kanalında kalıcı olarak ifşa oldu. Hastane bilgi güvenliği birimi KVKK ihlal alarmı verdi!',
      whyItHappened:
        'Kriz anında hız uğruna veri mahremiyeti (6698 sayılı KVKK Madde 12) feda edildi. Sistemin teknik olarak çalışması, yaşanan hukuki ve etik veri ihlalini telafi edemedi.',
      roleSpecificInsight: `${rolePrefix[profile.role]} Özel nitelikli sağlık verilerinin şifresiz ve maskesiz olarak üçüncü taraf mesajlaşma altyapısına aktarılması, Kişisel Verileri Koruma Kurumu bildirimi gerektiren kritik bir veri ihlali oluşturdu.`,
      telemetryDelta: {
        clockAfter: '08:25',
        waitingPatientsAfter: 45,
        stabilityScoreAfter: 82,
        kvkkBreached: true,
      },
    };
  }
}
