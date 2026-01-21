# 📁 Arquivos SQL do TesourApp

## 📋 Organização

Todos os arquivos SQL estão organizados na pasta `organizados/` com numeração para facilitar a execução.

## 🚀 Arquivo Principal

**`TOTAL_SQL.sql`** ou **`organizados/00_TOTAL_SQL.sql`** - Este é o arquivo ÚNICO que contém TODOS os SQLs necessários. **Use este arquivo para configurar o Supabase completamente.**

### Como usar:
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie TODO o conteúdo de `TOTAL_SQL.sql` (ou `organizados/00_TOTAL_SQL.sql`)
4. Execute o script completo
5. Pronto! Todo o banco de dados estará configurado

### ⚠️ Se receber erro "relation church_invites does not exist":
Execute primeiro o arquivo `CRIAR_CHURCH_INVITES.sql` na raiz da pasta supabase, depois execute o TOTAL_SQL.sql completo.

## 📂 Outros Arquivos (Referência)

### Arquivos Principais:
- **`01_setup_completo.sql`** - Setup completo inicial do banco
- **`02_aplicar_tudo.sql`** - Script para aplicar todas as correções

### Correções e Ajustes:
- **`03_criar_tabela_convites.sql`** - Cria apenas a tabela de convites
- **`04_permitir_owner_ver_usuarios.sql`** - Cria função para owners verem usuários
- **`05_criar_perfil_usuario.sql`** - Script para criar perfil de usuário
- **`06_verificar_e_corrigir_perfil.sql`** - Verifica e corrige perfis
- **`07_corrigir_recursao_urgente.sql`** - Correção urgente de recursão RLS
- **`08_remover_todas_politicas_recursivas.sql`** - Remove políticas recursivas
- **`09_schema.sql`** - Schema original do banco
- **`10_fix_user_profiles_rls.sql`** - Fix específico para RLS de user_profiles
- **`11_fix_recursao_infinita.sql`** - Fix para recursão infinita

## ⚠️ Importante

- **SEMPRE use `00_TOTAL_SQL.sql`** para configuração inicial completa
- Os outros arquivos são apenas para referência ou correções específicas
- Se precisar fazer uma correção específica, use o arquivo correspondente

## 🔄 Atualização

**⚠️ REGRA IMPORTANTE:** Sempre que qualquer arquivo SQL for editado, criado ou modificado, o arquivo `TOTAL_SQL.sql` (ou `00_TOTAL_SQL.sql`) **DEVE ser atualizado automaticamente** para manter a sincronização.

O `TOTAL_SQL.sql` deve ser **SEMPRE** o arquivo mais completo e atualizado, contendo TODAS as mudanças de TODOS os arquivos SQL do projeto.

### Processo Padrão:
1. Edite o arquivo SQL específico
2. **IMEDIATAMENTE** atualize o `TOTAL_SQL.sql` com as mesmas mudanças
3. Mantenha a ordem lógica no `TOTAL_SQL.sql`

