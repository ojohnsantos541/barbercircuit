# Correção coordenada de segurança — barbershops

**Aplicar pelo Lovable/Supabase. Não executar a remoção do SELECT anônimo antes de atualizar e publicar a rota pública `/b/$slug` para usar a RPC descrita abaixo.** A página pública atual consulta `barbershops` diretamente; revogar o acesso antes dessa adaptação quebra as páginas públicas.

## 1. Pré-verificação obrigatória

Execute primeiro:

```sql
select owner_user_id, count(*) as total, array_agg(id) as barbershop_ids
from public.barbershops
group by owner_user_id
having count(*) > 1;
```

Se retornar linhas, interrompa. Analise cada conta e decida manualmente qual registro deve permanecer. Não exclua nem mescle dados automaticamente.

## 2. RPC pública com campos mínimos

A função abaixo expõe somente os campos usados pela página pública. Ela não retorna `owner_user_id`.

```sql
create or replace function public.get_public_barbershop_by_slug(_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  address text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.name, b.slug, b.address, b.phone
  from public.barbershops b
  where b.slug = _slug
  limit 1;
$$;

revoke all on function public.get_public_barbershop_by_slug(text) from public;
grant execute on function public.get_public_barbershop_by_slug(text) to anon, authenticated;
```

Atualizar a rota `src/routes/b.$slug.tsx` para chamar `supabase.rpc("get_public_barbershop_by_slug", { _slug: slug })` e tratar o retorno como uma linha opcional. Publicar e validar a rota pública antes de prosseguir.

## 3. Remover leitura direta anônima

Depois de publicar e validar a RPC:

```sql
drop policy if exists "Public can view barbershops" on public.barbershops;

create policy "Owner reads own barbershop"
on public.barbershops
for select
to authenticated
using (auth.uid() = owner_user_id);

revoke select on public.barbershops from anon;
```

Manter as políticas de INSERT/UPDATE/DELETE do proprietário existentes. Confirmar que o cliente autenticado consegue carregar a própria barbearia e que a página pública continua funcionando via RPC.

## 4. Unicidade de proprietário

Somente depois de confirmar que a consulta da etapa 1 não retorna duplicidades:

```sql
create unique index if not exists barbershops_one_per_owner
on public.barbershops(owner_user_id);
```

## 5. Testes de aceitação

- Visitante anônimo consegue abrir `/b/slug-da-barbearia` e recebe somente nome, slug, endereço e telefone da loja.
- Visitante anônimo não consegue consultar diretamente a tabela `barbershops`.
- Proprietário autenticado consegue consultar e editar a própria loja.
- Proprietário não consegue consultar outra loja.
- Cadastro de uma segunda barbearia para o mesmo proprietário é rejeitado pelo banco.
- Serviços e barbeiros ativos continuam visíveis publicamente pelas políticas já existentes.

## Observação

A página pública ainda depende das políticas públicas de leitura de serviços e barbeiros ativos. Não ampliar permissões de escrita para `anon`. Esta alteração resolve a exposição da tabela de barbearias sem quebrar o fluxo público, desde que as etapas sejam aplicadas na ordem indicada.
