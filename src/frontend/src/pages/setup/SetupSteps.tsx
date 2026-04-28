import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, ExternalLink, CheckCircle2,
  Users, Scissors, Settings, PlayCircle, Sparkles,
  Clock, ChevronRight, RefreshCw, MessageCircle, Loader2,
} from 'lucide-react';
import {
  connectInstance,
  getInstanceStatus,
  provisionInstance,
  type InstanceStatus,
} from '@/services/uazapi';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/useAuth';
import { getNichoGroup, NICHO_LABELS, TUTORIAL_VIDEO_IDS } from '@/lib/nichoConfig';

// ---------------------------------------------------------------------------
// Shared nav bar used by every step
// ---------------------------------------------------------------------------

interface StepNavProps {
  prevPath?: string;
  nextPath: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  stepLabel: string;
}

function StepNav({ prevPath, nextPath, nextLabel = 'Próximo', nextDisabled, stepLabel }: StepNavProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-indigo-900/30">
      <div>
        {prevPath && (
          <button
            onClick={() => navigate(prevPath)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>
        )}
      </div>
      <span className="text-xs text-zinc-600">{stepLabel}</span>
      <button
        onClick={() => navigate(nextPath)}
        disabled={nextDisabled}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
          nextDisabled
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)]',
        )}
      >
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instructional action card — used in steps 2, 3, 4
// ---------------------------------------------------------------------------

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  ctaLabel: string;
  /** Route path for SPA navigation OR external URL → opens in new tab */
  ctaHref: string;
  ctaNewTab?: boolean;
}

