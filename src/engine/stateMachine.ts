export type ExperienceTier = 'novice' | 'veteran';
export type EngineeringRole = 'arch' | 'sre' | 'secops';
export type PrimaryGoal = 'uptime' | 'integrity' | 'compliance';

export interface CalibrationProfile {
  level: ExperienceTier;
  role: EngineeringRole;
  goal: PrimaryGoal;
}

export type DecisionStageId = 'STAGE_1_ARCH' | 'STAGE_2_TEST' | 'STAGE_3_KVKK';
export type ChoiceOptionKey = 'A' | 'B';

export interface DecisionRecord {
  stageId: DecisionStageId;
  stageTitle: string;
  chosenKey: ChoiceOptionKey;
  chosenLabel: string;
  timedOut: boolean;
  whatHappened: string;
  whyItHappened: string;
  roleSpecificInsight: string;
  telemetryDelta: {
    clockAfter: string;
    waitingPatientsAfter: number;
    stabilityScoreAfter: number;
    kvkkBreached: boolean;
  };
}

export type EndingType = 'SON_A_IYI' | 'SON_B_KOTU';

export type MachinePhase =
  | 'S0_CALIBRATION'
  | 'S1_IN_PROGRESS'
  | 'S2_EPILOGUE';

export interface TelemetrySnapshot {
  incidentClock: string;
  waitingPatients: number;
  stabilityScore: number;
  kvkkCompliant: boolean;
}

export interface PrimerMachineState {
  phase: MachinePhase;
  profile: CalibrationProfile;
  currentStageIndex: number; // 0 -> Mimari, 1 -> Test, 2 -> KVKK
  decisions: DecisionRecord[];
  activeCausalReview: DecisionRecord | null;
  telemetry: TelemetrySnapshot;
  ending: EndingType | null;
}

export const INITIAL_TELEMETRY: TelemetrySnapshot = {
  incidentClock: '08:00',
  waitingPatients: 300,
  stabilityScore: 35,
  kvkkCompliant: true,
};

export const STAGE_ORDER: DecisionStageId[] = [
  'STAGE_1_ARCH',
  'STAGE_2_TEST',
  'STAGE_3_KVKK',
];

export function createInitialMachineState(
  defaultProfile?: Partial<CalibrationProfile>
): PrimerMachineState {
  return {
    phase: 'S0_CALIBRATION',
    profile: {
      level: defaultProfile?.level ?? 'novice',
      role: defaultProfile?.role ?? 'arch',
      goal: defaultProfile?.goal ?? 'uptime',
    },
    currentStageIndex: 0,
    decisions: [],
    activeCausalReview: null,
    telemetry: { ...INITIAL_TELEMETRY },
    ending: null,
  };
}

/**
 * Sommerville Bölüm 5 Durum Makinesi Sonuç Belirleme Fonksiyonu:
 * - SON A · İYİ ("08:25 sistem ayakta, veri güvende"):
 *   KVKK adımında A (Maskele) seçilmiş olmalı VE Test adımında A (Kısa test koş) seçilmiş olmalı.
 * - SON B · KÖTÜ ("Sistem ayakta ama KVKK ihlali" / Kritik Hasar):
 *   KVKK adımında B (Olduğu gibi at) seçildiyse veya Test atlanıp canlı sistem bozulduysa.
 */
export function evaluateFinalEnding(decisions: DecisionRecord[]): EndingType {
  const archChoice = decisions.find((d) => d.stageId === 'STAGE_1_ARCH')?.chosenKey;
  const testChoice = decisions.find((d) => d.stageId === 'STAGE_2_TEST')?.chosenKey;
  const kvkkChoice = decisions.find((d) => d.stageId === 'STAGE_3_KVKK')?.chosenKey;

  if (kvkkChoice === 'B') {
    return 'SON_B_KOTU';
  }
  if (testChoice === 'B') {
    return 'SON_B_KOTU';
  }
  if (archChoice === 'B' && testChoice !== 'A') {
    return 'SON_B_KOTU';
  }
  return 'SON_A_IYI';
}
