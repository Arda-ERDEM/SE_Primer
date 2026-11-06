import React, { useEffect, useRef, useState } from 'react';
import {
  CalibrationProfile,
  ChoiceOptionKey,
  DecisionRecord,
  DecisionStageId,
  TelemetrySnapshot,
} from '../engine/stateMachine';
import {
  ENGINEERING_ROLES,
  EXPERIENCE_LEVELS,
  INCIDENT_STAGES,
  PRIMARY_GOALS,
} from '../domain/incidentMatrix';
import {
  askSocraticTutor,
  TutorMessage,
} from '../services/socraticMentor';
import {
  AdaptiveInferenceResult,
  BehavioralTelemetryInput,
  SessionTelemetryRow,
} from '../services/onnxAdaptiveEngine';
import { OnnxParityPanel } from './OnnxParityPanel';

interface IncidentStageViewProps {
  sessionId: string;
  stageId: DecisionStageId;
  profile: CalibrationProfile;
  telemetry: TelemetrySnapshot;
  priorDecisions: DecisionRecord[];
  activeCausalReview: DecisionRecord | null;
  onSelectChoice: (
    choice: ChoiceOptionKey,
    timedOut?: boolean,
    telemetryRow?: SessionTelemetryRow
  ) => void;
  onProceedNextStage: () => void;
  dataCollectionOnly?: boolean;
}

