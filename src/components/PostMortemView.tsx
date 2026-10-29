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
    <div className="space-y-3 pb-4" data-testid="screen-ending">
      {/* Main Outcome Alert Panel */}
      <div
        data-testid={isGoodEnding ? 'ending-banner-good' : 'ending-banner-bad'}
        className={`p-3.5 border border-l-4 rounded-[3px] space-y-2.5 ${
          isGoodEnding
            ? 'bg-[#d1e7dd] border-[#badbcc] border-l-[#198754] text-[#0f5132]'
            : 'bg-[#f8d7da] border-[#f5c2c7] border-l-[#dc3545] text-[#842029]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            data-testid="ending-code-badge"
            className={`px-2 py-0.5 text-xs font-mono font-bold text-white rounded-[2px] ${
              isGoodEnding ? 'bg-[#198754]' : 'bg-[#dc3545]'
            }`}
          >
            {isGoodEnding ? 'SON A · İYİ' : 'SON B · KÖTÜ'}
          </span>
          <span className="font-mono text-xs font-bold">
            Kapanış Saati: {telemetry.incidentClock}
          </span>
        </div>

        <h1
          data-testid="ending-headline"
          className="text-base font-bold leading-snug"
        >
          {isGoodEnding
            ? '08:25 sistem ayakta, veri güvende'
            : 'Sistem ayakta ama KVKK ihlali (veya Kritik Hasar)'}
        </h1>

        <p className="text-xs leading-normal">
          {isGoodEnding
            ? 'Poliklinik girişindeki 300 hastanın randevu akışı saat 08:25 itibarıyla normale döndü. Duman testiyle yapılandırma hatası canlıya çıkmadan yakalandı ve hasta kayıtları SHA-256 ile maskelenerek 6698 sayılı KVKK uyumu korundu.'
            : telemetry.kvkkCompliant
            ? 'Kriz sırasında doğrulama (smoke test) adımı atlandığı için canlı ortamda yapılandırma hatası patladı ve randevu kuyruğunda veri tutarsızlığı oluştu.'
            : 'Sistem ayağa kalkmış olsa da, hata loglarındaki hasta adları ve tanı kodları maskelenmeden paylaşıldığı için 6698 sayılı KVKK Madde 12 kapsamında veri ihlali gerçekleşti.'}
        </p>

        {/* Summary Table */}
        <table className="w-full border-collapse border border-[#adb5bd] bg-white text-[#212529] text-xs text-center">
          <thead>
            <tr className="bg-[#f8f9fa] font-semibold">
              <th className="border border-[#dee2e6] py-1 px-2">Çözüm Saati</th>
              <th className="border border-[#dee2e6] py-1 px-2">Bekleyen Kuyruk</th>
              <th className="border border-[#dee2e6] py-1 px-2">KVKK Durumu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold">
                08:25
              </td>
              <td className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold">
                {telemetry.waitingPatients} Hasta
              </td>
              <td className="border border-[#dee2e6] py-1.5 px-2 font-mono font-bold">
                {telemetry.kvkkCompliant ? (
                  <span className="text-[#198754]">GÜVENDE</span>
                ) : (
                  <span className="text-[#dc3545]">İHLAL!</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Operator Profile Info */}
      <div className="blazor-card p-2.5 text-xs bg-[#f8f9fa]">
        <strong>Oturum Parametreleri: </strong>
        Seviye: {levelMeta.title} | Rol: {roleMeta.title} | Hedef: {goalMeta.title}
      </div>

      {/* 3-Step Audit Trail Card */}
      <div className="blazor-card border-t-[3px] border-t-[#052767]">
        <div className="blazor-card-header text-xs">
          Karar Dökümü ve Kök Neden Kayıtları (1 → 2 → 3)
        </div>

        <div className="p-3 space-y-2.5">
          {decisions.map((d, idx) => (
            <div
              key={d.stageId}
              data-testid={`summary-step-${idx + 1}`}
              className="border border-[#ced4da] bg-[#f8f9fa] p-2.5 rounded-[2px] space-y-1 text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#dee2e6] pb-1">
                <span className="font-mono font-bold text-[#052767]">
                  {d.stageTitle}
                </span>
                <span
                  className={`px-1.5 py-0.5 font-mono text-[10px] font-bold text-white rounded-[2px] ${
                    d.chosenKey === 'A' ? 'bg-[#198754]' : 'bg-[#dc3545]'
                  }`}
                >
                  {d.chosenLabel}
                </span>
              </div>
              <p className="text-[#212529]">
                <strong>Ne Oldu:</strong> {d.whatHappened}
              </p>
              <p className="text-[#495057]">
                <strong>Neden Oldu:</strong> {d.whyItHappened}
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
          className="w-full blazor-btn-primary font-bold text-xs py-2.5 px-4 cursor-pointer"
        >
          Yeni Oturum Başlat (Farklı Parametrelerle)
        </button>

        <button
          type="button"
          data-testid="open-eval-from-ending-btn"
          onClick={onOpenEvalModal}
          className="w-full bg-[#6c757d] hover:bg-[#5c636a] text-white font-semibold text-xs py-2 px-4 rounded-[3px] cursor-pointer"
        >
          Sokratik Tutor Değerlendirme Tablosunu Aç (20 Kayıt)
        </button>
      </div>
    </div>
  );
};
