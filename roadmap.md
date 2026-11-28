# BarberCircuit — Roadmap de produção

## Base já conectada ao Supabase
- [x] Autenticação de proprietários e recuperação de senha.
- [x] Cadastro e leitura da barbearia do proprietário.
- [x] Serviços: criar, editar, ativar/desativar e excluir.
- [x] Barbeiros: criar, editar, ativar/desativar e excluir.
- [x] Clientes: criar, editar, pesquisar, excluir e consultar histórico.
- [x] Agendamentos internos: listar, criar, alterar status e excluir.
- [x] Validar no servidor que serviço, barbeiro e cliente pertencem à mesma barbearia.
- [x] Dashboard com consultas reais, faturamento por snapshot de preço e fuso de São Paulo.
- [x] Financeiro com receitas de atendimentos concluídos e despesas persistidas.
- [x] Relatórios calculados a partir dos agendamentos reais.
- [x] Configurações persistentes para nome, endereço, telefone e slug público.
- [x] Página pública consulta dados reais da barbearia, serviços e profissionais ativos.
- [x] Navegação sem fallback para a barbearia fictícia.

## Notificações e experiência mobile
- [x] Central visual de notificações no painel com eventos de agendamento em tempo real (novos, cancelados, alterados e mudanças de status).
- [x] Solicitação de permissão para notificações do navegador e registro do service worker.
- [x] Service worker preparado para exibir notificações push recebidas e abrir a agenda ao tocar.
- [ ] Habilitar `appointments` na publicação `supabase_realtime` e validar a entrega de eventos no projeto Supabase.
- [ ] Criar tabela `push_subscriptions` com RLS por usuário/barbearia e persistência das inscrições de dispositivos.
- [ ] Configurar VAPID (chave pública no frontend e chave privada em Supabase Secrets) e Edge Function autenticada para envio Web Push.
- [ ] Criar tabela de notificações persistentes e gatilhos para histórico durável, incluindo lembretes agendados antes do atendimento.

## Pendências de banco de dados — executar pelo Lovable
As instruções do projeto reservam as alterações de schema ao Lovable. Não editar migrations manualmente neste repositório.

- [ ] Garantir unicidade de `barbershops.owner_user_id` para o modelo de uma barbearia por assinatura; antes, detectar e resolver eventuais contas com duplicidade.
- [ ] Criar RPC segura para consultar disponibilidade pública por barbearia, profissional, serviço, expediente e agendamentos existentes.
- [ ] Criar RPC segura para gravar agendamento público, validar serviço/profissional ativos, criar ou localizar cliente por telefone, registrar snapshot de preço e impedir sobreposição concorrente.
- [ ] Definir limites/rate limit e validações contra abuso no agendamento público.
- [ ] Restringir a exposição pública de `barbershops`: a política atual permite leitura anônima da tabela; expor apenas campos públicos por view/RPC.
- [ ] Adicionar campos persistentes para slogan, logotipo, expediente semanal e preferências de agendamento.
- [ ] Adicionar restrição transacional no banco para impedir conflitos de horário mesmo em duas requisições simultâneas.
- [ ] Criar estrutura de assinaturas, planos, status de cobrança, trial, limites e histórico de pagamentos.

## Pendências de produto e operação
- [ ] Integrar provedor de cobrança recorrente após definição de provedor e credenciais em Secrets.
- [ ] Implementar gestão de plano, assinatura, cancelamento, inadimplência e limites por plano.
- [ ] Aplicar pelo Lovable as tabelas barber_weekly_hours e barber_time_blocks com RLS para o proprietário (ver especificação em docs/disponibilidade-barbercircuit.md).
- [x] Interface administrativa para configurar expediente semanal e bloqueios individuais por barbeiro (depende da criação das tabelas no Supabase).\n- [ ] Conectar as regras de disponibilidade à RPC de agendamento público e validar todos os fluxos no ambiente Supabase real.
- [ ] Implementar upload de logotipo com Supabase Storage e políticas de acesso.
- [ ] Ativar confirmação/lembretes de agendamento por e-mail/WhatsApp conforme provedor escolhido.
- [ ] Executar testes de integração com uma conta Supabase real, build de produção e lint.
- [ ] Configurar domínio, monitoramento, política de privacidade e termos de uso.

## Observações de integridade
- Não usar dados fictícios como se fossem dados de clientes.
- Dashboard e relatórios usam `appointments.price`, não o preço atual do catálogo.
- O agendamento público ainda não confirma reservas: a página exibe dados reais e encaminha para WhatsApp enquanto a RPC segura e as políticas públicas não forem implantadas.
- O status de build/deploy precisa ser confirmado no ambiente Lovable; não foi executado neste ambiente.