export const IncidentStageView: React.FC<IncidentStageViewProps> = ({
  sessionId,
  stageId,
  profile,
  telemetry,
  priorDecisions,
  activeCausalReview,
  onSelectChoice,
  onProceedNextStage,
  dataCollectionOnly = false,
}) => {
  const stage = INCIDENT_STAGES[stageId];
  const isVeteran = profile.level === 'veteran';
  const priorRiskyCount = priorDecisions.filter(
    (d) => d.chosenKey === 'B' || d.timedOut
  ).length;

  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [timeReliefGranted, setTimeReliefGranted] = useState<boolean>(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [studentInput, setStudentInput] = useState<string>('');
  const [isTutorThinking, setIsTutorThinking] = useState<boolean>(false);

  const lastHoveredOptionRef = useRef<ChoiceOptionKey | null>(null);
  const manualPresetLockRef = useRef<boolean>(false);

  const [telemetryInput, setTelemetryInput] = useState<BehavioralTelemetryInput>(() => ({
    sahne_no: stage.stepNumber,
    seviye: isVeteran ? 1 : 0,
    karar_suresi_sn: 8.0,
    tereddut_sayisi: 0,
    log_inceleme_orani: 0.85,
    onceki_riskli_karar: priorRiskyCount,
    tutor_etkilesim_sayisi: 0,
    kalan_sure_orani: isVeteran ? 0.87 : 1.0,
  }));

  const [inferenceResult, setInferenceResult] =
    useState<AdaptiveInferenceResult | null>(null);

  const roleMeta = ENGINEERING_ROLES.find((r) => r.id === profile.role)!;
  const goalMeta = PRIMARY_GOALS.find((g) => g.id === profile.goal)!;
  const levelMeta = EXPERIENCE_LEVELS.find((l) => l.id === profile.level)!;

  useEffect(() => {
    const riskySoFar = priorDecisions.filter(
      (d) => d.chosenKey === 'B' || d.timedOut
    ).length;

    setSecondsLeft(60);
    setTimeReliefGranted(false);
    setStudentInput('');
    lastHoveredOptionRef.current = null;
    manualPresetLockRef.current = false;

    setTelemetryInput({
      sahne_no: stage.stepNumber,
      seviye: isVeteran ? 1 : 0,
      karar_suresi_sn: 8.0,
      tereddut_sayisi: 0,
      log_inceleme_orani: 0.85,
      onceki_riskli_karar: riskySoFar,
      tutor_etkilesim_sayisi: 0,
      kalan_sure_orani: isVeteran ? 0.87 : 1.0,
    });

    setMessages([
      {
        id: `init-${stageId}`,
        sender: 'tutor',
        text: stage.defaultSocraticQuestion,
        timestamp: telemetry.incidentClock,
      },
    ]);
  }, [stageId, isVeteran]);

  // Model p >= 0.50 verdiğinde oyun davranışını değiştir:
  // 1) Deneyimli modda süre baskısını esnet (+30 sn bilişsel tampon)
  useEffect(() => {
    if (
      inferenceResult?.interventionRequired &&
      !timeReliefGranted &&
      !activeCausalReview
    ) {
      setTimeReliefGranted(true);
      if (isVeteran) {
        setSecondsLeft((prev) => Math.min(90, prev + 30));
      }
    }
  }, [inferenceResult?.interventionRequired, timeReliefGranted, activeCausalReview, isVeteran]);

  useEffect(() => {
    if (!isVeteran || activeCausalReview) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleCommitDecision('B', true);
          return 0;
        }
        const nextSec = prev - 1;
        if (!manualPresetLockRef.current) {
          setTelemetryInput((curr) => ({
            ...curr,
            karar_suresi_sn: Number(Math.min(60, curr.karar_suresi_sn + 1).toFixed(1)),
            kalan_sure_orani: Number(Math.max(0.02, Math.min(1.0, nextSec / 60)).toFixed(2)),
          }));
        }
        return nextSec;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isVeteran, activeCausalReview, stageId]);

  const handleOptionHover = (optKey: ChoiceOptionKey) => {
    if (activeCausalReview || manualPresetLockRef.current) return;
    if (lastHoveredOptionRef.current && lastHoveredOptionRef.current !== optKey) {
      setTelemetryInput((curr) => ({
        ...curr,
        tereddut_sayisi: Math.min(15, curr.tereddut_sayisi + 1),
      }));
    }
    lastHoveredOptionRef.current = optKey;
  };

  const handleLogInspect = () => {
    if (activeCausalReview || manualPresetLockRef.current) return;
    setTelemetryInput((curr) => ({
      ...curr,
      log_inceleme_orani: Number(Math.min(0.98, curr.log_inceleme_orani + 0.08).toFixed(2)),
    }));
  };

  const handleSelectPersonaPreset = (preset: 'flow' | 'overload') => {
    manualPresetLockRef.current = true;
    if (preset === 'flow') {
      setTimeReliefGranted(false);
      setTelemetryInput({
        sahne_no: stage.stepNumber,
        seviye: isVeteran ? 1 : 0,
        karar_suresi_sn: 11.0,
        tereddut_sayisi: 1,
        log_inceleme_orani: 0.9,
        onceki_riskli_karar: 0,
        tutor_etkilesim_sayisi: 0,
        kalan_sure_orani: 0.82,
      });
    } else {
      setTelemetryInput({
        sahne_no: stage.stepNumber,
        seviye: isVeteran ? 1 : 0,
        karar_suresi_sn: 44.0,
        tereddut_sayisi: 6,
        log_inceleme_orani: 0.22,
        onceki_riskli_karar: Math.max(1, priorRiskyCount),
        tutor_etkilesim_sayisi: 2,
        kalan_sure_orani: 0.27,
      });
    }
  };

  const handleManualTelemetryChange = (updated: BehavioralTelemetryInput) => {
    manualPresetLockRef.current = true;
    setTelemetryInput(updated);
  };

  const handleCommitDecision = (choice: ChoiceOptionKey, timedOut: boolean) => {
    const row: SessionTelemetryRow = {
      oturum: sessionId,
      ...telemetryInput,
      mudahale_gerekli: inferenceResult?.interventionRequired ? 1 : 0,
      kaynak: 'gercek',
      p_model: inferenceResult?.p ?? 0,
      chosen_key: choice,
    };
    onSelectChoice(choice, timedOut, row);
  };

  const handleSendToTutor = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isTutorThinking) return;

    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: trimmed,
      timestamp: telemetry.incidentClock,
    };

    setMessages((prev) => [...prev, userMsg]);
    setStudentInput('');
    setIsTutorThinking(true);

    if (!manualPresetLockRef.current) {
      setTelemetryInput((curr) => ({
        ...curr,
        tutor_etkilesim_sayisi: Math.min(10, curr.tutor_etkilesim_sayisi + 1),
      }));
    }

    const reply = await askSocraticTutor(trimmed, stageId, profile);

    const tutorMsg: TutorMessage = {
      id: `tutor-${Date.now()}`,
      sender: 'tutor',
      text: reply.text,
      timestamp: telemetry.incidentClock,
      guardrailTriggered: reply.guardrailTriggered,
    };

    setMessages((prev) => [...prev, tutorMsg]);
    setIsTutorThinking(false);
  };

  const isAdaptiveInterventionActive =
    !dataCollectionOnly && (inferenceResult?.interventionRequired ?? false);

  return (
    <div className="space-y-3 pb-4" data-testid={`screen-stage-${stage.stepNumber}`}>
      {/* Classic Blazor / Bootstrap Telemetry Table Card */}
      <div className="blazor-card border-t-[3px] border-t-[#052767]">
        <div className="blazor-card-header flex items-center justify-between text-xs">
          <span data-testid="stage-badge" className="font-bold text-[#052767]">
            {stage.badge} (Adım {stage.stepNumber}/3)
          </span>

          <div className="flex items-center gap-1">
            {isAdaptiveInterventionActive && (
              <span
                data-testid="adaptive-time-relief-badge"
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold bg-[#cff4fc] text-[#055160] border border-[#b6effb] rounded-[2px]"
              >
                Esnek Mod (+30sn)
              </span>
            )}
            {isVeteran ? (
              <span
                data-testid="veteran-countdown-timer"
                className={`px-2 py-0.5 font-mono text-xs font-bold border rounded-[2px] ${
                  secondsLeft <= 15
                    ? 'bg-[#dc3545] text-white border-[#b02a37]'
                    : 'bg-[#fff3cd] text-[#664d03] border-[#ffecb5]'
                }`}
              >
                Süre: 00:{String(secondsLeft).padStart(2, '0')}
              </span>
            ) : (
              <span
                data-testid="novice-mode-badge"
                className="px-2 py-0.5 font-mono text-[11px] bg-[#d1e7dd] text-[#0f5132] border border-[#badbcc] rounded-[2px]"
              >
                Rehber Açık | Süresiz
              </span>
            )}
          </div>
        </div>

        <div className="p-2.5">
          <table className="w-full border-collapse border border-[#dee2e6] text-xs text-center">
            <thead>
              <tr className="bg-[#f8f9fa] text-[#495057] font-semibold">
                <th className="border border-[#dee2e6] py-1 px-2">Sistem Saati</th>
                <th className="border border-[#dee2e6] py-1 px-2">Bekleyen Kuyruk</th>
                <th className="border border-[#dee2e6] py-1 px-2">KVKK Denetimi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold text-[#212529]"
                  data-testid="telemetry-clock"
                >
                  {telemetry.incidentClock}
                </td>
                <td
                  className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold text-[#dc3545]"
                  data-testid="telemetry-patients"
                >
                  {telemetry.waitingPatients} Hasta
                </td>
                <td className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold">
                  {telemetry.kvkkCompliant ? (
                    <span className="text-[#198754]">UYUMLU</span>
                  ) : (
                    <span className="text-[#dc3545]">İHLAL VAR</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 text-[11px] text-[#495057] font-mono bg-[#f8f9fa] border border-[#dee2e6] px-2 py-1 flex items-center justify-between">
            <span>
              Profil: {levelMeta.title} | Rol: {roleMeta.shortBadge} | Hedef: {goalMeta.shortBadge}
            </span>
            <span className="text-[10px] text-[#6c757d]">Oturum: #{sessionId}</span>
          </div>
        </div>
      </div>

      {/* v2.0 ONNX Behavioral Adaptive Engine & Parity Panel */}
      <OnnxParityPanel
        telemetry={telemetryInput}
        onChangeTelemetry={handleManualTelemetryChange}
        onInferenceResult={setInferenceResult}
        showPersonaPresets={!activeCausalReview}
        onSelectPersonaPreset={handleSelectPersonaPreset}
      />

      {/* Crisis Description & Server Logs Card */}
      <div className="blazor-card">
        <div className="blazor-card-header text-xs flex items-center justify-between">
          <span>Olay Özeti ve Sistem Günlüğü (Event Log)</span>
          {isAdaptiveInterventionActive && (
            <span className="text-[10px] font-mono text-[#c2410c] font-bold">
              [Model: Kritik Kök Neden Vurgulandı]
            </span>
          )}
        </div>
        <div className="p-3 space-y-2.5">
          <h2 className="text-sm font-bold text-[#212529]">
            {stage.headline}
          </h2>
          <p className="text-xs text-[#343a40] leading-normal">
            {stage.baseSituation}
          </p>

          {/* Role & Goal Specific Box */}
          <div
            className="bg-[#e7f1ff] border border-[#b6d4fe] text-[#084298] p-2.5 rounded-[2px] text-xs space-y-1"
            data-testid="role-adapted-narrative"
          >
            <div>{stage.roleNarratives[profile.role]}</div>
            <div className="font-semibold pt-1 border-t border-[#b6d4fe] text-[11px]">
              {stage.goalStakes[profile.goal]}
            </div>
          </div>

          {/* Classic Windows / Linux Console Pre Box */}
          <div
            onClick={handleLogInspect}
            onMouseEnter={handleLogInspect}
            className="bg-[#1e1e1e] text-[#d4d4d4] border border-[#6c757d] p-2 font-mono text-[11px] space-y-1 overflow-x-auto cursor-pointer"
          >
            <div className="text-[10px] text-[#9cdcfe] border-b border-[#3c3c3c] pb-1 mb-1">
              HBYS.EventLog.Reader — /var/log/hbys/randevu.log
            </div>
            {stage.terminalLogLines.map((line, idx) => {
              const isCriticalLine =
                line.includes('[CRIT]') ||
                line.includes('[ALRT]') ||
                line.includes('[SEC]');
              return (
                <div
                  key={idx}
                  className={
                    isCriticalLine
                      ? isAdaptiveInterventionActive
                        ? 'text-[#ffdf7e] bg-[#4b2316] px-1 font-bold border-l-2 border-[#fd7e14]'
                        : 'text-[#f48771]'
                      : line.includes('[WARN]')
                      ? 'text-[#cca700]'
                      : 'text-[#d4d4d4]'
                  }
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Novice Starter Hint (Classic Bootstrap Warning Alert - Preserved for v1 Regression) */}
      {!isVeteran && (
        <div
          data-testid="novice-starter-hint"
          className="bg-[#fff3cd] border border-[#ffecb5] border-l-4 border-l-[#ffc107] text-[#664d03] p-2.5 rounded-[3px] text-xs"
        >
          <strong>Sistem Rehberi: </strong>
          {stage.noviceStarterHint}
        </div>
      )}

      {/* v2.0 Model-Driven Proactive Socratic Scaffolding Card (Triggered when p >= 0.50) */}
      {isAdaptiveInterventionActive && !activeCausalReview && (
        <div
          data-testid="model-adaptive-intervention"
          className="bg-[#fff3cd] border border-[#ffecb5] border-l-4 border-l-[#fd7e14] text-[#664d03] p-3 rounded-[3px] text-xs space-y-1.5"
        >
          <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#993b00]">
            <span>
              [ONNX UYARLAMALI MÜDAHALE · p={inferenceResult?.pFormatted} ≥ 0.50]
            </span>
            <span>Süre Baskısı Esnetildi</span>
          </div>
          <p className="leading-normal">
            <strong>Proaktif Sokratik İskelet: </strong>
            {stage.noviceStarterHint}
          </p>
          <div
            data-testid="model-impact-preview"
            className="bg-[#ffffff] border border-[#ffe69c] p-2 rounded-[2px] text-[11px] text-[#495057] font-mono"
          >
            <strong>Karar Öncesi Ödünleşim Kontrolü:</strong> {stage.defaultSocraticQuestion}
          </div>
        </div>
      )}

      {/* Decision Form OR Post-Decision "Ne Oldu / Neden Oldu" Result Panel */}
      {!activeCausalReview ? (
        <div
          className="blazor-card border-t-[3px] border-t-[#1b6ec2]"
          data-testid="decision-options-group"
        >
          <div className="blazor-card-header text-xs">
            Uygulanacak Mühendislik Komutunu Seçin
          </div>
          <div className="p-3 space-y-2.5">
            {stage.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                data-testid={`choice-btn-${opt.key}`}
                onMouseEnter={() => handleOptionHover(opt.key)}
                onFocus={() => handleOptionHover(opt.key)}
                onClick={() => handleCommitDecision(opt.key, false)}
                className="w-full text-left border border-[#adb5bd] bg-[#ffffff] hover:bg-[#e7f1ff] hover:border-[#1b6ec2] p-3 rounded-[3px] transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b6ec2]">
                    {opt.shortTitle}
                  </span>
                  <span className="px-1.5 py-0.5 font-mono text-[10px] bg-[#e9ecef] text-[#495057] border border-[#ced4da] rounded-[2px]">
                    Komut [{opt.key}]
                  </span>
                </div>
                <p className="text-xs text-[#212529]">{opt.subtitle}</p>
                <div className="bg-[#f8f9fa] border border-[#dee2e6] px-2 py-1 font-mono text-[10px] text-[#495057] truncate">
                  &gt; {opt.commandPreview}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* NE OLDU & NEDEN OLDU (Seçim Sonrası Teknik Rapor) */
        <div
          data-testid="causal-feedback-card"
          className={`blazor-card border-t-4 ${
            activeCausalReview.chosenKey === 'A'
              ? 'border-t-[#198754]'
              : 'border-t-[#dc3545]'
          }`}
        >
          <div className="blazor-card-header flex items-center justify-between text-xs">
            <span
              className={`font-bold ${
                activeCausalReview.chosenKey === 'A'
                  ? 'text-[#198754]'
                  : 'text-[#dc3545]'
              }`}
            >
              {activeCausalReview.timedOut
                ? 'SÜRE AŞIMI (60sn Doldu)'
                : `İŞLEM SONUCU: ${activeCausalReview.chosenLabel}`}
            </span>
            <span className="font-mono text-xs text-[#495057]">
              Saat: {activeCausalReview.telemetryDelta.clockAfter}
            </span>
          </div>

          <div className="p-3 space-y-2.5 text-xs">
            <div className="bg-[#f8f9fa] border border-[#dee2e6] p-2.5 rounded-[2px]">
              <div className="font-bold text-[#212529] mb-1">
                1. Ne Oldu? (Sistem Etkisi):
              </div>
              <p className="text-[#343a40]" data-testid="feedback-what-happened">
                {activeCausalReview.whatHappened}
              </p>
            </div>

            <div className="bg-[#fff3cd] border border-[#ffecb5] p-2.5 rounded-[2px]">
              <div className="font-bold text-[#664d03] mb-1">
                2. Neden Oldu? (Kök Neden Analizi):
              </div>
              <p className="text-[#664d03]" data-testid="feedback-why-happened">
                {activeCausalReview.whyItHappened}
              </p>
            </div>

            <div className="bg-[#e2e3e5] border border-[#d3d6d8] p-2 text-[11px] text-[#41464b]">
              {activeCausalReview.roleSpecificInsight}
            </div>

            <button
              type="button"
              data-testid="next-stage-btn"
              onClick={onProceedNextStage}
              className="w-full blazor-btn-primary font-bold text-xs py-2.5 px-4 cursor-pointer"
            >
              {stage.stepNumber < 3
                ? `Analizi Onayla ve Karar ${stage.stepNumber + 1} Ekranına Geç >>`
                : 'Analizi Onayla ve Nöbet Sonuç Raporunu Aç >>'}
            </button>
          </div>
        </div>
      )}

      {/* Socratic AI Tutor Panel (Classic Enterprise GroupBox) */}
      <div
        className="blazor-card border-t-[3px] border-t-[#fd7e14]"
        data-testid="socratic-tutor-panel"
      >
        <div className="blazor-card-header flex items-center justify-between text-xs">
          <span>Sokratik AI Tutor (Cevabı Vermez, Soru Sorar)</span>
          <span className="font-mono text-[10px] bg-[#fff3cd] text-[#664d03] border border-[#ffecb5] px-1.5 py-0.5 rounded-[2px]">
            SpoilerGuard.Aktif
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Messages List */}
          <div
            className="space-y-2 max-h-44 overflow-y-auto border border-[#dee2e6] bg-[#f8f9fa] p-2"
            data-testid="tutor-messages-list"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`tutor-msg-${msg.sender}`}
                className={`p-2 text-xs border rounded-[2px] ${
                  msg.sender === 'tutor'
                    ? 'bg-[#fff3cd] border-[#ffecb5] text-[#664d03]'
                    : 'bg-[#ffffff] border-[#ced4da] text-[#212529] ml-4'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-0.5">
                  <span>
                    {msg.sender === 'tutor' ? '[SOKRATİK TUTOR]' : '[MÜHENDİS]'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div>“{msg.text}”</div>
              </div>
            ))}
            {isTutorThinking && (
              <div className="text-[11px] font-mono text-[#6c757d] px-1">
                Sokratik sorgu üretiliyor...
              </div>
            )}
          </div>

          {/* Quick Prompt Buttons */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#495057]">
              Örnek Sorular:
            </div>
            <div className="flex flex-col gap-1">
              {stage.quickStudentPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-testid={`quick-prompt-${idx}`}
                  onClick={() => handleSendToTutor(promptText)}
                  className="text-left bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#ced4da] px-2 py-1 text-[11px] text-[#212529] rounded-[2px] cursor-pointer"
                >
                  &raquo; {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendToTutor(studentInput);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              data-testid="tutor-input"
              placeholder="Sorunuzu yazın..."
              className="flex-1 border border-[#ced4da] bg-white px-2.5 py-1.5 text-xs text-[#212529] rounded-[2px] focus:border-[#1b6ec2] focus:outline-none"
            />
            <button
              type="submit"
              data-testid="tutor-send-btn"
              disabled={!studentInput.trim() || isTutorThinking}
              className="blazor-btn-primary disabled:opacity-50 font-semibold text-xs px-3 py-1.5 cursor-pointer"
            >
              Sor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
