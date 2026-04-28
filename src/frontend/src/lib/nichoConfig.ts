// ---------------------------------------------------------------------------
// Nicho configuration — PRD-v2 §5.2, §5.3, §7, §8
// Centralises all nicho-specific copy used across the Setup Wizard.
// ---------------------------------------------------------------------------

export type NichoGroup = 'barbershop' | 'clinic' | 'esthetic' | 'other';

/** Maps raw nicho value from user_metadata to a canonical group. */
export function getNichoGroup(nicho: string): NichoGroup {
  const map: Record<string, NichoGroup> = {
    barbearia:          'barbershop',
    salao_beleza:       'barbershop',
    studio_estetica:    'esthetic',
    clinica_medica:     'clinic',
    consultorio:        'clinic',
    clinica_estetica:   'esthetic',
    spa:                'esthetic',
    centro_bem_estar:   'esthetic',
    nutricao:           'clinic',
    fisioterapia:       'clinic',
    psicologia:         'clinic',
    centro_formacao:    'other',
    academia:           'other',
    outro:              'other',
  };
  return map[nicho] ?? 'other';
}

// ---------------------------------------------------------------------------
// Per-group copy (PRD-v2 §5.2.3 — step labels; §5.1.3 — subtitle)
// ---------------------------------------------------------------------------

export interface NichoLabels {
  /** Subtitle shown on step 1 welcome panel (PRD-v2 §5.1.3) */
  welcomeSubtitle: string;
  /** Step 2 label and content */
  professionals: string;
  professionalsSingular: string;
  professionalsInstruction: string;
  /** Step 3 label and content */
  services: string;
  servicesSingular: string;
  /** Generic term for clients */
  clients: string;
  /** Suggested services list (PRD-v2 §5.2.6) */
  suggestedServices: string[];
}

export const NICHO_LABELS: Record<NichoGroup, NichoLabels> = {
  barbershop: {
    welcomeSubtitle:          'Monte sua barbearia, convide a equipe e comece a agendar hoje.',
    professionals:            'Barbeiros',
    professionalsSingular:    'Barbeiro',
    professionalsInstruction: 'Cadastre os barbeiros que trabalham no seu estabelecimento.',
    services:                 'Serviços',
    servicesSingular:         'Serviço',
    clients:                  'clientes',
    suggestedServices: [
      'Corte adulto', 'Corte infantil', 'Barba', 'Combo corte+barba', 'Pigmentação',
    ],
  },
  clinic: {
    welcomeSubtitle:          'Monte sua clínica, cadastre sua equipe médica e comece a atender hoje.',
    professionals:            'Médicos / Equipe',
    professionalsSingular:    'Médico',
    professionalsInstruction: 'Cadastre os médicos e profissionais de saúde da clínica.',
    services:                 'Consultas & Exames',
    servicesSingular:         'Consulta',
    clients:                  'pacientes',
    suggestedServices: [
      'Consulta clínica geral', 'Retorno', 'Exame de sangue', 'ECG', 'Telemedicina',
    ],
  },
  esthetic: {
    welcomeSubtitle:          'Monte seu estúdio, cadastre seus profissionais e comece a receber hoje.',
    professionals:            'Profissionais',
    professionalsSingular:    'Profissional',
    professionalsInstruction: 'Cadastre os profissionais de estética do seu estabelecimento.',
    services:                 'Procedimentos',
    servicesSingular:         'Procedimento',
    clients:                  'clientes',
    suggestedServices: [
      'Limpeza de pele', 'Botox', 'Preenchimento', 'Laser', 'Drenagem', 'Massagem modeladora',
    ],
  },
  other: {
    welcomeSubtitle:          'Configure seu negócio, convide a equipe e comece a atender hoje.',
    professionals:            'Profissionais',
    professionalsSingular:    'Profissional',
    professionalsInstruction: 'Cadastre os profissionais que trabalham no seu negócio.',
    services:                 'Serviços',
    servicesSingular:         'Serviço',
    clients:                  'clientes',
    suggestedServices: ['Serviço 1', 'Serviço 2', 'Serviço 3'],
  },
};

// ---------------------------------------------------------------------------
// Tutorial video URLs — managed via Superadmin area (PRD-v2 §5.6 / §9.4).
// Fallback to empty string → placeholder shown in StepWelcome.
// In production these come from `tenant_settings.tutorial_video_url_<group>`.
// ---------------------------------------------------------------------------

export const TUTORIAL_VIDEO_IDS: Record<NichoGroup, string> = {
  barbershop: '',
  clinic:     '',
  esthetic:   '',
  other:      '',
};
