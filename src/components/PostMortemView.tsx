import React from 'react';
import {
  CalibrationProfile,
  DecisionRecord,
  EndingType,
  TelemetrySnapshot,
} from '../engine/stateMachine';
import {
  ENGINEERING_ROLES,
  EXPERIENCE_LEVELS,
  PRIMARY_GOALS,
} from '../domain/incidentMatrix';
import {
  AlertOctagon,
  Award,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface PostMortemViewProps {
  ending: EndingType;
  profile: CalibrationProfile;
  decisions: DecisionRecord[];
  telemetry: TelemetrySnapshot;
  onRestart: () => void;
  onOpenEvalModal: () => void;
}

export const PostMortemView: React.FC<PostMortemViewProps> = ({
  ending,
  profile,
  decisions,
  telemetry,
  onRestart,
  onOpenEvalModal,
}) => {
  const isGoodEnding = ending === 'SON_A_IYI';
  const levelMeta = EXPERIENCE_LEVELS.find((l) => l.id === profile.level)!;
  const roleMeta = ENGINEERING_ROLES.find((r) => r.id === profile.role)!;
  const goalMeta = PRIMARY_GOALS.find((g) => g.id === profile.goal)!;

  return (
    <div className="space-y-4 pb-6" data-testid="screen-ending">
      {/* Main Outcome Banner (Matches Slide 2 exact wording + detailed analysis) */}
      <div
        data-testid={isGoodEnding ? 'ending-banner-good' : 'ending-banner-bad'}
        className={`rounded-2xl border-2 p-5 space-y-3 shadow-xl ${
          isGoodEnding
            ? 'border-emerald-500/70 bg-gradient-to-br from-emerald-950/50 via-[#111827] to-[#0B1120]'
            : 'border-rose-500/70 bg-gradient-to-br from-rose-950/50 via-[#111827] to-[#0B1120]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            data-testid="ending-code-badge"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-extrabold ${
              isGoodEnding
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isGoodEnding ? (
              <>
                <Award className="w-4 h-4" />
                SON A · İYİ
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" />
                SON B · KÖTÜ
              </>
            )}
          </span>
          <span className="font-mono text-xs text-slate-400">
            Saat {telemetry.incidentClock}
          </span>
        </div>

        <h1
          data-testid="ending-headline"
          className="text-lg font-extrabold text-white leading-snug"
        >
          {isGoodEnding
            ? '08:25 sistem ayakta, veri güvende'
            : 'Sistem ayakta ama KVKK ihlali (veya Kritik Hasar)'}
        </h1>

        <p className="text-xs text-slate-200 leading-relaxed">
          {isGoodEnding
            ? 'Tebrikler! Poliklinik kapısındaki 300 hastanın randevu akışı saat 08:25 itibarıyla tamamen açıldı. Duman testiyle yapılandırma hatasını canlıya çıkmadan yakaladın ve hasta verilerini maskeleyerek 6698 sayılı KVKK disiplinini %100 korudun.'
            : telemetry.kvkkCompliant
            ? 'Kriz sırasında doğrulama (duman testi) adımını atladığın için canlı ortamda öngörülemeyen yapılandırma çöküşü yaşandı; kuyruktaki hasta mağduriyeti katlandı ve sistem bütünlüğü hasar gördü.'
            : 'Sistem teknik olarak ayağa kalkmış olsa da, hata loglarındaki gerçek hasta adlarını ve özel nitelikli tanı kodlarını maskelemeden paylaştığın için 6698 sayılı KVKK Madde 12 kapsamında kritik veri ihlali oluştu!'}
        </p>

        {/* Final Scorecard */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center">
            <div className="text-[10px] text-slate-400">Çözüm Saati</div>
            <div className="text-sm font-mono font-extrabold text-white">08:25</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center">
            <div className="text-[10px] text-slate-400">Kalan Kuyruk</div>
            <div className="text-sm font-mono font-extrabold text-cyan-300">
              {telemetry.waitingPatients} Hasta
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center">
            <div className="text-[10px] text-slate-400">KVKK Durumu</div>
            <div className="text-xs font-mono font-extrabold flex items-center justify-center gap-1 mt-0.5">
              {telemetry.kvkkCompliant ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> GÜVENDE
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> İHLAL!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Persona Summary */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3.5 text-xs space-y-1">
        <div className="font-bold text-slate-200">Oynanan Mühendis Profili:</div>
        <div className="text-slate-400">
          Seviye: <strong className="text-white">{levelMeta.title}</strong> · Rol:{' '}
          <strong className="text-cyan-300">{roleMeta.title}</strong> · Hedef:{' '}
          <strong className="text-amber-300">{goalMeta.title}</strong>
        </div>
      </div>

      {/* 3-Step Decision Audit Trail */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Nöbet Karar Zinciri (Ne Oldu · Neden Oldu)
        </h2>

        <div className="space-y-2.5">
          {decisions.map((d, idx) => (
            <div
              key={d.stageId}
              data-testid={`summary-step-${idx + 1}`}
              className="rounded-xl border border-slate-800 bg-slate-900/75 p-3 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-cyan-300">{d.stageTitle}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                    d.chosenKey === 'A'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {d.chosenKey === 'A' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {d.chosenLabel}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                <strong className="text-slate-400">Ne Oldu:</strong> {d.whatHappened}
              </p>
              <p className="text-amber-200/90 leading-relaxed">
                <strong className="text-amber-400">Neden Oldu:</strong> {d.whyItHappened}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          data-testid="replay-simulation-btn"
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm py-3.5 px-4 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Farklı Seviye / Rol ile Yeniden Oynat</span>
        </button>

        <button
          type="button"
          data-testid="open-eval-from-ending-btn"
          onClick={onOpenEvalModal}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-bold text-xs py-3 px-4 transition cursor-pointer"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Tutor Eval Raporunu İncele (20 Öğrenci Cevabı · 25 Puan)</span>
        </button>
      </div>
    </div>
  );
};
