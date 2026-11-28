# Disponibilidade dos barbeiros — BarberCircuit

## Estado do banco

As tabelas foram criadas no projeto Supabase em 28/11/2026. RLS está habilitado e somente o proprietário autenticado pode consultar e alterar os registros da própria barbearia.

### `barber_weekly_hours`
- `id` uuid, chave primária.
- `barbershop_id` e `barber_id`, com vínculo composto garantindo que o barbeiro pertence à mesma barbearia.
- `day_of_week` entre 0 e 6 (domingo=0).
- `start_time` e `end_time`, com início anterior ao fim.
- Exclusão de intervalos sobrepostos para o mesmo barbeiro/dia.

Permite várias faixas por dia. Exemplo: 09:00–12:00 e 13:00–18:00 representam intervalo de almoço.

### `barber_time_blocks`
- `id` uuid, chave primária.
- `barbershop_id` e `barber_id`, com vínculo composto.
- `starts_at`, `ends_at` e `reason`.
- Restrição para impedir bloqueios sobrepostos para o mesmo barbeiro.

## Proteção de agendamentos

- `appointments.ends_at` agora é obrigatório e deve ser posterior a `starts_at`.
- Uma restrição de exclusão no PostgreSQL impede agendamentos ativos sobrepostos para o mesmo barbeiro, inclusive em requisições concorrentes.
- Triggers com bloqueio transacional por barbeiro impedem corrida entre a criação de um agendamento e a criação de um bloqueio.
- O banco também valida expediente semanal e bloqueios quando um agendamento é inserido ou remarcado.
- Agendamentos cancelados não bloqueiam horários.
- Relações compostas impedem associar agendamento a barbeiro, cliente ou serviço de outra barbearia.
- A publicação `supabase_realtime` agora inclui `appointments`, com `REPLICA IDENTITY FULL`.

## Regras da aplicação

- Fuso operacional: `America/Sao_Paulo`.
- Almoço é configurado como duas faixas semanais.
- Bloqueios pontuais usam data e horário.
- Sem expediente cadastrado, o agendamento interno falha de forma segura.
- Antes de remover ou alterar faixas, verificar os compromissos futuros correspondentes. A interface ainda precisa implementar essa verificação preventiva.

## Agendamento público — primeira versão implementada

- RPC `get_public_booking_slots`: consulta expediente, duração do serviço, bloqueios e agendamentos, retornando slots de 15 minutos para até 60 dias.
- RPC `create_public_booking`: valida serviço e profissional ativos, telefone, data, expediente, bloqueios e conflitos; localiza ou cria cliente pelo telefone e grava o preço atual como snapshot.
- A reserva usa transação PostgreSQL e lock por barbeiro; a restrição de exclusão continua como proteção adicional contra concorrência.
- A página `/b/$slug` agora apresenta o fluxo completo de serviço, profissional, data, horário e confirmação.
- O fluxo foi testado no Supabase com expediente temporário e rollback, sem deixar dados de teste permanentes.

## Pendências

- Configurar expediente semanal real para cada barbeiro; sem isso, a consulta não retorna horários.
- Implementar rate limit e CAPTCHA para reduzir abuso automatizado.
- Implementar notificações persistentes e Web Push; Realtime foi habilitado, mas push não está configurado.
- Publicar a versão mais recente do GitHub no Lovable e validar o fluxo no navegador.
- Executar build de produção e testes de integração.
