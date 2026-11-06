import React, { useState } from 'react';
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
  formatSessionRowsAsCsv,
  SessionTelemetryRow,
} from '../services/onnxAdaptiveEngine';

interface PostMortemViewProps {
  sessionId: string;
  ending: EndingType;
  profile: CalibrationProfile;
  decisions: DecisionRecord[];
  telemetry: TelemetrySnapshot;
  sessionRows: SessionTelemetryRow[];
  onRestart: () => void;
}

export const PostMortemView: React.FC<PostMortemViewProps> = ({
  sessionId,
  ending,
  profile,
  decisions,
  telemetry,
  sessionRows,
  onRestart,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const isGoodEnding = ending === 'SON_A_IYI';
  const levelMeta = EXPERIENCE_LEVELS.find((l) => l.id === profile.level)!;
  const roleMeta = ENGINEERING_ROLES.find((r) => r.id === profile.role)!;
  const goalMeta = PRIMARY_GOALS.find((g) => g.id === profile.goal)!;

  const totalCount = decisions.length || 3;
  const correctCount = decisions.filter((d) => d.chosenKey === 'A' && !d.timedOut).length;
  const missedCount = totalCount - correctCount;
  const successRatePct = Number(((correctCount / totalCount) * 100).toFixed(1));

  const csvContent = formatSessionRowsAsCsv(sessionRows);

  const handleCopyCsv = async () => {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const blob = new Blob([csvContent + '\n'], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `oturum_${sessionId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch {
      setDownloaded(true);
    }
  };

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
        Seviye: {levelMeta.title} | Rol: {roleMeta.title} | Hedef: {goalMeta.title} | Oturum: #{sessionId}
      </div>

      {/* Karar Başarı Oranı ve Doğru Kararlar Özeti (KPI Kartları) */}
      <div className="blazor-card p-3 space-y-2.5" data-testid="decision-kpi-summary">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-[#d1e7dd] text-[#0f5132] rounded-full">
            ● Nöbet tamamlandı
          </span>
          <span className="text-[11px] font-mono text-[#6c757d]">
            Oturum #{sessionId}
          </span>
        </div>

        <h2 className="text-sm font-bold text-[#212529]">
          Hikâye bitti. {totalCount} kritik kararın {correctCount} tanesi doğruydu.
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#f8f9fa] border border-[#dee2e6] p-2.5 rounded-[3px] flex flex-col justify-between">
            <div className="text-[11px] text-[#495057]">Başarı oranı</div>
            <div
              className="text-xl font-bold font-mono text-[#052767] my-1"
              data-testid="kpi-success-rate"
            >
              %{successRatePct}
            </div>
            <div className="w-full h-1.5 bg-[#dee2e6] rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  correctCount === totalCount ? 'bg-[#198754]' : 'bg-[#fd7e14]'
                }`}
                style={{ width: `${Math.max(5, successRatePct)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#f8f9fa] border border-[#dee2e6] p-2.5 rounded-[3px] flex flex-col justify-between">
            <div className="text-[11px] text-[#495057]">Doğru kararlar</div>
            <div
              className="text-xl font-bold font-mono text-[#052767] my-1"
              data-testid="kpi-correct-count"
            >
              {correctCount} / {totalCount}
            </div>
            <div className="text-[10px] text-[#6c757d]">
              {missedCount === 0
                ? 'Tüm adımlar güvenliydi'
                : `${missedCount} tanesi daha iyi olabilirdi`}
            </div>
          </div>
        </div>
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

      {/* v2.0 KVKK-Compliant Session Telemetry CSV Export Card (macOS Terminal Style + 3 Action Buttons) */}
      <div
        className="blazor-card border-t-[3px] border-t-[#198754]"
        data-testid="session-csv-export-card"
      >
        <div className="bg-[#2d2d2d] text-[#e0e0e0] px-3 py-2 flex items-center justify-between border-b border-[#1e1e1e]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
            <span className="ml-2 font-mono text-[11px] text-[#cfd8dc]">
              oturum.csv
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#81c784]">
            KVKK Uyumlu · kaynak=gercek
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          <pre
            data-testid="session-csv-output"
            className="bg-[#1e1e1e] text-[#d4d4d4] p-2.5 font-mono text-[10px] overflow-x-auto rounded-[2px] border border-[#3c3c3c]"
          >
            {csvContent}
          </pre>

          <p className="text-[11px] text-[#495057] leading-normal">
            Teşekkürler! Bu yazıyı oyunu yaptıran kişiye gönder; kişisel bilgi içermez (rastgele 4-hex oturum kodu: <code>{sessionId}</code>). Sayfayı yenilersen bu oturum kaybolur, önce kopyala veya indir.
          </p>

          {/* 3 Stacked Action Buttons: Yazıyı kopyala / CSV indir / Yeniden oyna */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              data-testid="copy-session-csv-btn"
              onClick={handleCopyCsv}
              className="w-full bg-[#198754] hover:bg-[#157347] border border-[#146c43] text-white font-bold text-xs py-2.5 px-4 rounded-[3px] cursor-pointer transition-colors"
            >
              {copied ? '✓ Yazı Panoya Kopyalandı!' : 'Yazıyı kopyala'}
            </button>

            <button
              type="button"
              data-testid="download-session-csv-btn"
              onClick={handleDownloadCsv}
              className="w-full bg-[#ffffff] hover:bg-[#e9ecef] border border-[#adb5bd] text-[#212529] font-semibold text-xs py-2.5 px-4 rounded-[3px] cursor-pointer transition-colors"
            >
              {downloaded ? `✓ oturum_${sessionId}.csv İndirildi` : 'CSV indir'}
            </button>

            <button
              type="button"
              data-testid="replay-simulation-btn"
              onClick={onRestart}
              className="w-full blazor-btn-primary font-bold text-xs py-2.5 px-4 cursor-pointer"
            >
              Yeniden oyna (Yeni Oturum Başlat)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
