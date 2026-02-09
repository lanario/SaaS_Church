# Configurar confirmação de email (Supabase)

Para o link de confirmação de email funcionar e redirecionar corretamente:

## 1. URLs no Supabase Dashboard

1. Acesse **Supabase Dashboard** → seu projeto → **Authentication** → **URL Configuration**.
2. Em **Site URL**, use a URL do seu app, por exemplo:
   - Produção: `https://seudominio.com`
   - Desenvolvimento: `http://localhost:3000`
3. Em **Redirect URLs**, adicione (uma por linha):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirmar`
   - Em produção, também: `https://seudominio.com/auth/callback` e `https://seudominio.com/auth/confirmar`

## 2. Variável de ambiente

No `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Em produção, use a URL real do site, por exemplo: `https://seudominio.com`.

## 3. Fluxo

1. Usuário cria conta (ex.: pelo convite).
2. Supabase envia email de confirmação.
3. Usuário clica no link do email.
4. Supabase redireciona para `/auth/confirmar?next=...` (com token no hash ou `?code=`).
5. A app confirma o email e redireciona para a página em `next` (ex.: `/convite/TOKEN` ou `/dashboard`).
6. Se for dashboard, é exibido o aviso “Email confirmado!”.

## 4. Desabilitar confirmação de email (opcional)

Se quiser que novos usuários não precisem confirmar o email:

1. Supabase Dashboard → **Authentication** → **Providers** → **Email**.
2. Desative **Confirm email**.

Com isso, o usuário já fica logado logo após o cadastro, sem precisar clicar no link do email.
