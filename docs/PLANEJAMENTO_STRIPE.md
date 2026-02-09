# 💳 PLANEJAMENTO DE INTEGRAÇÃO STRIPE - TESOURAPP

## 🎯 Visão Geral

Planejamento completo para integração do Stripe como sistema de checkout de pagamento para os planos de assinatura do TesourApp. O sistema suportará assinaturas recorrentes mensais com gerenciamento completo de planos, webhooks e controle de acesso baseado em assinatura.

## 📊 Análise da Situação Atual

### Estrutura Existente
- ✅ Landing page com seção de planos (`app/page.tsx`)
- ✅ Dois planos definidos:
  - **Missões:** R$ 49,99/mês (Popular)
  - **Catedral:** R$ 99,99/mês
- ✅ Botões de ação nos cards de planos (atualmente sem funcionalidade)
- ✅ Sistema de autenticação com Supabase
- ✅ Tabela `churches` para igrejas
- ✅ Tabela `user_profiles` para usuários

### O que Falta
- ❌ Estrutura de banco de dados para subscriptions
- ❌ Integração com Stripe
- ❌ Rotas de API para checkout
- ❌ Webhooks do Stripe
- ❌ Sistema de controle de acesso baseado em assinatura
- ❌ Página de gerenciamento de assinatura

---

## 🚀 FASES DE IMPLEMENTAÇÃO

---

## 📋 FASE 1: Setup e Configuração Inicial

**Status:** 📋 PLANEJADO  
**Prioridade:** 🔴 ALTA  
**Estimativa:** 2-3 horas

### Objetivos
- Instalar dependências do Stripe
- Configurar variáveis de ambiente
- Criar cliente Stripe no servidor
- Configurar tipos TypeScript

### Tarefas

#### 1.1 Instalação de Dependências
```bash
npm install stripe @stripe/stripe-js
npm install -D @types/stripe
```

#### 1.2 Variáveis de Ambiente
Adicionar ao `.env.local`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 1.3 Cliente Stripe
Criar `lib/stripe/server.ts`:
- Cliente Stripe para server-side
- Função para obter cliente tipado

#### 1.4 Cliente Stripe (Browser)
Criar `lib/stripe/client.ts`:
- Cliente Stripe para client-side
- Função para carregar Stripe.js

### Entregas
- ✅ `package.json` atualizado com dependências
- ✅ Variáveis de ambiente configuradas
- ✅ `lib/stripe/server.ts` criado
- ✅ `lib/stripe/client.ts` criado
- ✅ Tipos TypeScript configurados

---

## 📋 FASE 2: Estrutura de Banco de Dados

**Status:** 📋 PLANEJADO  
**Prioridade:** 🔴 ALTA  
**Estimativa:** 3-4 horas

### Objetivos
- Criar tabelas para planos e assinaturas
- Configurar RLS (Row Level Security)
- Criar índices para performance
- Adicionar triggers necessários

### Tarefas

