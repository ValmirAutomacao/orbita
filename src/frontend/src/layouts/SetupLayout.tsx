import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/useAuth';
import { getNichoGroup, NICHO_LABELS } from '@/lib/nichoConfig';

// ---------------------------------------------------------------------------
// Step definitions — PRD-v2 §5.2.3
// Steps are dynamic per nicho but paths are fixed.
// ---------------------------------------------------------------------------

export type SetupStepPath = 'welcome' | 'professionals' | 'services' | 'settings' | 'done';

interface StepDef {
  id: number;
  path: SetupStepPath;
  labelFn: (group: ReturnType<typeof getNichoGroup>) => string;
}

const STEP_DEFS: StepDef[] = [
  { id: 1, path: 'welcome',       labelFn: () => 'Bem-vindo' },
  { id: 2, path: 'professionals', labelFn: (g) => NICHO_LABELS[g].professionals },
  { id: 3, path: 'services',      labelFn: (g) => NICHO_LABELS[g].services },
  { id: 4, path: 'settings',      labelFn: () => 'Configurações' },
  { id: 5, path: 'done',          labelFn: () => 'Pronto!' },
];

// ---------------------------------------------------------------------------
// SetupLayout
// ---------------------------------------------------------------------------

export default function SetupLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const nichoRaw = (user?.user_metadata?.nicho as string | undefined) ?? '';
  const nichoGroup = getNichoGroup(nichoRaw);

  const steps = STEP_DEFS.map((s) => ({ ...s, label: s.labelFn(nichoGroup) }));

  const currentPath = location.pathname.split('/').pop() as SetupStepPath;
  const currentIndex = steps.findIndex((s) => s.path === currentPath);
  const currentStep = steps[currentIndex] ?? steps[0];
  const progress = Math.round(((currentStep.id - 1) / (steps.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-[#0F1729] text-zinc-100 flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-[#0F1729] border-b border-indigo-900/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-white font-black text-[11px] tracking-widest">P</span>
          </div>
          <span className="text-zinc-300 font-semibold text-sm tracking-wide">Pulseo</span>
          <span className="text-zinc-600 text-xs">/ Configuração Inicial</span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          title="Pular por enquanto"
        >
          <X className="w-3.5 h-3.5" />
          Pular por enquanto
        </button>
      </header>

      {/* ── Stepper — horizontal, PRD-v2 §5.2.3 ────────────────────────── */}
      <div className="shrink-0 bg-[#0F1729] border-b border-indigo-900/30 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center">
            {steps.map((step, idx) => {
              const isDone    = step.id < currentStep.id;
              const isCurrent = step.id === currentStep.id;
              const isLast    = idx === steps.length - 1;

              return (
                <React.Fragment key={step.path}>
                  {/* Circle + label */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                      isDone    && 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]',
                      isCurrent && 'bg-indigo-600 text-white shadow-[0_0_14px_rgba(99,102,241,0.5)] ring-2 ring-indigo-400/30',
                      !isDone && !isCurrent && 'bg-zinc-800 text-zinc-500 border border-zinc-700',
                    )}>
                      {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step.id}
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium text-center leading-tight hidden sm:block max-w-[72px]',
                      isDone    && 'text-green-400',
                      isCurrent && 'text-indigo-300',
                      !isDone && !isCurrent && 'text-zinc-600',
                    )}>
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 mx-2 h-px relative">
                      <div className="absolute inset-0 bg-zinc-800 rounded-full" />
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-600/60 rounded-full transition-all duration-500"
                        style={{ width: isDone ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress label */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-zinc-500">
              Passo {currentStep.id} de {steps.length}
            </span>
            <span className="text-xs text-indigo-400 font-medium">{progress}% concluído</span>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
