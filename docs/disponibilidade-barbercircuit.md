# Disponibilidade dos barbeiros — BarberCircuit

Aplicar esta alteração de schema pelo Lovable (não criar migration manual no GitHub).

## Tabela barber_weekly_hours
- id uuid primary key default gen_random_uuid()
- barbershop_id uuid not null references public.barbershops(id) on delete cascade
- barber_id uuid not null references public.barbers(id) on delete cascade
- day_of_week integer not null check (day_of_week between 0 and 6) — domingo=0
- start_time time not null
- end_time time not null
- created_at timestamptz not null default now()
- check (start_time < end_time)
- índice em (barbershop_id, barber_id, day_of_week, start_time)

Permitir várias linhas por barbeiro/dia: por exemplo 09:00–12:00 e 13:00–18:00 representam expediente com almoço.

## Tabela barber_time_blocks
- id uuid primary key default gen_random_uuid()
- barbershop_id uuid not null references public.barbershops(id) on delete cascade
- barber_id uuid not null references public.barbers(id) on delete cascade
- starts_at timestamptz not null
- ends_at timestamptz not null
- reason text
- created_at timestamptz not null default now()
- check (starts_at < ends_at)
- índice em (barbershop_id, barber_id, starts_at)

## Segurança
- RLS habilitado nas duas tabelas.
- SELECT/INSERT/UPDATE/DELETE somente para proprietário autenticado da barbearia, usando public.is_shop_owner(barbershop_id).
- Validar que barber_id pertence à mesma barbershop_id em trigger ou constraint/trigger de integridade.
- Não habilitar acesso anônimo a essas tabelas.
- timezone operacional: America/Sao_Paulo.

## Regras funcionais
- Uma linha por intervalo de expediente; almoço é um intervalo sem expediente entre dois intervalos disponíveis.
- Bloqueios pontuais são intervalos de data/hora; não podem sobrepor appointments não cancelados.
- O agendamento público deve consultar estas tabelas pela RPC segura e só oferecer slots integralmente dentro de um intervalo semanal, fora de qualquer bloqueio e sem sobreposição com appointments.
- A verificação e gravação de agendamento público devem ser transacionais para evitar corrida.
- Se não houver expediente cadastrado para o barbeiro/dia, considerar indisponível (fail closed).