#### 2.1 Tabela `subscription_plans`
Armazenar os planos disponíveis:
```sql
- id (UUID, PK)
- stripe_price_id (VARCHAR, UNIQUE) - ID do preço no Stripe
- name (VARCHAR) - Nome do plano (Missões, Catedral)
- description (TEXT)
- price_monthly (DECIMAL) - Preço mensal em R$
- features (JSONB) - Array de features
- max_users (INTEGER) - Limite de usuários (NULL = ilimitado)
- max_churches (INTEGER) - Limite de igrejas (NULL = ilimitado)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 2.2 Tabela `subscriptions`
Armazenar assinaturas ativas:
```sql
- id (UUID, PK)
- church_id (UUID, FK -> churches)
- plan_id (UUID, FK -> subscription_plans)
- stripe_subscription_id (VARCHAR, UNIQUE) - ID da subscription no Stripe
- stripe_customer_id (VARCHAR) - ID do customer no Stripe
- status (VARCHAR) - 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- cancel_at_period_end (BOOLEAN)
- canceled_at (TIMESTAMP)
- created_at, updated_at
```

#### 2.3 Tabela `subscription_usage`
Rastrear uso de recursos (opcional, para limites):
```sql
- id (UUID, PK)
- subscription_id (UUID, FK -> subscriptions)
- church_id (UUID, FK -> churches)
- metric_type (VARCHAR) - 'users', 'churches', etc.
- current_count (INTEGER)
- limit_count (INTEGER)
- updated_at
```

#### 2.4 Índices
```sql
- idx_subscriptions_church_id
- idx_subscriptions_stripe_subscription_id
- idx_subscriptions_stripe_customer_id
- idx_subscriptions_status
- idx_subscription_plans_stripe_price_id
```

#### 2.5 RLS Policies
- Usuários podem ver assinatura da própria igreja
- Apenas owners podem ver detalhes completos
- Webhooks podem atualizar assinaturas (via service role)

### Entregas
- ✅ Script SQL completo em `supabase/STRIPE_SCHEMA.sql`
- ✅ Tabelas criadas no Supabase
- ✅ RLS configurado
- ✅ Índices criados
- ✅ Triggers para `updated_at`

---

## 📋 FASE 3: Criação de Produtos e Preços no Stripe

**Status:** 📋 PLANEJADO  
**Prioridade:** 🔴 ALTA  
**Estimativa:** 1-2 horas

### Objetivos
- Criar produtos no Stripe Dashboard
- Criar preços mensais recorrentes
- Popular tabela `subscription_plans` com dados do Stripe
- Script de sincronização

### Tarefas

#### 3.1 Criar Produtos no Stripe
Via Dashboard ou API:
- **Produto:** TesourApp - Missões
  - Preço: R$ 49,99/mês (recorrente mensal)
  - ID do Preço: `price_xxx_missoes`
  
- **Produto:** TesourApp - Catedral
  - Preço: R$ 99,99/mês (recorrente mensal)
  - ID do Preço: `price_xxx_catedral`

#### 3.2 Script de Sincronização
Criar `scripts/sync-stripe-plans.ts`:
- Buscar produtos do Stripe
- Sincronizar com `subscription_plans`
- Atualizar ou criar registros

#### 3.3 Seed de Dados
Criar script SQL para inserir planos iniciais:
```sql
INSERT INTO subscription_plans (...)
VALUES (...);
```

### Entregas
- ✅ Produtos criados no Stripe
- ✅ Preços configurados
- ✅ Tabela `subscription_plans` populada
- ✅ Script de sincronização funcional

---

## 📋 FASE 4: API de Checkout

**Status:** 📋 PLANEJADO  
**Prioridade:** 🔴 ALTA  
**Estimativa:** 4-5 horas

### Objetivos
- Criar rota de API para iniciar checkout
- Criar rota de API para sucesso/cancelamento
- Integrar com botões da landing page
- Gerenciar sessões de checkout

### Tarefas

#### 4.1 Rota de Checkout Session
Criar `app/api/checkout/create/route.ts`:
- Validar usuário autenticado
- Verificar se igreja já tem assinatura ativa
- Criar ou buscar customer no Stripe
- Criar Checkout Session
- Retornar URL de checkout

#### 4.2 Rota de Sucesso
Criar `app/api/checkout/success/route.ts`:
- Receber `session_id` do Stripe
- Buscar subscription criada
- Criar registro em `subscriptions`
- Redirecionar para dashboard

#### 4.3 Rota de Cancelamento
Criar `app/api/checkout/cancel/route.ts`:
- Página de cancelamento
- Opção de tentar novamente

#### 4.4 Atualizar Landing Page
Modificar `app/page.tsx`:
- Transformar botões em links funcionais
- Adicionar loading states
- Redirecionar para checkout

#### 4.5 Server Action para Checkout
Criar `app/actions/subscription.ts`:
- `createCheckoutSession(planId: string)`
- Validações de negócio
- Integração com API route

### Entregas
- ✅ `app/api/checkout/create/route.ts`
- ✅ `app/api/checkout/success/route.ts`
- ✅ `app/api/checkout/cancel/route.ts`
- ✅ Botões funcionais na landing page
- ✅ Server action `createCheckoutSession`
- ✅ Validações implementadas

---

## 📋 FASE 5: Webhooks do Stripe

**Status:** 📋 PLANEJADO  
**Prioridade:** 🔴 ALTA  
**Estimativa:** 5-6 horas

### Objetivos
- Criar endpoint de webhook
- Processar eventos do Stripe
- Sincronizar status de assinaturas
- Atualizar banco de dados

### Tarefas

#### 5.1 Rota de Webhook
Criar `app/api/webhooks/stripe/route.ts`:
- Verificar assinatura do webhook
- Processar eventos:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end`

