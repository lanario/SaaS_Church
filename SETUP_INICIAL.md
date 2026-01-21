# 🚀 Setup Inicial - Fase 1

## ✅ Estrutura Criada

A estrutura base do projeto Next.js 14 foi criada com sucesso! Agora você precisa:

## 📋 Próximos Passos

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > API** e copie:
   - Project URL
   - `anon` public key
   - `service_role` key (manter segredo!)

4. Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 3. Executar Schema SQL

1. No Supabase, vá em **SQL Editor**
2. Abra o arquivo `supabase/schema.sql`
3. Cole todo o conteúdo no SQL Editor
4. Execute o script

### 4. Executar o Projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura Criada

```
church-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ✅ Tela de login
│   │   └── register/page.tsx       ✅ Tela de cadastro
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx     ✅ Dashboard básico
│   ├── actions/
│   │   └── auth.ts                ✅ Server actions de autenticação
│   ├── globals.css                ✅ Estilos globais
│   ├── layout.tsx                 ✅ Layout raiz
│   ├── loading.tsx                ✅ Loading state
│   └── page.tsx                   ✅ Landing page
├── components/
│   └── ui/                        ✅ Componentes reutilizáveis
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ✅ Cliente browser
│   │   └── server.ts              ✅ Cliente server
│   ├── utils/
│   │   └── cn.ts                  ✅ Utilitário de classes
│   └── validations/
│       └── schemas.ts             ✅ Schemas Zod
├── middleware.ts                  ✅ Middleware de autenticação
├── package.json                   ✅ Dependências
├── tsconfig.json                   ✅ Config TypeScript
├── tailwind.config.ts             ✅ Config Tailwind
└── next.config.js                 ✅ Config Next.js
```

## 🎯 Funcionalidades Implementadas

- ✅ Landing page responsiva
- ✅ Tela de login com validação
- ✅ Tela de cadastro com validação
- ✅ Autenticação Supabase
- ✅ Criação automática de igreja após cadastro
- ✅ Criação de perfil e permissões
- ✅ Proteção de rotas
- ✅ Componentes UI reutilizáveis

## ⚠️ Notas Importantes

1. **Email de Confirmação**: Por padrão, o Supabase requer confirmação de email. Para desenvolvimento, você pode desabilitar isso em:
   - Supabase Dashboard > Authentication > Settings > Email Auth
   - Desmarque "Enable email confirmations"

2. **RLS Policies**: As políticas de Row Level Security estão configuradas no schema SQL. Certifique-se de executá-las.

3. **Service Role Key**: A service role key é necessária apenas para operações administrativas. Para o fluxo básico de cadastro, não é necessária.

## 🐛 Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas no `.env.local`
- Certifique-se de usar a `anon` key, não a `service_role` key no cliente

### Erro: "relation does not exist"
- Execute o schema SQL no Supabase
- Verifique se todas as tabelas foram criadas

### Erro: "permission denied"
- Verifique as RLS policies no Supabase
- Certifique-se de que as policies estão habilitadas

## 📚 Próximas Fases

Após configurar e testar a Fase 1, você pode prosseguir para:
- **Fase 2**: Dashboard e Sistema Financeiro
- Consulte `PLANEJAMENTO_PROJETO.md` para mais detalhes

---

**Boa sorte! 🚀**

