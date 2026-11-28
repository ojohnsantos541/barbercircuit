# WhatsApp no BarberCircuit

## O que já está disponível
Na agenda do painel, abra um atendimento. A seção **WhatsApp do cliente** oferece dois atalhos:
- **Enviar confirmação**: abre uma conversa com o telefone cadastrado e prepara os dados do agendamento.
- **Enviar lembrete**: prepara uma mensagem com a data, hora, profissional e serviço.

O proprietário precisa revisar e tocar em Enviar no WhatsApp. O BarberCircuit não dispara mensagens por conta própria nesta etapa.

## Por que o envio automático ainda não foi ativado
O envio automático exige uma conta WhatsApp Business Platform (Cloud API) da Meta ou um BSP compatível. Um link `wa.me` não autoriza um servidor a enviar mensagens em segundo plano.

Para habilitar o envio automático de forma oficial, o proprietário da conta precisa:
1. Ter uma Meta Business Portfolio e um WhatsApp Business Account (WABA).
2. Registrar e verificar o número remetente no WhatsApp Business Platform.
3. Criar e obter aprovação dos modelos de mensagem de confirmação e lembrete.
4. Configurar no Supabase Secrets, sem colocar no GitHub ou no frontend:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_TEMPLATE_CONFIRMATION`
   - `WHATSAPP_TEMPLATE_REMINDER`
5. Confirmar o idioma dos modelos (por exemplo, `pt_BR`) e as variáveis aprovadas.

## Próxima implementação de backend
Depois da configuração do provedor:
- criar fila persistente de mensagens com chave idempotente por agendamento/tipo;
- enfileirar confirmação após criação de reserva;
- agendar lembrete, por padrão 24 horas antes, respeitando o fuso `America/Sao_Paulo`;
- enviar via Edge Function usando template aprovado;
- registrar status, tentativas, resposta do provedor e falhas sem armazenar tokens;
- cancelar lembretes pendentes quando o agendamento for cancelado ou alterado;
- aplicar limites de envio e política de opt-out/consentimento.

**Importante:** não solicitar nem colar tokens privados em conversas ou no código-fonte. Configure-os diretamente em Supabase Edge Function Secrets.