#### 5.2 Handlers de Eventos
Criar `lib/stripe/webhooks.ts`:
- `handleCheckoutCompleted`
- `handleSubscriptionCreated`
- `handleSubscriptionUpdated`
- `handleSubscriptionDeleted`
- `handlePaymentSucceeded`
- `handlePaymentFailed`

#### 5.3 Atualização de Assinaturas
Sincronizar status:
- Atualizar `subscriptions.status`
- Atualizar `current_period_start/end`
- Marcar `cancel_at_period_end` quando aplicável

#### 5.4 Notificações (Opcional)
Enviar emails/notificações:
- Assinatura ativada
- Pagamento falhou
- Assinatura cancelada

### Entregas
- ✅ `app/api/webhooks/stripe/route.ts`
- ✅ Handlers de eventos implementados
- ✅ Sincronização de status funcional
- ✅ Testes com Stripe CLI
- ✅ Logs de webhooks

---

## 📋 FASE 6: Controle de Acesso Baseado em Assinatura

**Status:** 📋 PLANEJADO  
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 4-5 horas

### Objetivos
- Middleware para verificar assinatura ativa
- Bloquear acesso sem assinatura
- Página de upgrade/assinatura
- Verificações de limites (usuários, igrejas)

### Tarefas

#### 6.1 Função de Verificação
Criar `lib/subscription/check.ts`:
- `hasActiveSubscription(churchId: string)`
- `getSubscription(churchId: string)`
- `checkSubscriptionLimits(churchId: string)`

#### 6.2 Middleware de Assinatura
Atualizar `middleware.ts`:
- Verificar assinatura ativa para rotas protegidas
- Redirecionar para página de assinatura se necessário
- Exceções: landing page, login, registro

#### 6.3 Página de Assinatura Obrigatória
Criar `app/(dashboard)/assinatura/page.tsx`:
- Exibir planos disponíveis
- Botão para assinar
- Mensagem explicativa

#### 6.4 Verificações de Limites
Criar helpers:
- `checkUserLimit(churchId: string)`
- `checkChurchLimit(userId: string)`
- Bloquear ações que excedam limites

#### 6.5 Componente de Status
Criar `components/subscription/subscription-status.tsx`:
- Exibir status atual da assinatura
- Data de renovação
- Botão para gerenciar

### Entregas
- ✅ Funções de verificação implementadas
- ✅ Middleware atualizado
- ✅ Página de assinatura obrigatória
- ✅ Verificações de limites funcionais
- ✅ Componente de status

---

## 📋 FASE 7: Página de Gerenciamento de Assinatura

**Status:** 📋 PLANEJADO  
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 5-6 horas

### Objetivos
- Dashboard de assinatura
- Visualizar plano atual
- Alterar plano
- Cancelar assinatura
- Ver histórico de pagamentos

### Tarefas

#### 7.1 Página Principal
Criar `app/(dashboard)/ajustes/assinatura/page.tsx`:
- Exibir plano atual
- Status da assinatura
- Próxima data de cobrança
- Botões de ação

#### 7.2 Componentes
Criar `components/subscription/`:
- `subscription-card.tsx` - Card do plano atual
- `change-plan-modal.tsx` - Modal para trocar plano
- `cancel-subscription-modal.tsx` - Modal para cancelar
- `payment-history.tsx` - Histórico de pagamentos

#### 7.3 Server Actions
Adicionar em `app/actions/subscription.ts`:
- `getCurrentSubscription()`
- `changePlan(newPlanId: string)`
- `cancelSubscription()`
- `reactivateSubscription()`

#### 7.4 Integração com Stripe Customer Portal
Criar `app/api/customer-portal/create/route.ts`:
- Criar sessão do Customer Portal
- Redirecionar para portal do Stripe

