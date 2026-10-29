import React from 'react';
import {
  CalibrationProfile,
  EngineeringRole,
  ExperienceTier,
  PrimaryGoal,
} from '../engine/stateMachine';
import {
  ENGINEERING_ROLES,
  EXPERIENCE_LEVELS,
  PRIMARY_GOALS,
} from '../domain/incidentMatrix';
import {
  Activity,
  BookOpen,
  Clock,
  Cpu,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';

interface CalibrationViewProps {
  profile: CalibrationProfile;
  onChangeProfile: (updated: CalibrationProfile) => void;
  onStartIncident: () => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  profile,
  onChangeProfile,
  onStartIncident,
}) => {
  const activeLevel = EXPERIENCE_LEVELS.find((l) => l.id === profile.level)!;
  const activeRole = ENGINEERING_ROLES.find((r) => r.id === profile.role)!;
  const activeGoal = PRIMARY_GOALS.find((g) => g.id === profile.goal)!;

  return (
    <div className="space-y-4 pb-6" data-testid="screen-calibration">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#161F33] via-[#111827] to-[#1A121B] p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-rose-300 border border-rose-500/40">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            SAAT 08:00 · ACİL NÖBET ÇAĞRISI
          </span>
          <span className="text-[11px] font-mono text-slate-400">HBYS-CORE v2.4.0</span>
        </div>

        <h1 className="text-lg font-extrabold tracking-tight text-white leading-snug">
          “08:00, randevu sistemi çöktü. Nöbetçi sensin.”
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
          Dün gece yeni sürüm çıktı. Poliklinik kapısında <strong className="text-rose-300">300 hasta</strong> kayıt bekliyor.
          Kişiye uyum sağlayan <strong className="text-emerald-300">SE Primer</strong> kitabın, aşağıdaki 3 yanıtına göre anlatıyı,
          sistem loglarını ve kısıtları senin için uyarlayacak.
        </p>
      </div>

      {/* Question 1: Seviye */}
      <section className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
              1
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Deneyim Seviyen Nedir?
            </h2>
          </div>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const selected = profile.level === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                data-testid={`select-level-${lvl.id}`}
                onClick={() =>
                  onChangeProfile({ ...profile, level: lvl.id as ExperienceTier })
                }
                className={`text-left rounded-xl border p-3 transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white">{lvl.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                      lvl.id === 'veteran'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {lvl.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">
                  {lvl.adaptationRule}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Question 2: Rol */}
      <section className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
              2
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Nöbetçi Mühendis Rolün?
            </h2>
          </div>
          <Cpu className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="space-y-1.5">
          {ENGINEERING_ROLES.map((role) => {
            const selected = profile.role === role.id;
            return (
              <button
                key={role.id}
                type="button"
                data-testid={`select-role-${role.id}`}
                onClick={() =>
                  onChangeProfile({ ...profile, role: role.id as EngineeringRole })
                }
                className={`w-full text-left rounded-xl border p-2.5 transition-all flex items-start justify-between gap-2 ${
                  selected
                    ? 'border-cyan-500 bg-cyan-500/15'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">{role.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {role.focusDescription}
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
                  {role.shortBadge}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Question 3: Hedef */}
      <section className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              3
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Birincil Kriz Hedefin?
            </h2>
          </div>
          <Target className="w-4 h-4 text-amber-400" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRIMARY_GOALS.map((goal) => {
            const selected = profile.goal === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                data-testid={`select-goal-${goal.id}`}
                onClick={() =>
                  onChangeProfile({ ...profile, goal: goal.id as PrimaryGoal })
                }
                className={`text-left rounded-xl border p-2.5 transition-all flex flex-col justify-between ${
                  selected
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 mb-1">
                    {goal.shortBadge}
                  </span>
                  <div className="text-xs font-bold text-white leading-tight">
                    {goal.title}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  {goal.focusDescription}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Primer Adaptation Summary Card */}
      <div
        className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1.5"
        data-testid="adaptation-preview"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <Sparkles className="w-4 h-4" />
          <span>Kitap Uyarlama Özeti (Canlı Kalibrasyon)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">{activeLevel.title}</strong> seviyesinde,{' '}
          <strong className="text-cyan-300">{activeRole.title}</strong> gözüyle ve{' '}
          <strong className="text-amber-300">{activeGoal.title}</strong> önceliğiyle
          oynayacaksın.{' '}
          {profile.level === 'novice'
            ? 'Her kararda otomatik Sokratik ipucu kartı açılacak.'
            : 'Her kararda 60 saniyelik stres sayacı işleyecek!'}
        </p>
      </div>

      {/* Start CTA */}
      <button
        type="button"
        data-testid="start-simulation-btn"
        onClick={onStartIncident}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-sm py-4 px-5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Nöbeti Devral · 08:00 Krizini Başlat</span>
      </button>
    </div>
  );
};
