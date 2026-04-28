import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Building2, Mail, Phone, Lock, Eye, EyeOff,
  Scissors, Stethoscope, Sparkles, BookOpen, Dumbbell, Brain,
  GraduationCap, Settings, Globe, Calendar, DollarSign, Users,
  CheckCircle2, ArrowRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';

// ---------------------------------------------------------------------------
// Sector options (PRD-v2 § 5.1.1 — Dropdown "Sector de Negócio")
// ---------------------------------------------------------------------------

const SECTORS = [
  {
    group: '🪒 Cabeleireiros, Barbearias e Estética',
    icon: Scissors,
    options: [
      { value: 'barbearia', label: 'Barbearia' },
      { value: 'salao_beleza', label: 'Salão de Beleza' },
      { value: 'studio_estetica', label: 'Estúdio de Estética' },
    ],
  },
  {
    group: '🏥 Saúde (Multi-Especialidades)',
    icon: Stethoscope,
    options: [
      { value: 'clinica_medica', label: 'Clínica Médica' },
      { value: 'consultorio', label: 'Consultório' },
    ],
  },
  {
    group: '✨ Saúde e Bem-Estar',
    icon: Sparkles,
    options: [
      { value: 'clinica_estetica', label: 'Clínica de Estética' },
      { value: 'spa', label: 'Spa' },
      { value: 'centro_bem_estar', label: 'Centro de Bem-Estar' },
    ],
  },
  {
    group: '🥗 Nutrição',
    icon: BookOpen,
    options: [{ value: 'nutricao', label: 'Consultório de Nutrição' }],
  },
  {
    group: '🦴 Fisioterapia e Osteopatia',
    icon: Dumbbell,
    options: [{ value: 'fisioterapia', label: 'Clínica de Fisioterapia' }],
  },
  {
    group: '🧠 Psicologia',
    icon: Brain,
    options: [{ value: 'psicologia', label: 'Consultório de Psicologia' }],
  },
  {
    group: '📚 Formação',
    icon: GraduationCap,
    options: [
      { value: 'centro_formacao', label: 'Centro de Formação' },
      { value: 'academia', label: 'Academia' },
    ],
  },
  {
    group: '⚙️ Outros',
    icon: Settings,
    options: [{ value: 'outro', label: 'Outro tipo de negócio' }],
  },
] as const;

// ---------------------------------------------------------------------------
// Niche→subtitle mapping (PRD-v2 § 5.1.3)
// ---------------------------------------------------------------------------

const NICHE_SUBTITLE: Record<string, string> = {
  barbearia: 'Monte sua barbearia, convide a equipe e comece a agendar hoje.',
  salao_beleza: 'Monte sua barbearia, convide a equipe e comece a agendar hoje.',
  studio_estetica: 'Monte seu estúdio, cadastre seus profissionais e comece a receber hoje.',
  clinica_medica: 'Monte sua clínica, cadastre sua equipe médica e comece a atender hoje.',
  consultorio: 'Monte sua clínica, cadastre sua equipe médica e comece a atender hoje.',
  clinica_estetica: 'Monte seu estúdio, cadastre seus profissionais e comece a receber hoje.',
  spa: 'Monte seu estúdio, cadastre seus profissionais e comece a receber hoje.',
  centro_bem_estar: 'Monte seu centro, cadastre seus profissionais e comece a atender hoje.',
};
const DEFAULT_SUBTITLE = 'Configure seu negócio, convide a equipe e comece a atender hoje.';

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------

type StrengthLevel = 'empty' | 'weak' | 'good' | 'strong' | 'ideal';

function getPasswordStrength(pwd: string): StrengthLevel {
  if (!pwd) return 'empty';
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  if (pwd.length >= 12 && hasUpper && hasLower && hasNumber && hasSpecial) return 'ideal';
  if (pwd.length >= 10 && hasLower && hasNumber && hasSpecial) return 'strong';
  if (pwd.length >= 8 && (hasLower || hasUpper) && hasNumber) return 'good';
  return 'weak';
}

