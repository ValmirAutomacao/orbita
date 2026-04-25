# Pulseo Saúde ERP (Protótipo SaaS)

Este é um protótipo construído com **React (Vite), Tailwind CSS**, focado em ser o ponto de partida do seu SaaS Médico e gerado em um ambiente sandbox focado em frontend rápido. 

## Atendendo as suas requisições:
1. **Next.js & React**: Embora este ambiente sandbox (Google AI Studio) execute Vite por padrão para apresentar um preview instantâneo na web, toda a estrutura de componentes (em `src/components`, `src/pages`, `src/layouts`) usa padrões Next.js/React modernos que podem ser migrados 1-para-1 para a pasta `app/` ou `pages/` de um projeto Next.js real através do Claude Code.
2. **Tailwind CSS & Componentes UI**: Utilizamos Tailwind v4 com uma abordagem híbrida de componentes reutilizáveis estilo `shadcn/ui` (presentes em `src/components/ui`), como: Botões, Cards, Inputs e Labels, garantindo a estética e a estrutura requisitadas.
3. **Capacitor**: O `capacitor.config.ts` já foi criado na raiz e os pacotes `@capacitor/core` e `@capacitor/cli` foram instalados no `package.json`. Tudo está pronto para rodar `npx cap add android` ou `npx cap add ios`.
4. **Fluxo de Telas Exato**:
   - Tela de Autenticação/Login modernizada.
   - **Onboarding Guiado (Passo 1 a 10)** conforme o seu fluxo, centralizado em `SetupLayout.tsx` contendo menu lateral com status de progresso, e telas construídas em `SetupSteps.tsx`.
   - **Dashboard Principal** altamente fiel ao screenshot fornecido (gráficos feitos em `recharts`, estrutura de navegação lateral, métricas chave).

## Como importar isso no Claude Code:
1. Baixe o projeto em formato ZIP usando a opção de exportação do painel (roda dentada acima, "Export to ZIP").
2. Na sua máquina local, descompacte, e solicite ao Claude Code: *"Leia o código contido e adapte a estrutura para meu repositório Next.js atual, mantendo as pastas de componentes e migrando o React Router para as rotas do Next 14 (App Router)."*
