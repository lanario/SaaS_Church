# 📋 Planejamento do Projeto - TesourApp

## 🎯 Visão Geral do Projeto

SaaS completo para gestão financeira e administrativa de igrejas, com sistema de permissões hierárquico, gestão de membros, eventos e integração com WhatsApp.

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (tipagem rigorosa)
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Validação:** Zod
- **Estilização:** TailwindCSS
- **Gráficos:** Recharts
- **Ícones:** React Icons
- **Formulários:** React Hook Form + Zod

---

## 📊 Arquitetura do Banco de Dados (Supabase)

### Tabelas Principais

```sql
-- Igrejas (Organizações)
churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Usuários (Autenticação via Supabase Auth)
-- Tabela extendida para dados adicionais
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  church_id UUID REFERENCES churches(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL, -- 'owner', 'treasurer', 'marketing', 'member'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Membros da Igreja
members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- NULL se ainda não tem conta
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  member_since DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'visitor'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Categorias de Receitas
revenue_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Categorias de Despesas
expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#ef4444',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Transações Financeiras (Receitas)
revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  category_id UUID REFERENCES revenue_categories(id),
  member_id UUID REFERENCES members(id), -- NULL se não for de membro específico
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50), -- 'cash', 'pix', 'card', 'transfer'
  receipt_url TEXT, -- URL do recibo digital
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Transações Financeiras (Despesas)
expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  receipt_url TEXT,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Eventos/Cultos
events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  event_type VARCHAR(50), -- 'worship', 'meeting', 'special', 'other'
  whatsapp_message TEXT, -- Mensagem pré-pronta para envio
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Confirmações de Presença
event_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'confirmed', 'pending', 'absent'
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, member_id)
)

-- Permissões de Usuários
user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  church_id UUID REFERENCES churches(id) NOT NULL,
  can_manage_finances BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_events BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_send_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, church_id)
)
```

### Row Level Security (RLS) Policies

- Usuários só podem acessar dados da sua própria igreja
- Membros só podem ver eventos e informações públicas
- Apenas owners e usuários com permissões específicas podem editar dados financeiros
- Upload de avatares restrito ao próprio usuário

---

## 🚀 Fases de Desenvolvimento

### **FASE 1: Fundação e Autenticação** ⏱️ ~2 semanas

#### Objetivos
- Configurar projeto Next.js 14 com TypeScript
- Integração com Supabase
- Landing page responsiva
- Sistema de autenticação completo

#### Tarefas

1. **Setup Inicial**
   - [ ] Inicializar projeto Next.js 14 (App Router)
   - [ ] Configurar TypeScript com regras rigorosas
   - [ ] Instalar e configurar TailwindCSS
   - [ ] Configurar Supabase (cliente, tipos, variáveis de ambiente)
   - [ ] Configurar ESLint e Prettier
   - [ ] Estrutura de pastas do projeto

2. **Landing Page**
   - [ ] Converter template HTML para componentes React/Next.js
   - [ ] Implementar navegação responsiva
   - [ ] Animações e transições suaves
   - [ ] Links funcionais (botões para login/cadastro)
   - [ ] SEO básico (metadata, Open Graph)

3. **Autenticação**
   - [ ] Tela de Login (com validação Zod)
   - [ ] Tela de Cadastro (nome da igreja, email, senha, confirmação)
   - [ ] Integração com Supabase Auth
   - [ ] Validação de formulários com React Hook Form + Zod
   - [ ] Feedback visual de erros
   - [ ] Animações de transição entre login/cadastro
   - [ ] Recuperação de senha
   - [ ] Proteção de rotas (middleware)

4. **Criação de Igreja**
   - [ ] Após cadastro, criar registro na tabela `churches`
   - [ ] Criar perfil do usuário em `user_profiles` com role 'owner'
   - [ ] Criar permissões iniciais em `user_permissions`

#### Entregáveis
- ✅ Landing page funcional e responsiva
- ✅ Sistema de login/cadastro completo
- ✅ Usuário consegue criar conta e igreja
- ✅ Redirecionamento para dashboard após cadastro

---

### **FASE 2: Dashboard e Sistema Financeiro Básico** ⏱️ ~3 semanas

