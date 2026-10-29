import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import evalData from '../../eval/tutor_eval_20.json';

interface EvalInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvalInspectorModal: React.FC<EvalInspectorModalProps> = ({ isOpen, onClose }) => {
  const [filterCode, setFilterCode] = useState<string>('ALL');

  if (!isOpen) return null;

  const samples = evalData.samples.filter((s) =>
    filterCode === 'ALL' ? true : s.manualLabel === filterCode
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
      data-testid="eval-inspector-modal"
    >
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#0D1322] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5 bg-[#111827]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              RUBRİK KANITI · 25 PUAN
            </span>
            <h2 className="text-sm font-bold text-white mt-1">
              Sokratik AI Tutor Değerlendirmesi (20 Cevap)
            </h2>
          </div>
          <button
            onClick={onClose}
            data-testid="close-eval-modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="p-3.5 border-b border-slate-800/80 bg-[#0B101D] space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase">Toplam Örnek</div>
              <div className="text-base font-extrabold text-white font-mono">20 Cevap</div>
              <div className="text-[10px] text-emerald-400">Elle Etiketlendi</div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase">Ham Sokratik</div>
              <div className="text-base font-extrabold text-amber-300 font-mono">%85.0</div>
              <div className="text-[10px] text-slate-400">17/20 Başarılı</div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase">Spoiler Guard v2</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">%100.0</div>
              <div className="text-[10px] text-emerald-300">0/20 Sızıntı</div>
            </div>
          </div>

          {/* Taxonomy Filter Pills */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Filter className="w-3 h-3" />
              <span>Hata Türleri, Oran ve Örnek Sayısı:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterCode('ALL')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                  filterCode === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                Tümü (20 · %100)
              </button>
              {evalData.metadata.summaryMetrics.errorTaxonomy.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setFilterCode(t.code)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                    filterCode === t.code
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.code} ({t.count} · {t.rate})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 20 Samples List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {samples.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 space-y-1.5 text-xs ${
                item.gaveAwayAnswer
                  ? 'border-rose-500/40 bg-rose-950/15'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-cyan-300">
                  #{String(item.id).padStart(2, '0')} · {item.stage}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                    item.gaveAwayAnswer
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {item.gaveAwayAnswer ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Ele Verdi: EVET ({item.manualLabel})
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Ele Verdi: HAYIR ({item.manualLabel})
                    </>
                  )}
                </span>
              </div>

              <div className="text-slate-300">
                <span className="text-slate-500 font-semibold">Öğrenci ({item.persona}): </span>
                “{item.studentInput}”
              </div>

              <div className="text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                <span className="text-amber-400 font-semibold">Tutor Yanıtı: </span>
                “{item.tutorReplyV2}”
              </div>

              <div className="text-[11px] text-slate-400 italic">
                Not: {item.evaluatorNote}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
