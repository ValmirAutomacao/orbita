import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Scissors, Stethoscope, Sparkles, Building2, UploadCloud, Plus, ArrowRight, 
  Check, MessageSquare, Smartphone, CreditCard, Palette, Globe, Clock, Layout, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Step 1: Welcome (Niche Selection)
export function StepWelcome() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const niches = [
    { id: 'clinic', name: 'Clínica Médica', icon: Stethoscope, color: 'text-blue-500' },
    { id: 'esthetic', name: 'Clínica de Estética', icon: Sparkles, color: 'text-pink-500' },
    { id: 'salon', name: 'Salão de Beleza', icon: Scissors, color: 'text-amber-500' },
    { id: 'other', name: 'Outro', icon: Building2, color: 'text-emerald-500' },
  ];

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-zinc-100 mb-2">Bem-vindo ao Pulseo</h2>
        <p className="text-zinc-400 mb-8">Para começarmos, qual é o nicho do seu negócio?</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {niches.map((niche) => {
            const Icon = niche.icon;
            return (
              <button
                key={niche.id}
                onClick={() => setSelected(niche.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all duration-200",
                  selected === niche.id 
                    ? "border-zinc-500 bg-[#2C2C2E] text-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                    : "border-[#2C2C2E] hover:border-zinc-700 hover:bg-[#2C2C2E] text-zinc-300"
                )}
              >
                <Icon className={cn("w-10 h-10 mb-3", niche.color, selected === niche.id ? "" : "opacity-70 grayscale-0")} />
                <span className="font-medium">{niche.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button onClick={() => navigate('/setup/company')} disabled={!selected}>
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Company Data
export function StepCompany() {
  const navigate = useNavigate();
  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-zinc-100 mb-2">Dados da Empresa</h2>
        <p className="text-zinc-400 mb-6">Preencha as informações básicas do seu negócio.</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Comercial</Label>
              <Input placeholder="Ex: Clínica Saúde+" />
            </div>
            <div className="space-y-2">
              <Label>NIF/CNPJ</Label>
              <Input placeholder="00.000.000/0001-00" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Endereço Completo</Label>
            <Input placeholder="Rua principal, 123" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="contato@clinica.com" />
            </div>
          </div>
          
          <div className="pt-4">
            <Label className="mb-2 block">Logo da Empresa</Label>
            <div className="border-2 border-dashed border-[#2C2C2E] rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:bg-[#2C2C2E] hover:border-zinc-700 transition-colors cursor-pointer">
              <UploadCloud className="w-8 h-8 mb-2 text-zinc-600" />
              <p className="text-sm">Arraste e solte ou clique para fazer upload</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/setup/welcome')}>Voltar</Button>
        <Button onClick={() => navigate('/setup/whatsapp')}>
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}


// Step 6: WhatsApp
export function StepWhatsApp() {
  const navigate = useNavigate();
  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-zinc-100 mb-2">Conectar Comunicação</h2>
        <p className="text-zinc-400 mb-6">Ative os lembretes automáticos para reduzir faltas de pacientes.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border-2 border-emerald-500 bg-emerald-500/10 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
              RECOMENDADO
            </div>
            <MessageSquare className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-bold text-emerald-300 mb-1">Uazapi (Dev)</h4>
            <p className="text-sm text-emerald-100/70 mb-4">Conexão via QR Code em 30 segundos usando seu aparelho atual.</p>
            <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0">Conectar via QR Code</Button>
          </div>

          <div className="border border-[#2C2C2E] rounded-xl p-6 opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
            <Smartphone className="w-8 h-8 text-blue-400 mb-4" />
            <h4 className="font-bold text-zinc-100 mb-1">Meta Cloud API</h4>
            <p className="text-sm text-zinc-500 mb-4">Para clínicas de grande porte. Requer aprovação da Meta/Facebook.</p>
            <Button size="sm" variant="outline" className="w-full text-zinc-400" disabled>Em breve no painel</Button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/setup/company')}>Voltar</Button>
        <Button onClick={() => navigate('/setup/payments')}>
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 7: Payments
export function StepPayments() {
  const navigate = useNavigate();
  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-zinc-100 mb-2">Meios de Pagamento</h2>
        <p className="text-zinc-400 mb-6">Configure como você aceita pagamentos no caixa e online.</p>
        
        <div className="space-y-4">
          {[
            { id: 'pix', name: 'PIX', desc: 'Transferência instantânea via QR Code', active: true, color: 'text-teal-400 bg-teal-400/20' },
            { id: 'cielo', name: 'Cartão (Cielo / Stripe)', desc: 'Crédito e débito na maquininha ou online', active: false, color: 'text-blue-400 bg-blue-400/20' },
            { id: 'cash', name: 'Dinheiro Cédula', desc: 'Recebimento no balcão', active: true, color: 'text-emerald-400 bg-emerald-400/20' }
          ].map((method) => (
            <div key={method.id} className="border border-[#2C2C2E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-zinc-700 transition-colors" onClick={(e) => {
                 const container = e.currentTarget;
                 const btn = container.querySelector('.rounded-full.relative');
                 const iconContainer = container.querySelector('.p-2.rounded-lg');
                 
                 if (btn?.classList.contains('bg-zinc-100')) {
                     btn.classList.replace('bg-zinc-100', 'bg-[#3A3A3C]');
                     btn.querySelector('div')?.classList.replace('right-1', 'left-1');
                     iconContainer?.classList.add('grayscale', 'opacity-50');
                 } else {
                     btn?.classList.replace('bg-[#3A3A3C]', 'bg-zinc-100');
                     btn?.querySelector('div')?.classList.replace('left-1', 'right-1');
                     iconContainer?.classList.remove('grayscale', 'opacity-50');
                 }
            }}>
              <div className="flex items-start gap-4 pointer-events-none">
                <div className={cn("p-2 rounded-lg transition-colors", method.color, !method.active && "grayscale opacity-50")}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-zinc-100">{method.name}</h4>
                  <p className="text-sm text-zinc-500">{method.desc}</p>
                </div>
              </div>
              <div className={cn("w-11 h-6 rounded-full relative shrink-0 transition-colors pointer-events-none", method.active ? "bg-zinc-100" : "bg-[#3A3A3C]")}>
                 <div className={cn("w-4 h-4 bg-[#1C1C1E] rounded-full absolute top-1 shadow-sm transition-all", method.active ? "right-1" : "left-1")}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/setup/whatsapp')}>Voltar</Button>
        <Button onClick={() => navigate('/setup/first-booking')}>
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}


// Step 10: First Booking
export function StepFirstBooking() {
    const navigate = useNavigate();
    return (
      <div className="p-8 flex flex-col h-full bg-[#2C2C2E] rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-zinc-800/50 blur-3xl"></div>
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 py-12">
          <div className="w-20 h-20 bg-zinc-800 text-zinc-200 rounded-full flex items-center justify-center mb-6 shadow-sm border border-zinc-700">
             <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">Tudo Pronto!</h2>
          <p className="text-zinc-100 max-w-md mx-auto mb-8">
            Seu sistema foi configurado perfeitamente. Sua clínica já está pronta para 
            receber o primeiro agendamento online.
          </p>
          
          <div className="bg-[#1C1C1E] rounded-xl shadow-sm p-4 w-full max-w-sm mb-8 text-left border border-zinc-700">
             <h4 className="font-semibold text-zinc-100 mb-3 text-sm uppercase tracking-wide">Resumo da Instalação</h4>
             <ul className="space-y-2 text-sm text-zinc-100">
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-200" /> Dados da empresa cadastrados</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-200" /> Comunicação WhatsApp pronta</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-zinc-200" /> Pagamentos configurados</li>
             </ul>
          </div>
        </div>
        <div className="mt-4 flex justify-between z-10 border-t border-zinc-700/50 pt-6">
          <Button variant="outline" className="bg-[#1C1C1E] text-zinc-100 border-zinc-700 hover:bg-[#2C2C2E]" onClick={() => navigate('/setup/payments')}>Voltar</Button>
          <Button onClick={() => navigate('/dashboard')} className="bg-zinc-100 hover:bg-zinc-200 text-[#111111] shadow-lg shadow-zinc-800/30 font-medium px-8">
            Acessar o Dashboard
          </Button>
        </div>
      </div>
    )
}
