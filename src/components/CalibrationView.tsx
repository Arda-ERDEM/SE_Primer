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
    <div className="space-y-3 pb-4" data-testid="screen-calibration">
      {/* Classic Bootstrap Danger Alert Box */}
      <div className="bg-[#f8d7da] border border-[#f5c2c7] border-l-4 border-l-[#dc3545] text-[#842029] p-3 rounded-[3px]">
        <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
          <span>OLAY KAYDI #2026-0800</span>
          <span className="bg-[#dc3545] text-white px-1.5 py-0.5 rounded-[2px] text-[10px]">
            KRİTİK ARIZA
          </span>
        </div>
        <h1 className="text-base font-bold text-[#58151c]">
          “08:00, randevu sistemi çöktü. Nöbetçi sensin.”
        </h1>
        <p className="mt-1 text-xs text-[#842029]">
          Dün gece yeni sürüm (v2.4.0) çıktı. Poliklinik girişinde <strong>300 hasta</strong> kayıt bekliyor.
          Aşağıdaki 3 oturum parametresini seçerek simülasyon anlatısını ve sistem kısıtlarını başlatın.
        </p>
      </div>

      {/* Form Panel 1: Deneyim Seviyesi */}
      <div className="blazor-card border-t-[3px] border-t-[#1b6ec2]">
        <div className="blazor-card-header flex items-center justify-between text-xs">
          <span>1. Operatör Deneyim Seviyesi</span>
          <span className="font-mono text-[11px] text-[#6c757d]">Zorunlu Alan</span>
        </div>
        <div className="p-3 space-y-2">
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
                className={`w-full text-left p-2.5 border rounded-[3px] cursor-pointer transition-colors ${
                  selected
                    ? 'bg-[#e7f1ff] border-[#1b6ec2] text-[#084298]'
                    : 'bg-[#ffffff] border-[#ced4da] text-[#212529] hover:bg-[#f8f9fa]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      readOnly
                      checked={selected}
                      className="h-3.5 w-3.5 accent-[#1b6ec2]"
                    />
                    <span className="text-xs font-bold">{lvl.title}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono border rounded-[2px] ${
                      lvl.id === 'veteran'
                        ? 'bg-[#f8d7da] text-[#842029] border-[#f5c2c7]'
                        : 'bg-[#fff3cd] text-[#664d03] border-[#ffecb5]'
                    }`}
                  >
                    {lvl.badge}
                  </span>
                </div>
                <p className="mt-1 pl-5 text-[11px] text-[#495057]">
                  {lvl.adaptationRule}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Panel 2: Mühendislik Rolü */}
      <div className="blazor-card border-t-[3px] border-t-[#1b6ec2]">
        <div className="blazor-card-header flex items-center justify-between text-xs">
          <span>2. Nöbetçi Mühendis Rolü</span>
          <span className="font-mono text-[11px] text-[#6c757d]">Birim Ataması</span>
        </div>
        <div className="p-3 space-y-2">
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
                className={`w-full text-left p-2.5 border rounded-[3px] cursor-pointer transition-colors ${
                  selected
                    ? 'bg-[#e7f1ff] border-[#1b6ec2] text-[#084298]'
                    : 'bg-[#ffffff] border-[#ced4da] text-[#212529] hover:bg-[#f8f9fa]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      readOnly
                      checked={selected}
                      className="h-3.5 w-3.5 accent-[#1b6ec2]"
                    />
                    <span className="text-xs font-bold">{role.title}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#e9ecef] text-[#495057] border border-[#ced4da] rounded-[2px]">
                    {role.shortBadge}
                  </span>
                </div>
                <p className="mt-1 pl-5 text-[11px] text-[#495057]">
                  {role.focusDescription}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Panel 3: Birincil Kriz Hedefi */}
      <div className="blazor-card border-t-[3px] border-t-[#1b6ec2]">
        <div className="blazor-card-header flex items-center justify-between text-xs">
          <span>3. Birincil Kriz Hedefi (SLA Önceliği)</span>
          <span className="font-mono text-[11px] text-[#6c757d]">Hedef Kriteri</span>
        </div>
        <div className="p-3 space-y-2">
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
                className={`w-full text-left p-2.5 border rounded-[3px] cursor-pointer transition-colors ${
                  selected
                    ? 'bg-[#e7f1ff] border-[#1b6ec2] text-[#084298]'
                    : 'bg-[#ffffff] border-[#ced4da] text-[#212529] hover:bg-[#f8f9fa]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      readOnly
                      checked={selected}
                      className="h-3.5 w-3.5 accent-[#1b6ec2]"
                    />
                    <span className="text-xs font-bold">{goal.title}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#e9ecef] text-[#495057] border border-[#ced4da] rounded-[2px]">
                    {goal.shortBadge}
                  </span>
                </div>
                <p className="mt-1 pl-5 text-[11px] text-[#495057]">
                  {goal.focusDescription}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Classic Info Summary Table */}
      <div
        className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] p-3 rounded-[3px] text-xs"
        data-testid="adaptation-preview"
      >
        <div className="font-bold mb-1">Aktif Oturum Yapılandırması:</div>
        <p className="leading-normal">
          Seviye: <strong>{activeLevel.title}</strong> | Rol: <strong>{activeRole.title}</strong> | Hedef:{' '}
          <strong>{activeGoal.title}</strong>.{' '}
          {profile.level === 'novice'
            ? '(Süresiz mod ve otomatik başlangıç rehberi aktif.)'
            : '(60 saniyelik karar sayacı aktif, otomatik ipucu kapalı.)'}
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        data-testid="start-simulation-btn"
        onClick={onStartIncident}
        className="w-full blazor-btn-primary font-bold text-sm py-2.5 px-4 shadow-xs cursor-pointer"
      >
        Nöbet Oturumunu Başlat (08:00)
      </button>
    </div>
  );
};
