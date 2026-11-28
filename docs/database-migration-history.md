# Histórico de migrations do BarberCircuit

O projeto Supabase conectado registra estas migrations aplicadas:

- `20261125000352`
- `20261125000506`
- `20261128022016`
- `20261128022028`
- `20261128022043`
- `20261128022049`
- `20261128022113`
- `20261128022201`
- `20261128022401`
- `20261128120840` — `prevent_future_appointment_completion`
- `20261128121421` — `protect_booked_weekly_hours_from_deletion`

A branch `main` contém apenas os arquivos SQL das versões `20261125000352`, `20261125000506` e `20261128022401`. As seis versões intermediárias foram aplicadas no projeto remoto, mas seus arquivos não aparecem no histórico Git consultado, inclusive na árvore do commit anterior.

**Não execute `supabase db reset` nem tente reaplicar migrations antigas** até reconstruir e revisar os seis arquivos ausentes. A tabela de histórico remoto registra versões e nomes, não o SQL original; por isso não devemos inventar os scripts históricos nem declarar que foram recuperados.

As migrations `20261128120840_prevent_future_appointment_completion.sql` e `20261128121421_protect_booked_weekly_hours_from_deletion.sql` foram aplicadas no banco e estão versionadas no GitHub. Ambas reforçam validações sem alterar registros existentes.