function ActionCard({ icon, title, description, steps, ctaLabel, ctaHref, ctaNewTab }: ActionCardProps) {
  const navigate = useNavigate();

  const handleCta = () => {
    if (ctaNewTab) {
      window.open(ctaHref, '_blank', 'noopener,noreferrer');
    } else {
      navigate(ctaHref);
    }
  };

  return (
    <div className="bg-[#1A2744] border border-indigo-900/40 rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-700/40 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-1">{title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>

      <ol className="space-y-3 mb-8">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <button
        onClick={handleCta}
        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_22px_rgba(99,102,241,0.45)]"
      >
        {ctaLabel}
        {ctaNewTab ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </button>
      {ctaNewTab && (
        <p className="text-xs text-zinc-600 mt-3">
          Abre em nova aba — volte aqui para continuar o tutorial.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Boas-vindas & Vídeo Tutorial (PRD-v2 §5.2.4)
// ---------------------------------------------------------------------------

export function StepWelcome() {
  const { user } = useAuth();
  const nichoRaw = (user?.user_metadata?.nicho as string | undefined) ?? '';
  const nichoGroup = getNichoGroup(nichoRaw);
  const labels = NICHO_LABELS[nichoGroup];
  const videoId = TUTORIAL_VIDEO_IDS[nichoGroup];

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'você';

  return (
    <div>
      {/* Hero block */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-700/40 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Bem-vindo ao Pulseo, {firstName}!
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
          {labels.welcomeSubtitle}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-indigo-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Tempo estimado: 10–15 minutos</span>
        </div>
      </div>

      {/* Value cards (PRD-v2 §5.2.4 — bloco 1) */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { emoji: '✨', label: 'Setup rápido',       desc: 'Configure tudo em poucos minutos' },
          { emoji: '🎯', label: 'Simples & intuitivo', desc: 'Sem conhecimento técnico' },
          { emoji: '🚀', label: 'Comece a agendar',   desc: 'Pronto para usar imediatamente' },
        ].map(({ emoji, label, desc }) => (
          <div
            key={label}
            className="bg-[#1A2744] border border-indigo-900/30 rounded-xl p-4 text-center hover:border-indigo-700/50 transition-colors"
          >
            <span className="text-2xl mb-2 block">{emoji}</span>
            <p className="text-xs font-bold text-zinc-200 mb-1">{label}</p>
            <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
          </div>
        ))}
      </div>

      {/* Video block (PRD-v2 §5.2.4 — bloco 2) */}
      <div className="bg-[#1A2744] border border-indigo-900/40 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
          Assista ao passo a passo em vídeo
        </h3>
        {videoId ? (
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Tutorial Pulseo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* Placeholder when no video is configured (PRD-v2 §5.6) */
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-indigo-900/50 bg-indigo-950/20 py-12">
            <PlayCircle className="w-12 h-12 text-indigo-700" />
            <p className="text-sm text-zinc-500 text-center">
              Em breve: vídeo tutorial para{' '}
              <span className="text-zinc-400">{labels.professionals.toLowerCase()}</span>
            </p>
            <p className="text-[11px] text-zinc-700">
              Configurado pelo administrador da plataforma
            </p>
          </div>
        )}
      </div>

      {/* Dashboard preview prompt (PRD-v2 §5.2.4 — bloco 3) */}
      <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-5 mb-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-3">
          O que você terá ao final
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            `${labels.professionals} cadastrados`,
            `${labels.services} definidos`,
            'Horários configurados',
            `Pronto para receber ${labels.clients}`,
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <StepNav
        nextPath="/setup/professionals"
        nextLabel="Começar"
        stepLabel="Passo 1 de 5"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Cadastre os Profissionais (PRD-v2 §5.2.5)
// ---------------------------------------------------------------------------

export function StepProfessionals() {
  const { user } = useAuth();
  const nichoGroup = getNichoGroup((user?.user_metadata?.nicho as string | undefined) ?? '');
  const labels = NICHO_LABELS[nichoGroup];

  return (
    <div>
      <ActionCard
        icon={<Users className="w-6 h-6 text-indigo-400" />}
        title={`Cadastre seus ${labels.professionals}`}
        description={labels.professionalsInstruction}
        steps={[
          `Acesse "${labels.professionals}" no menu lateral`,
          `Clique em "Novo ${labels.professionalsSingular}"`,
          'Preencha nome, e-mail e senha de acesso',
          `Repita para cada ${labels.professionalsSingular.toLowerCase()}`,
        ]}
        ctaLabel={`Ir para ${labels.professionals}`}
        ctaHref="/dashboard/professionals"
        ctaNewTab
      />

      {/* Upsell note (PRD-v2 §5.5) */}
      <div className="mt-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-yellow-500 text-sm shrink-0">⚠️</span>
        <p className="text-xs text-yellow-200/70">
          <strong className="text-yellow-300">Comissões</strong> estão disponíveis apenas nos planos Business e Professional.
          No plano Starter o campo aparece bloqueado.
        </p>
      </div>

      <StepNav
        prevPath="/setup/welcome"
        nextPath="/setup/services"
        stepLabel="Passo 2 de 5"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Defina os Serviços (PRD-v2 §5.2.6)
// ---------------------------------------------------------------------------

export function StepServices() {
  const { user } = useAuth();
  const nichoGroup = getNichoGroup((user?.user_metadata?.nicho as string | undefined) ?? '');
  const labels = NICHO_LABELS[nichoGroup];

  return (
    <div>
      <ActionCard
        icon={<Scissors className="w-6 h-6 text-indigo-400" />}
        title={`Defina seus ${labels.services}`}
        description={`Cadastre os ${labels.services.toLowerCase()} que sua empresa oferece, com preço e duração.`}
        steps={[
          `Acesse "${labels.services}" no menu lateral`,
          `Clique em "Novo ${labels.servicesSingular}"`,
          `Defina nome, preço e duração (minutos)`,
          `Vincule ao(s) ${labels.professionals.toLowerCase()} responsável(is)`,
          `Cadastre todos os ${labels.services.toLowerCase()}`,
        ]}
        ctaLabel={`Ir para ${labels.services}`}
        ctaHref="/dashboard/services"
        ctaNewTab
      />

      {/* Suggested services chip list (PRD-v2 §5.2.6) */}
      <div className="mt-4 bg-[#1A2744] border border-indigo-900/30 rounded-xl px-5 py-4">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Sugestões para o seu nicho
        </p>
        <div className="flex flex-wrap gap-2">
          {labels.suggestedServices.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 text-xs bg-indigo-900/40 border border-indigo-800/50 text-indigo-300 px-3 py-1 rounded-full"
            >
              <ChevronRight className="w-3 h-3" />
              {s}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">
          Use "Usar templates sugeridos" dentro da tela de {labels.services.toLowerCase()} para adicionar todos de uma vez.
        </p>
      </div>

      <StepNav
        prevPath="/setup/professionals"
        nextPath="/setup/settings"
        stepLabel="Passo 3 de 5"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Configurações Gerais (PRD-v2 §5.2.7)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// WhatsApp QR Code connection panel (embedded in Step 4)
// QR countdown: 120 s (PRD-v3 §5.2.7)
// Polling: 3 s (PRD-v3 §4.2.1 passo 8)
// ---------------------------------------------------------------------------

const QR_TIMEOUT_S     = 120;
const POLL_INTERVAL_MS = 3_000;
const LS_KEY           = 'pulseo_wa_connected';

interface WhatsAppConnectProps {
  /** Supabase JWT — backend resolves instance token server-side. */
  jwt: string;
  onConnected: () => void;
}

function WhatsAppConnect({ jwt, onConnected }: WhatsAppConnectProps) {
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<InstanceStatus | 'idle' | 'loading'>('idle');
  const [countdown, setCountdown] = useState(QR_TIMEOUT_S);
  const [error, setError] = useState<string | null>(null);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current)      clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleConnected = useCallback(() => {
    stopPolling();
    localStorage.setItem(LS_KEY, 'true');
    onConnected();
  }, [onConnected]);

  const startQr = useCallback(async () => {
    stopPolling();
    setError(null);
    setConnectionStatus('loading');
    setQrDataUri(null);
    setCountdown(QR_TIMEOUT_S);

    try {
      const { qrcode } = await connectInstance(jwt);
      setQrDataUri(qrcode);
      setConnectionStatus('connecting');
    } catch (e) {
      setError((e as Error).message ?? 'Não foi possível gerar o QR Code.');
      setConnectionStatus('idle');
      return;
    }

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) { clearInterval(countdownRef.current!); return 0; }
        return s - 1;
      });
    }, 1_000);

    // Status polling every 3 s (PRD-v3 §4.2.1 passo 8)
    pollRef.current = setInterval(async () => {
      try {
        const result = await getInstanceStatus(jwt);
        setConnectionStatus(result.status);
        if (result.status === 'connected') {
          handleConnected();
        } else if (result.status === 'qrExpired') {
          stopPolling();
          setQrDataUri(null);
        }
      } catch {
        // transient network error — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [jwt, handleConnected]);

  useEffect(() => {
    startQr();
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isExpired   = connectionStatus === 'qrExpired' || countdown === 0;
  const isConnected = connectionStatus === 'connected';

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(74,222,128,0.25)]">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-green-400 font-semibold text-sm">WhatsApp Business conectado!</p>
        <p className="text-zinc-500 text-xs text-center max-w-xs">
          Seu número está vinculado. Mensagens automáticas já estão ativas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Instructions */}
      <ol className="w-full space-y-2 mb-2">
        {[
          'Abra o WhatsApp Business no seu celular',
          'Toque em ⋮ → Aparelhos Vinculados → Vincular um aparelho',
          'Aponte a câmera para o QR Code abaixo',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {/* QR area */}
      <div className="relative w-52 h-52 rounded-2xl border-2 border-indigo-700/40 bg-white flex items-center justify-center overflow-hidden">
        {connectionStatus === 'loading' && (
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        )}

        {qrDataUri && !isExpired && (
          <img src={qrDataUri} alt="QR Code WhatsApp" className="w-full h-full object-cover" />
        )}

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F1729]/90 backdrop-blur-sm rounded-2xl">
            <p className="text-xs text-zinc-400 text-center px-4">QR Code expirado</p>
            <button
              onClick={startQr}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Gerar novo QR Code
            </button>
          </div>
        )}
      </div>

      {/* Countdown */}
      {connectionStatus === 'connecting' && !isExpired && (
        <p className="text-xs text-zinc-500">
          QR Code válido por{' '}
          <span className={cn('font-mono font-bold', countdown <= 10 ? 'text-red-400' : 'text-zinc-300')}>
            {countdown}s
          </span>
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
      )}

      <p className="text-[10px] text-zinc-600 text-center max-w-xs">
        Obrigatório: <strong className="text-zinc-500">WhatsApp Business</strong>. WhatsApp pessoal não é suportado.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Configurações & Conexão WhatsApp (PRD-v3 §4.2)
// ---------------------------------------------------------------------------

export function StepSettings() {
  const { session } = useAuth();
  const jwt = session?.access_token ?? null;

  // Persist connected state across page refreshes
  const [whatsappConnected, setWhatsappConnected] = useState(
    () => localStorage.getItem('pulseo_wa_connected') === 'true',
  );
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);

  const provision = useCallback(() => {
    if (!jwt) return;
    setProvisioning(true);
    setProvisionError(null);
    provisionInstance(jwt)
      .then(() => { /* instance ready on backend */ })
      .catch((e: Error) => setProvisionError(e.message))
      .finally(() => setProvisioning(false));
  }, [jwt]);

  // Provision on mount so instance token is ready on backend
  useEffect(() => { provision(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnected = useCallback(() => {
    setWhatsappConnected(true);
  }, []);

  return (
    <div>
      {/* WhatsApp QR connect panel */}
      <div className="bg-[#1A2744] border border-indigo-900/40 rounded-2xl p-6 sm:p-8 mb-4">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-700/40 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Conectar WhatsApp Business</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Escaneie o QR Code para vincular seu número. Confirmações e lembretes serão enviados automaticamente.
            </p>
          </div>
        </div>

        {provisioning && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <p className="text-sm text-zinc-400">Preparando instância WhatsApp…</p>
          </div>
        )}

        {provisionError && !provisioning && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-red-400 text-center max-w-xs">{provisionError}</p>
            <button
              onClick={provision}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Show connected badge if already connected (localStorage), else show QR */}
        {!provisioning && !provisionError && whatsappConnected && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(74,222,128,0.25)]">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-green-400 font-semibold text-sm">WhatsApp Business conectado!</p>
            <p className="text-zinc-500 text-xs text-center max-w-xs">
              Seu número está vinculado. Mensagens automáticas já estão ativas.
            </p>
          </div>
        )}

        {!provisioning && !provisionError && !whatsappConnected && jwt && (
          <WhatsAppConnect
            jwt={jwt}
            onConnected={handleConnected}
          />
        )}
      </div>

      {/* Other settings card */}
      <ActionCard
        icon={<Settings className="w-6 h-6 text-indigo-400" />}
        title="Demais Configurações"
        description="Ajuste logo, endereço, pagamentos e horários de funcionamento."
        steps={[
          'Seção A — Dados do negócio: logo, endereço, telefone',
          'Seção B — Pagamentos: PIX, cartão, dinheiro, MB Way',
          'Seção C — Horários: Seg–Dom com pausa configurável',
          'Salve cada seção antes de avançar',
        ]}
        ctaLabel="Ir para Configurações"
        ctaHref="/dashboard/settings"
        ctaNewTab
      />

      <StepNav
        prevPath="/setup/services"
        nextPath="/setup/done"
        nextLabel="Concluir Setup"
        nextDisabled={!whatsappConnected}
        stepLabel="Passo 4 de 5"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Conclusão (PRD-v2 §5.2.8)
// ---------------------------------------------------------------------------

export function StepDone() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nichoGroup = getNichoGroup((user?.user_metadata?.nicho as string | undefined) ?? '');
  const labels = NICHO_LABELS[nichoGroup];

  return (
    <div className="text-center py-4">
      {/* Success badge */}
      <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_32px_rgba(34,197,94,0.2)]">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>

      <h1 className="text-3xl font-bold text-zinc-100 mb-3">
        Tudo configurado!
      </h1>
      <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Você está pronto para receber {labels.clients}.{' '}
        Acesse o dashboard para fazer seu primeiro agendamento.
      </p>

      {/* Checklist */}
      <div className="bg-[#1A2744] border border-indigo-900/40 rounded-2xl p-6 text-left max-w-sm mx-auto mb-8">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
          Resumo da configuração
        </p>
        <ul className="space-y-3">
          {[
            `${labels.professionals} cadastrados`,
            `${labels.services} definidos`,
            'Horários e pagamentos configurados',
            'Sistema pronto para uso',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-500 hover:bg-green-400 text-zinc-900 font-bold rounded-xl text-sm transition-all shadow-[0_0_24px_rgba(74,222,128,0.35)] hover:shadow-[0_0_32px_rgba(74,222,128,0.5)]"
      >
        Ir para o Dashboard
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-zinc-600 mt-4">
        Você pode retomar a qualquer momento em Configurações.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legacy exports kept for backwards compatibility during migration
// (App.tsx old routes — will be removed once routes are updated)
// ---------------------------------------------------------------------------
export { StepWelcome as StepCompany };
export { StepWelcome as StepWhatsApp };
export { StepWelcome as StepPayments };
export { StepWelcome as StepFirstBooking };
