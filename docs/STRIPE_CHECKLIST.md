# ✅ CHECKLIST - INTEGRAÇÃO STRIPE

## 📋 Checklist Rápido de Implementação

Use este checklist para acompanhar o progresso da integração do Stripe.

---

## 🔴 FASE 1: Setup e Configuração Inicial

- [ ] Instalar dependências: `npm install stripe @stripe/stripe-js`
- [ ] Criar conta no Stripe e obter API keys
- [ ] Adicionar variáveis de ambiente ao `.env.local`
- [ ] Criar `lib/stripe/server.ts`
- [ ] Criar `lib/stripe/client.ts`
- [ ] Configurar tipos TypeScript

**Status:** ⬜ Não iniciado

---

## 🔴 FASE 2: Estrutura de Banco de Dados

- [ ] Criar script SQL `supabase/STRIPE_SCHEMA.sql`
- [ ] Criar tabela `subscription_plans`
- [ ] Criar tabela `subscriptions`
- [ ] Criar tabela `subscription_usage` (opcional)
- [ ] Criar índices necessários
- [ ] Configurar RLS policies
- [ ] Criar triggers para `updated_at`
- [ ] Executar script no Supabase

**Status:** ⬜ Não iniciado

---

## 🔴 FASE 3: Criação de Produtos no Stripe

- [ ] Criar produto "TesourApp - Missões" no Stripe
- [ ] Criar preço R$ 49,99/mês (recorrente)
- [ ] Criar produto "TesourApp - Catedral" no Stripe
- [ ] Criar preço R$ 99,99/mês (recorrente)
- [ ] Criar script `scripts/sync-stripe-plans.ts`
- [ ] Popular tabela `subscription_plans`
- [ ] Validar dados sincronizados

**Status:** ⬜ Não iniciado

---

## 🔴 FASE 4: API de Checkout

- [ ] Criar `app/api/checkout/create/route.ts`
- [ ] Criar `app/api/checkout/success/route.ts`
- [ ] Criar `app/api/checkout/cancel/route.ts`
- [ ] Criar `app/actions/subscription.ts` com `createCheckoutSession`
- [ ] Atualizar botões na landing page (`app/page.tsx`)
- [ ] Testar fluxo de checkout completo
- [ ] Adicionar loading states e tratamento de erros

**Status:** ⬜ Não iniciado

---

## 🔴 FASE 5: Webhooks do Stripe

- [ ] Criar `app/api/webhooks/stripe/route.ts`
- [ ] Criar `lib/stripe/webhooks.ts` com handlers
- [ ] Implementar verificação de assinatura do webhook
- [ ] Handler: `checkout.session.completed`
- [ ] Handler: `customer.subscription.created`
- [ ] Handler: `customer.subscription.updated`
- [ ] Handler: `customer.subscription.deleted`
- [ ] Handler: `invoice.payment_succeeded`
- [ ] Handler: `invoice.payment_failed`
- [ ] Configurar webhook endpoint no Stripe Dashboard
- [ ] Testar webhooks com Stripe CLI
- [ ] Validar sincronização de status

**Status:** ⬜ Não iniciado

---

## 🟡 FASE 6: Controle de Acesso Baseado em Assinatura

- [ ] Criar `lib/subscription/check.ts`
- [ ] Implementar `hasActiveSubscription()`
- [ ] Implementar `getSubscription()`
- [ ] Implementar `checkSubscriptionLimits()`
- [ ] Atualizar `middleware.ts` para verificar assinatura
- [ ] Criar `app/(dashboard)/assinatura/page.tsx`
- [ ] Implementar verificações de limites de usuários
- [ ] Implementar verificações de limites de igrejas
- [ ] Criar `components/subscription/subscription-status.tsx`
- [ ] Testar bloqueio de acesso sem assinatura

**Status:** ⬜ Não iniciado

---

## 🟡 FASE 7: Página de Gerenciamento de Assinatura

- [ ] Criar `app/(dashboard)/ajustes/assinatura/page.tsx`
- [ ] Criar `components/subscription/subscription-card.tsx`
- [ ] Criar `components/subscription/change-plan-modal.tsx`
- [ ] Criar `components/subscription/cancel-subscription-modal.tsx`
- [ ] Criar `components/subscription/payment-history.tsx`
- [ ] Implementar `getCurrentSubscription()` em actions
- [ ] Implementar `changePlan()` em actions
- [ ] Implementar `cancelSubscription()` em actions
- [ ] Implementar `reactivateSubscription()` em actions
- [ ] Criar `app/api/customer-portal/create/route.ts`
- [ ] Adicionar aba "Assinatura" em ajustes
- [ ] Testar todas as funcionalidades de gerenciamento

**Status:** ⬜ Não iniciado

---

## 🟢 FASE 8: Melhorias e Testes

- [ ] Testar fluxo completo de checkout
- [ ] Testar todos os webhooks
- [ ] Testar cancelamento de assinatura
- [ ] Testar troca de plano
- [ ] Testar limites de recursos
- [ ] Implementar error boundaries
- [ ] Adicionar loading states em todos os botões
- [ ] Adicionar toasts de feedback
- [ ] Implementar confirmações antes de ações críticas
- [ ] Atualizar README com instruções do Stripe
- [ ] Documentar variáveis de ambiente
- [ ] Criar guia de troubleshooting

**Status:** ⬜ Não iniciado

---

## 📊 Progresso Geral

**Fases Completas:** 0/8 (0%)  
**Última Atualização:** Janeiro 2025

---

## 🔗 Links Úteis

- [Documentação Completa](./PLANEJAMENTO_STRIPE.md)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Docs - Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Docs - Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## ⚠️ Lembretes Importantes

- ✅ Sempre usar Stripe Test Mode durante desenvolvimento
- ✅ Nunca commitar variáveis de ambiente com valores reais
- ✅ Validar webhooks com assinatura antes de processar
- ✅ Testar todos os cenários antes de ir para produção
- ✅ Configurar webhook endpoint no Stripe Dashboard após deploy