const STRENGTH_META: Record<StrengthLevel, { label: string; color: string; width: string; glow: boolean }> = {
  empty:  { label: '',         color: 'bg-zinc-800',   width: 'w-0',    glow: false },
  weak:   { label: 'Fraca',   color: 'bg-red-500',    width: 'w-1/4',  glow: false },
  good:   { label: 'Boa',     color: 'bg-yellow-500', width: 'w-2/4',  glow: false },
  strong: { label: 'Forte',   color: 'bg-green-400',  width: 'w-3/4',  glow: false },
  ideal:  { label: 'Ideal ✓', color: 'bg-green-500',  width: 'w-full', glow: true  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Register() {
  const navigate = useNavigate();
  const { signUp, loading, error } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nicho, setNicho] = useState('');
  const [country, setCountry] = useState<'PT' | 'BR'>('PT');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Derived
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const meta = STRENGTH_META[strength];
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const subtitle = nicho ? (NICHE_SUBTITLE[nicho] ?? DEFAULT_SUBTITLE) : DEFAULT_SUBTITLE;

  const phoneMask = country === 'PT' ? '+351 ' : '+55 ';

  const isValid =
    fullName.trim().length >= 3 &&
    businessName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    nicho !== '' &&
    password.length >= 8 &&
    password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await signUp(email, password, {
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      nicho,
      country,
    });

    if (!error) {
      setSubmitted(true);
    }
  };

  // -------------------------------------------------------------------------
  // Email confirmation screen (PRD-v2 § 5.1.5)
  // -------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-[#1A2744] rounded-2xl p-10 border border-indigo-900/50 shadow-2xl text-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-1">
              <span className="text-white font-black text-sm tracking-widest">P</span>
            </div>
            <span className="text-white font-bold text-sm tracking-widest uppercase">Pulseo</span>
          </div>

          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Verifique seu e-mail</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Digite o código de confirmação enviado para o seu e-mail.
          </p>

          <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-green-300 text-sm">
              ✓ Conta criada. Enviamos um link de confirmação para <strong>{email}</strong> para ativar o acesso.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="email"
                readOnly
                value={email}
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all mb-3"
          >
            Reenviar e-mail de confirmação
          </button>
          <Link to="/login" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main registration screen (PRD-v2 § 5.1.1)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0F1729] flex w-full">

      {/* ── Left — Form ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-8 overflow-y-auto">
        <div className="w-full max-w-[480px] py-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-widest">P</span>
            </div>
            <span className="text-white font-bold text-sm tracking-widest uppercase">Pulseo</span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-100 mb-1">Criar conta</h1>
          <p className="text-zinc-400 text-sm mb-8">
            Conta com 7 dias gratuitos. Sem cartão de crédito para começar.
          </p>

          {/* Error banner */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-sm">{error.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Country selector — affects phone mask */}
            <div className="flex gap-3 mb-2">
              {(['PT', 'BR'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCountry(c)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    country === c
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : 'border-zinc-700/60 bg-transparent text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {c === 'PT' ? '🇵🇹 Portugal' : '🇧🇷 Brasil'}
                </button>
              ))}
            </div>

            {/* Full name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="register-full-name"
                type="text"
                required
                minLength={3}
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Business name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="register-business-name"
                type="text"
                required
                placeholder="Nome do negócio (ex: Barber Club)"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="register-phone"
                type="tel"
                placeholder={`${phoneMask}912 345 678`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Sector de Negócio — dropdown with optgroups */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-zinc-500" />
              </div>
              <select
                id="register-sector"
                required
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" disabled className="bg-zinc-900 text-zinc-400">
                  Sector de Negócio *
                </option>
                {SECTORS.map((s) => (
                  <optgroup key={s.group} label={s.group} className="bg-zinc-900 text-zinc-300">
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-200">
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {/* Chevron */}
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="register-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Senha (mínimo 8 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-zinc-900/60 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Alternar visibilidade da senha"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 px-1">
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${meta.color} ${meta.width} ${meta.glow ? 'shadow-[0_0_8px_#22c55e]' : ''}`}
                    />
                  </div>
                  <p className={`text-xs mt-1 transition-colors ${
                    strength === 'ideal' ? 'text-green-400' :
                    strength === 'strong' ? 'text-green-300' :
                    strength === 'good'   ? 'text-yellow-400' :
                                           'text-red-400'
                  }`}>
                    {meta.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Confirmar senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3.5 bg-zinc-900/60 border rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                    confirm.length > 0
                      ? passwordsMatch
                        ? 'border-green-600 focus:border-green-500 focus:ring-green-500'
                        : 'border-red-700/70 focus:border-red-500 focus:ring-red-500'
                      : 'border-zinc-700/60 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Alternar visibilidade da confirmação"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className={`text-xs mt-1.5 px-1 transition-colors ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Senhas coincidem ✓' : 'As senhas não coincidem'}
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              id="register-submit"
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-3.5 px-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_28px_rgba(74,222,128,0.45)] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
              ) : (
                <>Criar conta no Pulseo <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-zinc-500 pt-1">
              Já tem conta?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* ── Right — Value panel (PRD-v2 § 5.1.3) ───────────────────────── */}
      <div className="hidden lg:flex w-[45%] flex-col justify-center p-10 bg-[#1A2744] border-l border-indigo-900/40 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-white font-black text-sm tracking-widest">P</span>
            </div>
            <span className="text-white font-bold tracking-widest uppercase">Pulseo</span>
          </div>

          <h2 className="text-4xl font-bold text-zinc-100 mb-3 leading-tight">
            Crie sua conta
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-10 transition-all duration-300">
            {subtitle}
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: Calendar, label: 'AGENDA', desc: 'Agenda em tempo real' },
              { icon: DollarSign, label: 'FINANCEIRO', desc: 'Caixa e comissões' },
              { icon: Users, label: 'GESTÃO', desc: 'Equipe por função' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-zinc-900/40 border border-indigo-900/30 rounded-xl p-4 text-center hover:border-indigo-700/50 transition-colors">
                <Icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-300 tracking-wider mb-1">{label}</p>
                <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-zinc-900/30 border border-indigo-900/30 rounded-xl p-6">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Seu sistema pronto para crescer junto
            </p>
            <ul className="space-y-3">
              {[
                'Crie o negócio, equipe e serviços em poucos passos.',
                'Visualize ocupação, faturamento e horários.',
                'Comunique-se com clientes e confirme o acesso inicial com código.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Back to login link */}
          <div className="mt-8">
            <Link to="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Voltar para login
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