#### Objetivos
- Dashboard interativo com gráficos
- CRUD de receitas e despesas
- Sistema de categorias
- Visualizações financeiras

#### Tarefas

1. **Layout do Dashboard**
   - [ ] Sidebar responsiva com navegação
   - [ ] Header com informações do usuário
   - [ ] Layout adaptativo (mobile/desktop)
   - [ ] Componentes de loading e error states

2. **Dashboard Principal**
   - [ ] Cards de métricas (Saldo, Entradas, Saídas, Fundo de Reserva)
   - [ ] Gráfico de receitas mensais (Recharts)
   - [ ] Gráfico de despesas por categoria (Pie Chart)
   - [ ] Tabela de últimas transações
   - [ ] Filtros por período (mês, trimestre, ano)
   - [ ] Cálculos em tempo real

3. **Sistema de Categorias**
   - [ ] CRUD de categorias de receitas
   - [ ] CRUD de categorias de despesas
   - [ ] Seleção de cores personalizadas
   - [ ] Validação com Zod

4. **Gestão de Receitas**
   - [ ] Formulário de nova receita
   - [ ] Seleção de categoria
   - [ ] Associação com membro (opcional)
   - [ ] Método de pagamento
   - [ ] Data da transação
   - [ ] Listagem de receitas com filtros
   - [ ] Edição e exclusão
   - [ ] Geração de recibo digital (PDF)

5. **Gestão de Despesas**
   - [ ] Formulário de nova despesa
   - [ ] Seleção de categoria
   - [ ] Upload de comprovante (Supabase Storage)
   - [ ] Listagem de despesas com filtros
   - [ ] Edição e exclusão

6. **Validações e Segurança**
   - [ ] RLS policies no Supabase
   - [ ] Validação de permissões no frontend
   - [ ] Validação de dados com Zod em todas as operações

#### Entregáveis
- ✅ Dashboard funcional com gráficos
- ✅ Sistema completo de receitas e despesas
- ✅ Categorias personalizáveis
- ✅ Dados persistidos no Supabase

---

### **FASE 3: Sistema de Membros** ⏱️ ~2 semanas

#### Objetivos
- CRUD completo de membros
- Vinculação de membros com usuários
- Upload de fotos de perfil
- Visualização de membros

#### Tarefas

1. **Gestão de Membros (Owner)**
   - [ ] Listagem de membros com busca e filtros
   - [ ] Formulário de criação de membro
   - [ ] Campos: nome, email, telefone, data de nascimento, data de membro
   - [ ] Status (ativo, inativo, visitante)
   - [ ] Edição e exclusão de membros
   - [ ] Validação com Zod

2. **Criação de Contas para Membros**
   - [ ] Interface para criar conta de usuário para membro
   - [ ] Geração de senha temporária
   - [ ] Envio de credenciais por email (opcional)
   - [ ] Vinculação de `member.user_id` com `auth.users`

3. **Perfil do Membro**
   - [ ] Página de perfil do membro
   - [ ] Upload de foto de perfil (Supabase Storage)
   - [ ] Edição de dados pessoais (apenas o próprio membro)
   - [ ] Visualização de histórico de contribuições

4. **Permissões de Visualização**
   - [ ] Membros só veem seus próprios dados financeiros
   - [ ] Membros não veem dados financeiros gerais da igreja
   - [ ] Membros podem ver lista de outros membros (sem dados sensíveis)

#### Entregáveis
- ✅ Sistema completo de gestão de membros
- ✅ Criação de contas para membros
- ✅ Upload de fotos funcionando
- ✅ Permissões diferenciadas implementadas

---

### **FASE 4: Calendário e Eventos** ⏱️ ~2 semanas

#### Objetivos
- Calendário de eventos
- CRUD de eventos/cultos
- Confirmação de presença
- Integração WhatsApp

#### Tarefas

1. **Calendário de Eventos**
   - [ ] Componente de calendário (react-calendar ou similar)
   - [ ] Visualização mensal/semanal
   - [ ] Destaque de eventos no calendário
   - [ ] Modal de detalhes do evento

