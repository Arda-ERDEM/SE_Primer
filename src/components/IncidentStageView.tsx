import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
} from 'lucide-react';

interface IncidentStageViewProps {
  stageId: DecisionStageId;
  profile: CalibrationProfile;
  telemetry: TelemetrySnapshot;
  activeCausalReview: DecisionRecord | null;
  onSelectChoice: (choice: ChoiceOptionKey, timedOut?: boolean) => void;
  onProceedNextStage: () => void;
}

export const IncidentStageView: React.FC<IncidentStageViewProps> = ({
  stageId,
  profile,
  telemetry,
  activeCausalReview,
  onSelectChoice,
  onProceedNextStage,
}) => {
  const stage = INCIDENT_STAGES[stageId];
  const isVeteran = profile.level === 'veteran';

  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [studentInput, setStudentInput] = useState<string>('');
  const [isTutorThinking, setIsTutorThinking] = useState<boolean>(false);

  const roleMeta = ENGINEERING_ROLES.find((r) => r.id === profile.role)!;
  const goalMeta = PRIMARY_GOALS.find((g) => g.id === profile.goal)!;
  const levelMeta = EXPERIENCE_LEVELS.find((l) => l.id === profile.level)!;

  // Sahne değiştiğinde sayacı ve Sokratik Tutor açılış mesajını sıfırla
  useEffect(() => {
    setSecondsLeft(60);
    setStudentInput('');
    setMessages([
      {
        id: `init-${stageId}`,
        sender: 'tutor',
        text: stage.defaultSocraticQuestion,
        timestamp: telemetry.incidentClock,
      },
    ]);
  }, [stageId]);

  // Deneyimli modda 60 saniyelik geri sayım (Karar verildiğinde durur)
  useEffect(() => {
    if (!isVeteran || activeCausalReview) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          onSelectChoice('B', true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isVeteran, activeCausalReview, stageId]);

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

  return (
    <div className="space-y-3.5 pb-6" data-testid={`screen-stage-${stage.stepNumber}`}>
      {/* Top Telemetry & Persona Strip */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30"
            data-testid="stage-badge"
          >
            {stage.badge} ({stage.stepNumber}/3)
          </span>

          {isVeteran ? (
            <div
              data-testid="veteran-countdown-timer"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-extrabold border ${
                secondsLeft <= 15
                  ? 'bg-rose-500/25 text-rose-200 border-rose-500 animate-pulse'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>00:{String(secondsLeft).padStart(2, '0')}</span>
            </div>
          ) : (
            <span
              data-testid="novice-mode-badge"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300 border border-emerald-500/30"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              İpucu Açık · Süresiz
            </span>
          )}
        </div>

        {/* Live Hospital Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800/90 p-2">
            <div className="text-[10px] text-slate-400">Saat</div>
            <div className="text-xs font-mono font-bold text-white" data-testid="telemetry-clock">
              {telemetry.incidentClock}
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800/90 p-2">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-rose-400" /> Bekleyen
            </div>
            <div
              className="text-xs font-mono font-bold text-rose-300"
              data-testid="telemetry-patients"
            >
              {telemetry.waitingPatients} Hasta
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800/90 p-2">
            <div className="text-[10px] text-slate-400">KVKK Kalkanı</div>
            <div className="text-xs font-mono font-bold flex items-center justify-center gap-1">
              {telemetry.kvkkCompliant ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> KORUNUYOR
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> İHLAL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Calibration Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
            Seviye: {levelMeta.title}
          </span>
          <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-cyan-300 border border-cyan-500/20">
            Rol: {roleMeta.shortBadge}
          </span>
          <span className="rounded bg-amber-950/60 px-2 py-0.5 text-amber-300 border border-amber-500/20">
            Hedef: {goalMeta.shortBadge}
          </span>
        </div>
      </div>

      {/* Crisis Narrative Card (Adapted to Role & Goal) */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-2.5">
        <h2 className="text-base font-extrabold text-white leading-snug">
          {stage.headline}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">{stage.baseSituation}</p>

        {/* Dynamic Role & Goal Adaptation Box */}
        <div
          className="rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-2.5 space-y-1 text-xs"
          data-testid="role-adapted-narrative"
        >
          <div className="text-cyan-200 leading-relaxed">{stage.roleNarratives[profile.role]}</div>
          <div className="text-amber-300/90 text-[11px] font-medium pt-1 border-t border-cyan-500/15">
            {stage.goalStakes[profile.goal]}
          </div>
        </div>

        {/* Terminal Log Box */}
        <div className="rounded-xl border border-slate-800 bg-[#070A12] p-2.5 font-mono text-[11px] space-y-1 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pb-1 border-b border-slate-800/80">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>hbys-prod-cluster · canlı telemetri akışı</span>
          </div>
          {stage.terminalLogLines.map((line, idx) => (
            <div
              key={idx}
              className={
                line.includes('[CRIT]') || line.includes('[ALRT]') || line.includes('[SEC]')
                  ? 'text-rose-300'
                  : line.includes('[WARN]')
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Novice Automatic Hint Card (Only shown automatically when level === 'novice') */}
      {!isVeteran && (
        <div
          data-testid="novice-starter-hint"
          className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-2.5"
        >
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-100 leading-relaxed">
            {stage.noviceStarterHint}
          </div>
        </div>
      )}

      {/* Decision Buttons OR Post-Decision "Ne Oldu / Neden Oldu" Causal Breakdown */}
      {!activeCausalReview ? (
        <div className="space-y-2.5" data-testid="decision-options-group">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 px-1">
            Mühendislik Kararını Seç:
          </div>
          {stage.options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              data-testid={`choice-btn-${opt.key}`}
              onClick={() => onSelectChoice(opt.key, false)}
              className="w-full text-left rounded-2xl border border-slate-700/90 bg-[#161F33] hover:bg-[#1E293B] hover:border-emerald-500/60 active:scale-[0.99] p-3.5 transition-all space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition">
                  {opt.shortTitle}
                </span>
                <span className="rounded-lg bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
                  Seçenek {opt.key}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{opt.subtitle}</p>
              <div className="rounded-lg bg-[#090D16] px-2.5 py-1.5 font-mono text-[10px] text-emerald-300/90 border border-slate-800/80 truncate">
                $ {opt.commandPreview}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* NE OLDU & NEDEN OLDU (Seçim Sonrası Teknik Sonuç Paneli) */
        <div
          data-testid="causal-feedback-card"
          className={`rounded-2xl border-2 p-4 space-y-3 shadow-xl ${
            activeCausalReview.chosenKey === 'A'
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-rose-500/60 bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeCausalReview.chosenKey === 'A'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {activeCausalReview.chosenKey === 'A' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {activeCausalReview.timedOut
                ? 'SÜRE DOLDU (60sn Aşımı)'
                : `SEÇİLEN KARAR: ${activeCausalReview.chosenLabel}`}
            </span>
            <span className="font-mono text-xs text-slate-400">
              Saat {activeCausalReview.telemetryDelta.clockAfter}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="rounded-xl bg-slate-900/85 border border-slate-800 p-3 space-y-1">
              <div className="font-bold text-white uppercase tracking-wide text-[11px]">
                1. Teknik Olarak Ne Oldu?
              </div>
              <p className="text-slate-200 leading-relaxed" data-testid="feedback-what-happened">
                {activeCausalReview.whatHappened}
              </p>
            </div>

            <div className="rounded-xl bg-slate-900/85 border border-slate-800 p-3 space-y-1">
              <div className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                2. Neden Oldu? (Mühendislik Nedenselliği)
              </div>
              <p className="text-slate-200 leading-relaxed" data-testid="feedback-why-happened">
                {activeCausalReview.whyItHappened}
              </p>
            </div>

            <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/30 p-2.5 text-[11px] text-cyan-200">
              {activeCausalReview.roleSpecificInsight}
            </div>
          </div>

          <button
            type="button"
            data-testid="next-stage-btn"
            onClick={onProceedNextStage}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs py-3.5 px-4 transition cursor-pointer"
          >
            <span>
              {stage.stepNumber < 3
                ? `Analizi Okudum · Karar ${stage.stepNumber + 1}'e Geç`
                : 'Analizi Okudum · Nöbet Sonuç Raporunu Gör'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Socratic AI Tutor Panel ("AI tutor cevabı söylemez, sorar") */}
      <div
        className="rounded-2xl border border-amber-500/35 bg-[#121726] p-3.5 space-y-3"
        data-testid="socratic-tutor-panel"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Sokratik AI Tutor</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                  Spoiler Guard v2
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Cevabı söylemez, ödünleşim (trade-off) sorusu sorar
              </div>
            </div>
          </div>
          <HelpCircle className="w-4 h-4 text-amber-400/70" />
        </div>

        {/* Chat History */}
        <div
          className="space-y-2 max-h-48 overflow-y-auto pr-1"
          data-testid="tutor-messages-list"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              data-testid={`tutor-msg-${msg.sender}`}
              className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                msg.sender === 'tutor'
                  ? 'bg-amber-500/10 border border-amber-500/25 text-amber-100'
                  : 'bg-slate-800/90 border border-slate-700 text-slate-200 ml-6'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1 opacity-75">
                <span>
                  {msg.sender === 'tutor' ? 'SOKRATİK MENTOR' : 'NÖBETÇİ MÜHENDİS (SEN)'}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <div>“{msg.text}”</div>
            </div>
          ))}
          {isTutorThinking && (
            <div className="text-[11px] font-mono text-amber-300 animate-pulse px-2">
              Sokratik Tutor karşı-soru hazırlıyor...
            </div>
          )}
        </div>

        {/* Quick Student Prompts */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 font-medium">
            Hızlı Öğrenci Soruları (Tıkla veya Kendi Sorunu Yaz):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stage.quickStudentPrompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                data-testid={`quick-prompt-${idx}`}
                onClick={() => handleSendToTutor(promptText)}
                className="text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-amber-200 transition cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Free-form Student Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendToTutor(studentInput);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            data-testid="tutor-input"
            placeholder="Tutor'a sor (Örn: A mı B mi söyle, şema değişti mi?)..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            data-testid="tutor-send-btn"
            disabled={!studentInput.trim() || isTutorThinking}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold p-2.5 transition cursor-pointer"
            aria-label="Gönder"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
