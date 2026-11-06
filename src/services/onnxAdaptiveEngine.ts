export interface FeatureContractItem {
  name: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  example: number;
}

export interface ModelContractConfig {
  title: string;
  version: string;
  description: string;
  target: string;
  threshold: number;
  class_labels: Record<string, string>;
  features: FeatureContractItem[];
  classes: string[];
  metrics: {
    accuracy: number;
    auc: number;
    f1: number;
    precision?: number;
    recall?: number;
    onnx_max_diff?: number;
  };
  seed: number;
}

export interface BehavioralTelemetryInput {
  sahne_no: number;
  seviye: number;
  karar_suresi_sn: number;
  tereddut_sayisi: number;
  log_inceleme_orani: number;
  onceki_riskli_karar: number;
  tutor_etkilesim_sayisi: number;
  kalan_sure_orani: number;
}

export interface AdaptiveInferenceResult {
  p: number;
  pFormatted: string;
  predictedClass: 0 | 1;
  interventionRequired: boolean;
  decisionLabel: string;
  threshold: number;
  latencyMs: number;
  sourceUrl: string;
  engineType: 'onnxruntime-web' | 'contract-fallback';
  inputVector: number[];
}

export interface SessionTelemetryRow extends BehavioralTelemetryInput {
  oturum: string;
  mudahale_gerekli: 0 | 1;
  kaynak: 'gercek';
  p_model: number;
  chosen_key: 'A' | 'B';
}

declare global {
  interface Window {
    ort?: {
      env: {
        wasm: {
          wasmPaths: string;
          numThreads?: number;
        };
      };
      InferenceSession: {
        create: (uri: string | ArrayBuffer) => Promise<{
          run: (feeds: Record<string, unknown>) => Promise<{
            probabilities: { data: Float32Array | number[] };
            label?: { data: BigInt64Array | Int32Array | number[] };
          }>;
        }>;
      };
      Tensor: new (
        type: 'float32',
        data: Float32Array,
        dims: number[]
      ) => unknown;
    };
  }
}

const DEFAULT_CONTRACT: ModelContractConfig = {
  title: 'SE Primer v2.0 — Bilişsel Yük ve Kriz Müdahale Modeli',
  version: '2.0.0',
  description:
    'HBYS.Web kriz simülasyonunda nöbetçi mühendisin davranışsal telemetrisinden uyarlamalı Sokratik müdahale ve süre esnetme ihtiyacını tahmin eden ONNX modeli.',
  target: 'mudahale_gerekli',
  threshold: 0.5,
  class_labels: {
    '0': 'Otonom Akış (Müdahale Yok)',
    '1': 'Uyarlamalı Kriz Müdahalesi (İpucu + Süre Esnetme)',
  },
  features: [
    { name: 'sahne_no', label: 'Kriz Sahne No (1..3)', unit: 'adim', min: 1, max: 3, example: 2 },
    { name: 'seviye', label: 'Seviye (0: Novice, 1: Veteran)', unit: 'ikili', min: 0, max: 1, example: 1 },
    { name: 'karar_suresi_sn', label: 'Karar Süresi (sn)', unit: 'saniye', min: 1.5, max: 60, example: 44.0 },
    { name: 'tereddut_sayisi', label: 'Tereddüt Sayısı', unit: 'adet', min: 0, max: 15, example: 6 },
    { name: 'log_inceleme_orani', label: 'Log İnceleme Oranı', unit: 'oran', min: 0, max: 1, example: 0.22 },
    { name: 'onceki_riskli_karar', label: 'Önceki Riskli Karar', unit: 'adet', min: 0, max: 2, example: 1 },
    { name: 'tutor_etkilesim_sayisi', label: 'Tutor Etkileşimi', unit: 'adet', min: 0, max: 10, example: 2 },
    { name: 'kalan_sure_orani', label: 'Kalan Süre Oranı', unit: 'oran', min: 0, max: 1, example: 0.27 },
  ],
  classes: ['0', '1'],
  metrics: {
    accuracy: 0.9074,
    auc: 0.9769,
    f1: 0.9296,
    onnx_max_diff: 8e-8,
  },
  seed: 13,
};

let cachedConfig: ModelContractConfig | null = null;
let cachedSession: Awaited<ReturnType<NonNullable<Window['ort']>['InferenceSession']['create']>> | null = null;
let cachedSourceUrl = 'https://huggingface.co/Arda-ERDEM/se-primer-v2-onnx/resolve/v2.0.0-baseline/model.onnx';
let initPromise: Promise<{ config: ModelContractConfig; sourceUrl: string }> | null = null;
let inferenceMutex: Promise<unknown> = Promise.resolve();

/**
 * 6698 sayılı KVKK uyumlu, kişisel veri içermeyen rastgele 4-hex oturum kimliği üretir.
 */
export function generateAnonymousSessionId(): string {
  const randomInt = Math.floor(Math.random() * 0xffff);
  return randomInt.toString(16).padStart(4, '0');
}

/**
 * Model sözleşmesini (`config.json`) ve ONNX oturumunu (`model.onnx`) yükler.
 * Tüketiciler modeli `main` dalından değil, commit'e sabitlenmiş resolve URL'sinden (veya yerel önbellekten) okur.
 */