2. **Gestão de Eventos (Owner/Tesoureiro)**
   - [ ] Formulário de criação de evento
   - [ ] Campos: título, descrição, data, horário, local, tipo
   - [ ] Campo de mensagem pré-pronta para WhatsApp
   - [ ] Edição e exclusão de eventos
   - [ ] Listagem de eventos futuros e passados

3. **Confirmação de Presença**
   - [ ] Interface para membros confirmarem presença
   - [ ] Status: confirmado, pendente, ausente
   - [ ] Lista de confirmados para cada evento (visível para admins)
   - [ ] Estatísticas de presença

4. **Integração WhatsApp**
   - [ ] Botão "Enviar Lembrete" no evento
   - [ ] Seleção de membros para envio
   - [ ] Integração com API do WhatsApp (Twilio ou similar)
   - [ ] Envio em massa de mensagens
   - [ ] Template de mensagem personalizável por evento
   - [ ] Log de mensagens enviadas

5. **Visualização para Membros**
   - [ ] Calendário de eventos visível para membros
   - [ ] Membros podem confirmar presença
   - [ ] Membros veem apenas eventos públicos

#### Entregáveis
- ✅ Calendário funcional
- ✅ CRUD de eventos completo
- ✅ Sistema de confirmação de presença
- ✅ Integração WhatsApp funcionando

---

### **FASE 5: Relatórios Financeiros** ⏱️ ~2 semanas

#### Objetivos
- Relatórios detalhados
- Exportação em PDF
- Gráficos avançados
- Análises financeiras

#### Tarefas

1. **Relatórios Mensais**
   - [ ] Relatório de receitas do mês
   - [ ] Relatório de despesas do mês
   - [ ] Balanço mensal (entradas - saídas)
   - [ ] Gráficos de tendências
   - [ ] Comparativo com mês anterior

2. **Relatórios Anuais**
   - [ ] Relatório anual consolidado
   - [ ] Gráfico de evolução anual
   - [ ] Distribuição por categorias
   - [ ] Top contribuidores do ano

3. **Relatórios Personalizados**
   - [ ] Filtros por período customizado
   - [ ] Filtros por categoria
   - [ ] Filtros por membro (para receitas)
   - [ ] Exportação em PDF (react-pdf ou similar)
   - [ ] Exportação em Excel/CSV

4. **Visualizações Avançadas**
   - [ ] Gráfico de linha temporal
   - [ ] Gráfico de barras comparativo
   - [ ] Gráfico de pizza por categoria
   - [ ] Tabelas detalhadas com paginação

5. **Permissões**
   - [ ] Apenas owners e tesoureiros veem relatórios completos
   - [ ] Membros veem apenas seus próprios recibos

#### Entregáveis
- ✅ Sistema completo de relatórios
- ✅ Exportação em PDF funcionando
- ✅ Gráficos avançados implementados
- ✅ Filtros e análises personalizadas

---

### **FASE 6: Sistema de Permissões e Ajustes** ⏱️ ~2 semanas

#### Objetivos
- Gestão granular de permissões
- Página de configurações
- Personalização do sistema

#### Tarefas

1. **Gestão de Permissões (Owner)**
   - [ ] Interface para gerenciar permissões de usuários
   - [ ] Atribuição de roles (tesoureiro, marketing, membro)
   - [ ] Permissões granulares:
     - Gerenciar finanças
     - Gerenciar membros
     - Gerenciar eventos
     - Ver relatórios
     - Enviar WhatsApp
   - [ ] Lista de usuários com suas permissões
   - [ ] Edição de permissões em tempo real

2. **Página de Ajustes/Configurações**
   - [ ] Informações da igreja (editar nome, logo)
   - [ ] Configurações de notificações
   - [ ] Configurações de WhatsApp (API keys)
   - [ ] Configurações de planos (se houver)
   - [ ] Gerenciamento de usuários
   - [ ] Backup e exportação de dados

3. **Perfil do Usuário**
   - [ ] Edição de dados pessoais
   - [ ] Troca de senha
   - [ ] Upload de avatar
   - [ ] Preferências de notificação

4. **Segurança**
   - [ ] Validação de permissões em todas as rotas
   - [ ] Middleware de autorização
   - [ ] Logs de ações importantes
   - [ ] Políticas de RLS atualizadas

