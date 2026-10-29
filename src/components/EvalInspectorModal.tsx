import React, { useState } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
      data-testid="eval-inspector-modal"
    >
      <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-white border border-[#6c757d] rounded-[3px] text-[#212529] shadow-lg overflow-hidden">
        {/* Classic Blazor Dialog Header */}
        <div className="blazor-top-row px-3.5 py-2.5 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-bold">
              Sokratik AI Tutor Değerlendirme Kayıtları (20 Cevap)
            </div>
            <div className="text-[10px] text-[#cfd8dc] font-mono">
              Elle Etiketleme, Hata Türleri ve Oran Tablosu
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="close-eval-modal"
            className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 text-xs font-bold rounded-[2px] cursor-pointer"
          >
            Kapat [X]
          </button>
        </div>

        {/* Summary Metrics Table */}
        <div className="p-3 border-b border-[#ced4da] bg-[#f8f9fa] space-y-2">
          <table className="w-full border-collapse border border-[#ced4da] bg-white text-xs text-center">
            <thead>
              <tr className="bg-[#e9ecef] text-[#495057]">
                <th className="border border-[#ced4da] py-1 px-2">Toplam Örnek</th>
                <th className="border border-[#ced4da] py-1 px-2">Ham Sokratik (v1)</th>
                <th className="border border-[#ced4da] py-1 px-2">Spoiler Guard (v2)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-mono font-bold">
                <td className="border border-[#ced4da] py-1 px-2">20 Cevap</td>
                <td className="border border-[#ced4da] py-1 px-2 text-[#664d03]">
                  17/20 (%85.0)
                </td>
                <td className="border border-[#ced4da] py-1 px-2 text-[#198754]">
                  20/20 (%100.0)
                </td>
              </tr>
            </tbody>
          </table>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCode('ALL')}
              className={`px-2 py-1 text-[10px] font-mono border rounded-[2px] cursor-pointer ${
                filterCode === 'ALL'
                  ? 'bg-[#1b6ec2] text-white border-[#1861ac]'
                  : 'bg-white text-[#495057] border-[#ced4da]'
              }`}
            >
              Tümü (20 · %100)
            </button>
            {evalData.metadata.summaryMetrics.errorTaxonomy.map((t) => (
              <button
                key={t.code}
                onClick={() => setFilterCode(t.code)}
                className={`px-2 py-1 text-[10px] font-mono border rounded-[2px] cursor-pointer ${
                  filterCode === t.code
                    ? 'bg-[#1b6ec2] text-white border-[#1861ac]'
                    : 'bg-white text-[#495057] border-[#ced4da]'
                }`}
              >
                {t.code} ({t.count} · {t.rate})
              </button>
            ))}
          </div>
        </div>

        {/* 20 Samples List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#f4f6f9]">
          {samples.map((item) => (
            <div
              key={item.id}
              className="border border-[#ced4da] bg-white p-2.5 rounded-[2px] space-y-1 text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#e9ecef] pb-1">
                <span className="font-mono font-bold text-[#052767]">
                  #{String(item.id).padStart(2, '0')} | {item.stage}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[2px] ${
                    item.gaveAwayAnswer
                      ? 'bg-[#f8d7da] text-[#842029] border border-[#f5c2c7]'
                      : 'bg-[#d1e7dd] text-[#0f5132] border border-[#badbcc]'
                  }`}
                >
                  Ele Verdi: {item.gaveAwayAnswer ? 'EVET' : 'HAYIR'} ({item.manualLabel})
                </span>
              </div>

              <div className="text-[#212529]">
                <strong>Öğrenci ({item.persona}): </strong>
                “{item.studentInput}”
              </div>

              <div className="bg-[#fff3cd] border border-[#ffecb5] text-[#664d03] p-1.5 rounded-[2px]">
                <strong>Tutor Yanıtı: </strong>
                “{item.tutorReplyV2}”
              </div>

              <div className="text-[11px] text-[#6c757d]">
                Değerlendirme Notu: {item.evaluatorNote}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
