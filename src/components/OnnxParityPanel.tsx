import React, { useEffect, useState } from 'react';
import {
  AdaptiveInferenceResult,
  BehavioralTelemetryInput,
  initOnnxAdaptiveEngine,
  ModelContractConfig,
  runAdaptiveInference,
} from '../services/onnxAdaptiveEngine';

interface OnnxParityPanelProps {
  telemetry: BehavioralTelemetryInput;
  onChangeTelemetry: (updated: BehavioralTelemetryInput) => void;
  onInferenceResult?: (result: AdaptiveInferenceResult) => void;
  showPersonaPresets?: boolean;
  onSelectPersonaPreset?: (preset: 'flow' | 'overload') => void;
}

export const OnnxParityPanel: React.FC<OnnxParityPanelProps> = ({
  telemetry,
  onChangeTelemetry,
  onInferenceResult,
  showPersonaPresets = false,
  onSelectPersonaPreset,
}) => {
  const [config, setConfig] = useState<ModelContractConfig | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [result, setResult] = useState<AdaptiveInferenceResult | null>(null);
  const [showInputs, setShowInputs] = useState<boolean>(false);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(telemetry).map(([k, v]) => [k, String(v)])
    )
  );

  useEffect(() => {
    let mounted = true;
    initOnnxAdaptiveEngine().then(({ config: cfg, sourceUrl: url }) => {
      if (!mounted) return;
      setConfig(cfg);
      setSourceUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDraftInputs((prev) => {
      const next = { ...prev };
      (Object.keys(telemetry) as Array<keyof BehavioralTelemetryInput>).forEach(
        (k) => {
          if (Number(prev[k]) !== telemetry[k] || prev[k] === '') {
            next[k] = String(telemetry[k]);
          }
        }
      );
      return next;
    });
  }, [
    telemetry.sahne_no,
    telemetry.seviye,
    telemetry.karar_suresi_sn,
    telemetry.tereddut_sayisi,
    telemetry.log_inceleme_orani,
    telemetry.onceki_riskli_karar,
    telemetry.tutor_etkilesim_sayisi,
    telemetry.kalan_sure_orani,
  ]);

  useEffect(() => {
    let mounted = true;
    runAdaptiveInference(telemetry).then((res) => {
      if (!mounted) return;
      setResult(res);
      if (onInferenceResult) {
        onInferenceResult(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, [
    telemetry.sahne_no,
    telemetry.seviye,
    telemetry.karar_suresi_sn,
    telemetry.tereddut_sayisi,
    telemetry.log_inceleme_orani,
    telemetry.onceki_riskli_karar,
    telemetry.tutor_etkilesim_sayisi,
    telemetry.kalan_sure_orani,
  ]);

  const handleFieldChange = (
    name: keyof BehavioralTelemetryInput,
    rawValue: string
  ) => {
    setDraftInputs((prev) => ({
      ...prev,
      [name]: rawValue,
    }));

    const trimmed = rawValue.trim();
    if (trimmed === '' || trimmed === '-' || trimmed.endsWith('.')) {
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num)) return;
    onChangeTelemetry({
      ...telemetry,
      [name]: num,
    });
  };

  const handleManualRun = async () => {
    const parsedTelemetry: BehavioralTelemetryInput = { ...telemetry };
    (Object.keys(telemetry) as Array<keyof BehavioralTelemetryInput>).forEach(
      (k) => {
        const num = Number(draftInputs[k]);
        if (!Number.isNaN(num) && draftInputs[k]?.trim() !== '') {
          parsedTelemetry[k] = num;
        }
      }
    );
    onChangeTelemetry(parsedTelemetry);
    const res = await runAdaptiveInference(parsedTelemetry);
    setResult(res);
    if (onInferenceResult) {
      onInferenceResult(res);
    }
  };

  const isIntervention = result?.interventionRequired ?? false;

  return (
    <div
      className={`blazor-card border-t-[3px] ${
        isIntervention ? 'border-t-[#fd7e14]' : 'border-t-[#198754]'
      }`}
      data-testid="onnx-telemetry-card"
    >
      <div className="blazor-card-header flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#052767]">
            ONNX Davranışsal Uyum Motoru (v2.0)
          </span>
          <span className="px-1.5 py-0.5 font-mono text-[10px] bg-[#e7f1ff] text-[#084298] border border-[#b6d4fe] rounded-[2px]">
            onnxruntime-web
          </span>
        </div>
        <button
          type="button"
          data-cy="toggle-parity-inputs"
          data-testid="toggle-parity-inputs"
          onClick={() => setShowInputs((prev) => !prev)}
          className="text-[10px] font-mono px-1.5 py-0.5 bg-[#ffffff] hover:bg-[#e9ecef] border border-[#ced4da] text-[#495057] rounded-[2px] cursor-pointer"
        >
          {showInputs ? 'Parite Girdilerini Gizle ▲' : 'Parite Test Girdileri ▼'}
        </button>
      </div>

      <div className="p-2.5 space-y-2 text-xs">
        {/* Live Probability & Decision Status Strip */}
        <div className="flex items-center justify-between bg-[#f8f9fa] border border-[#dee2e6] px-2.5 py-1.5 rounded-[2px]">
          <div>
            <span className="text-[11px] text-[#495057]">
              p(mudahale_gerekli=1):{' '}
            </span>
            <strong
              data-cy="p"
              data-testid="onnx-probability"
              className={`font-mono text-xs ${
                isIntervention ? 'text-[#c2410c]' : 'text-[#198754]'
              }`}
            >
              {result ? result.pFormatted : '0.000000'}
            </strong>
            <span className="text-[10px] font-mono text-[#6c757d] ml-1.5">
              (eşik: {result?.threshold ?? 0.5})
            </span>
          </div>

          <span
            data-cy="model-decision"
            data-testid={
              isIntervention
                ? 'model-decision-intervention'
                : 'model-autonomous-flow'
            }
            className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-[2px] border ${
              isIntervention
                ? 'bg-[#fff3cd] text-[#664d03] border-[#ffecb5]'
                : 'bg-[#d1e7dd] text-[#0f5132] border-[#badbcc]'
            }`}
          >
            {isIntervention
              ? '1 · UYARLAMALI MÜDAHALE AKTİF'
              : '0 · OTONOM AKIŞ'}
          </span>
        </div>

        {/* Visual Probability Bar */}
        <div className="w-full h-2 bg-[#e9ecef] rounded-[2px] overflow-hidden border border-[#dee2e6]">
          <div
            className={`h-full transition-all duration-300 ${
              isIntervention ? 'bg-[#fd7e14]' : 'bg-[#198754]'
            }`}
            style={{
              width: `${Math.min(100, Math.max(2, (result?.p ?? 0) * 100))}%`,
            }}
          />
        </div>

        {/* Compact Telemetry Summary Pills */}
        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center bg-[#ffffff] border border-[#dee2e6] p-1.5 rounded-[2px]">
          <div>
            <div className="text-[#6c757d]">Karar Süresi</div>
            <div className="font-bold text-[#212529]" data-testid="telemetry-dwell-val">
              {telemetry.karar_suresi_sn.toFixed(1)}sn
            </div>
          </div>
          <div>
            <div className="text-[#6c757d]">Tereddüt</div>
            <div className="font-bold text-[#212529]" data-testid="telemetry-hesitation-val">
              {telemetry.tereddut_sayisi} kez
            </div>
          </div>
          <div>
            <div className="text-[#6c757d]">Log Okuma</div>
            <div className="font-bold text-[#212529]" data-testid="telemetry-log-val">
              %{Math.round(telemetry.log_inceleme_orani * 100)}
            </div>
          </div>
          <div>
            <div className="text-[#6c757d]">Önceki Risk</div>
            <div className="font-bold text-[#212529]" data-testid="telemetry-risk-val">
              {telemetry.onceki_riskli_karar} hata
            </div>
          </div>
        </div>

        {/* Quick Persona Simulation Buttons for Same-Stage Comparison & Demo */}
        {showPersonaPresets && onSelectPersonaPreset && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              data-testid="simulate-flow-player-btn"
              onClick={() => onSelectPersonaPreset('flow')}
              className="flex-1 bg-[#d1e7dd] hover:bg-[#badbcc] text-[#0f5132] border border-[#a3cfbb] px-2 py-1 text-[10px] font-mono font-bold rounded-[2px] cursor-pointer"
            >
              Oyuncu A: Kararlı Akış (p&lt;0.5)
            </button>
            <button
              type="button"
              data-testid="simulate-overload-player-btn"
              onClick={() => onSelectPersonaPreset('overload')}
              className="flex-1 bg-[#fff3cd] hover:bg-[#ffecb5] text-[#664d03] border border-[#ffe69c] px-2 py-1 text-[10px] font-mono font-bold rounded-[2px] cursor-pointer"
            >
              Oyuncu B: Tereddüt/Panik (p≥0.5)
            </button>
          </div>
        )}

        {/* Collapsible Parity Test Input Form (Used by Cypress tests/parite.json) */}
        {showInputs && (
          <div
            className="border-t border-[#dee2e6] pt-2 mt-1 space-y-2"
            data-testid="onnx-parity-form"
          >
            <div className="text-[10px] font-mono text-[#495057] flex items-center justify-between">
              <span>Sözleşme: model/config.json (8 Özellik)</span>
              <span>
                AUC: {config?.metrics.auc ?? 0.9769} | Acc:{' '}
                {config?.metrics.accuracy ?? 0.9074}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(config?.features ?? []).map((feat) => {
                const fieldKey = feat.name as keyof BehavioralTelemetryInput;
                return (
                  <label
                    key={feat.name}
                    className="flex flex-col text-[10px] font-mono text-[#495057] bg-[#f8f9fa] border border-[#dee2e6] p-1.5 rounded-[2px]"
                  >
                    <span className="truncate font-semibold text-[#212529]">
                      {feat.name}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      data-cy={`input-${feat.name}`}
                      value={draftInputs[fieldKey] ?? String(telemetry[fieldKey])}
                      onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                      className="mt-0.5 bg-white border border-[#ced4da] px-1.5 py-0.5 text-xs text-[#212529] rounded-[2px]"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                data-cy="run-onnx-btn"
                onClick={handleManualRun}
                className="blazor-btn-primary text-[11px] font-mono font-bold px-3 py-1 cursor-pointer"
              >
                ONNX Çıkarımı Çalıştır
              </button>
              <span
                className="text-[10px] font-mono text-[#6c757d] truncate"
                title={sourceUrl}
                data-testid="onnx-source-url"
              >
                Kaynak: {sourceUrl.replace('https://huggingface.co/', 'hf.co/')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
