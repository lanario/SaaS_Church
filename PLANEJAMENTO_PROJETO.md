# 📋 PLANEJAMENTO DO PROJETO - TESOURAPP

## 🎯 Visão Geral

SaaS completo para gestão financeira e administrativa de igrejas, desenvolvido com Next.js 14, TypeScript, Supabase e TailwindCSS.

## 🚀 Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (tipagem estática rigorosa)
- **Backend:** Supabase (PostgreSQL, RLS, Auth, Storage)
- **Validação:** Zod
- **Estilização:** TailwindCSS (mobile-first, responsivo)
- **Gráficos:** Recharts
- **Ícones:** React Icons
- **Formulários:** React Hook Form

## 📊 Fases de Desenvolvimento

---

## ✅ FASE 1: Setup Inicial e Autenticação

**Status:** ✅ COMPLETA

### Objetivos:
- Configuração do projeto Next.js 14
- Setup do Supabase
- Sistema de autenticação (login/registro)
- Layout base do dashboard

### Entregas:
- ✅ Estrutura do projeto
- ✅ Configuração do Supabase
- ✅ Páginas de login e registro
- ✅ Middleware de autenticação
- ✅ Layout do dashboard com sidebar e header

---

## ✅ FASE 2: Banco de Dados e Schema

**Status:** ✅ COMPLETA

### Objetivos:
- Criação das tabelas principais
- Configuração de RLS (Row Level Security)
- Triggers e funções PostgreSQL
- Índices para performance

### Entregas:
- ✅ Tabela `churches` (igrejas)
- ✅ Tabela `user_profiles` (perfis de usuários)
- ✅ Tabela `members` (membros)
- ✅ Tabela `revenues` (receitas)
- ✅ Tabela `expenses` (despesas)
- ✅ Tabela `revenue_categories` (categorias de receitas)
- ✅ Tabela `expense_categories` (categorias de despesas)
- ✅ Tabela `events` (eventos)
- ✅ Tabela `event_attendances` (confirmações de presença)
- ✅ Tabela `user_permissions` (permissões de usuários)
- ✅ Tabela `church_invites` (convites para membros)
- ✅ Políticas RLS configuradas
- ✅ Triggers para `updated_at`
- ✅ Funções PostgreSQL (`get_church_users`, `create_member_profile`)

---

## ✅ FASE 3: Dashboard e Métricas

**Status:** ✅ COMPLETA

### Objetivos:
- Dashboard principal com métricas
- Gráficos de receitas e despesas
- Calendário de eventos
- Últimas movimentações

### Entregas:
- ✅ Componente `Stats` (cards de métricas)
- ✅ Componente `RevenueChart` (gráfico de pizza de receitas)
- ✅ Componente `ExpenseChart` (gráfico de pizza de despesas)
- ✅ Componente `SimpleCalendar` (calendário interativo)
- ✅ Componente `RecentTransactions` (últimas movimentações)
- ✅ Página do dashboard (`/dashboard`)

---

## ✅ FASE 4: Gestão Financeira

**Status:** ✅ COMPLETA

### Objetivos:
- CRUD completo de receitas
- CRUD completo de despesas
- Gestão de categorias
- Validações e formulários

### Entregas:
- ✅ Página de receitas (`/receitas`)
- ✅ Formulário de nova receita (`/receitas/nova`)
- ✅ Lista de receitas com filtros
- ✅ Página de despesas (`/despesas`)
- ✅ Formulário de nova despesa (`/despesas/nova`)
- ✅ Lista de despesas com filtros
- ✅ Página de categorias (`/categorias`)
- ✅ Gestão de categorias de receitas e despesas
- ✅ Categorias padrão: "Dízimos" e "Ofertas"
- ✅ Comportamento automático para "Dízimos" e "Ofertas"

---

## ✅ FASE 5: Sistema de Membros

**Status:** ✅ COMPLETA

### Objetivos:
- CRUD completo de membros
- Upload de fotos de perfil
- Criação de contas para membros
- Histórico de contribuições

### Entregas:
- ✅ Página de membros (`/membros`)
- ✅ Formulário de novo membro (`/membros/novo`)
- ✅ Edição de membro (`/membros/[id]/editar`)
- ✅ Perfil do membro (`/membros/[id]`)
- ✅ Upload de avatar
- ✅ Criação de conta para membro
- ✅ Busca e filtros de membros
- ✅ Exibição de aniversários no calendário

---

## ✅ FASE 6: Eventos e Calendário

**Status:** ✅ COMPLETA

### Objetivos:
- CRUD completo de eventos
- Calendário de eventos
- Confirmação de presença
- Integração com WhatsApp

### Entregas:
- ✅ Página de eventos (`/eventos`)
- ✅ Formulário de novo evento (`/eventos/novo`)
- ✅ Edição de evento (`/eventos/[id]/editar`)
- ✅ Detalhes do evento (`/eventos/[id]`)
- ✅ Calendário de eventos
- ✅ Confirmação de presença
- ✅ Lista de participantes
- ✅ Integração com WhatsApp para lembretes
- ✅ Sistema de convites para acesso aos eventos

---

## ✅ FASE 7: Relatórios

**Status:** ✅ COMPLETA

### Objetivos:
- Relatório mensal
- Relatório anual
- Gráficos e visualizações
- Exportação de dados

### Entregas:
- ✅ Página de relatórios (`/relatorios`)
- ✅ Relatório mensal com:
  - Cards de resumo (Total Receitas, Total Despesas, Saldo, Variação)
  - Gráfico de linha (evolução mensal)
  - Tabela de transações
- ✅ Relatório anual com:
  - Cards de resumo anual
  - Gráfico de linha (receitas, despesas, saldo)
  - Gráfico de barras (receitas vs despesas)
  - Tabela de resumo mensal
