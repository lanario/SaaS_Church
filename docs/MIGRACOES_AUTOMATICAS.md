# Sistema de Migrações Automáticas

Este sistema permite executar migrações SQL automaticamente sem precisar usar o SQL Editor do Supabase manualmente.

## Configuração Inicial

### 1. Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```env
# Service Role Key do Supabase (obtenha em: Supabase Dashboard > Settings > API > service_role key)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Secret para proteger as rotas de migração (opcional, mas recomendado)
MIGRATION_SECRET=sua_chave_secreta_aqui

# URL da aplicação (para chamadas internas)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Primeira Execução (Manual - Apenas uma vez)

**IMPORTANTE**: Na primeira vez, você ainda precisa executar o `TOTAL_SQL.sql` manualmente no SQL Editor do Supabase para criar a função `exec_sql` e a tabela `schema_migrations`.

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o arquivo `supabase/TOTAL_SQL.sql`
4. Após isso, todas as outras migrações serão automáticas

## Como Funciona

### Execução Automática

O sistema funciona da seguinte forma:

1. **Tabela de Rastreamento**: Cria uma tabela `schema_migrations` que rastreia quais arquivos SQL já foram executados
2. **Leitura de Arquivos**: Lê todos os arquivos `.sql` da pasta `supabase/` (exceto `TOTAL_SQL.sql`)
3. **Execução Ordenada**: Executa os arquivos em ordem alfabética
4. **Limpeza Automática**: Após execução bem-sucedida, deleta o arquivo SQL processado

### API Routes

#### `/api/migrations/init`
Inicializa o banco de dados executando o `TOTAL_SQL.sql`.

**Uso:**
```bash
curl -X POST http://localhost:3000/api/migrations/init \
  -H "Authorization: Bearer sua_chave_secreta"
```

#### `/api/migrations/run`
Executa todas as migrações pendentes.

**Uso:**
```bash
curl -X POST http://localhost:3000/api/migrations/run \
  -H "Authorization: Bearer sua_chave_secreta"
```

### Server Actions

Você pode usar as server actions no código:

```typescript
import { initializeDatabase, runMigrations } from '@/app/actions/migrations'

// Inicializar banco de dados
const result = await initializeDatabase()

// Executar migrações pendentes
const result = await runMigrations()
```

### Componente de Interface

Use o componente `MigrationManager` para ter uma interface visual:

```tsx
import { MigrationManager } from '@/components/admin/migration-manager'

export default function AdminPage() {
  return <MigrationManager />
}
```

## Fluxo de Trabalho

1. **Primeira vez**: Execute `TOTAL_SQL.sql` manualmente no SQL Editor
2. **Migrações futuras**: 
   - Crie novos arquivos SQL na pasta `supabase/`
   - Execute `/api/migrations/run` ou use o componente `MigrationManager`
   - Os arquivos serão executados e deletados automaticamente

## Segurança

- As rotas de migração são protegidas por um token secreto (`MIGRATION_SECRET`)
- Use o `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor (nunca exponha no cliente)
- As migrações são executadas com privilégios de `service_role`, bypassando RLS

## Troubleshooting

### Erro: "Função exec_sql não encontrada"
**Solução**: Execute o `TOTAL_SQL.sql` manualmente no SQL Editor primeiro.

### Erro: "relation does not exist"
**Solução**: Certifique-se de que o `TOTAL_SQL.sql` foi executado completamente.

### Arquivos SQL não estão sendo deletados
**Solução**: Verifique as permissões da pasta `supabase/` e os logs do servidor.

## Notas Importantes

- O arquivo `TOTAL_SQL.sql` **NÃO** é deletado automaticamente (é o arquivo principal)
- Apenas arquivos `.sql` na pasta `supabase/` (exceto `TOTAL_SQL.sql`) são processados
- Os arquivos são executados em ordem alfabética
- Migrações já executadas são puladas automaticamente
