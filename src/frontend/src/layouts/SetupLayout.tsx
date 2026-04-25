import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Boas-vindas', path: 'welcome' },
  { id: 2, name: 'Empresa', path: 'company' },
  { id: 3, name: 'WhatsApp', path: 'whatsapp' },
  { id: 4, name: 'Pagamentos', path: 'payments' },
  { id: 5, name: 'Conclusão', path: 'first-booking' },
];

export default function SetupLayout() {
  const location = useLocation();
  const currentStepIndex = steps.findIndex(s => location.pathname.includes(s.path));
  const currentStepId = steps[currentStepIndex]?.id || 1;
  const progress = Math.round((currentStepId / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#111111] text-zinc-100 font-sans flex overflow-hidden">
      {/* Mobile Top Bar (Hidden on Desktop) */}
      <div className="lg:hidden absolute top-0 left-0 right-0 bg-[#1C1C1E] border-b border-[#2C2C2E] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between z-10">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
             <span className="text-[#111111] font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg text-zinc-100">Configuração Inicial</span>
        </div>
        <div className="text-sm font-medium text-zinc-500">
          Passo {currentStepId} de {steps.length}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#1C1C1E] border-r border-[#2C2C2E] hidden lg:flex flex-col shrink-0">
        <div className="p-6 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-[#111111] font-bold">P</div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-200">Pulseo <span className="text-zinc-200 text-sm">ERP</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {steps.map((step) => {
            const isComplete = step.id < currentStepId;
            const isCurrent = step.id === currentStepId;

            return (
              <div key={step.name} className={cn(
                "flex items-center gap-3 p-3 rounded-lg text-sm",
                isComplete ? "bg-green-50 text-green-700 font-medium" :
                isCurrent ? "bg-[#2C2C2E] text-zinc-100 font-bold" :
                "text-zinc-600"
              )}>
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 text-[#111111] flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-500 text-zinc-200 flex items-center justify-center text-[10px]">
                    {step.id}
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#3C3C3E] flex items-center justify-center text-[10px]">
                    {step.id}
                  </div>
                )}
                <span>{step.id}. {step.name}</span>
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#2C2C2E]">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
            <span>Progresso Geral</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#2C2C2E] rounded-full">
            <div className="h-full bg-[#3b42fc] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#111111] relative overflow-y-auto pt-24 lg:pt-0">
        <div className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-5xl mx-auto flex flex-col h-full">
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
              <span>Passo {currentStepId} de {steps.length}</span>
              <span className="text-[#3b42fc]">{progress}% Concluído</span>
            </div>
            <div className="w-full h-2 bg-[#1C1C1E] border border-[#2C2C2E] rounded-full overflow-hidden">
               <div className="h-full bg-[#3b42fc] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E] shadow-sm flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
