# Segurança do Supabase — BarberCircuit

## Estado aplicado no projeto Supabase

As correções abaixo foram aplicadas diretamente ao projeto Barbercircuit em 28/11/2026 e verificadas por consultas SQL e pelos Database Advisors.

- A rota pública `/b/$slug` consulta a RPC `get_public_barbershop_by_slug`.
- A RPC retorna apenas `id`, `name`, `slug`, `address` e `phone`; não retorna `owner_user_id`.
- A função usa `SECURITY DEFINER`, `search_path = ''` e consulta somente o slug exato. A execução é concedida somente a `anon`, pois a página pública usa a chave publicável.
- A política ampla `Public can view barbershops` foi removida.
- Leitura direta de `barbershops` foi revogada para `anon`; usuários autenticados leem somente a própria loja.
- Foi criada unicidade em `barbershops.owner_user_id`. A pré-verificação não encontrou duplicidades.
- A função `is_shop_owner` passou para `SECURITY INVOKER`, com execução restrita a `authenticated`.
- Foram adicionadas chaves estrangeiras compostas para impedir que agendamentos relacionem barbeiros, clientes ou serviços de outra barbearia.
- Foram adicionados índices de suporte e políticas RLS específicas.

## Verificações realizadas

- A chamada da RPC como `anon` retornou somente os campos públicos esperados.
- A consulta direta a `barbershops` como `anon` foi negada por falta de privilégio.
- A consulta da própria loja como `authenticated` foi confirmada com contexto JWT de teste.
- O projeto tem uma única barbearia e nenhum proprietário duplicado.
- O advisor de saúde não apontou problemas.
- O advisor de segurança ainda aponta dois itens: a RPC pública `SECURITY DEFINER` (intencional para lookup anônimo limitado) e a proteção contra senhas vazadas desativada. A segunda configuração precisa ser ativada no painel Auth do Supabase.

## Atenção

A RPC pública é uma exceção deliberada e restrita. Não conceder acesso anônimo direto à tabela `barbershops`. Se os campos retornados pela página pública mudarem, revisar a RPC e seus privilégios antes de alterar políticas.

A publicação da aplicação e os testes de ponta a ponta no navegador ainda precisam ser confirmados.