- ✅ Seletores de mês/ano
- ✅ Navegação por tabs

---

## ✅ FASE 8: Ajustes e Permissões

**Status:** ✅ COMPLETA

### Objetivos:
- Perfil do usuário
- Configurações da igreja
- Sistema de permissões
- Gestão de usuários
- Sistema de convites

### Entregas:
- ✅ Página de ajustes (`/ajustes`)
- ✅ Aba de perfil (edição de dados pessoais)
- ✅ Aba de igreja (edição de dados da igreja)
- ✅ Aba de usuários e permissões
- ✅ Sistema de permissões granulares:
  - `can_manage_finances`
  - `can_manage_members`
  - `can_manage_events`
  - `can_view_reports`
  - `can_send_whatsapp`
- ✅ Sistema de convites para membros
- ✅ Página de aceitar convite (`/convite/[token]`)

---

## ✅ FASE 9: Landing Page

**Status:** ✅ COMPLETA

### Objetivos:
- Landing page profissional
- Seção de features
- Seção de preços
- Preview do dashboard

### Entregas:
- ✅ Landing page (`/`)
- ✅ Hero section
- ✅ Seção de features
- ✅ Preview interativo do dashboard
- ✅ Seção de preços (planos)
- ✅ Animações e hover effects
- ✅ Design responsivo

---

## ✅ FASE 10: Manutenção e Refatoração

**Status:** ✅ COMPLETA

### Objetivos:
- Refatoração de código
- Padronização de funções
- Limpeza de arquivos desnecessários
- Organização de SQLs

### Entregas:
- ✅ Refatoração de `const` para `function` (priorização)
- ✅ Organização da pasta `supabase`
- ✅ Remoção de arquivos desnecessários
- ✅ Consolidação de SQLs em `TOTAL_SQL.sql`
- ✅ Limpeza de componentes não utilizados

---

## 🚧 FASE 11: Melhorias e Otimizações

**Status:** 🚧 EM ANDAMENTO

### Objetivos:
- Otimizações de performance
- Melhorias de UX/UI
- Testes e validações
- Documentação

### Tarefas Pendentes:
- [ ] Otimização de queries do Supabase
- [ ] Implementação de cache onde necessário
- [ ] Melhorias de acessibilidade (a11y)
- [ ] Testes unitários e de integração
- [ ] Documentação de API
- [ ] Guia de uso para usuários finais
- [ ] Melhorias de SEO na landing page

---

## 🔮 FASE 12: Funcionalidades Futuras

**Status:** 📋 PLANEJADO

### Funcionalidades Propostas:
- [ ] **Notificações Push**
  - Notificações de eventos
  - Lembretes de contribuições
  - Alertas financeiros

- [ ] **Exportação Avançada**
  - Exportação em Excel
  - Relatórios personalizados
  - Gráficos customizáveis

- [ ] **Integrações**
  - Integração com sistemas de pagamento
  - Integração com contabilidade
  - API pública para integrações

- [ ] **Mobile App**
  - App React Native
  - Notificações nativas
  - Acesso offline

- [ ] **Multi-tenant Avançado**
  - Suporte a múltiplas igrejas por usuário
  - Templates de configuração
  - Migração de dados

- [ ] **Analytics Avançado**
  - Previsões financeiras
  - Análise de tendências
  - Comparativos entre períodos

- [ ] **Comunicação**
  - Sistema de mensagens interno
  - Email marketing
  - Campanhas de arrecadação

---

## 📝 Padrões de Código

### Funções vs Const
- **PRIORIDADE:** Usar `function` para componentes React e funções utilitárias
- **Exceções:** `const` apenas para arrow functions em métodos de array (map, filter) ou quando estritamente necessário

### Estrutura de Componentes
```typescript
// ✅ PREFERIDO
function MyComponent({ prop }: MyComponentProps) {
  return <div>...</div>
}

// ❌ EVITAR (exceto em casos específicos)
const MyComponent = ({ prop }: MyComponentProps) => {
  return <div>...</div>
}
```

### Server Components vs Client Components
- **Padrão:** Server Components por padrão
- **Client Components:** Apenas quando necessário (hooks, interatividade)
- **Marcação:** `'use client'` no topo do arquivo

### Validação
- **Zod:** Todos os formulários validados com Zod
- **Schemas:** Centralizados em `lib/validations/`
- **Validação dupla:** Cliente e servidor

---

## 🗂️ Organização de Arquivos SQL

### Estrutura da Pasta `supabase/`
```
supabase/
├── TOTAL_SQL.sql              # Script completo e consolidado (PRINCIPAL)
├── 01_setup_completo.sql      # Setup inicial
├── 02_aplicar_tudo.sql        # Script completo de correção
├── 03_criar_tabela_convites.sql
└── 04_permitir_owner_ver_usuarios.sql
```

**IMPORTANTE:** Sempre atualizar `TOTAL_SQL.sql` quando qualquer SQL for modificado.

---

## 🎯 Próximos Passos

1. **Finalizar Fase 11** (Melhorias e Otimizações)
2. **Testes completos** do sistema
3. **Documentação** para usuários finais
4. **Deploy** em produção
5. **Planejamento** das funcionalidades futuras (Fase 12)

---

## 📊 Status Geral do Projeto

- **Fases Completas:** 10/12 (83%)
- **Funcionalidades Core:** ✅ 100%
- **Funcionalidades Avançadas:** 🚧 Em desenvolvimento
- **Pronto para Produção:** 🟡 Quase (pendente testes e otimizações)

---

**Última atualização:** Dezembro 2024
**Versão:** 1.0.0-beta

