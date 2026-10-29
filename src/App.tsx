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

export function App() {
  const [machine, setMachine] = useState<PrimerMachineState>(() =>
    createInitialMachineState()
  );

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

  const currentBreadcrumb =
    machine.phase === 'S0_CALIBRATION'
      ? 'Oturum Kalibrasyonu'
      : machine.phase === 'S1_IN_PROGRESS'
      ? `Kriz Müdahalesi / Adım ${machine.currentStageIndex + 1}`
      : 'Nöbet Sonuç Raporu';

  return (
    <div className="min-h-screen bg-[#dee2e6] text-[#212529] flex flex-col items-center justify-start">
      {/* Classic Blazor Mobile / Responsive Container */}
      <div className="w-full max-w-md min-h-screen bg-[#f4f6f9] border-x border-[#adb5bd] flex flex-col shadow-sm">
        {/* Classic Blazor Top Navbar (#052767 -> #3a0647) */}
        <header className="blazor-top-row sticky top-0 z-30 px-3 py-2.5 text-white flex items-center justify-between">
          <div>
            <div className="text-sm font-bold tracking-tight">
              HBYS.Primer.Web
            </div>
            <div className="text-[11px] text-[#cfd8dc] font-mono">
              Modül: YZM301.KrizSimulasyonu
            </div>
          </div>

          {machine.phase !== 'S0_CALIBRATION' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="header-reset-btn"
                onClick={handleRestart}
                className="bg-[#dc3545] hover:bg-[#bb2d3b] border border-[#b02a37] text-white px-2 py-1 text-xs font-semibold rounded-[3px] cursor-pointer"
              >
                Sıfırla
              </button>
            </div>
          )}
        </header>

        {/* Sub-header Breadcrumb Strip (Classic Bootstrap / AdminLTE / Blazor style) */}
        <div className="bg-[#e9ecef] border-b border-[#ced4da] px-3 py-1.5 flex items-center justify-between text-xs text-[#495057]">
          <div>
            <span className="font-semibold text-[#1b6ec2]">Ana Sayfa</span>
            <span className="mx-1.5 text-[#6c757d]">/</span>
            <span>{currentBreadcrumb}</span>
          </div>
          <span className="font-mono text-[11px] text-[#495057]">
            Durum: Aktif
          </span>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-3 overflow-y-auto">
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
            />
          )}
        </main>

        {/* Classic Blazor Server Status Footer */}
        <footer className="border-t border-[#ced4da] bg-[#ffffff] px-3 py-2 flex items-center justify-between text-[11px] text-[#6c757d] font-mono">
          <span>HBYS.Randevu.Servis v2.4.0</span>
          <span>6698 KVKK Denetim Modu</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
