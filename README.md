# 🏛️ TesourApp - Sistema de Gestão para Igrejas

SaaS completo para gestão financeira e administrativa de igrejas, desenvolvido com Next.js 14, TypeScript, Supabase e TailwindCSS.

## 🚀 Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Validação:** Zod
- **Estilização:** TailwindCSS
- **Gráficos:** Recharts
- **Ícones:** React Icons

## 📋 Funcionalidades Principais

- ✅ **Gestão Financeira Completa**
  - Controle de receitas (dízimos, ofertas)
  - Controle de despesas com categorias
  - Relatórios mensais e anuais
  - Exportação em PDF

- ✅ **Sistema de Membros**
  - Cadastro completo de membros
  - Criação de contas para membros
  - Upload de fotos de perfil
  - Histórico de contribuições

- ✅ **Calendário e Eventos**
  - Calendário de eventos/cultos
  - Confirmação de presença
  - Integração com WhatsApp para lembretes

- ✅ **Sistema de Permissões**
  - Roles hierárquicos (Owner, Tesoureiro, Marketing, Membro)
  - Permissões granulares por funcionalidade
  - Controle de acesso baseado em roles

- ✅ **Dashboard Interativo**
  - Gráficos de receitas e despesas
  - Métricas em tempo real
  - Visualizações por categoria

## 🛠️ Setup do Projeto

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd church-saas
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Configure o Supabase**

- Crie um novo projeto no Supabase
- Execute o script SQL em `supabase/schema.sql` no SQL Editor do Supabase
- Configure o Storage para upload de arquivos (avatars, recibos)

5. **Execute o projeto em desenvolvimento**

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
church-saas/
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas do dashboard
│   └── page.tsx           # Landing page
├── components/            # Componentes React
│   ├── ui/               # Componentes reutilizáveis
│   ├── dashboard/        # Componentes do dashboard
│   └── ...
├── lib/                  # Utilitários e configurações
│   ├── supabase/        # Cliente Supabase
│   ├── validations/     # Schemas Zod
│   └── utils/           # Funções utilitárias
├── hooks/               # Custom hooks
├── types/               # Tipos TypeScript
└── supabase/            # Scripts SQL e migrations
```

## 🔐 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- Validação de dados com **Zod** no cliente e servidor
- Autenticação via **Supabase Auth** com JWT
- Políticas de acesso baseadas em roles e permissões

## 📊 Banco de Dados

O schema completo está em `supabase/schema.sql`. Principais tabelas:

- `churches` - Igrejas
- `user_profiles` - Perfis de usuários
- `members` - Membros
- `revenues` - Receitas
- `expenses` - Despesas
- `events` - Eventos
- `event_attendances` - Confirmações de presença
- `user_permissions` - Permissões de usuários

## 🎨 Design System

- **Cores:** Indigo (#6366f1) e Purple (#a855f7)
- **Tipografia:** Plus Jakarta Sans (títulos) e Inter (corpo)
- **Componentes:** Cards arredondados, sombras suaves, transições

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
```

## 🚧 Fases de Desenvolvimento

Consulte `PLANEJAMENTO_PROJETO.md` para o planejamento completo em fases.

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Contribuindo

Este é um projeto privado. Para sugestões ou problemas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para fortalecer a gestão do Reino**