#### Entregáveis
- ✅ Sistema completo de permissões
- ✅ Página de ajustes funcional
- ✅ Segurança implementada
- ✅ Personalização disponível

---

### **FASE 7: Polimento e Otimizações** ⏱️ ~1-2 semanas

#### Objetivos
- Melhorias de UX/UI
- Performance
- Testes
- Documentação

#### Tarefas

1. **Otimizações de Performance**
   - [ ] Lazy loading de componentes
   - [ ] Otimização de imagens (Next.js Image)
   - [ ] Cache de queries (React Query ou SWR)
   - [ ] Code splitting
   - [ ] Otimização de bundle

2. **Melhorias de UX**
   - [ ] Feedback visual em todas as ações
   - [ ] Toasts/notificações
   - [ ] Loading states
   - [ ] Empty states
   - [ ] Error boundaries
   - [ ] Animações suaves

3. **Responsividade**
   - [ ] Testes em diferentes dispositivos
   - [ ] Menu mobile otimizado
   - [ ] Tabelas responsivas
   - [ ] Formulários mobile-friendly

4. **Testes**
   - [ ] Testes de integração críticos
   - [ ] Validação de fluxos principais
   - [ ] Testes de permissões

5. **Documentação**
   - [ ] README completo
   - [ ] Guia de instalação
   - [ ] Documentação de API (se necessário)
   - [ ] Comentários no código

#### Entregáveis
- ✅ Aplicação otimizada e performática
- ✅ UX polida
- ✅ Totalmente responsiva
- ✅ Documentada

---

## 📁 Estrutura de Pastas do Projeto

```
church-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── receitas/
│   │   ├── despesas/
│   │   ├── membros/
│   │   ├── eventos/
│   │   ├── relatorios/
│   │   └── ajustes/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   └── loading.tsx
├── components/
│   ├── ui/ (componentes reutilizáveis)
│   ├── dashboard/
│   ├── financeiro/
│   ├── membros/
│   ├── eventos/
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── validations/ (schemas Zod)
│   ├── utils/
│   └── types/
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useChurch.ts
├── public/
│   └── images/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── types/
    └── database.types.ts (gerado pelo Supabase)
```

---

## 🔐 Considerações de Segurança

1. **Row Level Security (RLS)**
   - Todas as tabelas com RLS habilitado
   - Policies baseadas em `church_id` e `user_id`
   - Validação de roles e permissões

2. **Validação de Dados**
   - Zod em todos os formulários
   - Validação no cliente e servidor
   - Sanitização de inputs

3. **Autenticação**
   - Supabase Auth com JWT
   - Refresh tokens
   - Sessões seguras

4. **Upload de Arquivos**
   - Supabase Storage com policies
   - Validação de tipos de arquivo
   - Limite de tamanho

---

## 📈 Métricas de Sucesso

- ✅ Usuário consegue criar conta e igreja em < 2 minutos
- ✅ Dashboard carrega em < 2 segundos
- ✅ Todas as operações CRUD funcionando
- ✅ Sistema de permissões funcionando corretamente
- ✅ Integração WhatsApp enviando mensagens
- ✅ Relatórios gerando PDFs corretamente
- ✅ Aplicação 100% responsiva

---

## 🎨 Design System

- **Cores Principais:**
  - Indigo: `#6366f1` (primária)
  - Purple: `#a855f7` (gradiente)
  - Slate: `#0f172a` (texto)
  
- **Tipografia:**
  - Plus Jakarta Sans (títulos)
  - Inter (corpo)

- **Componentes:**
  - Cards com bordas arredondadas (`rounded-xl`, `rounded-2xl`)
  - Sombras suaves (`shadow-sm`, `shadow-lg`)
  - Transições suaves (`transition-all`)
  - Hover effects com scale e cores

---

## 📝 Próximos Passos Imediatos

1. Criar repositório Git
2. Inicializar projeto Next.js 14
3. Configurar Supabase
4. Criar estrutura de pastas
5. Começar FASE 1

---

**Tempo Total Estimado:** ~14-16 semanas (3.5-4 meses)

**Prioridade:** Fases 1-3 são críticas para MVP funcional