export async function initOnnxAdaptiveEngine(): Promise<{
  config: ModelContractConfig;
  sourceUrl: string;
}> {
  if (cachedConfig && cachedSession) {
    return { config: cachedConfig, sourceUrl: cachedSourceUrl };
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get('repo') || 'Arda-ERDEM/se-primer-v2-onnx';
    const commitParam = params.get('commit') || 'v2.0.0-baseline';
    const pinnedResolveBase = `https://huggingface.co/${repoParam}/resolve/${commitParam}/`;
    cachedSourceUrl = `${pinnedResolveBase}model.onnx`;

    try {
      const siteRes = await fetch('./site.json', { cache: 'no-store' });
      if (siteRes.ok) {
        const siteMeta = await siteRes.json();
        if (siteMeta.model_repo && siteMeta.commit && !params.get('repo')) {
          cachedSourceUrl = `https://huggingface.co/${siteMeta.model_repo}/resolve/${siteMeta.commit}/model.onnx`;
        }
      }
    } catch {
      // Varsayılan pinned URL korunur
    }

    // 1. config.json sözleşmesini yükle
    try {
      const cfgRes = await fetch('./model/config.json', { cache: 'no-store' });
      if (cfgRes.ok) {
        cachedConfig = (await cfgRes.json()) as ModelContractConfig;
      } else {
        const remoteCfg = await fetch(`${pinnedResolveBase}config.json`);
        cachedConfig = remoteCfg.ok
          ? ((await remoteCfg.json()) as ModelContractConfig)
          : DEFAULT_CONTRACT;
      }
    } catch {
      cachedConfig = DEFAULT_CONTRACT;
    }

    // 2. onnxruntime-web WASM oturumunu başlat
    if (window.ort) {
      const localOrtBase = new URL('./ort/', window.location.href).href;
      window.ort.env.wasm.wasmPaths = localOrtBase;
      window.ort.env.wasm.numThreads = 1;

      let modelBuffer: ArrayBuffer | null = null;
      try {
        const modelResp = await fetch('./model/model.onnx');
        if (modelResp.ok) {
          modelBuffer = await modelResp.arrayBuffer();
        }
      } catch {
        modelBuffer = null;
      }

      try {
        // Önce aynı byte-birebir model.onnx artefaktını hızlı yerel yoldan yükle, yoksa HF resolve URL'sini dene
        if (modelBuffer) {
          cachedSession = await window.ort.InferenceSession.create(modelBuffer);
        } else {
          cachedSession = await window.ort.InferenceSession.create(cachedSourceUrl);
        }
      } catch {
        try {
          window.ort.env.wasm.wasmPaths =
            'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
          cachedSession = modelBuffer
            ? await window.ort.InferenceSession.create(modelBuffer)
            : await window.ort.InferenceSession.create('./model/model.onnx');
        } catch {
          cachedSession = null;
        }
      }
    }

    return { config: cachedConfig, sourceUrl: cachedSourceUrl };
  })();

  return initPromise;
}

/**
 * Verilen 8 davranışsal telemetri girdisiyle `onnxruntime-web` üzerinde `model.onnx` çıkarımı yapar.
 * Çıktı olasılığı Python Test Kahini (`tests/parite.py`) ile |Δp| < 1e-4 pariteye sahiptir.
 */
export async function runAdaptiveInference(
  input: BehavioralTelemetryInput
): Promise<AdaptiveInferenceResult> {
  const t0 = performance.now();
  const { config, sourceUrl } = await initOnnxAdaptiveEngine();

  const orderedVector = config.features.map((f) =>
    Number(input[f.name as keyof BehavioralTelemetryInput] ?? f.example)
  );

  let p1 = 0.5;
  let engineType: 'onnxruntime-web' | 'contract-fallback' = 'onnxruntime-web';

  if (cachedSession && window.ort) {
    const floatArray = Float32Array.from(orderedVector);
    const tensor = new window.ort.Tensor('float32', floatArray, [
      1,
      orderedVector.length,
    ]);
    const sessionRef = cachedSession;
    const runTask = inferenceMutex.then(async () => {
      const output = await sessionRef.run({ input: tensor });
      return Number(output.probabilities.data[1]);
    });
    inferenceMutex = runTask.catch(() => 0.5);
    p1 = await runTask;
  } else {
    engineType = 'contract-fallback';
    // Yalnızca WASM yüklenemediği olağandışı ortamlar için deterministik yedek
    p1 = 0.5;
  }

  const latencyMs = Math.max(0.1, Number((performance.now() - t0).toFixed(2)));
  const threshold = config.threshold ?? 0.5;
  const interventionRequired = p1 >= threshold;
  const predictedClass: 0 | 1 = interventionRequired ? 1 : 0;

  return {
    p: p1,
    pFormatted: p1.toFixed(6),
    predictedClass,
    interventionRequired,
    decisionLabel:
      config.class_labels[String(predictedClass)] ??
      (interventionRequired ? 'Uyarlamalı Müdahale Aktif' : 'Otonom Akış'),
    threshold,
    latencyMs,
    sourceUrl,
    engineType,
    inputVector: orderedVector,
  };
}

/**
 * Oturum boyunca toplanan gerçek karar satırlarını `data/oturumlar.csv` şemasında CSV metnine dönüştürür.
 */
export function formatSessionRowsAsCsv(rows: SessionTelemetryRow[]): string {
  const header =
    'oturum,sahne_no,seviye,karar_suresi_sn,tereddut_sayisi,log_inceleme_orani,onceki_riskli_karar,tutor_etkilesim_sayisi,kalan_sure_orani,mudahale_gerekli,kaynak';
  const lines = rows.map(
    (r) =>
      `${r.oturum},${r.sahne_no},${r.seviye},${r.karar_suresi_sn.toFixed(1)},${r.tereddut_sayisi},${r.log_inceleme_orani.toFixed(2)},${r.onceki_riskli_karar},${r.tutor_etkilesim_sayisi},${r.kalan_sure_orani.toFixed(2)},${r.mudahale_gerekli},${r.kaynak}`
  );
  return [header, ...lines].join('\n');
}
