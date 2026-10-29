import React, { useState } from 'react';
import {
  CalibrationProfile,
  ChoiceOptionKey,
  createInitialMachineState,
  evaluateFinalEnding,
  INITIAL_TELEMETRY,
  PrimerMachineState,
  STAGE_ORDER,
} from './engine/stateMachine';
import { buildDecisionOutcome } from './domain/incidentMatrix';
import { CalibrationView } from './components/CalibrationView';
import { IncidentStageView } from './components/IncidentStageView';
import { PostMortemView } from './components/PostMortemView';
import { EvalInspectorModal } from './components/EvalInspectorModal';
import { BookOpen, ClipboardList, RotateCcw } from 'lucide-react';

export function App() {
  const [machine, setMachine] = useState<PrimerMachineState>(() =>
    createInitialMachineState()
  );
  const [isEvalOpen, setIsEvalOpen] = useState<boolean>(false);

  const handleProfileChange = (updatedProfile: CalibrationProfile) => {
    setMachine((prev) => ({
      ...prev,
      profile: updatedProfile,
    }));
  };

  const handleStartIncident = () => {
    setMachine((prev) => ({
      ...prev,
      phase: 'S1_IN_PROGRESS',
      currentStageIndex: 0,
      decisions: [],
      activeCausalReview: null,
      telemetry: { ...INITIAL_TELEMETRY },
      ending: null,
    }));
  };

  const handleSelectChoice = (chosenKey: ChoiceOptionKey, timedOut: boolean = false) => {
    setMachine((prev) => {
      if (prev.activeCausalReview) return prev;
      const stageId = STAGE_ORDER[prev.currentStageIndex];
      const outcome = buildDecisionOutcome(
        stageId,
        chosenKey,
        prev.profile,
        prev.telemetry,
        timedOut
      );

      return {
        ...prev,
        activeCausalReview: outcome,
        telemetry: {
          incidentClock: outcome.telemetryDelta.clockAfter,
          waitingPatients: outcome.telemetryDelta.waitingPatientsAfter,
          stabilityScore: outcome.telemetryDelta.stabilityScoreAfter,
          kvkkCompliant: prev.telemetry.kvkkCompliant && !outcome.telemetryDelta.kvkkBreached,
        },
      };
    });
  };

  const handleProceedNextStage = () => {
    setMachine((prev) => {
      if (!prev.activeCausalReview) return prev;
      const updatedDecisions = [...prev.decisions, prev.activeCausalReview];
      const nextIndex = prev.currentStageIndex + 1;

      if (nextIndex >= STAGE_ORDER.length) {
        const finalEnding = evaluateFinalEnding(updatedDecisions);
        return {
          ...prev,
          phase: 'S2_EPILOGUE',
          decisions: updatedDecisions,
          activeCausalReview: null,
          ending: finalEnding,
        };
      }

      return {
        ...prev,
        currentStageIndex: nextIndex,
        decisions: updatedDecisions,
        activeCausalReview: null,
      };
    });
  };

  const handleRestart = () => {
    setMachine((prev) => createInitialMachineState(prev.profile));
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col items-center justify-start sm:py-4">
      {/* Mobile Viewport Shell (390px - 448px) */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[844px] bg-[#090D16] sm:rounded-3xl sm:border sm:border-slate-800/90 shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky Top App Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/90 bg-[#0D1322]/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>SE PRIMER</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                  YZM301
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Klinik Nöbet & Kriz Muhakemesi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="open-eval-modal-btn"
              onClick={() => setIsEvalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1.5 text-[11px] font-mono font-bold text-amber-300 transition cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Eval (20)</span>
            </button>

            {machine.phase !== 'S0_CALIBRATION' && (
              <button
                type="button"
                data-testid="header-reset-btn"
                onClick={handleRestart}
                title="Başa Dön"
                className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-1.5 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Main Screen Container */}
        <main className="flex-1 px-3.5 pt-3.5 overflow-y-auto">
          {machine.phase === 'S0_CALIBRATION' && (
            <CalibrationView
              profile={machine.profile}
              onChangeProfile={handleProfileChange}
              onStartIncident={handleStartIncident}
            />
          )}

          {machine.phase === 'S1_IN_PROGRESS' && (
            <IncidentStageView
              stageId={STAGE_ORDER[machine.currentStageIndex]}
              profile={machine.profile}
              telemetry={machine.telemetry}
              activeCausalReview={machine.activeCausalReview}
              onSelectChoice={handleSelectChoice}
              onProceedNextStage={handleProceedNextStage}
            />
          )}

          {machine.phase === 'S2_EPILOGUE' && machine.ending && (
            <PostMortemView
              ending={machine.ending}
              profile={machine.profile}
              decisions={machine.decisions}
              telemetry={machine.telemetry}
              onRestart={handleRestart}
              onOpenEvalModal={() => setIsEvalOpen(true)}
            />
          )}
        </main>

        {/* Footer Info Bar */}
        <footer className="border-t border-slate-800/80 bg-[#0B101D] px-4 py-2.5 text-center text-[10px] text-slate-500 font-mono">
          Google Stitch → Google AI Studio → Cypress E2E · 6698 KVKK Uyumlu
        </footer>
      </div>

      {/* 25-Point Tutor Eval Modal */}
      <EvalInspectorModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
      />
    </div>
  );
}

export default App;
