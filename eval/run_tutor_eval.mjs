import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.join(__dirname, 'tutor_eval_20.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

const SPOILER_PATTERNS = [
  /\b[AB]\s*şıkkı/i,
  /\b[AB]'yi\s*seç/i,
  /eski\s+sürüme\s+geri\s+dön(melisin|!)/i,
  /kısa\s+test\s+koşmayı\s+seçmelisin/i,
  /hemen\s+yayına\s+almalısın/i,
];

function verifySpoilerGuard(replyText) {
  const hasSpoiler = SPOILER_PATTERNS.some((rx) => rx.test(replyText));
  const endsWithQuestion = replyText.trim().endsWith('?');
  return {
    hasSpoiler,
    endsWithQuestion,
    isCompliant: !hasSpoiler && endsWithQuestion,
  };
}

console.log('================================================================================');
console.log(' YZM301 · SE PRIMER — SOKRATİK AI TUTOR DEĞERLENDİRME RAPORU (25 PUAN)');
console.log('================================================================================\n');

let v1Pass = 0;
let v1Spoilers = 0;
let v2Pass = 0;
const taxonomyCounts = {};

for (const sample of dataset.samples) {
  taxonomyCounts[sample.manualLabel] = (taxonomyCounts[sample.manualLabel] || 0) + 1;

  const checkV1 = verifySpoilerGuard(sample.tutorReplyV1);
  const checkV2 = verifySpoilerGuard(sample.tutorReplyV2);

  if (checkV1.isCompliant) v1Pass++;
  if (sample.gaveAwayAnswer) v1Spoilers++;
  if (checkV2.isCompliant) v2Pass++;

  const statusBadge = sample.gaveAwayAnswer
    ? '[CEVABI ELE VERDİ: EVET]'
    : '[CEVABI ELE VERDİ: HAYIR]';

  console.log(
    `#${String(sample.id).padStart(2, '0')} | ${sample.stage.padEnd(18)} | ${sample.manualLabel.padEnd(21)} | ${statusBadge}`
  );
}

console.log('\n--------------------------------------------------------------------------------');
console.log(' HATA TÜRLERİ, ORAN VE ÖRNEK SAYISI ÖZETİ (N = 20)');
console.log('--------------------------------------------------------------------------------');
for (const item of dataset.metadata.summaryMetrics.errorTaxonomy) {
  console.log(
    `• ${item.code.padEnd(22)} : ${String(item.count).padStart(2, ' ')} örnek (${item.rate.padStart(5, ' ')}) | Cevap Sızıntısı: ${
      item.gaveAwayAnswer ? 'EVET' : 'HAYIR'
    } -> ${item.label}`
  );
}

console.log('\n--------------------------------------------------------------------------------');
console.log(`• Ham Model (v1) Sokratik Uyum Oranı          : ${v1Pass}/20 (${((v1Pass / 20) * 100).toFixed(1)}%)`);
console.log(`• Ham Model (v1) Cevap Sızdırma Oranı         : ${v1Spoilers}/20 (${((v1Spoilers / 20) * 100).toFixed(1)}%)`);
console.log(`• Spoiler Guard (v2) Sonrası Sokratik Uyum    : ${v2Pass}/20 (${((v2Pass / 20) * 100).toFixed(1)}%)`);
console.log('================================================================================\n');

if (v2Pass !== 20) {
  process.exit(1);
}