#### 7.5 Atualizar Ajustes
Adicionar aba "Assinatura" em `app/(dashboard)/ajustes/page.tsx`

### Entregas
- ✅ Página de gerenciamento completa
- ✅ Componentes de UI
- ✅ Server actions implementadas
- ✅ Integração com Customer Portal
- ✅ Aba de assinatura nos ajustes

---

## 📋 FASE 8: Melhorias e Testes

**Status:** 📋 PLANEJADO  
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 4-5 horas

### Objetivos
- Testes end-to-end
- Tratamento de erros
- Loading states
- Mensagens de feedback
- Documentação

### Tarefas

#### 8.1 Testes
- Testar fluxo completo de checkout
- Testar webhooks (usar Stripe CLI)
- Testar cancelamento
- Testar troca de plano
- Testar limites de recursos

#### 8.2 Tratamento de Erros
- Error boundaries
- Mensagens amigáveis
- Logs de erro
- Retry logic para webhooks

#### 8.3 UX Improvements
- Loading states em botões
- Toasts de sucesso/erro
- Confirmações antes de cancelar
- Feedback visual de status

#### 8.4 Documentação
- Atualizar README
- Documentar variáveis de ambiente
- Guia de setup do Stripe
- Troubleshooting

### Entregas
- ✅ Testes realizados
- ✅ Erros tratados adequadamente
- ✅ UX melhorada
- ✅ Documentação atualizada

---

## 📊 RESUMO DAS FASES

| Fase | Descrição | Prioridade | Estimativa | Status |
|------|-----------|------------|------------|--------|
| 1 | Setup e Configuração | 🔴 ALTA | 2-3h | 📋 PLANEJADO |
| 2 | Banco de Dados | 🔴 ALTA | 3-4h | 📋 PLANEJADO |
| 3 | Produtos no Stripe | 🔴 ALTA | 1-2h | 📋 PLANEJADO |
| 4 | API de Checkout | 🔴 ALTA | 4-5h | 📋 PLANEJADO |
| 5 | Webhooks | 🔴 ALTA | 5-6h | 📋 PLANEJADO |
| 6 | Controle de Acesso | 🟡 MÉDIA | 4-5h | 📋 PLANEJADO |
| 7 | Gerenciamento | 🟡 MÉDIA | 5-6h | 📋 PLANEJADO |
| 8 | Melhorias e Testes | 🟢 BAIXA | 4-5h | 📋 PLANEJADO |

**Total Estimado:** 28-36 horas

---

## 🔧 DEPENDÊNCIAS E PRÉ-REQUISITOS

### Conta Stripe
- [ ] Criar conta no Stripe
- [ ] Obter API keys (test e live)
- [ ] Configurar webhook endpoint
- [ ] Obter webhook secret

### Variáveis de Ambiente
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Dependências NPM
```json
{
  "stripe": "^latest",
  "@stripe/stripe-js": "^latest"
}
```

---

## 📝 NOTAS IMPORTANTES

### Segurança
- ✅ Nunca expor `STRIPE_SECRET_KEY` no client-side
- ✅ Validar webhooks com assinatura
- ✅ Usar RLS no Supabase para subscriptions
- ✅ Verificar autenticação em todas as rotas

### Performance
- ✅ Cachear informações de assinatura quando possível
- ✅ Usar índices no banco de dados
- ✅ Otimizar queries de verificação

### Escalabilidade
- ✅ Considerar rate limiting nas APIs
- ✅ Implementar retry logic para webhooks
- ✅ Logs estruturados para debugging

### Testes
- ✅ Usar Stripe Test Mode para desenvolvimento
- ✅ Testar todos os cenários de webhook
- ✅ Validar fluxo completo antes de produção

---

## 🚀 PRÓXIMOS PASSOS

1. **Iniciar Fase 1** - Setup e configuração
2. **Configurar conta Stripe** - Obter API keys
3. **Executar Fase 2** - Criar estrutura de banco
4. **Seguir sequencialmente** - Fases 3-8

---

**Última atualização:** Janeiro 2025  
**Versão do Planejamento:** 1.0.0
